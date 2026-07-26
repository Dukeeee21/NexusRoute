"""Serializers for the deliveries app."""

from rest_framework import serializers

from .models import Delivery, Package


class PackageSerializer(serializers.ModelSerializer):
    class Meta:
        model = Package
        fields = (
            "id",
            "tracking_code",
            "client_name",
            "description",
            "weight_kg",
            "origin_address",
            "origin_lat",
            "origin_lng",
            "destination_address",
            "destination_lat",
            "destination_lng",
            "created_at",
        )
        read_only_fields = ("id", "tracking_code", "created_at")


class DeliverySerializer(serializers.ModelSerializer):
    """Read/write delivery with a nested package (writable on create)."""

    package = PackageSerializer()
    status_display = serializers.CharField(source="get_status_display", read_only=True)
    driver_name = serializers.CharField(source="driver.username", read_only=True)
    vehicle_plate = serializers.CharField(source="vehicle.plate", read_only=True)

    class Meta:
        model = Delivery
        fields = (
            "id",
            "package",
            "driver",
            "driver_name",
            "vehicle",
            "vehicle_plate",
            "status",
            "status_display",
            "scheduled_at",
            "delivered_at",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "delivered_at", "created_at", "updated_at")

    def validate_driver(self, value):
        if value is not None and not value.is_driver:
            raise serializers.ValidationError(
                "El conductor asignado debe tener el rol de conductor."
            )
        return value

    def create(self, validated_data):
        package_data = validated_data.pop("package")
        package = Package.objects.create(**package_data)
        return Delivery.objects.create(package=package, **validated_data)

    def update(self, instance, validated_data):
        # Allow nested package edits alongside the delivery fields.
        package_data = validated_data.pop("package", None)
        if package_data:
            for attr, val in package_data.items():
                setattr(instance.package, attr, val)
            instance.package.save()
        for attr, val in validated_data.items():
            setattr(instance, attr, val)
        instance.save()
        return instance


class DeliveryStatusSerializer(serializers.ModelSerializer):
    """Lightweight serializer for status-only updates (used in Phase 5)."""

    class Meta:
        model = Delivery
        fields = ("id", "status")

    def validate_status(self, value):
        current = self.instance.status if self.instance else None
        allowed = {
            Delivery.Status.PENDING: {Delivery.Status.IN_TRANSIT},
            Delivery.Status.IN_TRANSIT: {Delivery.Status.DELIVERED},
            Delivery.Status.DELIVERED: set(),
        }
        if current and value != current and value not in allowed[current]:
            raise serializers.ValidationError(
                f"Transición de estado inválida: {current} → {value}."
            )
        return value
