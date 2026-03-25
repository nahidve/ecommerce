import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "./PlaceOrder.css";
import axios from "axios";
import { useAppSelector } from "../../store/hooks.js";
import { selectCartTotal } from "../../store/selectors.js";
import { API_BASE_URL } from "../../store/constants.js";

const PlaceOrder = () => {
  const cartTotal = useAppSelector(selectCartTotal);
  const token = useAppSelector((state) => state.auth.token);
  const cartItems = useAppSelector((state) => state.cart.items);

  const navigate = useNavigate();

  // -------- IDEMPOTENCY KEY (PERSIST PER SUBMISSION) --------
  const idempotencyKeyRef = useRef(null);

  const IDEMPOTENCY_STORAGE_KEY = "order_idempotency_key";

  const generateIdempotencyKey = () =>
    `order_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;

  const getStoredKey = () => sessionStorage.getItem(IDEMPOTENCY_STORAGE_KEY);
  const setStoredKey = (key) =>
    sessionStorage.setItem(IDEMPOTENCY_STORAGE_KEY, key);
  const clearStoredKey = () =>
    sessionStorage.removeItem(IDEMPOTENCY_STORAGE_KEY);

  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

  const [data, setData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    street: "",
    city: "",
    state: "",
    zipcode: "",
    country: "",
    phone: "",
  });

  const onChangehandler = (event) => {
    const name = event.target.name;
    const value = event.target.value;
    setData((prev) => ({ ...prev, [name]: value }));
  };

  const placeOrder = async (event) => {
    event.preventDefault();

    if (isPlacingOrder) return; // prevent double click
    setIsPlacingOrder(true);

    try {
      // -------- GENERATE KEY ONLY ONCE --------
      if (!idempotencyKeyRef.current) {
        const existingKey = getStoredKey();

        if (existingKey) {
          idempotencyKeyRef.current = existingKey;
        } else {
          const newKey = generateIdempotencyKey();
          idempotencyKeyRef.current = newKey;
          setStoredKey(newKey);
        }
      }

      const orderItems = Object.entries(cartItems)
        .filter(([, qty]) => qty > 0)
        .map(([itemId, quantity]) => ({
          _id: itemId,
          quantity,
        }));

      const orderData = {
        address: data,
        items: orderItems,
      };

      const response = await axios.post(
        API_BASE_URL + "/api/order/place",
        orderData,
        {
          headers: {
            token,
            "idempotency-key": idempotencyKeyRef.current,
          },
        },
      );

      if (response.data.success) {
        const { session_url } = response.data;

        // clear before redirect
        clearStoredKey();

        // redirect to Stripe
        window.location.replace(session_url);
      } else {
        clearStoredKey();
        setIsPlacingOrder(false);
        alert("Error placing order: " + response.data.message);
      }
    } catch (error) {
      console.error(error);
      clearStoredKey();
      setIsPlacingOrder(false);
      alert("Order failed. Try again.");
    }
  };

  useEffect(() => {
    if (!token) {
      navigate("/cart");
    } else if (cartTotal === 0) {
      navigate("/cart");
    }
  }, [token, cartTotal, navigate]);

  return (
    <form onSubmit={placeOrder} className="place-order">
      <div className="place-order-left">
        <p className="title">Delivery Information</p>

        <div className="multi-fields">
          <input
            required
            name="firstName"
            onChange={onChangehandler}
            value={data.firstName}
            type="text"
            placeholder="First name"
          />
          <input
            required
            name="lastName"
            onChange={onChangehandler}
            value={data.lastName}
            type="text"
            placeholder="Last name"
          />
        </div>

        <input
          required
          name="email"
          onChange={onChangehandler}
          value={data.email}
          type="text"
          placeholder="Email address"
        />

        <input
          required
          name="street"
          onChange={onChangehandler}
          value={data.street}
          type="text"
          placeholder="Street"
        />

        <div className="multi-fields">
          <input
            required
            name="city"
            onChange={onChangehandler}
            value={data.city}
            type="text"
            placeholder="City"
          />
          <input
            required
            name="state"
            onChange={onChangehandler}
            value={data.state}
            type="text"
            placeholder="State"
          />
        </div>

        <div className="multi-fields">
          <input
            required
            name="zipcode"
            onChange={onChangehandler}
            value={data.zipcode}
            type="text"
            placeholder="Zip code"
          />
          <input
            required
            name="country"
            onChange={onChangehandler}
            value={data.country}
            type="text"
            placeholder="Country"
          />
        </div>

        <input
          required
          name="phone"
          onChange={onChangehandler}
          value={data.phone}
          type="text"
          placeholder="Phone"
        />
      </div>

      <div className="place-order-right">
        <div className="cart-total">
          <h2>Cart Total</h2>

          <div>
            <div className="cart-total-details">
              <p>Subtotal</p>
              <p>${cartTotal}</p>
            </div>

            <hr />

            <div className="cart-total-details">
              <p>Delivery Fee</p>
              <p>${cartTotal === 0 ? 0 : 2}</p>
            </div>

            <hr />

            <div className="cart-total-details">
              <b>Total</b>
              <b>${cartTotal === 0 ? 0 : cartTotal + 2}</b>
            </div>
          </div>

          <button type="submit" disabled={isPlacingOrder}>
            {isPlacingOrder ? "PROCESSING..." : "PROCEED TO PAYMENT"}
          </button>
        </div>
      </div>
    </form>
  );
};

export default PlaceOrder;
