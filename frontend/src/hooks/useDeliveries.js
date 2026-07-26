import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";

import { loadDeliveries } from "../store/deliveriesSlice.js";

/**
 * Loads deliveries into the store on mount and exposes the current list.
 * Pass `params` (e.g. { status: "IN_TRANSIT" }) to filter server-side.
 *
 * `pollMs`, when set, silently reloads on that interval — this is how the
 * admin dashboard finds out a driver marked a delivery as completed
 * without wiring up websockets (see roadmap Phase 5: "notificación al
 * admin... vía polling").
 */
export function useDeliveries(params, { pollMs } = {}) {
  const dispatch = useDispatch();
  const { items, count, status, error } = useSelector((s) => s.deliveries);

  useEffect(() => {
    dispatch(loadDeliveries(params));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, JSON.stringify(params)]);

  useEffect(() => {
    if (!pollMs) return undefined;
    const id = setInterval(() => dispatch(loadDeliveries(params)), pollMs);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, JSON.stringify(params), pollMs]);

  return {
    deliveries: items,
    count,
    loading: status === "loading",
    error,
    reload: () => dispatch(loadDeliveries(params)),
  };
}
