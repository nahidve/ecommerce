import express from "express"
import authMiddleware from "../middleware/auth.middleware.js"
import { placeOrder, cancelOrder, getMyOrders, getAllOrders, updateOrderStatus } from "../controllers/order.controller.js"
// import adminMiddleware from "../middleware/admin.middleware.js"

const orderRouter = express.Router()

// @desc Place new order
// @route POST /api/order/place
// @access Private
orderRouter.post("/place", authMiddleware, placeOrder)

// @desc Get my orders
// @route GET /api/order/me
// @access Private
orderRouter.get("/me", authMiddleware, getMyOrders)

// @desc Cancel my orders
// @route DELETE /api/order/:id
// @access Private
orderRouter.delete("/:id", authMiddleware, cancelOrder)

// @desc Get all orders (Admin)
// @route GET /api/order/orders
// @access Private/Admin
orderRouter.get("/orders", authMiddleware, getAllOrders)

// @desc Update order status (Admin)
// @route PUT /api/order/:id
// @access Private/Admin
orderRouter.put("/:id", authMiddleware, updateOrderStatus)

export default orderRouter