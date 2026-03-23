import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  searchQuery: "",
  priceRange: { min: 0, max: Infinity },
};

const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    setSearchQuery: (state, action) => {
      state.searchQuery = action.payload;
    },
    setPriceRange: (state, action) => {
      state.priceRange = action.payload;
    },
  },
});

export const { setSearchQuery, setPriceRange } = uiSlice.actions;
export default uiSlice.reducer;
