"""Serializers for the route optimization endpoint."""
from rest_framework import serializers


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
    avg_speed_kmh = serializers.FloatField(
        required=False, default=40.0, min_value=1
    )


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
