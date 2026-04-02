import { useEffect, useState } from "react";
import "./MyOrders.css";
import axios from "axios";
import { assets } from "../../assets/frontend_assets/assets.js";
import { useAppDispatch, useAppSelector } from "../../store/hooks.js";
import { API_BASE_URL } from "../../store/constants.js";
import { fetchFoodList } from "../../store/slices/catalogSlice.js";

export const MyOrders = () => {
  const dispatch = useAppDispatch();
  const url = API_BASE_URL;
  const token = useAppSelector((state) => state.auth.token);
  const [data, setData] = useState([]);

  const fetchOrders = async () => {
    try {
      const response = await axios.post(
        url + "/api/order/userorders",
        {},
        { headers: { token } }
      );
      setData(response.data.data);
    } catch (error) {
      console.log("Error fetching orders:", error);
    }
  };

  useEffect(() => {
    if (token) {
      fetchOrders();
    }
  }, [token]);

  const handleRating = async (orderId, foodId, rating) => {
    try {
      const response = await axios.post(
        url + "/api/food/rate",
        { foodId, rating },
        { headers: { token } }
      );

      if (response.data.success) {
        alert("Rated successfully");

        setData((prevOrders) =>
          prevOrders.map((order) => {
            if (order._id === orderId) {
              return {
                ...order,
                items: order.items.map((item) =>
                  item._id === foodId ? { ...item, rating } : item
                ),
              };
            }
            return order;
          })
        );

        dispatch(fetchFoodList());
      } else {
        alert("Error rating");
      }
    } catch (error) {
      console.log(error);
      alert("Something went wrong");
    }
  };

  return (
    <div className="myorders">
      <h2>My Orders</h2>

      <div className="container">
        {data.map((order) => (
          <div key={order._id} className="my-orders-order">
            <img src={assets.parcel_icon} alt="Parcel" />

            <div>
              <p>
                {order.items
                  .map((item) => `${item.name} x ${item.quantity}`)
                  .join(", ")}
              </p>

              {
                order.items.map((item) => {
                  const currentRating = item.rating || 0;
                  return (
                    <div key={item._id} style={{ marginTop: "5px" }}>
                      <span>{item.name} : </span>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <span
                          key={star}
                          style={{
                            cursor: "pointer",
                            fontSize: "18px",
                            color: star <= currentRating ? "gold" : "#ccc",
                            marginRight: "2px",
                          }}
                          onClick={() =>
                            handleRating(order._id, item._id, star)
                          }
                        >
                          ★
                        </span>
                      ))}
                    </div>
                  );
                })}
            </div>

            <p>${order.amount}.00</p>
            <p>Items: {order.items.length}</p>
            <p>
              <span>&#x25cf;</span> <b>{order.status}</b>
            </p>

            <button onClick={fetchOrders}>Track Order</button>
          </div>
        ))}
      </div>
    </div>
  );
};
