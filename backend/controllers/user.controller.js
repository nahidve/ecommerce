import userModel from "../models/user.model.js"
import bcrypt from "bcrypt"
import validator from "validator"
import dotenv from "dotenv"
import { generateToken } from "../config/utils.js"

// Load environment variables from .env for JWT secret token
dotenv.config()

//desc: Register a new user
//route: POST /api/user/register
//access: Public
const signupUser = async (req, res) => {
    // Extract user details from request body
    const { name, email, password } = req.body

    try {
        // Validate input
        if (!name || !email || !password) 
            return res.status(400).json({ success: false, message: "All fields are required!" })

        //Check if User with same email already exists
        const existsingUser = await userModel.findOne({ email })
        if (existsingUser) 
            return res.status(400).json({ success: false, message: "User already exists!" })

        // Validate email format & password strength
        if (!validator.isEmail(email))
            return res.status(400).json({ success: false, message: "Invalid email format!" })

        if (!validator.isStrongPassword(password, { 
            minLength: 4,
            minLowercase: 0,
            minUppercase: 0,
            minNumbers: 0,
            minSymbols: 0
         }))
            return res.status(400).json({ success: false, message: "Password is too short!" })

        // Hash password
        const salt = await bcrypt.genSalt(10)
        const hashedPassword = await bcrypt.hash(password, salt)

        //Check if this is the first user
        // const userCount = await userModel.countDocuments()

        // Create new user
        const newUser = new userModel({ 
            name, 
            email, 
            password: hashedPassword,
            // isAdmin: userCount === 0 //First user is admin
        })
        
        // Save user to database
        const user = await newUser.save()
        // Generate JWT token and set in cookie
        const token = generateToken(user._id, res)
        res.status(201).json({ success: true, token, message: "User registered successfully!", user: {
            id: user._id,
            name: user.name,
            email: user.email,
            // isAdmin: user.isAdmin
        }})

    } catch (error) {
        console.error("Error registering user:", error)
        res.status(500).json({ success: false, message: "Internal Server error" })
    }
    

}

//@desc: Login user
//@route: POST /api/user/login
//@access: Public
const loginUser = async (req, res) => {
    // Extract user details from request body
    const { email, password } = req.body

    try {
        const user = await userModel.findOne({ email })

        // Check if user exists
        if(!user)
            return res.status(400).json({ success: false, message: "User does not exist" })

        const isMatch = await bcrypt.compare(password, user.password)

        // Check if password matches
        if(!isMatch)
            return res.status(400).json({ success: false, message: "Invalid Credentials" })

        // Generate JWT token and set in cookie
        const token = generateToken(user._id, res)
        res.status(200).json({ success: true, token, message: "User logged in successfully!", user: {
            id: user._id,
            name: user.name,
            email: user.email,
            // isAdmin: user.isAdmin
        }})

    } catch (error) {
        console.error("Error logging in user:", error)
        res.status(500).json({ success: false, message: "Internal Server error" })
    }
}

//@desc: Logout user
//@route: POST /api/user/logout
//@access: Private
const logoutUser = async (req, res) => {
    try {
        res.cookie("jwt", "", { maxAge: 0 })
        res.status(200).json({success: true, message: "Logged Out Successfully"})

    } catch (error) {
        console.error("Error in logout controller", error)
        res.status(500).json({message:"Internal Server error"});
    }
}

//@desc: Delete user
//@route: DELETE /api/user/delete
//@access: Private
const deleteUser = async (req, res) => {
    const id = req.user._id

    try {
        // Check if user exists
        const user = await userModel.findById(id)
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found!" })
        }
        // Delete user
        await userModel.findByIdAndDelete(id)
        
        //Clear JWT cookie on deletion
        res.cookie("jwt", "", { maxAge: 0 })
        res.status(200).json({success: true, message: "User Deleted Successfully"})

    } catch (error) {
        console.error("Error deleting user:", error);
        res.status(500).json({ success: false, message: "Internal Server error" });
    }
}

//@desc: checkAuth
//@route: GET /api/user/check
//@access: Private
const checkAuth = async (req, res) => {
    try {
        res.status(200).json({ user: req.user })
    } catch (error) {
        console.error("Error checking auth:", error)
        res.status(500).json({ success: false, message: "Internal Server error." })
    }
}

export { signupUser, loginUser, logoutUser, deleteUser, checkAuth }

