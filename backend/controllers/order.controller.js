import orderModel from "../models/order.model.js"
import userModel from "../models/user.model.js"
import Stripe from "stripe"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

// @desc Place new order
// @route POST /api/order/place
// @access Private
const placeOrder = async (req, res) => {

  const frontend_url = "http://localhost:5173"

  try {
    // Save order to MongoDB
    const newOrder = new orderModel({
      userId: req.body.userId,
      items: req.body.items,
      amount:req.body.amount,
      address: req.body.address,
      status: "pending",
    })
    await newOrder.save()
    await userModel.findByIdAndUpdate(req.body.userId, {cartData:{}})

    const line_items = req.body.items.map((item)=>({
      price_data:{
        currency:"usd",
        product_data:{
          name:item.name
        },
        unit_amount:item.price*100
      },
      quantity:item.quantity
    }))
    line_items.push({
      price_data:{
        currency:"usd",
        product_data:{
          name:"Delivery Charges"
        },
        unit_amount:2*100
      },
      quantity:1
    })

    const session = await stripe.checkout.session.create({
      line_items:line_items,
      mode:"payment",
      success_url:`${frontend_url}/verify?success=true&orderId=${newOrder._id}`,
      cancel_url:`${frontend_url}/verify?success=false&orderId=${newOrder._id}`
    })
    res.json({success:true, session_url:session.url})

  } catch (error) {
    console.error("Error creating order:", error)
    res.status(500).json({ success: false, message: error.message })
  }
}

// @desc Get my orders
// @route GET /api/order/me
// @access Private
const getMyOrders = async (req, res) => {
  try {
    const userId = req.user._id

    const orders = await orderModel
      .find({ userId })
      .sort({ createdAt: -1 })
      .populate("items.foodId")

    const ordersFormatted = orders.map(order => ({
      id: order._id,
      items: order.items.map(item => ({
        foodId: item.foodId._id,
        name: item.foodId.name,
        quantity: item.quantity,
        price: item.foodId.price,
        total: Math.round(item.quantity * item.foodId.price * 100) / 100
      })),
      amount: order.amount,
      status: order.status,
      payment: order.payment,
      address: order.address,
      date: order.createdAt
    }))

    res.status(200).json({
      success: true,
      orders: ordersFormatted
    })

  } catch (error) {
    console.error("Error fetching user orders:", error)
    res.status(500).json({ success: false, message: "Failed to fetch orders" })
  }
}

// @desc Cancel my orders
// @route DELETE /api/order/:id
// @access Private
const cancelOrder = async (req, res) => {
  try {
    const userId = req.user._id
    const orderId = req.params.id

    const order = await orderModel.findOne({ _id: orderId, userId })

    if (!order)
      return res.status(404).json({ success: false, message: "Order not found" })

    if (order.status !== "pending")
      return res.status(400).json({
        success: false,
        message: "Only pending orders can be cancelled"
      })

    if (order.status === "cancelled")
      return res.status(400).json({
        success: false,
        message: "Order is already cancelled"
      })

    order.status = "cancelled"
    await order.save()

    res.status(200).json({
      success: true,
      message: "Order cancelled successfully.",
      order
    })

  } catch (error) {
    console.error("Error cancelling order:", error)
    res.status(500).json({ success: false, message: "Failed to cancel order" })
  }
}

// @desc Get all orders (Admin)
// @route GET /api/order/orders
// @access Private/Admin
const getAllOrders = async (req, res) => {
  try {
    if (!req.user.isAdmin)
      return res.status(403).json({
        success: false,
        message: "Forbidden: Admins only"
      })

    const orders = await orderModel
      .find({})
      .sort({ createdAt: -1 })
      .populate("userId", "name email")
      .populate("items.foodId")

    const ordersFormatted = orders.map(order => ({
      id: order._id,
      user: order.userId
        ? {
            id: order.userId._id,
            name: order.userId.name,
            email: order.userId.email
          }
        : null,
      items: order.items.map(item => ({
        foodId: item.foodId._id,
        name: item.foodId.name,
        quantity: item.quantity,
        price: item.foodId.price,
        total: Math.round(item.quantity * item.foodId.price * 100) / 100
      })),
      amount: order.amount,
      status: order.status,
      payment: order.payment,
      address: order.address,
      date: order.createdAt
    }))

    res.status(200).json({
      success: true,
      orders: ordersFormatted
    })

  } catch (error) {
    console.error("Error fetching all orders:", error)
    res.status(500).json({ success: false, message: "Failed to fetch orders" })
  }
}

// @desc Update order status (Admin)
// @route PUT /api/order/:id
// @access Private/Admin
const updateOrderStatus = async (req, res) => {
  try {
    const orderId = req.params.id
    const { status } = req.body

    const validStatuses = [
      "pending",
      "confirmed",
      "preparing",
      "delivered",
      "cancelled"
    ]

    if (!validStatuses.includes(status))
      return res.status(400).json({
        success: false,
        message: "Invalid status value"
      })

    const order = await orderModel.findById(orderId)

    if (!order)
      return res.status(404).json({
        success: false,
        message: "Order not found"
      })

    order.status = status
    await order.save()

    res.status(200).json({
      success: true,
      message: `Order status updated to ${status}`,
      order
    })

  } catch (error) {
    console.error("Error updating order status:", error)
    res.status(500).json({
      success: false,
      message: "Failed to update order status"
    })
  }
}

export { placeOrder, getMyOrders, cancelOrder, getAllOrders, updateOrderStatus }