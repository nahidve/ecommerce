import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true },
    items: [
      {
        _id: { type: String }, // foodId
        name: String,
        quantity: Number,
        price: Number,
        rating: { type: Number, default: 0 },
      },
    ],
    amount: { type: Number, required: true },
    address: { type: Object, required: true },
    status: { type: String, default: "Food Processing" },
    date: { type: Date, default: Date.now() },
    payment: { type: Boolean, default: false },
    paymentIntentId: { type: String },
    refundedAmount: { type: Number, default: 0 },
    refundHistory: [
      {
        amount: { type: Number, required: true },
        stripeRefundId: { type: String },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    idempotencyKey: { type: String, required: true, unique: true },
  },
  { timestamps: true },
);

// Index for fetching user orders sorted by date (most common query)
orderSchema.index({ userId: 1, createdAt: -1 });

// Index for restaurant dashboard queries
orderSchema.index({ "items._id": 1, status: 1, createdAt: -1 });

// Index for filtering orders by status and date (admin/restaurant view)
orderSchema.index({ status: 1, createdAt: -1 });

// Index for payment status queries
orderSchema.index({ payment: 1, status: 1 });

// Index for date-based queries (e.g., daily/weekly reports)
orderSchema.index({ createdAt: -1 });

// Compound index for order analytics by date range
orderSchema.index({ createdAt: 1, status: 1, amount: 1 });

const orderModel =
  mongoose.models.order || mongoose.model("order", orderSchema);

export default orderModel;
