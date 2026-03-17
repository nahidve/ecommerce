const adminMiddleware = (req, res, next) => {
    try {
        if (req.user && req.user.isAdmin)
        next();
        
    } catch (error) {
        console.error("Not an admin", error);
        res.status(403).json({ success: false, message: "Forbidden - Admins only" });
    }
}

export default adminMiddleware;