import { useCallback, useEffect, useState } from "react";

import { fetchVehicles } from "../api/vehicles.js";

/** Loads vehicles on mount; call `reload()` to refresh after a mutation. */
export function useVehicles(params) {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchVehicles(params);
      setVehicles(data.results ?? data);
      setError(null);
    } catch (err) {
      setError(err.response?.data || "Error al cargar vehículos");
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(params)]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { vehicles, loading, error, reload };
}
