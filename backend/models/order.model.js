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
        rating: { type: Number, default: 0 } // ⭐ ADD THIS
      }
    ],
    amount: { type: Number, required: true },
    address: { type: Object, required: true },
    status: { type: String, default: "Food Processing" },
    date: { type: Date, default: Date.now() },
    payment: { type: Boolean, default: false }
  }, { timestamps: true }
)

const orderModel = mongoose.models.order || mongoose.model("order", orderSchema)

export default orderModel
