import orderModel from "../models/order.model.js";
import userModel from "../models/user.model.js";
import Stripe from "stripe";
import { generateInvoice } from "../config/generateInvoice.js";
import { sendInvoiceEmail } from "../config/sendEmail.js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// @desc Place new order
// @route POST /api/order/place
// @access Private
const placeOrder = async (req, res) => {
  const frontend_url = "http://localhost:5173";

  try {
    console.log("Incoming items:", req.body.items); // ✅ debug

    // ✅ Ensure proper structure + rating field
    const formattedItems = Array.isArray(req.body.items)
      ? req.body.items.map((item) => ({
          _id: item._id,
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          rating: item.rating || 0,
        }))
      : [];

    // Save order
    const newOrder = new orderModel({
      userId: req.body.userId,
      items: formattedItems,
      amount: req.body.amount,
      address: req.body.address,
      status: "pending",
    });

    await newOrder.save();

    // Clear cart
    await userModel.findByIdAndUpdate(req.body.userId, { cartData: {} });

    // Stripe line items
    const line_items = formattedItems.map((item) => ({
      price_data: {
        currency: "usd",
        product_data: {
          name: item.name,
        },
        unit_amount: Number(item.price * 100),
      },
      quantity: item.quantity,
    }));

    // Delivery fee
    line_items.push({
      price_data: {
        currency: "usd",
        product_data: {
          name: "Delivery Charges",
        },
        unit_amount: 2 * 100,
      },
      quantity: 1,
    });

    // Create Stripe session
    const session = await stripe.checkout.sessions.create({
      line_items,
      mode: "payment",
      success_url: `${frontend_url}/verify?success=true&orderId=${newOrder._id}`,
      cancel_url: `${frontend_url}/verify?success=false&orderId=${newOrder._id}`,
      payment_method_types: ["card"],
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

// @desc Verify payment
// @route POST /api/order/verify
// @access Public
const verifyOrder = async (req, res) => {
  const { orderId, success } = req.body;

  try {
    if (success == "true") {
      const updatedOrder = await orderModel.findByIdAndUpdate(
        orderId,
        { payment: true },
        { new: true }
      );

      const user = await userModel.findById(updatedOrder.userId);

      // Generate & send invoice
      try {
        const invoicePath = await generateInvoice(updatedOrder, user);
        await sendInvoiceEmail(user.email, invoicePath, updatedOrder);
        console.log("Invoice sent successfully");
      } catch (pdfError) {
        console.error("Invoice error:", pdfError);
      }

      res.json({ success: true, message: "PAID" });
    } else {
      await orderModel.findByIdAndDelete(orderId);
      res.json({ success: false, message: "NOT PAID" });
    }
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error" });
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
  verifyOrder,
  listOrders,
  updateStatus,
};