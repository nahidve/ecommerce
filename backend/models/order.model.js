import mongoose from "mongoose";

// Reused the cartItemSchema idea for order items
// const orderItemSchema = new mongoose.Schema({
//   foodId: { type: mongoose.Schema.Types.ObjectId, ref: "food", required: true },
//   quantity: { type: Number, default: 1, min: 1 }
// })

const orderSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true },
    items: { type: Array, required: true },
    amount: { type: Number, required: true },
    address: { type: Object, required: true },
    status: {type:String, default:"Food Processing"},
    date:{type:Date, default:Date.now()},
    payment:{type:Boolean, default:false}
  }, { timestamps: true }
)

const orderModel = mongoose.models.order || mongoose.model("order", orderSchema)

export default orderModel
