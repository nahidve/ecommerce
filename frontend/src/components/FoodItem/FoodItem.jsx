import "./FoodItem.css";
import { assets } from "../../assets/frontend_assets/assets.js";
import { useContext } from "react";
import { StoreContext } from "../../context/StoreContext";

const FoodItem = ({ id, name, price, description, image, rating }) => {
  const { cartItems, addToCart, removeFromCart, url } =
    useContext(StoreContext);

  return (
    <div className="food-item">
      <div className="food-item-img-container">
        <img
          className="food-item-image"
          src={url + "/images/" + image}
          alt=""
        />

        {!cartItems?.[id] ? (
          <img
            className="add"
            onClick={() => addToCart(id)}
            src={assets.add_icon_white}
            alt=""
          />
        ) : (
          <div className="food-item-counter">
            <img
              onClick={() => removeFromCart(id)}
              src={assets.remove_icon_red}
              alt=""
            />
            <p>{cartItems[id]}</p>
            <img
              onClick={() => addToCart(id)}
              src={assets.add_icon_green}
              alt=""
            />
          </div>
        )}
      </div>

      <div className="food-item-info">
        <div className="food-item-name-rating">
          <p>{name}</p>

          {/* ⭐ Dynamic Rating */}
          <div className="stars">
            {[1, 2, 3, 4, 5].map((star) => (
              <span key={star}>
                {star <= Math.round(rating || 0) ? "★" : "☆"}
              </span>
            ))}
          </div>
        </div>

        <p className="food-item-description">{description}</p>
        <p className="food-item-price">${price}</p>
      </div>
    </div>
  );
};

export default FoodItem;