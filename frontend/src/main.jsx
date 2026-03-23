import { BrowserRouter } from "react-router-dom";
import { Provider } from "react-redux";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { store } from "./store/index.js";
import StoreInitializer from "./components/StoreInitializer/StoreInitializer.jsx";

createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <Provider store={store}>
      <StoreInitializer>
        <App />
      </StoreInitializer>
    </Provider>
  </BrowserRouter>
);
