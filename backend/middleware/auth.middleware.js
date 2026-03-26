import jwt from "jsonwebtoken";
import logger from "../config/logger.js";

const authMiddleware = async (req, res, next) => {
  try {
    const { token } = req.headers;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Not Authorized. Login Again",
      });
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      logger.error("JWT_SECRET is not set in environment");
      return res.status(500).json({
        success: false,
        message: "Server misconfiguration",
      });
    }

    const decoded = jwt.verify(token, secret);

    if (!req.body || typeof req.body !== "object") {
      req.body = {};
    }
    req.body.userId = decoded.id;
    req.user = { id: decoded.id };

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({
        success: false,
        message: "Session expired. Please log in again.",
      });
    }
    if (error instanceof jwt.JsonWebTokenError) {
      logger.warn("Invalid JWT", { error: error.message });
      return res.status(401).json({
        success: false,
        message: "Invalid or expired session. Please log in again.",
      });
    }
    logger.error("Auth middleware error", { error: error.message });
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

export default authMiddleware;
