import { useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { StoreContext } from "../../context/StoreContext";
import "./PlaceOrder.css";
import axios from "axios";

const PlaceOrder = () => {
  const { getTotalCartAmount, token, food_list, cartItems, url } =
    useContext(StoreContext);
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
    setData((data) => ({ ...data, [name]: value }));
  };

  const placeOrder = async (event) => {
    event.preventDefault();
    let orderItems = [];

    food_list.forEach((item) => {
      if (cartItems[item._id] > 0) {
        orderItems.push({
          _id: item._id,
          name: item.name,
          price: item.price,
          quantity: cartItems[item._id],
          rating: 0,
        })
      }
    })
    
    let orderData = {
      address: data,
      items: orderItems,
      amount: getTotalCartAmount() === 0 ? 0 : getTotalCartAmount() + 2,
    }
    let response = await axios.post(url + "/api/order/place", orderData, {
      headers: { token },
    })
    if (response.data.success) {
      const { session_url } = response.data;
      window.location.replace(session_url);
    } else alert("Error placing order: " + response.data.message);
  }

  const navigate = useNavigate();

  useEffect(() => {
    if (!token) {
      navigate("/cart");
    } else if (getTotalCartAmount() === 0) {
      navigate("/cart");
    }
  }, [token]);

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
              <p>${getTotalCartAmount()}</p>
            </div>
            <hr />
            <div className="cart-total-details">
              <p>Delivery Fee</p>
              <p>${getTotalCartAmount() === 0 ? 0 : 2}</p>
            </div>
            <hr />
            <div className="cart-total-details">
              <b>Total</b>
              <b>
                ${getTotalCartAmount() === 0 ? 0 : getTotalCartAmount() + 2}
              </b>
            </div>
          </div>
          <button type="submit">PROCEED TO PAYMENT</button>
        </div>
      </div>
    </form>
  );
};

export default PlaceOrder;
