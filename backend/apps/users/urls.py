"""URL routes for the users app (mounted at /api/users/)."""

from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import MeView, RegisterView, UserViewSet

router = DefaultRouter()
router.register(r"", UserViewSet, basename="user")

urlpatterns = [
    path("register/", RegisterView.as_view(), name="user-register"),
    path("me/", MeView.as_view(), name="user-me"),
    path("", include(router.urls)),
]
