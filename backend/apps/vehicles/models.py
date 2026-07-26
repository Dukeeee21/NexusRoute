"""Vehicle model for the NexusRoute fleet."""

from django.conf import settings
from django.db import models
from django.utils.translation import gettext_lazy as _


class Vehicle(models.Model):
    class VehicleType(models.TextChoices):
        VAN = "VAN", _("Furgoneta")
        TRUCK = "TRUCK", _("Camión")
        MOTORCYCLE = "MOTORCYCLE", _("Motocicleta")

    plate = models.CharField(_("placa"), max_length=15, unique=True)
    model = models.CharField(_("modelo"), max_length=80, blank=True)
    vehicle_type = models.CharField(
        _("tipo"),
        max_length=12,
        choices=VehicleType.choices,
        default=VehicleType.VAN,
    )
    capacity_kg = models.PositiveIntegerField(_("capacidad (kg)"), default=0)
    is_active = models.BooleanField(_("activo"), default=True)

    # A vehicle may be assigned to a driver (role DRIVER). Nullable so a
    # vehicle can exist unassigned in the fleet.
    driver = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="vehicles",
        verbose_name=_("conductor"),
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = _("vehículo")
        verbose_name_plural = _("vehículos")
        ordering = ["plate"]

    def __str__(self) -> str:
        return f"{self.plate} ({self.get_vehicle_type_display()})"
