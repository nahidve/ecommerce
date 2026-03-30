import { useState } from "react";
import axios from "../../utils/axios";
import { toast } from "react-toastify";
import "./Login.css";

const Login = ({ url }) => {
  const [data, setData] = useState({
    email: "",
    password: "",
  });

  const onChangeHandler = (e) => {
    setData({ ...data, [e.target.name]: e.target.value });
  };

  const onSubmitHandler = async (e) => {
    e.preventDefault();

    try {
      const res = await axios.post(`${url}/api/user/login`, data);

        if (res.data.role !== "admin") {
          toast.error("Admin access only");
          return;
        }

        if (res.data.success) {
        localStorage.setItem("adminToken", res.data.token);

        // redirect to admin dashboard
        window.location.href = "/add";
      } else {
        toast.error(res.data.message);
      }
    } catch {
      toast.error("Login failed");
    }
  };

  return (
    <form onSubmit={onSubmitHandler}>
      <h2>Admin Login</h2>

      <input
        type="email"
        name="email"
        placeholder="Email"
        onChange={onChangeHandler}
        required
      />

      <input
        type="password"
        name="password"
        placeholder="Password"
        onChange={onChangeHandler}
        required
      />

      <button type="submit">Login</button>
    </form>
  );
};

export default Login;
