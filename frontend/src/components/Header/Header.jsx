// components/Header/Header.jsx
import "./Header.css";
import bannerVideo from "../../assets/frontend_assets/background.mp4";

const Header = () => {
  const scrollToMenu = () => {
    const menuSection = document.getElementById('food-display'); // ← Changed to match
    console.log('Found menu section:', menuSection); // Debug
    
    if (menuSection) {
      menuSection.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
    } else {
      console.log('Element with id "food-display" not found');
    }
  };

  return (
    <div className="header">
      <video 
        className="header-video"
        autoPlay
        loop
        muted
        playsInline
      >
        <source src={bannerVideo} type="video/mp4" />
        Your browser does not support the video tag.
      </video>
      
      <div className="header-content">
        <h2>Order your favourite food here</h2>
        <p>Choose from a diverse menu featuring a delectable array of dishes</p>
        <button onClick={scrollToMenu}>View Menu</button>
      </div>
    </div>
  );
};

export default Header;