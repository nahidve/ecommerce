import "./FoodItem.css";
import { assets } from "../../assets/frontend_assets/assets.js";
import { useAppDispatch, useAppSelector } from "../../store/hooks.js";
import { API_BASE_URL } from "../../store/constants.js";
import { addToCart, removeFromCart } from "../../store/slices/cartSlice.js";
import Rating from "../Rating/Rating.jsx";

const FoodItem = ({ id, name, price, description, image, rating }) => {
  const dispatch = useAppDispatch();
  const cartItems = useAppSelector((state) => state.cart.items);

  return (
    <div className="food-item">
      <div className="food-item-img-container">
        <img
          className="food-item-image"
          src={API_BASE_URL + "/images/" + image}
          alt=""
        />

        {!cartItems?.[id] ? (
          <img
            className="add"
            onClick={() => dispatch(addToCart(id))}
            src={assets.add_icon_white}
            alt=""
          />
        ) : (
          <div className="food-item-counter">
            <img
              onClick={() => dispatch(removeFromCart(id))}
              src={assets.remove_icon_red}
              alt=""
            />
            <p>{cartItems[id]}</p>
            <img
              onClick={() => dispatch(addToCart(id))}
              src={assets.add_icon_green}
              alt=""
            />
          </div>
        )}
      </div>

      <div className="food-item-info">
        <div className="food-item-name-rating">
          <p>{name}</p>
          <Rating rating={rating} />
        </div>

        <p className="food-item-description">{description}</p>
        <p className="food-item-price">${price}</p>
      </div>
    </div>
  );
};

export default FoodItem;
