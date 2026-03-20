import { useContext, useEffect, useState } from "react";
import "./MyOrders.css";
import { StoreContext } from "../../context/StoreContext";
import axios from "axios";
import { assets } from "../../assets/frontend_assets/assets.js";

export const MyOrders = () => {
  const { url, token, fetchFoodList } = useContext(StoreContext);
  const [data, setData] = useState([]);

  // Fetch all orders for the logged-in user
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

  // Handle rating a food item
  const handleRating = async (orderId, foodId, rating) => {
    try {
      const response = await axios.post(
        url + "/api/food/rate",
        { foodId, rating },
        { headers: { token } }
      );

      if (response.data.success) {
        alert("Rated successfully");

        // Update local state immediately
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

        fetchFoodList(); // refresh global food list
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

            {/* Order Items */}
            <div>
              <p>
                {order.items
                  .map((item) => `${item.name} x ${item.quantity}`)
                  .join(", ")}
              </p>

              {/* ⭐ Rating Section (only after payment) */}
              {order.payment &&
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