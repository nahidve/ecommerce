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
      amount: req.body.amount,
      address: req.body.address,
      status: "pending",
    })
    await newOrder.save()
    await userModel.findByIdAndUpdate(req.body.userId, { cartData: {} })
 
    const line_items = req.body.items.map((item) => ({
      price_data: {
        currency: "usd",
        product_data: {
          name: item.name
        },
        unit_amount: Number(item.price * 100)
      },
      quantity: item.quantity
    }))
    line_items.push({
      price_data: {
        currency: "usd",
        product_data: {
          name: "Delivery Charges"
        },
        unit_amount: 2 * 100
      },
      quantity: 1
    })
 
    const session = await stripe.checkout.sessions.create({
      line_items: line_items,
      mode: "payment",
      success_url: `${frontend_url}/verify?success=true&orderId=${newOrder._id}`,
      cancel_url: `${frontend_url}/verify?success=false&orderId=${newOrder._id}`,
      payment_method_types: ["card"]
    })
    res.json({ success: true, session_url: session.url })
 
  } catch (error) {
    console.error("Error creating order:", error)
    res.status(500).json({ success: false, message: error.message })
  }
}
 
// @desc Get my orders
// @route GET /api/order/me
// @access Private
const userOrders = async (req, res) => {
  try {
    const orders = await orderModel.find({userId:req.body.userId})
    res.json({success:true, data:orders})
  } catch (error) {
    console.log(error)
    res.json({success:false, message:"error"})
  }
}


// @desc Cancel my orders
// @route DELETE /api/order/:id
// @access Private

// @desc Get all orders (Admin)
// @route GET /api/order/orders
// @access Private/Admin

// @desc Update order status (Admin)
// @route PUT /api/order/:id
// @access Private/Admin


const verifyOrder = async (req, res) => {
  const {orderId, success} = req.body
  try {
    if(success == "true") {
      await orderModel.findByIdAndUpdate(orderId, {payment:true})
      res.json({success:true, message:"PAID"})
    }
    else {
      await orderModel.findByIdAndDelete(orderId)
      res.json({success:false, message:"NOT PAID"})
    }
  } catch (error) {
    console.log(error)
    res.json({success:false, message:"Error"})
  }
}
 
export { placeOrder, verifyOrder, userOrders }