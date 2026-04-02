import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import "./VerifyOTP.css";
import { API_BASE_URL } from "../../store/constants.js";

export const VerifyOTP = () => {
  const [otp, setOtp] = useState("");
  const navigate = useNavigate();
  const location = useLocation();

  const email = location.state?.email;

  const handleVerify = async (e) => {
    e.preventDefault();

    try {
      const response = await axios.post(`${API_BASE_URL}/api/user/verify-otp`, {
        email,
        otp,
      });

      if (response.data.success) {
        alert("Email verified successfully!");
        navigate("/login");
      } else {
        alert(response.data.message);
      }
    } catch (error) {
      console.error(error);
      alert("Error verifying OTP");
    }
  };

  if (!email) {
    return <p>Invalid access. Please signup again.</p>;
  }

  return (
    <div className="verify-otp">
      <div className="verify-otp-card">
        <form onSubmit={handleVerify} className="verify-otp-form">
          <h2>Verify OTP</h2>
          <p className="subtitle">
            Enter the 6-digit code sent to<br />
            <strong>{email}</strong>
          </p>

          <div className="input-group">
            <input
              type="text"
              placeholder="Enter 6-digit OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              maxLength="6"
              required
            />
          </div>

          <button type="submit" className="verify-btn">Verify Account</button>
        </form>
        <p className="resend-text">Didn't receive code? <span>Resend OTP</span></p>
        <button className="back-to-login" onClick={() => navigate("/login")}>Back to Login</button>
      </div>
    </div>
  );
};
