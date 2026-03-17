import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"
import connectDB from "./config/db.js"
import foodRouter from "./routes/food.route.js"
import userRouter from "./routes/user.route.js"
import cartRouter from "./routes/cart.route.js"
import orderRouter from "./routes/order.route.js"
import path from "path"
import { fileURLToPath } from "url"
import Razorpay from "razorpay"
import paymentRouter from "./routes/payment.route.js"
import dotenv from "dotenv"

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env
dotenv.config()

//app config
const app = express()
const PORT = process.env.PORT || 4000

//middlewares
app.use(express.json())
app.use(cookieParser())
app.use(cors())

//api endpoints
app.use("/api/food", foodRouter)
app.use("/images", express.static("uploads"))
app.use("/api/user", userRouter)
app.use("/api/cart", cartRouter)
app.use("/api/order", orderRouter)


// RAZORPAY API KEYS
export const instance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
})

app.post("/payment/process", (req, res)=>{
  res.status(200).json({success:true})
})

app.get('/place', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Route to serve the success page(TESTING IN HTML)
app.get('/payment-success', (req, res) => {
  res.sendFile(path.join(__dirname, 'success.html'));
})

//app.get("/", (req, res) => res.send("API Running"))
app.get("/health", (req, res) => res.send("Server is running"))

//Connect to MongoDB and start server
connectDB().then(() => {
    app.listen(PORT, () => console.log(`Server is running on port ${PORT}`))
}).catch((error) => console.log(error))



