import "dotenv/config";
import { Queue } from "bullmq";


const connection = {
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT,
  username: "default",
  password: process.env.REDIS_PASSWORD,
};

export const emailQueue = new Queue("email-queue", { connection });