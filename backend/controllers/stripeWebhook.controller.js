import orderModel from "../models/order.model.js";
import userModel from "../models/user.model.js";
import { stripe } from "../config/stripe.js";
import { generateInvoice } from "../config/generateInvoice.js";
import { sendInvoiceEmail } from "../config/sendEmail.js";

/**
 * PDF + email can take seconds; run after the HTTP response so Stripe
 * gets a fast 200 and is less likely to retry/time out.
 */
function schedulePostPaymentFulfillment(order) {
  setImmediate(() => {
    void (async () => {
      try {
        const user = await userModel.findById(order.userId);
        const invoicePath = await generateInvoice(order, user);
        await sendInvoiceEmail(user?.email, invoicePath, order);
      } catch (err) {
        console.error("Post-payment fulfill error:", err);
      }
    })();
  });
}

/**
 * Stripe webhook — must use raw body (see server.js).
 * Marks order paid only after verified checkout.session.completed.
 */
export const handleStripeWebhook = async (req, res) => {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  if (!webhookSecret) {
    console.error("STRIPE_WEBHOOK_SECRET is not set");
    return res.status(500).send("Webhook misconfigured");
  }

  const sig = req.headers["stripe-signature"];
  let event;

  const payload =
    Buffer.isBuffer(req.body) ? req.body : Buffer.from(req.body || "", "utf8");

  try {
    event = stripe.webhooks.constructEvent(payload, sig, webhookSecret);
  } catch (err) {
    console.error("Stripe webhook signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const orderId =
      session.metadata?.orderId || session.client_reference_id || null;

    if (!orderId) {
      console.error(
        "checkout.session.completed: no orderId (metadata.orderId / client_reference_id missing)"
      );
      return res.json({ received: true });
    }

    try {
      const order = await orderModel.findOneAndUpdate(
        { _id: orderId, payment: false },
        { $set: { payment: true } },
        { new: true }
      );

      if (!order) {
        console.warn(
          `Stripe webhook: no unpaid order matched id=${orderId} (already paid or unknown id)`
        );
        return res.json({ received: true });
      }

      console.log(`Stripe webhook: order ${orderId} marked paid`);

      await userModel.findByIdAndUpdate(order.userId, { cartData: {} });

      res.json({ received: true });
      schedulePostPaymentFulfillment(order);
      return;
    } catch (err) {
      console.error("Webhook order update error:", err);
      return res.status(500).json({ received: false });
    }
  }

  res.json({ received: true });
};
