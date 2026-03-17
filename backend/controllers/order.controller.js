import orderModel from "../models/order.model.js"
import userModel from "../models/user.model.js"
import stripe from "stripe"

// @desc Place new order
// @route POST /api/order/place
// @access Private
const placeOrder = async (req, res) => {
  try {
    let { items, address, amount, paymentMethod } = req.body
    const userId = req.user._id

    if (!items || items.length === 0)
      return res.status(400).json({ success: false, message: "No items in order" })

    const detailedItems = []
    amount = 0

    for (const item of items) {
      const food = await foodModel.findById(item.foodId)

      if (!food)
        return res.status(400).json({
          success: false,
          message: `Food item not found: ${item.foodId}`
        })

      const itemTotal = Math.round(food.price * item.quantity * 100) / 100
      amount += itemTotal

      detailedItems.push({
        foodId: food._id,
        name: food.name,
        quantity: item.quantity,
        price: food.price,
        total: itemTotal
      })
    }

    // Save order to MongoDB
    const newOrder = new orderModel({
      userId,
      items: detailedItems,
      address,
      amount,
      status: "pending",
      payment: {
        method: paymentMethod,
        status: "pending"
      }
    })

    await newOrder.save()

    res.status(201).json({
      success: true,
      order: newOrder
    })

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