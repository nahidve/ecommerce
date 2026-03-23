import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";
import { API_BASE_URL } from "../constants.js";

export const fetchFoodList = createAsyncThunk(
  "catalog/fetchFoodList",
  async () => {
    const response = await axios.get(`${API_BASE_URL}/api/food/list`);
    return response.data.data;
  }
);

const catalogSlice = createSlice({
  name: "catalog",
  initialState: {
    foodList: [],
    status: "idle",
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchFoodList.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchFoodList.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.foodList = action.payload;
      })
      .addCase(fetchFoodList.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message;
      });
  },
});

export default catalogSlice.reducer;
