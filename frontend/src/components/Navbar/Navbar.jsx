import "./navbar.css";
import { assets } from "../../assets/frontend_assets/assets.js";
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../store/hooks.js";
import { selectCartTotal } from "../../store/selectors.js";
import { clearToken } from "../../store/slices/authSlice.js";
import { setSearchQuery } from "../../store/slices/uiSlice.js";

const Navbar = ({ setShowLogin }) => {
  const [menu, setMenu] = useState("home");

  const dispatch = useAppDispatch();
  const cartTotal = useAppSelector(selectCartTotal);
  const token = useAppSelector((state) => state.auth.token);

  const [search, setSearch] = useState("");
  const [showSearch, setShowSearch] = useState(false);

  const navigate = useNavigate();

  // ⭐ Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      dispatch(setSearchQuery(search.toLowerCase()));
    }, 400);

    return () => clearTimeout(timer);
  }, [search, dispatch]);

  const logout = () => {
    localStorage.removeItem("token");
    dispatch(clearToken());
    navigate("/");
  };

  return (
    <div className="navbar">
      {/* Logo */}
      <Link to="/">
        <img src={assets.logo} alt="" className="logo" />
      </Link>

      {/* Menu */}
      <ul className="navbar-menu">
        <Link
          to="/"
          onClick={() => setMenu("home")}
          className={menu === "home" ? "active" : ""}
        >
          home
        </Link>

        <a
          href="#explore-menu"
          onClick={() => setMenu("menu")}
          className={menu === "menu" ? "active" : ""}
        >
          menu
        </a>

        <a
          href="#footer"
          onClick={() => setMenu("contact-us")}
          className={menu === "contact-us" ? "active" : ""}
        >
          contact us
        </a>
      </ul>

      {/* Right Section */}
      <div className="navbar-right">

        {/* 🔍 Search Icon */}
        <div className="search-wrapper">
          <img
            src={assets.search_icon}
            alt=""
            onClick={() => setShowSearch(!showSearch)}
            style={{ cursor: "pointer" }}
          />

          {/* ⭐ Toggle Search Input */}
          {showSearch && (
            <input
              type="text"
              placeholder="Search category..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="search-input"
            />
          )}
        </div>

        {/* Cart */}
        <div className="navbar-search-icon">
          <Link to="/cart">
            <img src={assets.basket_icon} alt="" />
          </Link>
          <div className={cartTotal === 0 ? "" : "dot"}></div>
        </div>

        {/* Auth */}
        {!token ? (
          <button onClick={() => setShowLogin(true)}>Sign In</button>
        ) : (
          <div className="navbar-profile">
            <img src={assets.profile_icon} alt="" />
            <ul className="nav-profile-dropdown">
              <li onClick={() => navigate("/myorders")}>
                <img src={assets.bag_icon} alt="" />
                <p>Orders</p>
              </li>
              <hr />
              <li onClick={logout}>
                <img src={assets.logout_icon} alt="" />
                <p>Logout</p>
              </li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default Navbar;