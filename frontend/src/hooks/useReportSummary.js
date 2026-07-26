import { useCallback, useEffect, useState } from "react";

import { fetchPerformanceSummary } from "../api/reports.js";

/** Loads the fleet-wide KPI summary; pass `pollMs` to auto-refresh. */
export function useReportSummary({ pollMs } = {}) {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const reload = useCallback(async () => {
    try {
      const data = await fetchPerformanceSummary();
      setSummary(data);
      setError(null);
    } catch (err) {
      setError(err.response?.data || "Error al cargar el resumen.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  useEffect(() => {
    if (!pollMs) return undefined;
    const id = setInterval(reload, pollMs);
    return () => clearInterval(id);
  }, [reload, pollMs]);

  return { summary, loading, error, reload };
}
