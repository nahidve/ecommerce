const adminMiddleware = (req, res, next) => {
  try {
    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Admins only.",
      });
    }

    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Authorization error",
    });
  }
};

export default adminMiddleware;