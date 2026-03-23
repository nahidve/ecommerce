import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";
import { API_BASE_URL } from "../constants.js";

export const loadCart = createAsyncThunk(
  "cart/loadCart",
  async (token) => {
    const response = await axios.post(
      `${API_BASE_URL}/api/cart/get`,
      {},
      { headers: { token } }
    );
    return response.data.cartData || {};
  }
);

const cartSlice = createSlice({
  name: "cart",
  initialState: {
    items: {},
  },
  reducers: {
    addToCartOptimistic: (state, action) => {
      const itemId = action.payload;
      if (!state.items[itemId]) {
        state.items[itemId] = 1;
      } else {
        state.items[itemId] += 1;
      }
    },
    removeFromCartOptimistic: (state, action) => {
      const itemId = action.payload;
      state.items[itemId] = (state.items[itemId] || 0) - 1;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(loadCart.fulfilled, (state, action) => {
      state.items = action.payload;
    });
  },
});

export const { addToCartOptimistic, removeFromCartOptimistic } =
  cartSlice.actions;

export const addToCart = (itemId) => async (dispatch, getState) => {
  dispatch(addToCartOptimistic(itemId));
  const token = getState().auth.token;
  if (token) {
    try {
      await axios.post(
        `${API_BASE_URL}/api/cart/add`,
        { itemId },
        { headers: { token } }
      );
    } catch (e) {
      console.error(e);
    }
  }
};

export const removeFromCart = (itemId) => async (dispatch, getState) => {
  dispatch(removeFromCartOptimistic(itemId));
  const token = getState().auth.token;
  if (token) {
    try {
      await axios.post(
        `${API_BASE_URL}/api/cart/remove`,
        { itemId },
        { headers: { token } }
      );
    } catch (e) {
      console.error(e);
    }
  }
};

export default cartSlice.reducer;
