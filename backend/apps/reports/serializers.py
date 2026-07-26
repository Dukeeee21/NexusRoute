"""Serializers for the reports app. All fields are computed (there is no
Report model — everything is aggregated from deliveries/routes)."""

from rest_framework import serializers


class PerformanceSummarySerializer(serializers.Serializer):
    total_deliveries = serializers.IntegerField()
    pending = serializers.IntegerField()
    in_transit = serializers.IntegerField()
    delivered = serializers.IntegerField()
    completion_rate = serializers.FloatField()
    active_drivers = serializers.IntegerField()
    avg_delivery_time_min = serializers.FloatField(allow_null=True)
    total_distance_km = serializers.FloatField()


class DriverPerformanceSerializer(serializers.Serializer):
    driver_id = serializers.IntegerField()
    driver_name = serializers.CharField()
    assigned = serializers.IntegerField()
    delivered = serializers.IntegerField()
    completion_rate = serializers.FloatField()
    total_distance_km = serializers.FloatField()


class DailyCountSerializer(serializers.Serializer):
    date = serializers.DateField()
    count = serializers.IntegerField()
