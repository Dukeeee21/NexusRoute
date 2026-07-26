/** Admin-only user lookups (used to populate driver pickers, etc). */
import api from "./axiosConfig.js";

export async function fetchDrivers() {
  const { data } = await api.get("/users/", {
    params: { role: "DRIVER", is_active: true },
  });
  return data.results ?? data;
}

/** Update the current user's own profile (email, phone, names). */
export async function updateMyProfile(payload) {
  const { data } = await api.patch("/users/me/", payload);
  return data;
}

/** Change the current user's own password. */
export async function changeMyPassword(currentPassword, newPassword) {
  const { data } = await api.patch("/users/me/password/", {
    current_password: currentPassword,
    new_password: newPassword,
  });
  return data;
}
