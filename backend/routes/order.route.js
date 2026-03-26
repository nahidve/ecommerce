import express from "express";
import authMiddleware from "../middleware/auth.middleware.js";
import {
  placeOrder,
  userOrders,
  getOrderPaymentStatus,
  listOrders,
  updateStatus,
  refundOrder,
} from "../controllers/order.controller.js";

const orderRouter = express.Router();

orderRouter.post("/place", authMiddleware, placeOrder);
orderRouter.post("/userorders", authMiddleware, userOrders);
orderRouter.get("/payment-status/:orderId", authMiddleware, getOrderPaymentStatus);
orderRouter.get("/list", listOrders);
orderRouter.post("/status", updateStatus);
orderRouter.post("/refund", refundOrder);

export default orderRouter;
