"""Views for the route optimization engine and route assignment."""
import hashlib
import json

from django.core.cache import cache
from drf_spectacular.utils import extend_schema
from rest_framework import status, viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.users.permissions import IsAdminOrReadOnly

from .algorithms.astar import TooManyStopsError, optimize_route
from .models import Route
from .serializers import (
    OptimizeRequestSerializer,
    OptimizeResponseSerializer,
    RouteCreateSerializer,
    RouteSerializer,
)

# Optimized routes for the same points are deterministic, so results are
# cached to keep the endpoint well within the < 2s SLA on repeat calls.
CACHE_TTL_SECONDS = 60 * 60  # 1 hour


def _cache_key(points) -> str:
    payload = json.dumps({"points": points}, sort_keys=True).encode()
    digest = hashlib.sha1(payload).hexdigest()
    return f"route:optimize:{digest}"


class OptimizeRouteView(APIView):
    """
    POST /api/routes/optimize/

    Receives an origin and a list of stops and returns the most efficient
    visiting order computed with A*. The response is explainable: it
    includes the ordered points, each leg's distance, the total distance
    and an estimated travel time.
    """

    permission_classes = (IsAuthenticated,)

    @extend_schema(
        request=OptimizeRequestSerializer,
        responses=OptimizeResponseSerializer,
    )
    def post(self, request):
        req = OptimizeRequestSerializer(data=request.data)
        req.is_valid(raise_exception=True)
        data = req.validated_data

        origin = data["origin"]
        stops = data["stops"]
        avg_speed = data["avg_speed_kmh"]

        # Origin is index 0; stops follow.
        ordered_points = [origin, *stops]
        coords = [(p["lat"], p["lng"]) for p in ordered_points]

        # The geometry (order + distances) depends only on the coordinates,
        # so that is what we cache. Labels come from the current request and
        # are applied on every response, cached or not.
        key = _cache_key(coords)
        geometry = cache.get(key)
        was_cached = geometry is not None

        if not was_cached:
            try:
                result = optimize_route(coords, start_index=0)
            except TooManyStopsError as exc:
                return Response(
                    {"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST
                )
            geometry = {
                "order_indices": result.order,
                "legs": [
                    {
                        "from_index": leg.from_index,
                        "to_index": leg.to_index,
                        "distance_km": round(leg.distance_km, 4),
                    }
                    for leg in result.legs
                ],
                "total_distance_km": result.total_distance_km,
            }
            cache.set(key, geometry, CACHE_TTL_SECONDS)

        total_km = geometry["total_distance_km"]
        payload = {
            "order": [ordered_points[i] for i in geometry["order_indices"]],
            "legs": geometry["legs"],
            "total_distance_km": total_km,
            "estimated_time_min": round(total_km / avg_speed * 60, 2),
            "stops_count": len(stops),
            "cached": was_cached,
        }
        return Response(payload)


class RouteViewSet(viewsets.ModelViewSet):
    """
    Persisted route assignments.

    - `POST /api/routes/` (admin only): optimize + assign a driver/vehicle
      to a set of pending deliveries, returning the saved plan.
    - `GET /api/routes/` / `GET /api/routes/{id}/`: list/retrieve plans.
      Drivers only see their own routes; admins see all.

    Routes are immutable snapshots for this phase (no update/delete) —
    progress is tracked per-delivery via /api/deliveries/{id}/status/.
    """

    permission_classes = (IsAdminOrReadOnly,)
    http_method_names = ["get", "post", "head", "options"]

    def get_serializer_class(self):
        return RouteCreateSerializer if self.action == "create" else RouteSerializer

    def get_queryset(self):
        qs = Route.objects.select_related("driver", "vehicle").prefetch_related(
            "stops__delivery__package"
        )
        user = self.request.user
        if user.is_authenticated and user.is_driver:
            qs = qs.filter(driver=user)
        return qs

    def create(self, request, *args, **kwargs):
        serializer = RouteCreateSerializer(
            data=request.data, context={"request": request}
        )
        serializer.is_valid(raise_exception=True)
        route = serializer.save()
        return Response(
            RouteSerializer(route).data, status=status.HTTP_201_CREATED
        )
