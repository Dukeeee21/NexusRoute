"""Views for the vehicles app."""

from rest_framework import viewsets

from apps.users.permissions import IsAdminOrReadOnly

from .models import Vehicle
from .serializers import VehicleSerializer


class VehicleViewSet(viewsets.ModelViewSet):
    """CRUD for fleet vehicles. Writes are admin-only; reads authenticated."""

    queryset = Vehicle.objects.select_related("driver").all()
    serializer_class = VehicleSerializer
    permission_classes = (IsAdminOrReadOnly,)
    filterset_fields = ("vehicle_type", "is_active", "driver")
    search_fields = ("plate", "model")
    ordering_fields = ("plate", "capacity_kg", "created_at")
