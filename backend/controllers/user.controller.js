import userModel from "../models/user.model.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { emailQueue } from "../queues/email.queue.js";

// ================= HELPER: GENERATE OTP =================
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// ================= SIGNUP =================
const signupUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const existingUser = await userModel.findOne({ email });
    if (existingUser) {
      return res.json({ success: false, message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const otp = generateOTP();

    const user = new userModel({
      name,
      email,
      password: hashedPassword,
      otp,
      otpExpiry: Date.now() + 5 * 60 * 1000, // 5 minutes
      isVerified: false,
    });

    await user.save();

    // Send OTP email (non-blocking)
    await emailQueue.add(
      "send-otp",
      {
        type: "SEND_OTP",
        data: { email, otp },
      },
      {
        attempts: 3,
        backoff: {
          type: "exponential",
          delay: 5000,
        },
        removeOnComplete: 10,
        removeOnFail: 5,
      },
    );

    res.json({
      success: true,
      message: "OTP sent to email. Please verify your account.",
    });
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: "Signup error" });
  }
};

// ================= VERIFY OTP =================
const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const user = await userModel.findOne({ email });
    if (!user) {
      return res.json({ success: false, message: "User not found" });
    }

    if (!user.otp || user.otp !== otp) {
      return res.json({ success: false, message: "Invalid OTP" });
    }

    if (user.otpExpiry < Date.now()) {
      return res.json({ success: false, message: "OTP expired" });
    }

    user.isVerified = true;
    user.otp = null;
    user.otpExpiry = null;

    await user.save();

    res.json({
      success: true,
      message: "Email verified successfully",
    });
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: "Verification error" });
  }
};

// ================= LOGIN =================
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await userModel.findOne({ email });
    if (!user) {
      return res.json({ success: false, message: "User not found" });
    }

    // ❗ BLOCK if not verified
    if (!user.isVerified) {
      return res.json({
        success: false,
        message: "Please verify your email first",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.json({ success: false, message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: user._id, 
        role: user.role },
      process.env.JWT_SECRET
    );

    res.json({
      success: true,
      token,
      role: user.role
    });
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: "Login error" });
  }
};

// ================= LOGOUT =================
const logoutUser = async (req, res) => {
  try {
    res.json({ success: true, message: "Logged out successfully" });
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: "Logout error" });
  }
};

// ================= DELETE USER =================
const deleteUser = async (req, res) => {
  try {
    const userId = req.body.userId;

    await userModel.findByIdAndDelete(userId);

    res.json({ success: true, message: "User deleted" });
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: "Delete error" });
  }
};

// ================= CHECK AUTH =================
const checkAuth = async (req, res) => {
  try {
    const user = await userModel.findById(req.body.userId).select("-password");

    res.json({
      success: true,
      user,
    });
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: "Auth check error" });
  }
};

export { signupUser, verifyOTP, loginUser, logoutUser, deleteUser, checkAuth };
