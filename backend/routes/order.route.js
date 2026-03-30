import express from "express";
import authMiddleware from "../middleware/auth.middleware.js";
import adminMiddleware from "../middleware/admin.middleware.js";

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
orderRouter.get("/list", authMiddleware, adminMiddleware, listOrders);
orderRouter.post("/status", authMiddleware, adminMiddleware, updateStatus);
orderRouter.post("/refund", authMiddleware, adminMiddleware, refundOrder);

export default orderRouter;
