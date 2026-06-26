import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

import { login as loginApi } from "../api/auth.js";
import { TOKEN_KEYS } from "../utils/constants.js";

// Rehydrate the user from localStorage on app load.
const storedUser = localStorage.getItem("nexus_user");

const initialState = {
  user: storedUser ? JSON.parse(storedUser) : null,
  status: "idle", // idle | loading | succeeded | failed
  error: null,
};

export const loginThunk = createAsyncThunk(
  "auth/login",
  async ({ username, password }, { rejectWithValue }) => {
    try {
      const data = await loginApi(username, password);
      localStorage.setItem(TOKEN_KEYS.ACCESS, data.access);
      localStorage.setItem(TOKEN_KEYS.REFRESH, data.refresh);
      localStorage.setItem("nexus_user", JSON.stringify(data.user));
      return data.user;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.detail || "Credenciales invalidas"
      );
    }
  }
);

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    logout(state) {
      state.user = null;
      state.status = "idle";
      state.error = null;
      localStorage.clear();
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginThunk.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(loginThunk.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.user = action.payload;
      })
      .addCase(loginThunk.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      });
  },
});

export const { logout } = authSlice.actions;
export default authSlice.reducer;
