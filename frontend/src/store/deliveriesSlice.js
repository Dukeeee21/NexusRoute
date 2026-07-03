import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

import {
  createDelivery,
  deleteDelivery,
  fetchDeliveries,
} from "../api/deliveries.js";

export const loadDeliveries = createAsyncThunk(
  "deliveries/load",
  async (params, { rejectWithValue }) => {
    try {
      return await fetchDeliveries(params);
    } catch (err) {
      return rejectWithValue(err.response?.data || "Error al cargar entregas");
    }
  }
);

export const addDelivery = createAsyncThunk(
  "deliveries/add",
  async (payload, { rejectWithValue }) => {
    try {
      return await createDelivery(payload);
    } catch (err) {
      return rejectWithValue(err.response?.data || "Error al crear la entrega");
    }
  }
);

export const removeDelivery = createAsyncThunk(
  "deliveries/remove",
  async (id, { rejectWithValue }) => {
    try {
      return await deleteDelivery(id);
    } catch (err) {
      return rejectWithValue(err.response?.data || "Error al eliminar la entrega");
    }
  }
);

const initialState = {
  items: [],
  count: 0,
  status: "idle", // idle | loading | succeeded | failed
  error: null,
};

const deliveriesSlice = createSlice({
  name: "deliveries",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(loadDeliveries.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(loadDeliveries.fulfilled, (state, action) => {
        state.status = "succeeded";
        // Supports both paginated ({results}) and plain array responses.
        state.items = action.payload.results ?? action.payload;
        state.count = action.payload.count ?? state.items.length;
      })
      .addCase(loadDeliveries.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      .addCase(addDelivery.fulfilled, (state, action) => {
        state.items.unshift(action.payload);
        state.count += 1;
      })
      .addCase(removeDelivery.fulfilled, (state, action) => {
        state.items = state.items.filter((d) => d.id !== action.payload);
        state.count = Math.max(0, state.count - 1);
      });
  },
});

export default deliveriesSlice.reducer;
