"""Tests for the Vehicle model and its API."""

import pytest
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework.test import APIClient

from apps.vehicles.models import Vehicle

User = get_user_model()


@pytest.fixture
def admin_user(db):
    return User.objects.create_user(username="admin", password="pass12345", role=User.Role.ADMIN)


@pytest.fixture
def driver_user(db):
    return User.objects.create_user(username="driver", password="pass12345", role=User.Role.DRIVER)


@pytest.mark.django_db
def test_vehicle_str():
    v = Vehicle.objects.create(plate="ABC-123", vehicle_type=Vehicle.VehicleType.TRUCK)
    assert "ABC-123" in str(v)


@pytest.mark.django_db
def test_admin_can_create_vehicle(admin_user):
    client = APIClient()
    client.force_authenticate(user=admin_user)
    resp = client.post(
        reverse("vehicle-list"),
        {"plate": "XYZ-999", "vehicle_type": "VAN", "capacity_kg": 500},
        format="json",
    )
    assert resp.status_code == 201
    assert Vehicle.objects.filter(plate="XYZ-999").exists()


@pytest.mark.django_db
def test_driver_cannot_create_vehicle(driver_user):
    client = APIClient()
    client.force_authenticate(user=driver_user)
    resp = client.post(
        reverse("vehicle-list"), {"plate": "NO-001", "capacity_kg": 100}, format="json"
    )
    assert resp.status_code == 403


@pytest.mark.django_db
def test_admin_can_assign_driver_to_vehicle(admin_user, driver_user):
    client = APIClient()
    client.force_authenticate(user=admin_user)
    resp = client.post(
        reverse("vehicle-list"),
        {"plate": "DRV-001", "capacity_kg": 300, "driver": driver_user.id},
        format="json",
    )
    assert resp.status_code == 201
    assert resp.data["driver"] == driver_user.id
    assert resp.data["driver_name"] == driver_user.username


@pytest.mark.django_db
def test_cannot_assign_admin_as_driver(admin_user):
    client = APIClient()
    client.force_authenticate(user=admin_user)
    resp = client.post(
        reverse("vehicle-list"),
        {"plate": "AS-1", "capacity_kg": 100, "driver": admin_user.id},
        format="json",
    )
    assert resp.status_code == 400
