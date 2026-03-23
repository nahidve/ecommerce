import { useNavigate, useSearchParams } from "react-router-dom";
import "./Verify.css";
import { useEffect } from "react";
import axios from "axios";
import { API_BASE_URL } from "../../store/constants.js";
import { useAppSelector } from "../../store/hooks.js";

const Verify = () => {
  const [searchParams] = useSearchParams();
  const success = searchParams.get("success");
  const orderId = searchParams.get("orderId");
  const navigate = useNavigate();
  const token = useAppSelector((state) => state.auth.token);

  useEffect(() => {
    if (!orderId) {
      navigate("/");
      return;
    }

    if (success === "false") {
      navigate("/cart");
      return;
    }

    if (success !== "true") {
      navigate("/");
      return;
    }

    const authToken = token || localStorage.getItem("token") || "";
    if (!authToken) {
      navigate("/cart");
      return;
    }

    let cancelled = false;
    let intervalId;

    const checkPayment = async () => {
      try {
        const res = await axios.get(
          `${API_BASE_URL}/api/order/payment-status/${orderId}`,
          { headers: { token: authToken } }
        );
        if (cancelled) return;
        if (res.data.success && res.data.payment) {
          clearInterval(intervalId);
          navigate("/myorders");
        }
      } catch {
        // keep polling until timeout
      }
    };

    checkPayment();
    intervalId = setInterval(checkPayment, 2000);
    const timeoutId = setTimeout(() => {
      if (!cancelled) navigate("/myorders");
    }, 90000);

    return () => {
      cancelled = true;
      clearInterval(intervalId);
      clearTimeout(timeoutId);
    };
  }, [orderId, success, token, navigate]);

  return (
    <div className="verify">
      <div className="spinner"></div>
    </div>
  );
};

export default Verify;
