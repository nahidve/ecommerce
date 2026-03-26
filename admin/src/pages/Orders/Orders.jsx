import { useState, useEffect } from "react";
import "./Orders.css";
import axios from "axios";
import { toast } from "react-toastify";
import { assets } from "../../assets/assets.js";

const Orders = ({ url }) => {
  const [orders, setOrders] = useState([]);

  const fetchAllOrders = async () => {
    try {
      const response = await axios.get(url + "/api/order/list");
      if (response.data.success) {
        setOrders(response.data.data);
      } else {
        toast.error("Error fetching orders");
      }
    } catch (err) {
      toast.error("Server error");
    }
  };

  const statusHandler = async (event, orderId) => {
    try {
      const response = await axios.post(url + "/api/order/status", {
        orderId,
        status: event.target.value,
      });

      if (response.data.success) {
        fetchAllOrders();
      }
    } catch (err) {
      toast.error("Failed to update status");
    }
  };

  const handleRefund = async (orderId) => {
    try {
      const response = await axios.post(url + "/api/order/refund", {
        orderId,
      });

      if (response.data.success) {
        toast.success("Refund successful");
        fetchAllOrders();
      } else {
        toast.error(response.data.message);
      }
    } catch (err) {
      toast.error("Refund failed");
    }
  };

  useEffect(() => {
    fetchAllOrders();
  }, []);

  return (
    <div className="order add">
      <h3>Order Page</h3>

      <div className="order-list">
        {orders.map((order, index) => (
          <div className="order-item" key={index}>
            <img src={assets.parcel_icon} alt="" />

            <div>
              <p className="order-item-food">
                {order.items.map((item, i) =>
                  i === order.items.length - 1
                    ? `${item.name} x ${item.quantity}`
                    : `${item.name} x ${item.quantity}, `,
                )}
              </p>

              <p className="order-item-name">
                {order.address.firstName} {order.address.lastName}
              </p>

              <div className="order-item-address">
                <p>{order.address.street},</p>
                <p>
                  {order.address.city}, {order.address.state},{" "}
                  {order.address.country}, {order.address.zipcode}
                </p>
              </div>

              <p className="order-item-phone">{order.address.phone}</p>
            </div>

            <p>Items: {order.items.length}</p>
            <p>${order.amount}</p>

            {/* Status Dropdown */}
            <select
              onChange={(event) => statusHandler(event, order._id)}
              value={order.status}
              disabled={order.status === "Refunded"}
            >
              <option value="Food Processing">Food Processing</option>
              <option value="Out For Delivery">Out For Delivery</option>
              <option value="Delivered">Delivered</option>
            </select>

            {/* Refund Button */}
            <button
              onClick={() => handleRefund(order._id)}
              disabled={!order.payment || order.status === "Refunded"}
              style={{
                marginTop: "10px",
                backgroundColor:
                  !order.payment || order.status === "Refunded"
                    ? "gray"
                    : "red",
                color: "white",
                padding: "6px 10px",
                border: "none",
                cursor:
                  !order.payment || order.status === "Refunded"
                    ? "not-allowed"
                    : "pointer",
              }}
            >
              Refund
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Orders;
