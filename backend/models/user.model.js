import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    cartData: { type: Object, default: {} },
    isVerified: { type: Boolean, default: false },
    otp: { type: String },
    otpExpiry: { type: Date },
    // isAdmin: { type: Boolean, default: false }
  },
  { minimize: false, timestamps: true }
)

// Index for email lookups (already has unique:true, but explicit index is good)
// userSchema.index({ email: 1 }, { unique: true });

// Index for OTP queries - useful for finding users by OTP during verification
userSchema.index({ otp: 1, otpExpiry: 1 });

// Index for filtering by verification status
userSchema.index({ isVerified: 1 });

// Compound index for common queries (if you often query by verification + email)
userSchema.index({ isVerified: 1, email: 1 });

const userModel = mongoose.models.user || mongoose.model("user", userSchema);

export default userModel;