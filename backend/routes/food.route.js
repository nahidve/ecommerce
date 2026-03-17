import express from "express"
import { addFood, listFood, removeFood } from "../controllers/food.controller.js"
import multer from "multer"
import authMiddleware from "../middleware/auth.middleware.js"
import adminMiddleware from "../middleware/admin.middleware.js"

const foodRouter = express.Router()

//Image Storage Engine
const storage = multer.diskStorage({
    destination:"uploads",
    filename: (req, file, cb) => {
        return cb(null, `${Date.now()}${file.originalname}`)
    }
})

//Multer Middleware
const upload = multer({ storage: storage})

//@desc Add Food
//@route POST /api/food/add
//@access Private
foodRouter.post("/add",  upload.single("image"), addFood) 

//@desc List Foods
//@route GET /api/food/list
//@access Public
foodRouter.get("/list", listFood)

//@desc Remove Food
//@route DELETE /api/food/remove
//@access Private
foodRouter.delete("/remove", authMiddleware, adminMiddleware, removeFood)

export default foodRouter