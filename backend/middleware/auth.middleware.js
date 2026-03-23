import jwt from "jsonwebtoken"

const authMiddleware = async (req, res, next) => {
  try {
    const { token } = req.headers

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Not Authorized. Login Again",
      })
    }

    const secret = process.env.JWT_SECRET
    if (!secret) {
      console.error("JWT_SECRET is not set in environment")
      return res.status(500).json({
        success: false,
        message: "Server misconfiguration",
      })
    }

    const decoded = jwt.verify(token, secret)

    if (!req.body || typeof req.body !== "object") {
      req.body = {}
    }
    req.body.userId = decoded.id
    req.user = { id: decoded.id }

    next()
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({
        success: false,
        message: "Session expired. Please log in again.",
      })
    }
    if (error instanceof jwt.JsonWebTokenError) {
      console.error("Error in auth middleware", error.name, error.message)
      return res.status(401).json({
        success: false,
        message: "Invalid or expired session. Please log in again.",
      })
    }
    console.error("Error in auth middleware", error)
    res.status(500).json({ success: false, message: "Internal Server Error" })
  }
}

export default authMiddleware