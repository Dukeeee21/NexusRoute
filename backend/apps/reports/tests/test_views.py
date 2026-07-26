"""Tests for the reports (performance) API — admin-only KPIs."""
from datetime import timedelta

import pytest
from django.contrib.auth import get_user_model
from django.urls import reverse
from django.utils import timezone
from rest_framework.test import APIClient

from apps.deliveries.models import Delivery, Package
from apps.routes.models import Route
from apps.vehicles.models import Vehicle

User = get_user_model()


@pytest.fixture
def admin_client(db):
    user = User.objects.create_user(username="admin", password="pass12345", role=User.Role.ADMIN)
    client = APIClient()
    client.force_authenticate(user=user)
    return client


@pytest.fixture
def driver(db):
    return User.objects.create_user(username="conductor", password="pass12345", role=User.Role.DRIVER)


def _delivery(driver=None, status=Delivery.Status.PENDING):
    package = Package.objects.create(
        client_name="Cliente", origin_address="A", origin_lat=0, origin_lng=0,
        destination_address="B", destination_lat=1, destination_lng=1,
    )
    return Delivery.objects.create(package=package, driver=driver, status=status)


@pytest.mark.django_db
def test_performance_requires_admin(driver):
    client = APIClient()
    client.force_authenticate(user=driver)
    resp = client.get(reverse("report-performance"))
    assert resp.status_code == 403


@pytest.mark.django_db
def test_performance_summary_counts(admin_client, driver):
    _delivery()  # PENDING, unassigned
    _delivery()  # PENDING, unassigned
    _delivery(driver=driver, status=Delivery.Status.IN_TRANSIT)

    d = _delivery(driver=driver, status=Delivery.Status.PENDING)
    Delivery.objects.filter(pk=d.pk).update(
        created_at=timezone.now() - timedelta(minutes=30)
    )
    d.refresh_from_db()
    d.status = Delivery.Status.DELIVERED
    d.save()

    resp = admin_client.get(reverse("report-performance"))
    assert resp.status_code == 200
    data = resp.data
    assert data["total_deliveries"] == 4
    assert data["pending"] == 2
    assert data["in_transit"] == 1
    assert data["delivered"] == 1
    assert data["active_drivers"] == 1
    assert data["avg_delivery_time_min"] == pytest.approx(30, abs=1)


@pytest.mark.django_db
def test_performance_summary_empty_state(admin_client):
    resp = admin_client.get(reverse("report-performance"))
    assert resp.status_code == 200
    assert resp.data["total_deliveries"] == 0
    assert resp.data["completion_rate"] == 0.0
    assert resp.data["avg_delivery_time_min"] is None


@pytest.mark.django_db
def test_by_driver_breakdown(admin_client, driver):
    vehicle = Vehicle.objects.create(plate="XX-000", capacity_kg=100)
    _delivery(driver=driver, status=Delivery.Status.DELIVERED)
    _delivery(driver=driver, status=Delivery.Status.PENDING)
    Route.objects.create(
        driver=driver,
        vehicle=vehicle,
        origin_label="Depósito",
        origin_lat=0,
        origin_lng=0,
        total_distance_km=12.5,
        estimated_time_min=20,
    )

    resp = admin_client.get(reverse("report-by-driver"))
    assert resp.status_code == 200
    row = resp.data[0]
    assert row["driver_id"] == driver.id
    assert row["assigned"] == 2
    assert row["delivered"] == 1
    assert row["completion_rate"] == 50.0
    assert row["total_distance_km"] == 12.5


@pytest.mark.django_db
def test_by_driver_excludes_drivers_with_no_deliveries(admin_client, driver):
    User.objects.create_user(username="sindeliveries", password="pass12345", role=User.Role.DRIVER)
    _delivery(driver=driver)

    resp = admin_client.get(reverse("report-by-driver"))
    assert len(resp.data) == 1
    assert resp.data[0]["driver_id"] == driver.id


@pytest.mark.django_db
def test_deliveries_per_day_shape(admin_client):
    _delivery()
    resp = admin_client.get(reverse("report-deliveries-per-day"), {"days": 7})
    assert resp.status_code == 200
    assert len(resp.data) == 7
    assert sum(row["count"] for row in resp.data) == 1


@pytest.mark.django_db
def test_export_csv(admin_client):
    d = _delivery()
    resp = admin_client.get(reverse("report-export"))
    assert resp.status_code == 200
    assert resp["Content-Type"].startswith("text/csv")
    content = resp.content.decode("utf-8")
    assert "codigo" in content
    assert d.package.tracking_code in content
