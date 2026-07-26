"""Serializers for route optimization and route assignment."""

from django.conf import settings
from django.contrib.auth import get_user_model
from rest_framework import serializers

from apps.deliveries.models import Delivery
from apps.vehicles.models import Vehicle

from .algorithms.astar import TooManyStopsError, optimize_route
from .models import Route, RouteStop

User = get_user_model()

# Used only to turn total distance into an estimated duration.
DEFAULT_SPEED_KMH = 40.0


class PointSerializer(serializers.Serializer):
    """A single geographic point, optionally tagged with a label/id."""

    id = serializers.CharField(required=False, allow_null=True)
    label = serializers.CharField(required=False, allow_blank=True, default="")
    lat = serializers.FloatField(min_value=-90, max_value=90)
    lng = serializers.FloatField(min_value=-180, max_value=180)


class OptimizeRequestSerializer(serializers.Serializer):
    """
    Input for POST /api/routes/optimize/.

    An `origin` (the route's start) plus one or more `stops` to visit.
    `avg_speed_kmh` is used only to estimate travel time.
    """

    origin = PointSerializer()
    stops = serializers.ListField(child=PointSerializer(), allow_empty=False)
    avg_speed_kmh = serializers.FloatField(required=False, default=40.0, min_value=1)


class LegSerializer(serializers.Serializer):
    from_index = serializers.IntegerField()
    to_index = serializers.IntegerField()
    distance_km = serializers.FloatField()


class OptimizeResponseSerializer(serializers.Serializer):
    """Explainable result: the ordered route and its cost breakdown."""

    order = PointSerializer(many=True)
    legs = LegSerializer(many=True)
    total_distance_km = serializers.FloatField()
    estimated_time_min = serializers.FloatField()
    stops_count = serializers.IntegerField()
    cached = serializers.BooleanField()


# ── Route assignment (persisted plans) ─────────────────────────────


class RouteStopSerializer(serializers.ModelSerializer):
    """A stop in visiting order, enriched with delivery/package details
    so the frontend can render the map and the explainable stop list
    without extra requests."""

    tracking_code = serializers.CharField(source="delivery.package.tracking_code", read_only=True)
    client_name = serializers.CharField(source="delivery.package.client_name", read_only=True)
    destination_address = serializers.CharField(
        source="delivery.package.destination_address", read_only=True
    )
    lat = serializers.FloatField(source="delivery.package.destination_lat", read_only=True)
    lng = serializers.FloatField(source="delivery.package.destination_lng", read_only=True)
    delivery_status = serializers.CharField(source="delivery.status", read_only=True)

    class Meta:
        model = RouteStop
        fields = (
            "id",
            "delivery",
            "order",
            "distance_from_prev_km",
            "tracking_code",
            "client_name",
            "destination_address",
            "lat",
            "lng",
            "delivery_status",
        )


class RouteSerializer(serializers.ModelSerializer):
    """Read representation of a Route, with its stops in visiting order."""

    stops = RouteStopSerializer(many=True, read_only=True)
    driver_name = serializers.SerializerMethodField()
    vehicle_plate = serializers.SerializerMethodField()

    class Meta:
        model = Route
        fields = (
            "id",
            "driver",
            "driver_name",
            "vehicle",
            "vehicle_plate",
            "origin_label",
            "origin_lat",
            "origin_lng",
            "total_distance_km",
            "estimated_time_min",
            "stops",
            "created_at",
        )

    def get_driver_name(self, obj):
        return obj.driver.username if obj.driver else None

    def get_vehicle_plate(self, obj):
        return obj.vehicle.plate if obj.vehicle else None


class RouteCreateSerializer(serializers.Serializer):
    """
    Input for POST /api/routes/.

    Takes a driver, a vehicle and a list of pending, unassigned delivery
    ids; runs A* to order them from the depot (or a custom origin) and
    persists the result as a Route with its RouteStops. Each selected
    Delivery is stamped with the chosen driver/vehicle.
    """

    driver = serializers.PrimaryKeyRelatedField(queryset=User.objects.filter(role=User.Role.DRIVER))
    vehicle = serializers.PrimaryKeyRelatedField(queryset=Vehicle.objects.filter(is_active=True))
    delivery_ids = serializers.ListField(child=serializers.IntegerField(), allow_empty=False)
    origin_label = serializers.CharField(required=False, allow_blank=True)
    origin_lat = serializers.FloatField(required=False)
    origin_lng = serializers.FloatField(required=False)

    def validate_delivery_ids(self, value):
        if len(set(value)) != len(value):
            raise serializers.ValidationError("Hay entregas duplicadas en la lista.")

        deliveries = list(Delivery.objects.filter(id__in=value).select_related("package"))
        if len(deliveries) != len(value):
            raise serializers.ValidationError("Alguna entrega no existe.")

        for delivery in deliveries:
            if delivery.status != Delivery.Status.PENDING or delivery.driver_id:
                raise serializers.ValidationError(
                    f"La entrega {delivery.package.tracking_code} no está "
                    "disponible para asignar (ya tiene ruta o no está pendiente)."
                )

        # Keep a lookup so create() doesn't need to re-query.
        self._deliveries_by_id = {d.id: d for d in deliveries}
        return value

    def create(self, validated_data):
        ids = validated_data["delivery_ids"]
        deliveries = [self._deliveries_by_id[i] for i in ids]

        origin_lat = validated_data.get("origin_lat", settings.DEPOT_LAT)
        origin_lng = validated_data.get("origin_lng", settings.DEPOT_LNG)
        origin_label = validated_data.get("origin_label") or settings.DEPOT_LABEL

        coords = [(origin_lat, origin_lng)] + [
            (d.package.destination_lat, d.package.destination_lng) for d in deliveries
        ]

        try:
            result = optimize_route(coords, start_index=0)
        except TooManyStopsError as exc:
            raise serializers.ValidationError({"delivery_ids": str(exc)})

        driver = validated_data["driver"]
        vehicle = validated_data["vehicle"]
        request = self.context.get("request")

        route = Route.objects.create(
            driver=driver,
            vehicle=vehicle,
            created_by=getattr(request, "user", None),
            origin_label=origin_label,
            origin_lat=origin_lat,
            origin_lng=origin_lng,
            total_distance_km=result.total_distance_km,
            estimated_time_min=round(result.total_distance_km / DEFAULT_SPEED_KMH * 60, 2),
        )

        # result.order[0] is the origin (index 0); every later index maps
        # 1:1 back to `deliveries` (coords[k] == deliveries[k - 1]).
        for position, point_index in enumerate(result.order[1:], start=1):
            delivery = deliveries[point_index - 1]
            leg = next(candidate for candidate in result.legs if candidate.to_index == point_index)
            RouteStop.objects.create(
                route=route,
                delivery=delivery,
                order=position,
                distance_from_prev_km=round(leg.distance_km, 4),
            )
            delivery.driver = driver
            delivery.vehicle = vehicle
            delivery.save(update_fields=["driver", "vehicle"])

        return route
