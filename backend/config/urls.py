"""
Root URL configuration for NexusRoute.

All API routes are namespaced under /api/. Each app exposes its own
urls module which is included here.
"""
from django.contrib import admin
from django.urls import include, path
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularSwaggerView,
)
from rest_framework_simplejwt.views import TokenRefreshView

from apps.users.views import CustomTokenObtainPairView

urlpatterns = [
    path("admin/", admin.site.urls),
    # ── Authentication (JWT) ──────────────────────────────────────
    path("api/auth/token/", CustomTokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("api/auth/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    # ── Application APIs ──────────────────────────────────────────
    path("api/users/", include("apps.users.urls")),
    path("api/deliveries/", include("apps.deliveries.urls")),
    path("api/vehicles/", include("apps.vehicles.urls")),
    path("api/routes/", include("apps.routes.urls")),
    path("api/reports/", include("apps.reports.urls")),
    # ── API documentation ─────────────────────────────────────────
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path(
        "api/docs/",
        SpectacularSwaggerView.as_view(url_name="schema"),
        name="swagger-ui",
    ),
]
