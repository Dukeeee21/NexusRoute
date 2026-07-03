"""Tests for the route optimization endpoint."""
import pytest
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework.test import APIClient

User = get_user_model()


@pytest.fixture
def auth_client(db):
    user = User.objects.create_user(username="disp", password="pass12345", role=User.Role.ADMIN)
    client = APIClient()
    client.force_authenticate(user=user)
    return client


def _body():
    return {
        "origin": {"label": "Depósito", "lat": -34.60, "lng": -58.38},
        "stops": [
            {"label": "A", "lat": -34.55, "lng": -58.45},
            {"label": "B", "lat": -34.62, "lng": -58.40},
            {"label": "C", "lat": -34.58, "lng": -58.36},
        ],
    }


@pytest.mark.django_db
def test_optimize_requires_authentication():
    resp = APIClient().post(reverse("route-optimize"), _body(), format="json")
    assert resp.status_code == 401


@pytest.mark.django_db
def test_optimize_returns_ordered_route(auth_client):
    resp = auth_client.post(reverse("route-optimize"), _body(), format="json")
    assert resp.status_code == 200
    data = resp.data
    assert data["order"][0]["label"] == "Depósito"  # origin first
    assert data["stops_count"] == 3
    assert len(data["order"]) == 4
    assert len(data["legs"]) == 3
    assert data["total_distance_km"] > 0
    assert data["estimated_time_min"] > 0


@pytest.mark.django_db
def test_optimize_rejects_empty_stops(auth_client):
    body = {"origin": {"lat": -34.6, "lng": -58.4}, "stops": []}
    resp = auth_client.post(reverse("route-optimize"), body, format="json")
    assert resp.status_code == 400


@pytest.mark.django_db
def test_optimize_rejects_invalid_coordinates(auth_client):
    body = {"origin": {"lat": 200, "lng": -58.4}, "stops": [{"lat": -34.5, "lng": -58.4}]}
    resp = auth_client.post(reverse("route-optimize"), body, format="json")
    assert resp.status_code == 400
