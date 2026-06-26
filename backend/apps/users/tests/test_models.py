"""Tests for the User model and its role helpers."""
import pytest
from django.contrib.auth import get_user_model

User = get_user_model()


@pytest.mark.django_db
def test_create_user_defaults_to_driver():
    user = User.objects.create_user(username="juan", password="testpass123")
    assert user.role == User.Role.DRIVER
    assert user.is_driver is True
    assert user.is_admin is False


@pytest.mark.django_db
def test_create_admin_role():
    user = User.objects.create_user(
        username="dispatcher",
        password="testpass123",
        role=User.Role.ADMIN,
    )
    assert user.is_admin is True
    assert user.is_driver is False


@pytest.mark.django_db
def test_user_str_includes_role_label():
    user = User.objects.create_user(
        username="ana", password="testpass123", role=User.Role.ADMIN
    )
    assert "ana" in str(user)
    assert "Administrador" in str(user)
