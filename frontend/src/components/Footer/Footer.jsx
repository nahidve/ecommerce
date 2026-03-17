import "./Footer.css"
import { assets } from "../../assets/frontend_assets/assets.js"

export const Footer = () => {
  return (
    <div className="footer" id="footer">
        <div className="footer-content">
          <div className="footer-content-left">
            <img src={ assets.logo } alt="" />
            <p>© 2026 Tomato. All rights reserved.</p>
            <div className="footer-social-icons">
              <img src={assets.twitter_logo} alt="" />
              <img src={assets.facebook_logo} alt="" />
              <img src={assets.instagram_logo} alt="" />
            </div>
          </div>
          <div className="footer-content-center">
            <h2>COMPANY</h2>
            <ul>
              <li><a href="#">Home</a></li>
              <li><a href="#">About Us</a></li>
              <li><a href="#">Delivery</a></li>
              <li><a href="#">Privacy Policy</a></li>
            </ul>
          </div>
          <div className="footer-content-right">
            <h2>CONTACT US</h2>
            <ul>
              <li>+91 1234567890</li>
              <li>contact@tomato.com</li>
            </ul>
          </div>
        </div>
        <hr/>
        <p className="footer-copyright">Copyright 2026 © Tomato. All rights reserved.</p>
    </div>
  )
}
