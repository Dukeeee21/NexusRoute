"""Views for the users app."""
from django.contrib.auth import get_user_model
from rest_framework import generics, permissions, viewsets
from rest_framework_simplejwt.views import TokenObtainPairView

from .permissions import IsAdmin
from .serializers import (
    CustomTokenObtainPairSerializer,
    RegisterSerializer,
    UserSerializer,
)

User = get_user_model()


class CustomTokenObtainPairView(TokenObtainPairView):
    """Login endpoint that returns tokens plus the user's role/profile."""

    serializer_class = CustomTokenObtainPairSerializer


class RegisterView(generics.CreateAPIView):
    """Register a new user. Only admins can create accounts."""

    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = (IsAdmin,)


class MeView(generics.RetrieveUpdateAPIView):
    """Return / update the currently authenticated user's profile."""

    serializer_class = UserSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_object(self):
        return self.request.user


class UserViewSet(viewsets.ModelViewSet):
    """Admin-only management of all users."""

    queryset = User.objects.all().order_by("id")
    serializer_class = UserSerializer
    permission_classes = (IsAdmin,)
    filterset_fields = ("role", "is_active")
    search_fields = ("username", "email", "first_name", "last_name")
