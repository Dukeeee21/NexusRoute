"""Serializers for the vehicles app."""
from django.contrib.auth import get_user_model
from rest_framework import serializers

from .models import Vehicle

User = get_user_model()


class VehicleSerializer(serializers.ModelSerializer):
    driver_name = serializers.CharField(source="driver.username", read_only=True)

    class Meta:
        model = Vehicle
        fields = (
            "id",
            "plate",
            "model",
            "vehicle_type",
            "capacity_kg",
            "is_active",
            "driver",
            "driver_name",
            "created_at",
        )
        read_only_fields = ("id", "created_at")

    def validate_driver(self, value):
        """Only users with the DRIVER role can be assigned a vehicle."""
        if value is not None and not value.is_driver:
            raise serializers.ValidationError(
                "El usuario asignado debe tener el rol de conductor."
            )
        return value
