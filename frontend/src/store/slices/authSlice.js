import { createSlice } from "@reduxjs/toolkit";

function readStoredToken() {
  try {
    return localStorage.getItem("userToken") || "";
  } catch {
    return "";
  }
}

// Hydrate on load so /verify after Stripe redirect sees token on first paint
const initialState = {
  token: readStoredToken(),
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setToken: (state, action) => {
      state.token = action.payload;
    },
    clearToken: (state) => {
      state.token = "";
    },
  },
});

export const { setToken, clearToken } = authSlice.actions;
export default authSlice.reducer;
