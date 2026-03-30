import "./Navbar.css";
import { assets } from "../../assets/assets.js";

const Navbar = () => {
  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    window.location.href = "/login";
  };

  return (
    <div className="navbar">
      <img className="logo" src={assets.logo} alt="" />
      <img className="profile" src={assets.profile_image} alt="" />

      {/* Logout Button */}
      <button onClick={handleLogout} style={{ marginLeft: "20px" }}>
        Logout
      </button>
    </div>
  );
};

export default Navbar;