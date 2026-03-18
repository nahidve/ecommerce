import express from "express"
import authMiddleware from "../middleware/auth.middleware.js"
import { placeOrder, userOrders, verifyOrder } from "../controllers/order.controller.js"
// import adminMiddleware from "../middleware/admin.middleware.js"

const orderRouter = express.Router()

// @desc Place new order
// @route POST /api/order/place
// @access Private
orderRouter.post("/place", authMiddleware, placeOrder)

orderRouter.post("/verify", verifyOrder)

// @desc Get my orders
// @route POST /api/order/userorders
// @access Private
orderRouter.post("/userorders", authMiddleware, userOrders)

// @desc Cancel my orders
// @route DELETE /api/order/:id
// @access Private
// orderRouter.delete("/:id", authMiddleware, cancelOrder)

// @desc Get all orders (Admin)
// @route GET /api/order/orders
// @access Private/Admin
// orderRouter.get("/orders", authMiddleware, getAllOrders)

// @desc Update order status (Admin)
// @route PUT /api/order/:id
// @access Private/Admin
// orderRouter.put("/:id", authMiddleware, updateOrderStatus)

export default orderRouter