"""URL routes for the deliveries app (mounted at /api/deliveries/)."""
from rest_framework.routers import DefaultRouter

from .views import DeliveryViewSet

router = DefaultRouter()
router.register(r"", DeliveryViewSet, basename="delivery")

urlpatterns = router.urls
