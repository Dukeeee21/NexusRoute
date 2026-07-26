"""Views for the deliveries app."""
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.users.permissions import IsAdminOrReadOnly, IsAssignedDriverOrAdmin

from .models import Delivery
from .serializers import DeliverySerializer, DeliveryStatusSerializer


class DeliveryViewSet(viewsets.ModelViewSet):
    """
    CRUD for deliveries.

    - List/retrieve: any authenticated user; drivers only see deliveries
      assigned to them, admins see everything.
    - Create/update/delete: admins only (IsAdminOrReadOnly).
    - `status` action: the assigned driver (or an admin) transitions a
      single delivery through PENDING -> IN_TRANSIT -> DELIVERED as they
      progress along their route.
    """

    serializer_class = DeliverySerializer
    permission_classes = (IsAdminOrReadOnly,)
    filterset_fields = ("status", "driver", "vehicle")
    search_fields = (
        "package__tracking_code",
        "package__client_name",
        "package__destination_address",
    )
    ordering_fields = ("created_at", "scheduled_at", "status")

    def get_queryset(self):
        qs = Delivery.objects.select_related("package", "driver", "vehicle").all()
        user = self.request.user
        if user.is_authenticated and user.is_driver:
            qs = qs.filter(driver=user)
        return qs

    def get_permissions(self):
        if self.action == "status":
            return [IsAssignedDriverOrAdmin()]
        return super().get_permissions()

    @action(detail=True, methods=["patch"])
    def status(self, request, pk=None):
        delivery = self.get_object()  # runs has_object_permission via check_object_permissions
        serializer = DeliveryStatusSerializer(
            delivery, data=request.data, partial=True
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(DeliverySerializer(delivery).data)
