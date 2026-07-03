import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";

import { loadDeliveries } from "../store/deliveriesSlice.js";

/**
 * Loads deliveries into the store on mount and exposes the current list.
 * Pass `params` (e.g. { status: "IN_TRANSIT" }) to filter server-side.
 */
export function useDeliveries(params) {
  const dispatch = useDispatch();
  const { items, count, status, error } = useSelector((s) => s.deliveries);

  useEffect(() => {
    dispatch(loadDeliveries(params));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, JSON.stringify(params)]);

  return {
    deliveries: items,
    count,
    loading: status === "loading",
    error,
    reload: () => dispatch(loadDeliveries(params)),
  };
}
