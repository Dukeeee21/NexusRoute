"""Tests for the seed_demo_data management command."""

import pytest
from django.contrib.auth import get_user_model
from django.core.management import call_command

from apps.deliveries.models import Delivery
from apps.vehicles.models import Vehicle

User = get_user_model()


@pytest.mark.django_db
def test_seed_creates_admin_drivers_vehicle_and_deliveries():
    call_command("seed_demo_data")

    admin = User.objects.get(username="admin")
    assert admin.role == User.Role.ADMIN
    assert admin.is_superuser is True
    assert admin.check_password("admin12345")

    assert User.objects.filter(role=User.Role.DRIVER).count() == 2
    assert Vehicle.objects.filter(plate="NX-001").exists()
    assert Delivery.objects.filter(status=Delivery.Status.PENDING).count() == 5


@pytest.mark.django_db
def test_seed_is_idempotent():
    call_command("seed_demo_data")
    first_user_count = User.objects.count()
    first_delivery_count = Delivery.objects.count()

    call_command("seed_demo_data")

    assert User.objects.count() == first_user_count
    assert Delivery.objects.count() == first_delivery_count
