import "dotenv/config";
import mongoose from "mongoose";

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Worker DB connected");
  } catch (err) {
    console.error("Worker DB connection failed:", err);
  }
};

await connectDB();

import { Worker } from "bullmq";
import { generateInvoice } from "../config/generateInvoice.js";
import { sendInvoiceEmail, sendOTPEmail } from "../config/sendEmail.js";
import userModel from "../models/user.model.js";


const connection = {
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT,
  username: "default",
  password: process.env.REDIS_PASSWORD,
};



const worker = new Worker(
  "email-queue",
  async (job) => {
    const { type, data } = job.data;

    if (type === "SEND_OTP") {
      await sendOTPEmail(data.email, data.otp);
    }

    if (type === "SEND_INVOICE") {
      const { order } = data;

      const user = await userModel.findById(order.userId);
      const invoicePath = await generateInvoice(order, user);

      await sendInvoiceEmail(user?.email, invoicePath, order);
    }
  },
  { connection }
);

worker.on("completed", (job) => {
  console.log(`Job completed: ${job.id}`);
});

worker.on("failed", (job, err) => {
  console.error(`Job failed: ${job.id}`, err.message);
});

