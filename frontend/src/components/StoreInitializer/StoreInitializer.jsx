import { useEffect } from "react";
import { useAppDispatch } from "../../store/hooks.js";
import { fetchFoodList } from "../../store/slices/catalogSlice.js";
import { loadCart } from "../../store/slices/cartSlice.js";
import { setToken } from "../../store/slices/authSlice.js";

const StoreInitializer = ({ children }) => {
  const dispatch = useAppDispatch();

  useEffect(() => {
    const stored = localStorage.getItem("userToken");
    if (stored) {
      dispatch(setToken(stored));
    }
    async function loadData() {
      await dispatch(fetchFoodList());
      if (stored) {
        await dispatch(loadCart(stored));
      }
    }
    loadData();
  }, [dispatch]);

  return children;
};

export default StoreInitializer;
