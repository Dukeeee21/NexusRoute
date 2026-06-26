"""
Role-based DRF permissions for NexusRoute.

These complement the default IsAuthenticated policy so views can require
a specific role with a single permission class.
"""
from rest_framework.permissions import BasePermission


class IsAdmin(BasePermission):
    """Allow access only to authenticated users with the ADMIN role."""

    message = "Solo los administradores (dispatchers) pueden acceder a este recurso."

    def has_permission(self, request, view) -> bool:
        return bool(request.user and request.user.is_authenticated and request.user.is_admin)


class IsDriver(BasePermission):
    """Allow access only to authenticated users with the DRIVER role."""

    message = "Solo los conductores pueden acceder a este recurso."

    def has_permission(self, request, view) -> bool:
        return bool(request.user and request.user.is_authenticated and request.user.is_driver)


class IsAdminOrReadOnly(BasePermission):
    """Read access to any authenticated user; writes only for admins."""

    SAFE_METHODS = ("GET", "HEAD", "OPTIONS")

    def has_permission(self, request, view) -> bool:
        if not (request.user and request.user.is_authenticated):
            return False
        if request.method in self.SAFE_METHODS:
            return True
        return request.user.is_admin
