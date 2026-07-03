"""Views for the deliveries app."""
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.users.permissions import IsAdminOrReadOnly

from .models import Delivery
from .serializers import DeliverySerializer, DeliveryStatusSerializer


class DeliveryViewSet(viewsets.ModelViewSet):
    """
    CRUD for deliveries.

    - List/retrieve: any authenticated user.
    - Create/update/delete: admins only (IsAdminOrReadOnly).
    - `status` action: dedicated endpoint for status transitions (Phase 5
      will restrict it to the assigned driver).
    """

    queryset = (
        Delivery.objects.select_related("package", "driver", "vehicle").all()
    )
    serializer_class = DeliverySerializer
    permission_classes = (IsAdminOrReadOnly,)
    filterset_fields = ("status", "driver", "vehicle")
    search_fields = (
        "package__tracking_code",
        "package__client_name",
        "package__destination_address",
    )
    ordering_fields = ("created_at", "scheduled_at", "status")

    @action(detail=True, methods=["patch"])
    def status(self, request, pk=None):
        delivery = self.get_object()
        serializer = DeliveryStatusSerializer(
            delivery, data=request.data, partial=True
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(DeliverySerializer(delivery).data)
