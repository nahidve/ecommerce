import mongoose from "mongoose";
import orderModel from "../models/order.model.js";
import foodModel from "../models/food.model.js";
import { stripe } from "../config/stripe.js";

const DELIVERY_FEE_USD = 2;

const toUsdCents = (usd) => Math.round(Number(usd) * 100);

// @desc Place new order (prices from DB only; ignores client price/total)
// @route POST /api/order/place
// @access Private
const placeOrder = async (req, res) => {
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";

  try {
    const userId = req.body.userId;
    const address = req.body.address;
    const rawItems = req.body.items;

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
    });

    await newOrder.save();

    const line_items = formattedItems.map((item) => ({
      price_data: {
        currency: "usd",
        product_data: {
          name: item.name,
        },
        unit_amount: toUsdCents(item.price),
      },
      quantity: item.quantity,
    }));

    line_items.push({
      price_data: {
        currency: "usd",
        product_data: {
          name: "Delivery Charges",
        },
        unit_amount: toUsdCents(DELIVERY_FEE_USD),
      },
      quantity: 1,
    });

    const orderIdStr = String(newOrder._id);
    const session = await stripe.checkout.sessions.create({
      line_items,
      mode: "payment",
      success_url: `${frontendUrl}/verify?success=true&orderId=${newOrder._id}`,
      cancel_url: `${frontendUrl}/verify?success=false&orderId=${newOrder._id}`,
      payment_method_types: ["card"],
      client_reference_id: orderIdStr,
      metadata: {
        orderId: orderIdStr,
      },
    });

    res.json({ success: true, session_url: session.url });
  } catch (error) {
    console.error("Error creating order:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Get my orders
// @route POST /api/order/userorders
// @access Private
const userOrders = async (req, res) => {
  try {
    const orders = await orderModel.find({ userId: req.body.userId });
    res.json({ success: true, data: orders });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "error" });
  }
};

// @desc Poll payment status (read-only; payment is set by Stripe webhook)
// @route GET /api/order/payment-status/:orderId
// @access Private
const getOrderPaymentStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({ success: false, message: "Invalid order id" });
    }

    const order = await orderModel
      .findOne({ _id: orderId, userId })
      .select("payment status")
      .lean();

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    res.json({
      success: true,
      payment: order.payment,
      status: order.status,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Error" });
  }
};

// @desc List all orders (Admin)
const listOrders = async (req, res) => {
  try {
    const orders = await orderModel.find({});
    res.json({ success: true, data: orders });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error" });
  }
};

// @desc Update order status (Admin)
const updateStatus = async (req, res) => {
  try {
    await orderModel.findByIdAndUpdate(req.body.orderId, {
      status: req.body.status,
    });
    res.json({ success: true, message: "Status Updated" });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error" });
  }
};

export {
  placeOrder,
  userOrders,
  getOrderPaymentStatus,
  listOrders,
  updateStatus,
};
