import { Route, Routes, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar/Navbar";
import Sidebar from "./components/Sidebar/Sidebar";
import Add from "./pages/Add/Add";
import List from "./pages/List/List";
import Orders from "./pages/Orders/Orders";
import Login from "./pages/Login/Login";
import { ToastContainer } from "react-toastify";

const App = () => {
  const url = "http://localhost:4000";

  const isAuthenticated = () => {
    return localStorage.getItem("adminToken");
  };

  return (
    <div>
      <ToastContainer />

      {/* Show Navbar + Sidebar only if logged in */}
      {isAuthenticated() && (
        <>
          <Navbar />
          <hr />
          <div className="app-content">
            <Sidebar />

            <Routes>
              <Route path="/login" element={<Login url={url} />} />

              <Route
                path="/add"
                element={
                  isAuthenticated() ? (
                    <Add url={url} />
                  ) : (
                    <Navigate to="/login" />
                  )
                }
              />

              <Route
                path="/list"
                element={
                  isAuthenticated() ? (
                    <List url={url} />
                  ) : (
                    <Navigate to="/login" />
                  )
                }
              />

              <Route
                path="/orders"
                element={
                  isAuthenticated() ? (
                    <Orders url={url} />
                  ) : (
                    <Navigate to="/login" />
                  )
                }
              />

              <Route path="*" element={<Navigate to="/login" />} />
            </Routes>
          </div>
        </>
      )}

      {/* Login route (always accessible) */}
      <Routes>
        <Route path="/login" element={<Login url={url} />} />
      </Routes>

      {/* If not logged in, redirect everything to login */}
      {!isAuthenticated() && <Navigate to="/login" />}
    </div>
  );
};

export default App;
