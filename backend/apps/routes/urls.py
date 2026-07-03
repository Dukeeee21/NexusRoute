"""URL routes for the routes app (mounted at /api/routes/)."""
from django.urls import path

from .views import OptimizeRouteView

urlpatterns = [
    path("optimize/", OptimizeRouteView.as_view(), name="route-optimize"),
]
