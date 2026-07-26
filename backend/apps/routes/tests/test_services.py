"""Tests for the OSRM-first / haversine-fallback orchestration layer."""

from unittest.mock import patch

import pytest

from apps.routes.algorithms.astar import MAX_STOPS, TooManyStopsError
from apps.routes.models import RoutingSource
from apps.routes.services import compute_optimized_route


def _coords():
    return [(-12.0464, -77.0428), (-12.1211, -77.0282), (-12.0931, -77.0465)]


@patch("apps.routes.services.osrm.fetch_route_geometry")
@patch("apps.routes.services.osrm.fetch_distance_duration_matrix")
def test_uses_osrm_when_available(mock_matrix, mock_geometry):
    # 0->1: 10km/20min, 0->2: 5km/10min, 1->2: 3km/6min.
    mock_matrix.return_value = (
        [[0, 10, 5], [10, 0, 3], [5, 3, 0]],
        [[0, 20, 10], [20, 0, 6], [10, 6, 0]],
    )
    mock_geometry.return_value = [(-12.0, -77.0), (-12.05, -77.02)]

    optimized = compute_optimized_route(_coords())

    assert optimized.routing_source == RoutingSource.OSRM
    assert optimized.result.total_distance_km == pytest.approx(8.0)  # 0->2 (5) + 2->1 (3)
    assert optimized.duration_min == pytest.approx(16.0)  # 10 + 6, along the real order
    assert optimized.geometry == [(-12.0, -77.0), (-12.05, -77.02)]
    mock_matrix.assert_called_once()
    mock_geometry.assert_called_once()


@patch("apps.routes.services.osrm.fetch_distance_duration_matrix")
def test_falls_back_to_haversine_when_osrm_unavailable(mock_matrix):
    mock_matrix.return_value = None

    optimized = compute_optimized_route(_coords())

    assert optimized.routing_source == RoutingSource.HAVERSINE
    assert optimized.duration_min is None
    assert optimized.geometry is None
    assert optimized.result.total_distance_km > 0


@patch("apps.routes.services.osrm.fetch_route_geometry")
@patch("apps.routes.services.osrm.fetch_distance_duration_matrix")
def test_geometry_failure_does_not_lose_real_distances(mock_matrix, mock_geometry):
    mock_matrix.return_value = (
        [[0, 10, 5], [10, 0, 3], [5, 3, 0]],
        [[0, 20, 10], [20, 0, 6], [10, 6, 0]],
    )
    mock_geometry.return_value = None

    optimized = compute_optimized_route(_coords())

    assert optimized.routing_source == RoutingSource.OSRM
    assert optimized.duration_min is not None
    assert optimized.geometry is None


@patch("apps.routes.services.osrm.fetch_distance_duration_matrix")
def test_too_many_stops_never_calls_osrm(mock_matrix):
    coords = [(-12.0 + i * 0.01, -77.0) for i in range(MAX_STOPS + 2)]
    with pytest.raises(TooManyStopsError):
        compute_optimized_route(coords)
    mock_matrix.assert_not_called()
