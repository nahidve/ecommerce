import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";
import { API_BASE_URL } from "../constants.js";

export const fetchFoodList = createAsyncThunk(
  "catalog/fetchFoodList",
  async (filters = {}) => {
    const params = new URLSearchParams();

    if (filters.category) params.append("category", filters.category);
    if (filters.minPrice) params.append("minPrice", filters.minPrice);
    if (filters.maxPrice !== Infinity) params.append("maxPrice", filters.maxPrice);
    if (filters.search) params.append("search", filters.search);

    params.append("page", filters.page || 1);
    params.append("limit", filters.limit || 8);


    const response = await axios.get(
      `${API_BASE_URL}/api/food/list?${params.toString()}`
    );

    return response.data;
  }
);

const catalogSlice = createSlice({
  name: "catalog",
  initialState: {
    foodList: [],
    pagination: {},
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
        state.foodList = action.payload.data;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchFoodList.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message;
      });
  },
});

export default catalogSlice.reducer;
