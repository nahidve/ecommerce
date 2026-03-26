import "./config/env.js"
import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"
import connectDB from "./config/db.js"
import foodRouter from "./routes/food.route.js"
import userRouter from "./routes/user.route.js"
import cartRouter from "./routes/cart.route.js"
import orderRouter from "./routes/order.route.js"
import { connectRedis } from "./config/redis.js"
import { handleStripeWebhook } from "./controllers/stripeWebhook.controller.js"
import logger from "./config/logger.js"
import path from "path"
import { fileURLToPath } from "url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

//app config
const app = express()
const PORT = process.env.PORT || 4000

// Stripe webhook needs raw body — register before express.json()
// Use a broad `type` so charset variants (e.g. application/json; charset=utf-8) still parse as Buffer
app.post(
  "/api/order/stripe-webhook",
  express.raw({ type: "*/*" }),
  handleStripeWebhook,
)

//middlewares
app.use(express.json())
app.use(cookieParser())
app.use(cors())

//request logger middleware (winston)
app.use((req, res, next) => {
  const start = Date.now()
  
  res.on("finish", () => {
    logger.info("HTTP Request", {
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      duration: `${Date.now() - start}ms`,
    })
  })
  next()
})

//api endpoints
app.use("/api/food", foodRouter)
app.use("/images", express.static("uploads"))
app.use("/api/user", userRouter)
app.use("/api/cart", cartRouter)
app.use("/api/order", orderRouter)

app.get("/place", (req, res) => { res.sendFile(path.join(__dirname, "index.html")) })

// Route to serve the success page(TESTING IN HTML)
app.get("/payment-success", (req, res) => { res.sendFile(path.join(__dirname, "success.html")) })

//app.get("/", (req, res) => res.send("API Running"))
app.get("/health", (req, res) => res.send("Server is running"))

//Connect to MongoDB and start server
connectDB()
  .then(async () => { await connectRedis()

    // ✅ TEST REDIS HERE
    const redisClient = (await import("./config/redis.js")).default
    await redisClient.set("test", "working")
    const val = await redisClient.get("test")
    logger.info("Redis test successful", { value: val })

    app.listen(PORT, () => logger.info(`Server started on port ${PORT}`))
  })
  .catch((error) => logger.error("Startup error", { error }))
