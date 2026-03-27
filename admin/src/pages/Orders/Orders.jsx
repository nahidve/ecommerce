import { useState, useEffect } from "react";
import "./Orders.css";
import axios from "axios";
import { toast } from "react-toastify";
import { assets } from "../../assets/assets.js";

const Orders = ({ url }) => {
  const [orders, setOrders] = useState([]);
  const [refundAmounts, setRefundAmounts] = useState({});

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

  const handleRefund = async (orderId, order) => {
    try {
      const input = refundAmounts[orderId];
      const remaining = order.amount - (order.refundedAmount || 0);

      const amount = refundAmounts[orderId];

      // Validation
      if (amount !== undefined) {
        if (isNaN(amount) || amount <= 0) {
          return toast.error("Enter valid amount");
        }

        if (amount > remaining) {
          return toast.error(`Max refundable: $${remaining}`);
        }
      }

      const response = await axios.post(url + "/api/order/refund", {
        orderId,
        amount: amount ? Number(amount) : undefined,
      });

      if (response.data.success) {
        toast.success(response.data.message);

        // clear input after success
        setRefundAmounts((prev) => ({
          ...prev,
          [orderId]: "",
        }));

        fetchAllOrders();
      } else {
        toast.error(response.data.message);
      }
    } catch {
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
            {/* Refund Controls */}
            <div style={{ marginTop: "10px", display: "flex", gap: "10px" }}>
              <input
                type="number"
                min="1"
                max={order.amount - (order.refundedAmount || 0)}
                step="0.01"
                placeholder="Amount"
                value={refundAmounts[order._id] || ""}
                onChange={(e) =>
                  setRefundAmounts({
                    ...refundAmounts,
                    [order._id]: e.target.value,
                  })
                }
                style={{
                  width: "100px",
                  padding: "5px",
                }}
              />

              <button
                onClick={() => handleRefund(order._id, order)}
                disabled={
                  !order.payment ||
                  order.status === "Refunded" ||
                  (order.refundedAmount || 0) >= order.amount
                }
                style={{
                  backgroundColor:
                    !order.payment ||
                    order.status === "Refunded" ||
                    (order.refundedAmount || 0) >= order.amount
                      ? "gray"
                      : "red",
                  color: "white",
                  padding: "6px 10px",
                  border: "none",
                  cursor:
                    !order.payment ||
                    order.status === "Refunded" ||
                    (order.refundedAmount || 0) >= order.amount
                      ? "not-allowed"
                      : "pointer",
                }}
              >
                Refund
              </button>
              <p>
                Remaining Refund: $
                {(order.amount - (order.refundedAmount || 0)).toFixed(2)}
              </p>
            </div>
            {order.refundHistory && order.refundHistory.length > 0 && (
              <div style={{ marginTop: "10px", fontSize: "13px" }}>
                <b>Refund History:</b>

                {[...(order.refundHistory || [])]
                  .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                  .map((r, idx) => (
                    <p key={idx} style={{ margin: "2px 0", color: "#555" }}>
                      • ${r.amount.toFixed(2)} —{" "}
                      {new Date(r.createdAt).toLocaleString()}
                    </p>
                  ))}
              </div>
            )}
            {(order.refundedAmount || 0) >= order.amount && (
              <p style={{ color: "green" }}>Fully Refunded</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Orders;
