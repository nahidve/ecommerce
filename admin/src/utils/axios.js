import axios from "axios";

const instance = axios.create();

// ✅ Attach token automatically
instance.interceptors.request.use((config) => {
  const token = localStorage.getItem("adminToken");
  if (token) {
    config.headers.token = token;
  }
  return config;
});

// ✅ Handle logout on 401
instance.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("adminToken");
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

export default instance;