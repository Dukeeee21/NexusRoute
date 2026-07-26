"""URL routes for the routes app (mounted at /api/routes/)."""

from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import OptimizeRouteView, RouteViewSet

router = DefaultRouter()
router.register(r"", RouteViewSet, basename="route")

urlpatterns = [
    # Listed before the router include so this static path always wins
    # over the router's "{pk}" detail pattern for the same prefix.
    path("optimize/", OptimizeRouteView.as_view(), name="route-optimize"),
    path("", include(router.urls)),
]
