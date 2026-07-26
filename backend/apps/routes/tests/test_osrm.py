"""
Tests for the OSRM road-routing client.

No real network calls — everything goes through requests_mock. The
public OSRM demo server has no uptime guarantee, so the test suite
must never depend on it actually being reachable.
"""

import requests
from django.conf import settings

from apps.routes.algorithms.osrm import fetch_distance_duration_matrix, fetch_route_geometry

POINTS = [(-12.0464, -77.0428), (-12.1211, -77.0282)]
TABLE_URL = f"{settings.OSRM_BASE_URL}/table/v1/driving/-77.0428,-12.0464;-77.0282,-12.1211"
ROUTE_URL = f"{settings.OSRM_BASE_URL}/route/v1/driving/-77.0428,-12.0464;-77.0282,-12.1211"


def test_fetch_distance_duration_matrix_success(requests_mock):
    requests_mock.get(
        TABLE_URL,
        json={
            "code": "Ok",
            "distances": [[0, 8500.0], [8500.0, 0]],
            "durations": [[0, 900.0], [900.0, 0]],
        },
    )
    result = fetch_distance_duration_matrix(POINTS)
    assert result is not None
    km_matrix, min_matrix = result
    assert km_matrix[0][1] == 8.5
    assert min_matrix[0][1] == 15.0


def test_fetch_distance_duration_matrix_none_on_error_code(requests_mock):
    requests_mock.get(TABLE_URL, json={"code": "NoRoute"})
    assert fetch_distance_duration_matrix(POINTS) is None


def test_fetch_distance_duration_matrix_none_on_unroutable_pair(requests_mock):
    requests_mock.get(
        TABLE_URL,
        json={
            "code": "Ok",
            "distances": [[0, None], [None, 0]],
            "durations": [[0, None], [None, 0]],
        },
    )
    assert fetch_distance_duration_matrix(POINTS) is None


def test_fetch_distance_duration_matrix_none_on_wrong_size(requests_mock):
    requests_mock.get(
        TABLE_URL,
        json={"code": "Ok", "distances": [[0]], "durations": [[0]]},
    )
    assert fetch_distance_duration_matrix(POINTS) is None


def test_fetch_distance_duration_matrix_none_on_network_error(requests_mock):
    requests_mock.get(TABLE_URL, exc=requests.ConnectionError)
    assert fetch_distance_duration_matrix(POINTS) is None


def test_fetch_distance_duration_matrix_none_on_timeout(requests_mock):
    requests_mock.get(TABLE_URL, exc=requests.Timeout)
    assert fetch_distance_duration_matrix(POINTS) is None


def test_fetch_distance_duration_matrix_none_on_http_error(requests_mock):
    requests_mock.get(TABLE_URL, status_code=500, text="internal error")
    assert fetch_distance_duration_matrix(POINTS) is None


def test_fetch_route_geometry_success(requests_mock):
    requests_mock.get(
        ROUTE_URL,
        json={
            "code": "Ok",
            "routes": [
                {
                    "geometry": {
                        "type": "LineString",
                        "coordinates": [
                            [-77.0428, -12.0464],
                            [-77.04, -12.06],
                            [-77.0282, -12.1211],
                        ],
                    }
                }
            ],
        },
    )
    geometry = fetch_route_geometry(POINTS)
    assert geometry == [(-12.0464, -77.0428), (-12.06, -77.04), (-12.1211, -77.0282)]


def test_fetch_route_geometry_none_on_error_code(requests_mock):
    requests_mock.get(ROUTE_URL, json={"code": "NoRoute", "routes": []})
    assert fetch_route_geometry(POINTS) is None


def test_fetch_route_geometry_none_on_network_error(requests_mock):
    requests_mock.get(ROUTE_URL, exc=requests.ConnectionError)
    assert fetch_route_geometry(POINTS) is None
