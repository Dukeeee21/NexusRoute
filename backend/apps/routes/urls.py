"""URL routes for the routes app (mounted at /api/routes/)."""

from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import DepotConfigView, OptimizeRouteView, RouteViewSet

router = DefaultRouter()
router.register(r"", RouteViewSet, basename="route")

urlpatterns = [
    # Listed before the router include so these static paths always win
    # over the router's "{pk}" detail pattern for the same prefix.
    path("optimize/", OptimizeRouteView.as_view(), name="route-optimize"),
    path("depot/", DepotConfigView.as_view(), name="route-depot"),
    path("", include(router.urls)),
]
