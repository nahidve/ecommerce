import { useState, useContext } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { StoreContext } from "../../context/StoreContext";
import "./VerifyOTP.css";

export const VerifyOTP = () => {
  const [otp, setOtp] = useState("");
  const { url } = useContext(StoreContext);
  const navigate = useNavigate();
  const location = useLocation();

  const email = location.state?.email;

  const handleVerify = async (e) => {
    e.preventDefault();

    try {
      const response = await axios.post(`${url}/api/user/verify-otp`, {
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
      <form onSubmit={handleVerify} className="verify-otp-form">
        <h2>Verify OTP</h2>
        <p>Enter the OTP sent to <strong>{email}</strong></p>

        <input
          type="text"
          placeholder="Enter OTP"
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
          required
        />

        <button type="submit">Verify</button>
      </form>
    </div>
  )
}