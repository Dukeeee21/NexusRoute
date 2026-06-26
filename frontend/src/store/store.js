import { configureStore } from "@reduxjs/toolkit";

import authReducer from "./authSlice.js";
import deliveriesReducer from "./deliveriesSlice.js";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    deliveries: deliveriesReducer,
  },
});
