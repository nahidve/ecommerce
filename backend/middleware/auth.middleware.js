import jwt from "jsonwebtoken"
import userModel from "../models/user.model.js"

const authMiddleware = async (req, res, next) => {
    try {
        //Get jwt token from cookie
        const { token } = req.headers
            if (!token) {
                return res.json({ success: false, message: "Not Authorized. Login Again" })
            }
            const token_decode = jwt.verify(token, process.env.JWT_SECRET);
            if (!req.body) req.body = {};
            req.body.userId = token_decode.id;
            next()
        } catch (error) {
        console.error("Error in protecting middleware", error)
        res.status(500).json({ success: false, message: "Internal Server Error" })
    }
}

export default authMiddleware