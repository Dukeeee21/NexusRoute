"""
Route-optimization orchestration shared by the /optimize/ preview
endpoint and the persisted Route creation flow, so both behave
identically: try real road distances via OSRM first, transparently
fall back to the pure haversine algorithm if OSRM is unreachable,
slow, or reports an unroutable pair.
"""

from __future__ import annotations

from dataclasses import dataclass

from .algorithms import osrm
from .algorithms.astar import MAX_STOPS, RouteResult, TooManyStopsError, optimize_route
from .models import RoutingSource


@dataclass
class OptimizedRoute:
    """The A* result plus metadata about how the distances were sourced."""

    result: RouteResult
    routing_source: str  # RoutingSource.OSRM | RoutingSource.HAVERSINE
    duration_min: float | None  # real OSRM duration; None -> caller estimates it
    geometry: list[tuple[float, float]] | None  # road-following path, or None


def compute_optimized_route(coords: list[tuple[float, float]]) -> OptimizedRoute:
    """
    `coords[0]` is the origin; the rest are stops, in the order the
    caller wants distances/legs to reference (`optimize_route`
    determines the actual visiting order).

    Raises TooManyStopsError before ever attempting a network call if
    there are more than MAX_STOPS stops, so invalid input doesn't cost
    a wasted OSRM request.
    """
    if len(coords) - 1 > MAX_STOPS:
        raise TooManyStopsError(
            f"Máximo {MAX_STOPS} paradas por ruta (se recibieron {len(coords) - 1})."
        )

    osrm_data = osrm.fetch_distance_duration_matrix(coords) if len(coords) > 1 else None

    if osrm_data is not None:
        km_matrix, min_matrix = osrm_data
        result = optimize_route(coords, start_index=0, distance_matrix=km_matrix)
        duration_min = round(
            sum(
                min_matrix[result.order[i]][result.order[i + 1]]
                for i in range(len(result.order) - 1)
            ),
            2,
        )
        # A separate call, over the now-known optimal order — if this
        # one fails, the distances/duration above are still real OSRM
        # numbers; only the drawn path degrades to straight segments.
        geometry = osrm.fetch_route_geometry([coords[i] for i in result.order])
        return OptimizedRoute(result, RoutingSource.OSRM, duration_min, geometry)

    result = optimize_route(coords, start_index=0)
    return OptimizedRoute(result, RoutingSource.HAVERSINE, None, None)
