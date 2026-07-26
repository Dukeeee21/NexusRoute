"""Tests for the route optimization endpoint and route assignment."""

import pytest
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework.test import APIClient

from apps.deliveries.models import Delivery, Package
from apps.routes.algorithms.astar import MAX_STOPS
from apps.routes.models import Route, RouteStop
from apps.vehicles.models import Vehicle

User = get_user_model()


@pytest.fixture
def auth_client(db):
    user = User.objects.create_user(username="disp", password="pass12345", role=User.Role.ADMIN)
    client = APIClient()
    client.force_authenticate(user=user)
    return client


@pytest.fixture
def driver(db):
    return User.objects.create_user(
        username="conductor", password="pass12345", role=User.Role.DRIVER
    )


@pytest.fixture
def vehicle(db):
    return Vehicle.objects.create(plate="ABC-123", capacity_kg=500)


def _make_pending_delivery(client_name, dest_lat, dest_lng):
    package = Package.objects.create(
        client_name=client_name,
        origin_address="Depósito",
        origin_lat=-34.60,
        origin_lng=-58.38,
        destination_address=f"Destino {client_name}",
        destination_lat=dest_lat,
        destination_lng=dest_lng,
    )
    return Delivery.objects.create(package=package)


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


@pytest.mark.django_db
def test_optimize_rejects_too_many_stops(auth_client):
    body = {
        "origin": {"lat": -34.6, "lng": -58.4},
        "stops": [{"lat": -34.6 + i * 0.01, "lng": -58.4} for i in range(MAX_STOPS + 1)],
    }
    resp = auth_client.post(reverse("route-optimize"), body, format="json")
    assert resp.status_code == 400


@pytest.mark.django_db
def test_optimize_caches_identical_requests(auth_client):
    body = _body()
    first = auth_client.post(reverse("route-optimize"), body, format="json")
    assert first.status_code == 200
    assert first.data["cached"] is False

    second = auth_client.post(reverse("route-optimize"), body, format="json")
    assert second.status_code == 200
    assert second.data["cached"] is True
    assert second.data["total_distance_km"] == first.data["total_distance_km"]


# ── Route assignment (persisted plans) ──────────────────────────────


def test_route_str():
    route = Route(id=1, origin_label="Depósito")
    assert "Ruta #1" in str(route)


def test_route_stop_str():
    delivery = Delivery(package=Package(tracking_code="NX-TEST"))
    stop = RouteStop(order=2, delivery=delivery)
    assert "Parada 2" in str(stop)
    assert "NX-TEST" in str(stop)


@pytest.mark.django_db
def test_admin_creates_route_assigns_deliveries(auth_client, driver, vehicle):
    d1 = _make_pending_delivery("A", -34.55, -58.45)
    d2 = _make_pending_delivery("B", -34.62, -58.40)

    resp = auth_client.post(
        reverse("route-list"),
        {"driver": driver.id, "vehicle": vehicle.id, "delivery_ids": [d1.id, d2.id]},
        format="json",
    )
    assert resp.status_code == 201
    assert Route.objects.count() == 1
    assert resp.data["driver"] == driver.id
    assert len(resp.data["stops"]) == 2
    assert resp.data["total_distance_km"] > 0

    d1.refresh_from_db()
    d2.refresh_from_db()
    assert d1.driver_id == driver.id
    assert d2.driver_id == driver.id
    assert d1.vehicle_id == vehicle.id


@pytest.mark.django_db
def test_driver_cannot_create_route(driver, vehicle):
    d1 = _make_pending_delivery("A", -34.55, -58.45)
    client = APIClient()
    client.force_authenticate(user=driver)
    resp = client.post(
        reverse("route-list"),
        {"driver": driver.id, "vehicle": vehicle.id, "delivery_ids": [d1.id]},
        format="json",
    )
    assert resp.status_code == 403


@pytest.mark.django_db
def test_cannot_reassign_delivery_already_on_a_route(auth_client, driver, vehicle):
    d1 = _make_pending_delivery("A", -34.55, -58.45)
    auth_client.post(
        reverse("route-list"),
        {"driver": driver.id, "vehicle": vehicle.id, "delivery_ids": [d1.id]},
        format="json",
    )
    resp = auth_client.post(
        reverse("route-list"),
        {"driver": driver.id, "vehicle": vehicle.id, "delivery_ids": [d1.id]},
        format="json",
    )
    assert resp.status_code == 400


@pytest.mark.django_db
def test_driver_sees_only_own_routes(auth_client, driver, vehicle):
    other_driver = User.objects.create_user(
        username="otro", password="pass12345", role=User.Role.DRIVER
    )
    d1 = _make_pending_delivery("A", -34.55, -58.45)
    d2 = _make_pending_delivery("B", -34.62, -58.40)
    auth_client.post(
        reverse("route-list"),
        {"driver": driver.id, "vehicle": vehicle.id, "delivery_ids": [d1.id]},
        format="json",
    )
    auth_client.post(
        reverse("route-list"),
        {"driver": other_driver.id, "vehicle": vehicle.id, "delivery_ids": [d2.id]},
        format="json",
    )

    client = APIClient()
    client.force_authenticate(user=driver)
    resp = client.get(reverse("route-list"))
    assert resp.status_code == 200
    results = resp.data["results"] if "results" in resp.data else resp.data
    assert len(results) == 1
    assert results[0]["driver"] == driver.id


@pytest.mark.django_db
def test_route_rejects_duplicate_delivery_ids(auth_client, driver, vehicle):
    d1 = _make_pending_delivery("A", -34.55, -58.45)
    resp = auth_client.post(
        reverse("route-list"),
        {"driver": driver.id, "vehicle": vehicle.id, "delivery_ids": [d1.id, d1.id]},
        format="json",
    )
    assert resp.status_code == 400


@pytest.mark.django_db
def test_route_rejects_nonexistent_delivery_id(auth_client, driver, vehicle):
    resp = auth_client.post(
        reverse("route-list"),
        {"driver": driver.id, "vehicle": vehicle.id, "delivery_ids": [999999]},
        format="json",
    )
    assert resp.status_code == 400


@pytest.mark.django_db
def test_route_rejects_too_many_stops(auth_client, driver, vehicle):
    ids = [
        _make_pending_delivery(f"C{i}", -34.6 + i * 0.01, -58.4).id for i in range(MAX_STOPS + 1)
    ]
    resp = auth_client.post(
        reverse("route-list"),
        {"driver": driver.id, "vehicle": vehicle.id, "delivery_ids": ids},
        format="json",
    )
    assert resp.status_code == 400
    assert "delivery_ids" in resp.data
