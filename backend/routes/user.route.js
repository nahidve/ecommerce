import express from "express"
import { signupUser, loginUser, logoutUser, deleteUser, checkAuth } from "../controllers/user.controller.js"
import authMiddleware from "../middleware/auth.middleware.js"

const userRouter = express.Router()

//@desc: Register a new user
//@route: POST /api/user/signup
//@access: Public
userRouter.post("/signup", signupUser)

//@desc: Login user
//@route: POST /api/user/login
//@access: Public
userRouter.post("/login", loginUser)

//@desc: Logout user
//@route: POST /api/user/logout
//@access: Private
userRouter.post("/logout", authMiddleware, logoutUser)

//@desc: Delete user
//@route: DELETE /api/user/delete
//@access: Private
userRouter.delete("/delete", authMiddleware, deleteUser)

//@desc: checkAuth
//@route: GET /api/user/check
//@access: Private
userRouter.get("/check", authMiddleware, checkAuth)

export default userRouter

