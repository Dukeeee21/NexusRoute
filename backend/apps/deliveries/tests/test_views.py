"""Tests for the deliveries API."""
import pytest
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework.test import APIClient

from apps.deliveries.models import Delivery, Package

User = get_user_model()


@pytest.fixture
def admin_user(db):
    return User.objects.create_user(username="admin", password="pass12345", role=User.Role.ADMIN)


@pytest.fixture
def driver_user(db):
    return User.objects.create_user(username="driver", password="pass12345", role=User.Role.DRIVER)


@pytest.fixture
def admin_client(admin_user):
    client = APIClient()
    client.force_authenticate(user=admin_user)
    return client


def _package_payload():
    return {
        "client_name": "MegaRetail S.A.",
        "origin_address": "Depósito Central",
        "origin_lat": -34.60,
        "origin_lng": -58.38,
        "destination_address": "Av. Principal 123",
        "destination_lat": -34.55,
        "destination_lng": -58.45,
        "weight_kg": "8.00",
    }


@pytest.mark.django_db
def test_admin_creates_delivery_with_nested_package(admin_client):
    resp = admin_client.post(
        reverse("delivery-list"), {"package": _package_payload()}, format="json"
    )
    assert resp.status_code == 201
    assert Delivery.objects.count() == 1
    assert Package.objects.count() == 1
    assert resp.data["package"]["tracking_code"].startswith("NX-")


@pytest.mark.django_db
def test_driver_cannot_create_delivery(driver_user):
    client = APIClient()
    client.force_authenticate(user=driver_user)
    resp = client.post(
        reverse("delivery-list"), {"package": _package_payload()}, format="json"
    )
    assert resp.status_code == 403


@pytest.mark.django_db
def test_list_requires_authentication():
    client = APIClient()
    resp = client.get(reverse("delivery-list"))
    assert resp.status_code == 401


@pytest.mark.django_db
def test_status_action_valid_transition(admin_client, admin_user):
    package = Package.objects.create(
        client_name="X", origin_address="A", origin_lat=0, origin_lng=0,
        destination_address="B", destination_lat=1, destination_lng=1,
    )
    delivery = Delivery.objects.create(package=package)
    url = reverse("delivery-status", args=[delivery.id])
    resp = admin_client.patch(url, {"status": "IN_TRANSIT"}, format="json")
    assert resp.status_code == 200
    delivery.refresh_from_db()
    assert delivery.status == Delivery.Status.IN_TRANSIT


@pytest.mark.django_db
def test_status_action_invalid_transition(admin_client):
    package = Package.objects.create(
        client_name="X", origin_address="A", origin_lat=0, origin_lng=0,
        destination_address="B", destination_lat=1, destination_lng=1,
    )
    delivery = Delivery.objects.create(package=package)  # PENDING
    url = reverse("delivery-status", args=[delivery.id])
    resp = admin_client.patch(url, {"status": "DELIVERED"}, format="json")
    assert resp.status_code == 400  # can't jump PENDING -> DELIVERED


# ── Phase 5: driver-driven status updates ───────────────────────────


def _assigned_delivery(driver):
    package = Package.objects.create(
        client_name="X", origin_address="A", origin_lat=0, origin_lng=0,
        destination_address="B", destination_lat=1, destination_lng=1,
    )
    return Delivery.objects.create(package=package, driver=driver)


@pytest.mark.django_db
def test_assigned_driver_can_update_own_delivery_status(driver_user):
    delivery = _assigned_delivery(driver_user)
    client = APIClient()
    client.force_authenticate(user=driver_user)
    resp = client.patch(
        reverse("delivery-status", args=[delivery.id]), {"status": "IN_TRANSIT"}, format="json"
    )
    assert resp.status_code == 200
    delivery.refresh_from_db()
    assert delivery.status == Delivery.Status.IN_TRANSIT


@pytest.mark.django_db
def test_driver_cannot_update_another_drivers_delivery(driver_user):
    other_driver = User.objects.create_user(
        username="otro", password="pass12345", role=User.Role.DRIVER
    )
    delivery = _assigned_delivery(other_driver)
    client = APIClient()
    client.force_authenticate(user=driver_user)
    resp = client.patch(
        reverse("delivery-status", args=[delivery.id]), {"status": "IN_TRANSIT"}, format="json"
    )
    # Filtered out of the driver's own queryset entirely -> not found,
    # rather than leaking that the delivery exists via a 403.
    assert resp.status_code == 404


@pytest.mark.django_db
def test_driver_full_pipeline_transition(driver_user):
    delivery = _assigned_delivery(driver_user)
    client = APIClient()
    client.force_authenticate(user=driver_user)
    url = reverse("delivery-status", args=[delivery.id])

    resp = client.patch(url, {"status": "IN_TRANSIT"}, format="json")
    assert resp.status_code == 200

    resp = client.patch(url, {"status": "DELIVERED"}, format="json")
    assert resp.status_code == 200
    delivery.refresh_from_db()
    assert delivery.status == Delivery.Status.DELIVERED
    assert delivery.delivered_at is not None


@pytest.mark.django_db
def test_driver_list_only_shows_own_deliveries(driver_user):
    other_driver = User.objects.create_user(
        username="otro2", password="pass12345", role=User.Role.DRIVER
    )
    _assigned_delivery(driver_user)
    _assigned_delivery(other_driver)

    client = APIClient()
    client.force_authenticate(user=driver_user)
    resp = client.get(reverse("delivery-list"))
    assert resp.status_code == 200
    results = resp.data["results"] if "results" in resp.data else resp.data
    assert len(results) == 1
    assert results[0]["driver"] == driver_user.id
