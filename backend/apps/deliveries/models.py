"""
Domain models for deliveries.

A `Package` holds the physical/logistics data (origin, destination, weight).
A `Delivery` is the operational assignment of that package to a driver and
vehicle, and tracks its status through the pipeline:

    PENDING -> IN_TRANSIT -> DELIVERED
"""

import uuid

from django.conf import settings
from django.db import models
from django.utils import timezone
from django.utils.translation import gettext_lazy as _


def generate_tracking_code() -> str:
    """Human-friendly unique code, e.g. NX-A1B2C3."""
    return f"NX-{uuid.uuid4().hex[:6].upper()}"


class Package(models.Model):
    tracking_code = models.CharField(
        _("código de seguimiento"),
        max_length=20,
        unique=True,
        default=generate_tracking_code,
        editable=False,
    )
    client_name = models.CharField(_("cliente"), max_length=120)
    description = models.CharField(_("descripción"), max_length=255, blank=True)
    weight_kg = models.DecimalField(_("peso (kg)"), max_digits=8, decimal_places=2, default=0)

    origin_address = models.CharField(_("origen"), max_length=255)
    origin_lat = models.FloatField(_("latitud origen"))
    origin_lng = models.FloatField(_("longitud origen"))

    destination_address = models.CharField(_("destino"), max_length=255)
    destination_lat = models.FloatField(_("latitud destino"))
    destination_lng = models.FloatField(_("longitud destino"))

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = _("paquete")
        verbose_name_plural = _("paquetes")
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"{self.tracking_code} — {self.client_name}"


class Delivery(models.Model):
    class Status(models.TextChoices):
        PENDING = "PENDING", _("Pendiente")
        IN_TRANSIT = "IN_TRANSIT", _("En tránsito")
        DELIVERED = "DELIVERED", _("Entregado")

    package = models.OneToOneField(
        Package,
        on_delete=models.CASCADE,
        related_name="delivery",
        verbose_name=_("paquete"),
    )
    driver = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="deliveries",
        verbose_name=_("conductor"),
    )
    vehicle = models.ForeignKey(
        "vehicles.Vehicle",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="deliveries",
        verbose_name=_("vehículo"),
    )
    status = models.CharField(
        _("estado"),
        max_length=12,
        choices=Status.choices,
        default=Status.PENDING,
    )
    scheduled_at = models.DateTimeField(_("programada"), null=True, blank=True)
    delivered_at = models.DateTimeField(_("entregada"), null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = _("entrega")
        verbose_name_plural = _("entregas")
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"{self.package.tracking_code} [{self.get_status_display()}]"

    def save(self, *args, **kwargs):
        # Keep delivered_at in sync with the DELIVERED status.
        if self.status == self.Status.DELIVERED and self.delivered_at is None:
            self.delivered_at = timezone.now()
        elif self.status != self.Status.DELIVERED:
            self.delivered_at = None
        super().save(*args, **kwargs)
