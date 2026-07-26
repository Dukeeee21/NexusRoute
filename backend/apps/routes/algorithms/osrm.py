"""
OSRM road-routing client.

Talks to a public or self-hosted OSRM instance (see OSRM_BASE_URL in
settings) to get real road-network distances/durations and route
geometry, instead of the straight-line haversine estimate used
elsewhere in this package (see haversine.py, astar.py).

Every function here returns None on any failure — network error,
timeout, malformed response, or a matrix containing an unreachable
pair — so callers can fall back to haversine rather than break. The
public demo server has no uptime guarantee; this module is written
assuming it will occasionally be down or slow.
"""

from __future__ import annotations

import logging

import requests
from django.conf import settings

logger = logging.getLogger(__name__)


def _coords_param(points: list[tuple[float, float]]) -> str:
    """OSRM expects "lng,lat;lng,lat;..." — the opposite order from
    this project's own (lat, lng) convention everywhere else."""
    return ";".join(f"{lng},{lat}" for lat, lng in points)


def fetch_distance_duration_matrix(
    points: list[tuple[float, float]],
) -> tuple[list[list[float]], list[list[float]]] | None:
    """
    Real road-network distance (km) and duration (min) matrices for
    `points`, via OSRM's Table service — one HTTP call regardless of
    how many points. Returns None if OSRM is unreachable, times out,
    errors, or reports any pair as unroutable — a partial matrix isn't
    safe to feed into the optimizer, whose correctness depends on
    every pair having a real distance.
    """
    url = f"{settings.OSRM_BASE_URL}/table/v1/driving/{_coords_param(points)}"
    try:
        resp = requests.get(
            url,
            params={"annotations": "distance,duration"},
            timeout=settings.OSRM_TIMEOUT_SECONDS,
        )
        resp.raise_for_status()
        data = resp.json()
        if data.get("code") != "Ok":
            logger.warning("OSRM table request returned code=%s", data.get("code"))
            return None

        distances = data["distances"]
        durations = data["durations"]
        n = len(points)
        if len(distances) != n or len(durations) != n:
            return None
        for row in (*distances, *durations):
            if len(row) != n or any(v is None for v in row):
                return None

        km_matrix = [[v / 1000 for v in row] for row in distances]
        min_matrix = [[v / 60 for v in row] for row in durations]
        return km_matrix, min_matrix
    except (requests.RequestException, ValueError, KeyError) as exc:
        logger.warning("OSRM table request failed: %s", exc)
        return None


def fetch_route_geometry(points: list[tuple[float, float]]) -> list[tuple[float, float]] | None:
    """
    Actual road-following path (a list of (lat, lng) points) that
    visits `points` in the given order, via OSRM's Route service.
    Returns None on any failure — the caller should fall back to
    drawing straight segments between the stops instead.
    """
    url = f"{settings.OSRM_BASE_URL}/route/v1/driving/{_coords_param(points)}"
    try:
        resp = requests.get(
            url,
            params={"overview": "full", "geometries": "geojson"},
            timeout=settings.OSRM_TIMEOUT_SECONDS,
        )
        resp.raise_for_status()
        data = resp.json()
        if data.get("code") != "Ok" or not data.get("routes"):
            return None

        coords = data["routes"][0]["geometry"]["coordinates"]
        # GeoJSON coordinates are [lng, lat]; flip to this project's (lat, lng).
        return [(lat, lng) for lng, lat in coords]
    except (requests.RequestException, ValueError, KeyError, IndexError) as exc:
        logger.warning("OSRM route request failed: %s", exc)
        return None
