import jwt from "jsonwebtoken"
import dotenv from "dotenv"

// Load environment variables from .env for JWT secret token
dotenv.config()

// Function to generate JWT token
const  generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET)
}

export { generateToken }