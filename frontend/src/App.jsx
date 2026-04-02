import { useState } from "react";
import Navbar from "./components/Navbar/Navbar";
import { Route, Routes } from "react-router-dom";
import Home from "./pages/Home/Home";
import Cart from "./pages/Cart/Cart";
import PlaceOrder from "./pages/PlaceOrder/PlaceOrder";
import { Footer } from "./components/Footer/Footer";
import LoginPopup from "./components/LoginPopup/LoginPopup";
import Verify from "./pages/Verify/Verify";
import { MyOrders } from "./pages/MyOrders/MyOrders";
import { VerifyOTP } from "./pages/VerifyOTP/VerifyOTP";
import Chatbot from "./components/chatbot/Chatbot";

const App = () => {
  const [showLogin, setShowLogin] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);

  return (
    <>
      {showLogin ? <LoginPopup setShowLogin={setShowLogin} /> : <></>}
      <div className="app">
        <Navbar setShowLogin={setShowLogin} />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/order" element={<PlaceOrder />} />
          <Route path="/verify" element={<Verify />} />
          <Route path="/myorders" element={<MyOrders />} />
          <Route path="/verify-otp" element={<VerifyOTP />} />
        </Routes>
      </div>
      <Footer />
      {/* Floating Chat Button */}
      <button
        onClick={() => setChatOpen(!chatOpen)}
        style={{
          position: "fixed",
          bottom: "20px",
          right: "20px",
          zIndex: 1000,
          padding: "10px 15px",
          borderRadius: "50%",
          background: "#ff4d4f",
          color: "#fff",
          border: "none",
          cursor: "pointer",
        }}
      >
        💬
      </button>

      {/* Chatbot Popup */}
      {chatOpen && <Chatbot />}
    </>
  );
};

export default App;
