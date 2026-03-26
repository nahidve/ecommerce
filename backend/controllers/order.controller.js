import mongoose from "mongoose";
import orderModel from "../models/order.model.js";
import foodModel from "../models/food.model.js";
import { stripe } from "../config/stripe.js";
import { acquireLock } from "../config/redis.js";
import logger from "../config/logger.js";

const DELIVERY_FEE_USD = 2;
const toUsdCents = (usd) => Math.round(Number(usd) * 100);

// @desc Place new order (IDEMPOTENT)
// @route POST /api/order/place
// @access Private
const placeOrder = async (req, res) => {
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";

  try {
    const userId = req.body.userId;
    const address = req.body.address;
    const rawItems = req.body.items;

    const idempotencyKey = req.headers["idempotency-key"];

    if (!idempotencyKey) {
      return res.status(400).json({
        success: false,
        message: "Missing idempotency key",
      });
    }

    const lockKey = `order:lock:${idempotencyKey}`;
    try {
      const lock = await acquireLock(lockKey);

      if (!lock) {
        logger.warn("Duplicate order request blocked", { idempotencyKey });
        return res.status(429).json({
          success: false,
          message: "Duplicate request in progress",
        });
      }
    } catch (err) {
      logger.warn("Redis lock failed", { error: err.message });
    }

    const existingOrder = await orderModel.findOne({ idempotencyKey });

    if (existingOrder) {
      logger.info("Idempotent order reused", { idempotencyKey });
      return res.json({
        success: true,
        session_url: `${frontendUrl}/verify?success=true&orderId=${existingOrder._id}`,
      });
    }

    if (!address || typeof address !== "object") {
      return res.status(400).json({
        success: false,
        message: "Delivery address is required",
      });
    }

    if (!Array.isArray(rawItems) || rawItems.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Order must include at least one item",
      });
    }

    const normalizedItems = [];

    for (const row of rawItems) {
      const foodId = row._id ?? row.id;
      const quantity = Number(row.quantity);

      if (!foodId || !mongoose.Types.ObjectId.isValid(foodId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid item id",
        });
      }

      if (!Number.isInteger(quantity) || quantity < 1) {
        return res.status(400).json({
          success: false,
          message: "Each item must have a positive integer quantity",
        });
      }

      normalizedItems.push({ foodId: String(foodId), quantity });
    }

    const formattedItems = [];
    let subtotal = 0;

    for (const { foodId, quantity } of normalizedItems) {
      const food = await foodModel.findById(foodId).lean();

      if (!food) {
        return res.status(400).json({
          success: false,
          message: `Food item not found: ${foodId}`,
        });
      }

      const unitPrice = Number(food.price);

      if (Number.isNaN(unitPrice) || unitPrice < 0) {
        return res.status(500).json({
          success: false,
          message: "Invalid product price in catalog",
        });
      }

      subtotal += unitPrice * quantity;

      formattedItems.push({
        _id: String(food._id),
        name: food.name,
        quantity,
        price: unitPrice,
        rating: food.rating ?? 0,
      });
    }

    const totalAmount = subtotal + DELIVERY_FEE_USD;

    const newOrder = new orderModel({
      userId,
      items: formattedItems,
      amount: totalAmount,
      address,
      status: "pending",
      payment: false,
      idempotencyKey,
    });

    let savedOrder;

    try {
      savedOrder = await newOrder.save();
    } catch (err) {
      if (err.code === 11000) {
        const existingOrder = await orderModel.findOne({ idempotencyKey });

        logger.info("Race condition handled via DB unique constraint", {
          idempotencyKey,
        });

        return res.json({
          success: true,
          session_url: `${frontendUrl}/verify?success=true&orderId=${existingOrder._id}`,
        });
      }
      throw err;
    }

    logger.info("Order created", {
      orderId: savedOrder._id,
      userId,
      amount: totalAmount,
    });

    const line_items = formattedItems.map((item) => ({
      price_data: {
        currency: "usd",
        product_data: { name: item.name },
        unit_amount: toUsdCents(item.price),
      },
      quantity: item.quantity,
    }));

    line_items.push({
      price_data: {
        currency: "usd",
        product_data: { name: "Delivery Charges" },
        unit_amount: toUsdCents(DELIVERY_FEE_USD),
      },
      quantity: 1,
    });

    const orderIdStr = String(savedOrder._id);

    const session = await stripe.checkout.sessions.create({
      line_items,
      mode: "payment",
      success_url: `${frontendUrl}/verify?success=true&orderId=${orderIdStr}`,
      cancel_url: `${frontendUrl}/verify?success=false&orderId=${orderIdStr}`,
      payment_method_types: ["card"],
      client_reference_id: orderIdStr,
      metadata: { orderId: orderIdStr },
    });

    logger.info("Stripe session created", { orderId: orderIdStr });

    res.json({ success: true, session_url: session.url });
  } catch (error) {
    logger.error("Order creation failed", { error: error.message });
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Get my orders
const userOrders = async (req, res) => {
  try {
    const orders = await orderModel.find({ userId: req.body.userId });
    res.json({ success: true, data: orders });
  } catch (error) {
    logger.error("Fetch user orders failed", { error: error.message });
    res.json({ success: false, message: "error" });
  }
};

// @desc Payment status
const getOrderPaymentStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid order id" });
    }

    const order = await orderModel
      .findOne({ _id: orderId, userId })
      .select("payment status")
      .lean();

    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }

    res.json({
      success: true,
      payment: order.payment,
      status: order.status,
    });
  } catch (error) {
    logger.error("Fetch payment status failed", { error: error.message });
    res.status(500).json({ success: false, message: "Error" });
  }
};

// @desc List all orders (Admin)
const listOrders = async (req, res) => {
  try {
    const orders = await orderModel.find({});

    for (const order of orders) {
      if (order.status === "Refunded" && order.payment === true) {
        logger.warn("Auto-fixing inconsistent order state", {
          orderId: order._id,
        });

        order.payment = false;
        await order.save();
      }
    }

    res.json({ success: true, data: orders });
  } catch (error) {
    logger.error("List orders failed", { error: error.message });
    res.json({ success: false, message: "Error" });
  }
};

// @desc Update order status (Admin)
const updateStatus = async (req, res) => {
  try {
    const { orderId, status } = req.body;

    // Block invalid usage first
    if (status === "Refunded") {
      return res.json({
        success: false,
        message: "Use refund API instead",
      });
    }

    const order = await orderModel.findById(orderId);

    if (!order) {
      return res.json({ success: false, message: "Order not found" });
    }

    // 🔍 Consistency check
    if (order.status === "Refunded" && order.payment === true) {
      logger.error("Inconsistent state detected", { orderId });
    }

    // Update status safely
    order.status = status;
    await order.save();

    logger.info("Order status updated", { orderId, status });

    res.json({ success: true, message: "Status Updated" });

  } catch (error) {
    logger.error("Update status failed", { error: error.message });
    res.json({ success: false, message: "Error" });
  }
};

const refundOrder = async (req, res) => {
  try {
    const { orderId } = req.body;

    const order = await orderModel.findById(orderId);
    if (!order) {
      return res.json({ success: false, message: "Order not found" });
    }

    if (order.status === "Refunded" && order.payment === true) {
      logger.warn("Auto-fixing before refund", { orderId });
      order.payment = false;
      await order.save();

      return res.json({
        success: true,
        message: "Order already refunded (state corrected)",
      });
    }

    if (!order.payment) {
      return res.json({ success: false, message: "Order not paid" });
    }

    if (!order.paymentIntentId) {
      return res.json({
        success: false,
        message: "Missing payment intent",
      });
    }

    if (order.status === "Refunded") {
      return res.json({
        success: false,
        message: "Already refunded",
      });
    }

    // Stripe refund
    await stripe.refunds.create({
      payment_intent: order.paymentIntentId,
    });

    // Update DB
    order.payment = false;
    order.status = "Refunded";
    await order.save();

    logger.info("Order refunded", { orderId });

    res.json({ success: true, message: "Refund successful" });

  } catch (error) {
    logger.error("Refund failed", { error: error.message });
    res.json({ success: false, message: "Refund failed" });
  }
};

export {
  placeOrder,
  userOrders,
  getOrderPaymentStatus,
  listOrders,
  updateStatus,
  refundOrder
};
