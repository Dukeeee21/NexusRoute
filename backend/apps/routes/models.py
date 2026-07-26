"""
Route assignment models.

A `Route` is the dispatcher's plan for a driver/vehicle pair: a snapshot
of the optimized visiting order (computed with A*, see algorithms/astar.py)
over a set of pending deliveries. `RouteStop` records each delivery's
position in that order and the distance travelled to reach it, which is
what the admin map/detail view renders for explainability.

Routes are treated as immutable plans for Phase 4 — reassigning or
editing a route is out of scope here; Phase 5 tracks progress through
each Delivery's own status field.
"""

from django.conf import settings
from django.db import models
from django.utils.translation import gettext_lazy as _


class RoutingSource(models.TextChoices):
    OSRM = "OSRM", _("Calles reales (OSRM)")
    HAVERSINE = "HAVERSINE", _("Línea recta (estimación)")


class Route(models.Model):
    driver = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="routes",
        verbose_name=_("conductor"),
    )
    vehicle = models.ForeignKey(
        "vehicles.Vehicle",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="routes",
        verbose_name=_("vehículo"),
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="routes_created",
        verbose_name=_("creada por"),
    )

    origin_label = models.CharField(_("etiqueta de origen"), max_length=120)
    origin_lat = models.FloatField(_("latitud de origen"))
    origin_lng = models.FloatField(_("longitud de origen"))

    total_distance_km = models.FloatField(_("distancia total (km)"))
    estimated_time_min = models.FloatField(_("tiempo estimado (min)"))

    # Whether total_distance_km/estimated_time_min and `geometry` reflect
    # real road distances (OSRM) or the haversine straight-line fallback
    # — surfaced in the UI so the dispatcher knows which one they're
    # looking at (see apps/routes/algorithms/osrm.py for the fallback
    # logic; OSRM is a public, best-effort service with no uptime SLA).
    routing_source = models.CharField(
        _("fuente de ruteo"),
        max_length=10,
        choices=RoutingSource.choices,
        default=RoutingSource.HAVERSINE,
    )
    # The actual road-following path as [[lat, lng], ...] from OSRM's
    # Route service, in visiting order. Always null when routing_source
    # is HAVERSINE; can also be null even when routing_source is OSRM
    # if the (separate) geometry request specifically failed while the
    # distance/duration one succeeded. The frontend draws straight
    # segments between stops whenever this is null.
    geometry = models.JSONField(_("geometría de la ruta"), null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = _("ruta")
        verbose_name_plural = _("rutas")
        ordering = ["-created_at"]

    def __str__(self) -> str:
        vehicle_plate = self.vehicle.plate if self.vehicle else "sin vehículo"
        return f"Ruta #{self.id} — {self.driver} ({vehicle_plate})"


class RouteStop(models.Model):
    route = models.ForeignKey(
        Route, on_delete=models.CASCADE, related_name="stops", verbose_name=_("ruta")
    )
    delivery = models.OneToOneField(
        "deliveries.Delivery",
        on_delete=models.CASCADE,
        related_name="route_stop",
        verbose_name=_("entrega"),
    )
    order = models.PositiveIntegerField(_("orden"))
    distance_from_prev_km = models.FloatField(_("distancia desde la anterior (km)"))

    class Meta:
        verbose_name = _("parada")
        verbose_name_plural = _("paradas")
        ordering = ["order"]
        unique_together = ("route", "order")

    def __str__(self) -> str:
        return f"Parada {self.order} — {self.delivery.package.tracking_code}"
