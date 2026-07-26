"""Tests for Package and Delivery models."""

import pytest

from apps.deliveries.models import Delivery, Package


@pytest.fixture
def package(db):
    return Package.objects.create(
        client_name="TechCorp Ltda.",
        origin_address="Depósito Central",
        origin_lat=-34.60,
        origin_lng=-58.38,
        destination_address="Zona Norte",
        destination_lat=-34.55,
        destination_lng=-58.45,
        weight_kg=12.5,
    )


@pytest.mark.django_db
def test_package_auto_tracking_code(package):
    assert package.tracking_code.startswith("NX-")
    assert len(package.tracking_code) == 9  # "NX-" + 6 hex chars


@pytest.mark.django_db
def test_package_str(package):
    assert package.tracking_code in str(package)
    assert "TechCorp Ltda." in str(package)


@pytest.mark.django_db
def test_delivery_str(package):
    delivery = Delivery.objects.create(package=package)
    assert package.tracking_code in str(delivery)
    assert "Pendiente" in str(delivery)


@pytest.mark.django_db
def test_delivery_defaults_to_pending(package):
    delivery = Delivery.objects.create(package=package)
    assert delivery.status == Delivery.Status.PENDING
    assert delivery.delivered_at is None


@pytest.mark.django_db
def test_delivered_sets_timestamp(package):
    delivery = Delivery.objects.create(package=package)
    delivery.status = Delivery.Status.DELIVERED
    delivery.save()
    assert delivery.delivered_at is not None


@pytest.mark.django_db
def test_reverting_status_clears_delivered_at(package):
    delivery = Delivery.objects.create(package=package, status=Delivery.Status.DELIVERED)
    assert delivery.delivered_at is not None
    delivery.status = Delivery.Status.IN_TRANSIT
    delivery.save()
    assert delivery.delivered_at is None
