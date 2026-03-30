import "./LoginPopup.css";
import { assets } from "../../assets/frontend_assets/assets";
import { useState } from "react";
import axios from "axios";
import { useAppDispatch } from "../../store/hooks.js";
import { API_BASE_URL } from "../../store/constants.js";
import { setToken } from "../../store/slices/authSlice.js";

const LoginPopup = ({ setShowLogin }) => {
  const dispatch = useAppDispatch();

  const [currState, setCurrState] = useState("Login"); // Login | Sign Up | OTP

  const [data, setData] = useState({
    name: "",
    email: "",
    password: "",
  });

  const [otp, setOtp] = useState("");

  const onChangeHandler = (event) => {
    const name = event.target.name;
    const value = event.target.value;
    setData((data) => ({ ...data, [name]: value }));
  };

  const onLogin = async (event) => {
    event.preventDefault();

    let newUrl = API_BASE_URL;

    if (currState === "Login") newUrl += "/api/user/login";
    else newUrl += "/api/user/signup";

    const response = await axios.post(newUrl, data);

    if (response.data.success) {
      if (currState === "Sign Up") {
        setCurrState("OTP");
        return;
      }

      dispatch(setToken(response.data.token));
      localStorage.setItem("userToken", response.data.token);
      setShowLogin(false);
    } else {
      if (response.data.message === "Please verify your email first") {
        setCurrState("OTP");
      }

      alert(response.data.message);
    }
  };

  const handleVerifyOTP = async (event) => {
    event.preventDefault();

    const response = await axios.post(API_BASE_URL + "/api/user/verify-otp", {
      email: data.email,
      otp,
    });

    if (response.data.success) {
      alert("Email verified successfully");
      setCurrState("Login");
    } else {
      alert(response.data.message);
    }
  };

  return (
    <div className="login-popup">
      <div className="login-popup-container">
        <div className="login-popup-title">
          <h2>{currState}</h2>
          <img
            onClick={() => setShowLogin(false)}
            src={assets.cross_icon}
            alt=""
          />
        </div>

        {(currState === "Login" || currState === "Sign Up") && (
          <form onSubmit={onLogin}>
            <div className="login-popup-inputs">
              {currState === "Sign Up" && (
                <input
                  name="name"
                  onChange={onChangeHandler}
                  value={data.name}
                  type="text"
                  placeholder="your name"
                  required
                />
              )}

              <input
                name="email"
                onChange={onChangeHandler}
                value={data.email}
                type="email"
                placeholder="your email"
                required
              />

              <input
                name="password"
                onChange={onChangeHandler}
                value={data.password}
                type="password"
                placeholder="password"
                required
              />
            </div>

            <button type="submit">
              {currState === "Sign Up" ? "Create account" : "Login"}
            </button>

            <div className="login-popup-condition">
              <input type="checkbox" required />
              <p>By continuing, I agree to the terms of use & privacy policy.</p>
            </div>

            {currState === "Login" ? (
              <p>
                Create a new account?{" "}
                <span onClick={() => setCurrState("Sign Up")}>Click here</span>
              </p>
            ) : (
              <p>
                Already have an account?{" "}
                <span onClick={() => setCurrState("Login")}>Login here</span>
              </p>
            )}
          </form>
        )}

        {currState === "OTP" && (
          <form onSubmit={handleVerifyOTP}>
            <p>
              Enter OTP sent to <strong>{data.email}</strong>
            </p>

            <input
              type="text"
              placeholder="Enter OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              required
            />

            <button type="submit">Verify OTP</button>

            <p>
              Back to <span onClick={() => setCurrState("Login")}>Login</span>
            </p>
          </form>
        )}
      </div>
    </div>
  );
};

export default LoginPopup;
