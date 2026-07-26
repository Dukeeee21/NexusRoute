"""
User model for NexusRoute.

We use a custom user with a `role` field instead of relying solely on
Django groups. NexusRoute has exactly two operational roles:

  * ADMIN  — the dispatcher who manages deliveries, fleet and reports.
  * DRIVER — operates an assigned route and updates delivery status.

The role drives DRF permission checks (see apps/users/permissions.py).
"""

from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils.translation import gettext_lazy as _


class User(AbstractUser):
    class Role(models.TextChoices):
        ADMIN = "ADMIN", _("Administrador (Dispatcher)")
        DRIVER = "DRIVER", _("Conductor")

    role = models.CharField(
        _("rol"),
        max_length=10,
        choices=Role.choices,
        default=Role.DRIVER,
    )
    phone = models.CharField(_("telefono"), max_length=30, blank=True)

    class Meta:
        verbose_name = _("usuario")
        verbose_name_plural = _("usuarios")

    def __str__(self) -> str:
        return f"{self.username} ({self.get_role_display()})"

    @property
    def is_admin(self) -> bool:
        return self.role == self.Role.ADMIN

    @property
    def is_driver(self) -> bool:
        return self.role == self.Role.DRIVER
