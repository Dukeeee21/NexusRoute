"""Tests for the A* route optimization algorithm and haversine distance."""

import itertools

import pytest

from apps.routes.algorithms.astar import MAX_STOPS, TooManyStopsError, optimize_route
from apps.routes.algorithms.haversine import haversine_km


def _brute_force_best(points, start=0):
    """Optimal open-path length by trying every permutation (small n)."""
    n = len(points)
    others = [i for i in range(n) if i != start]
    best = float("inf")
    for perm in itertools.permutations(others):
        order = [start, *perm]
        dist = sum(haversine_km(*points[order[i]], *points[order[i + 1]]) for i in range(n - 1))
        best = min(best, dist)
    return best


def test_haversine_known_distance():
    # Buenos Aires (Obelisco) to Córdoba, ~646 km.
    d = haversine_km(-34.6037, -58.3816, -31.4201, -64.1888)
    assert 630 < d < 660


def test_haversine_zero_for_same_point():
    assert haversine_km(-34.6, -58.4, -34.6, -58.4) == pytest.approx(0.0)


def test_single_point_returns_itself():
    result = optimize_route([(-34.6, -58.4)])
    assert result.order == [0]
    assert result.total_distance_km == 0.0
    assert result.legs == []


def test_route_starts_at_origin():
    points = [(-34.60, -58.38), (-34.55, -58.45), (-34.62, -58.40)]
    result = optimize_route(points, start_index=0)
    assert result.order[0] == 0
    assert set(result.order) == {0, 1, 2}


def test_astar_matches_brute_force_optimum():
    points = [
        (-34.60, -58.38),
        (-34.55, -58.45),
        (-34.62, -58.40),
        (-34.58, -58.36),
        (-34.50, -58.50),
    ]
    result = optimize_route(points, start_index=0)
    expected = _brute_force_best(points, start=0)
    assert result.total_distance_km == pytest.approx(expected, abs=1e-3)


def test_legs_sum_to_total():
    points = [(-34.60, -58.38), (-34.55, -58.45), (-34.62, -58.40), (-34.58, -58.36)]
    result = optimize_route(points)
    legs_sum = sum(leg.distance_km for leg in result.legs)
    assert legs_sum == pytest.approx(result.total_distance_km, abs=1e-3)


def test_too_many_stops_raises():
    points = [(-34.6 + i * 0.01, -58.4) for i in range(MAX_STOPS + 2)]
    with pytest.raises(TooManyStopsError):
        optimize_route(points)


def test_empty_points_raises_value_error():
    with pytest.raises(ValueError):
        optimize_route([])


def test_optimize_route_honors_custom_distance_matrix():
    # A tiny 3-point matrix where the "real" (custom) distances
    # deliberately disagree with what haversine would say — point 1 is
    # geographically close to the origin but the custom matrix marks
    # it as expensive (e.g. a one-way street / river crossing), so the
    # optimizer should prefer visiting point 2 first if that's cheaper
    # under the SUPPLIED matrix, proving the matrix is actually used
    # rather than silently falling back to haversine.
    points = [(0.0, 0.0), (0.01, 0.0), (0.0, 0.01)]
    matrix = [
        [0.0, 100.0, 1.0],
        [100.0, 0.0, 1.0],
        [1.0, 1.0, 0.0],
    ]
    result = optimize_route(points, start_index=0, distance_matrix=matrix)
    assert result.order == [0, 2, 1]
    assert result.total_distance_km == pytest.approx(2.0)


def test_optimize_route_rejects_wrong_sized_matrix():
    points = [(0.0, 0.0), (0.01, 0.0), (0.0, 0.01)]
    bad_matrix = [[0.0, 1.0], [1.0, 0.0]]  # 2x2 for 3 points
    with pytest.raises(ValueError):
        optimize_route(points, distance_matrix=bad_matrix)


def test_astar_matches_brute_force_with_more_points():
    # A larger, irregular spread than the 5-point case above: more nodes
    # means more (node, visited-set) states get requeued with a cheaper
    # cost after a longer one was already on the heap, exercising the
    # "skip stale queue entry" branch while still checking optimality.
    points = [
        (-34.60, -58.38),
        (-34.55, -58.45),
        (-34.62, -58.40),
        (-34.58, -58.36),
        (-34.50, -58.50),
        (-34.65, -58.42),
        (-34.57, -58.30),
    ]
    result = optimize_route(points, start_index=0)
    expected = _brute_force_best(points, start=0)
    assert result.total_distance_km == pytest.approx(expected, abs=1e-3)
