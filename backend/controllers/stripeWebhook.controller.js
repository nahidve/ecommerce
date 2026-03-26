import orderModel from "../models/order.model.js"
import userModel from "../models/user.model.js"
import { stripe } from "../config/stripe.js"
import { emailQueue } from "../queues/email.queue.js";
import redisClient from "../config/redis.js"
import logger from "../config/logger.js";

/**
 * Stripe webhook — must use raw body (see server.js).
 * Marks order paid only after verified checkout.session.completed.
 */
export const handleStripeWebhook = async (req, res) => {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  if (!webhookSecret) {
    logger.error("Missing STRIPE_WEBHOOK_SECRET");
    return res.status(500).send("Webhook misconfigured");
  }

  const sig = req.headers["stripe-signature"];
  let event;

  const payload =
    Buffer.isBuffer(req.body) ? req.body : Buffer.from(req.body || "", "utf8");

  try {
    event = stripe.webhooks.constructEvent(payload, sig, webhookSecret);
  } catch (err) {
    logger.error("Stripe webhook signature verification failed", { error: err.message });
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // REDIS IDEMPOTENCY CHECK START
  const eventId = event.id;
  const cacheKey = `stripe:event:${eventId}`;

  try {
    const exists = await redisClient.get(cacheKey);

    if (exists) {
      logger.warn("Duplicate webhook ignored", { eventId });
      return res.status(200).json({ received: true });
    }

    // Mark as processed (24 hours)
    await redisClient.set(cacheKey, "processed", {
      EX: 86400,
    });

  } catch (err) {
    logger.error("Redis webhook error", { error: err.message });
    // Do NOT block webhook if Redis fails
  }
  // REDIS IDEMPOTENCY CHECK END

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const orderId =
      session.metadata?.orderId || session.client_reference_id || null;

    if (!orderId) {
      logger.error("Missing orderId in webhook");
      return res.json({ received: true });
    }

    try {
      const order = await orderModel.findOneAndUpdate(
        { _id: orderId, payment: false },
        { $set: { payment: true } },
        { new: true }
      );

      if (!order) {
        logger.warn("Order not found or already paid", { orderId });
        return res.json({ received: true });
      }

      logger.info("Order marked paid", { orderId });

      await userModel.findByIdAndUpdate(order.userId, { cartData: {} });

      res.json({ received: true });

      await emailQueue.add(
        "send-invoice",
        {
          type: "SEND_INVOICE",
          data: { order },
        },
        {
          attempts: 3,
          backoff: {
            type: "exponential",
            delay: 5000,
          },
          removeOnComplete: 10,
          removeOnFail: 5,
        }
      );
      return;
    } catch (err) {
      logger.error("Webhook order update failed", { error: err.message });
      return res.status(500).json({ received: false });
    }
  }

  res.json({ received: true });
};
