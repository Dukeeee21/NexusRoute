import { createSlice } from "@reduxjs/toolkit";

// Placeholder slice. Async thunks (fetch/create/update deliveries)
// are implemented in Phase 2.
const initialState = {
  items: [],
  status: "idle",
  error: null,
};

const deliveriesSlice = createSlice({
  name: "deliveries",
  initialState,
  reducers: {},
});

export default deliveriesSlice.reducer;
