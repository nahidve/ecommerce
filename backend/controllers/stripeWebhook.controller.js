import orderModel from "../models/order.model.js";
import userModel from "../models/user.model.js";
import { stripe } from "../config/stripe.js";
import { emailQueue } from "../queues/email.queue.js";
import redisClient from "../config/redis.js";
import logger from "../config/logger.js";

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
    logger.error("Stripe webhook signature verification failed", {
      error: err.message,
    });
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // =========================
  // REDIS IDEMPOTENCY
  // =========================
  const eventId = event.id;
  const cacheKey = `stripe:event:${eventId}`;

  try {
    const exists = await redisClient.get(cacheKey);

    if (exists) {
      logger.warn("Duplicate webhook ignored", { eventId });
      return res.status(200).json({ received: true });
    }

    await redisClient.set(cacheKey, "processed", {
      EX: 86400,
    });
  } catch (err) {
    logger.error("Redis webhook error", { error: err.message });
  }

  // =========================
  // PAYMENT SUCCESS
  // =========================
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
        {
          $set: {
            payment: true,
            paymentIntentId: session.payment_intent,
          },
        },
        { new: true }
      );

      if (!order) {
        logger.warn("Order not found or already paid", { orderId });
        return res.json({ received: true });
      }

      logger.info("Order marked paid", { orderId });

      await userModel.findByIdAndUpdate(order.userId, {
        cartData: {},
      });

      res.json({ received: true });

      // async email
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
      logger.error("Webhook order update failed", {
        error: err.message,
      });
      return res.status(500).json({ received: false });
    }
  }

  // =========================
  // REFUND HANDLING (NEW)
  // =========================
  if (event.type === "refund.created") {
    const refund = event.data.object;

    const paymentIntentId = refund.payment_intent;

    try {
      const order = await orderModel.findOne({ paymentIntentId });

      if (!order) {
        logger.warn("Refund webhook: order not found", { paymentIntentId });
        return res.json({ received: true });
      }

      const refundAmount = refund.amount / 100; // cents → USD

      // Prevent duplicate webhook processing
      const alreadyExists = (order.refundHistory || []).some(
        (r) => r.stripeRefundId === refund.id
      );

      if (alreadyExists) {
        logger.warn("Duplicate refund webhook ignored", {
          refundId: refund.id,
        });
        return res.json({ received: true });
      }

      // Initialize if missing
      if (!order.refundedAmount) order.refundedAmount = 0;
      if (!order.refundHistory) order.refundHistory = [];

      // ✅ UPDATE REFUND DATA
      order.refundedAmount = Math.min(
        order.amount,
        (order.refundedAmount || 0) + refundAmount
      );

      order.refundHistory.push({
        amount: refundAmount,
        stripeRefundId: refund.id,
      });

      // ✅ FULL REFUND CHECK
      if (order.refundedAmount >= order.amount) {
        order.status = "Refunded";
        order.payment = false;
      }

      await order.save();

      logger.info("Refund synced from webhook", {
        orderId: order._id,
        refundAmount,
      });

      return res.json({ received: true });
    } catch (err) {
      logger.error("Refund webhook failed", { error: err.message });
      return res.status(500).json({ received: false });
    }
  }

  // =========================
  // DEFAULT
  // =========================
  res.json({ received: true });
};