import express from "express"
import authMiddleware from "../middleware/auth.middleware.js"
import { placeOrder, userOrders, verifyOrder, listOrders, updateStatus} from "../controllers/order.controller.js"
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

orderRouter.get("/list", listOrders)

orderRouter.post("/status", updateStatus)

export default orderRouter