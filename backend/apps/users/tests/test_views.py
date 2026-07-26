"""Tests for authentication and user endpoints."""

import pytest
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework.test import APIClient

User = get_user_model()


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def admin_user(db):
    return User.objects.create_user(username="admin", password="testpass123", role=User.Role.ADMIN)


@pytest.fixture
def driver_user(db):
    return User.objects.create_user(
        username="driver", password="testpass123", role=User.Role.DRIVER
    )


@pytest.mark.django_db
def test_login_returns_tokens_and_role(api_client, admin_user):
    url = reverse("token_obtain_pair")
    resp = api_client.post(url, {"username": "admin", "password": "testpass123"}, format="json")
    assert resp.status_code == 200
    assert "access" in resp.data
    assert "refresh" in resp.data
    assert resp.data["user"]["role"] == "ADMIN"


@pytest.mark.django_db
def test_me_endpoint_requires_authentication(api_client):
    resp = api_client.get(reverse("user-me"))
    assert resp.status_code == 401


@pytest.mark.django_db
def test_me_endpoint_returns_current_user(api_client, driver_user):
    api_client.force_authenticate(user=driver_user)
    resp = api_client.get(reverse("user-me"))
    assert resp.status_code == 200
    assert resp.data["username"] == "driver"


@pytest.mark.django_db
def test_driver_cannot_register_users(api_client, driver_user):
    api_client.force_authenticate(user=driver_user)
    resp = api_client.post(
        reverse("user-register"),
        {"username": "new", "password": "testpass123", "role": "DRIVER"},
        format="json",
    )
    assert resp.status_code == 403


@pytest.mark.django_db
def test_admin_can_register_users(api_client, admin_user):
    api_client.force_authenticate(user=admin_user)
    resp = api_client.post(
        reverse("user-register"),
        {"username": "new", "password": "testpass123", "role": "DRIVER"},
        format="json",
    )
    assert resp.status_code == 201
    assert User.objects.filter(username="new").exists()
