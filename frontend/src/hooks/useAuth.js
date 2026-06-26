import { useDispatch, useSelector } from "react-redux";

import { logout as logoutAction } from "../store/authSlice.js";
import { ROLES } from "../utils/constants.js";

/** Convenience hook exposing the current auth state and helpers. */
export function useAuth() {
  const dispatch = useDispatch();
  const { user, status, error } = useSelector((state) => state.auth);

  return {
    user,
    status,
    error,
    isAuthenticated: Boolean(user),
    isAdmin: user?.role === ROLES.ADMIN,
    isDriver: user?.role === ROLES.DRIVER,
    logout: () => dispatch(logoutAction()),
  };
}
