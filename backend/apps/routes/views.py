"""Views for the route optimization engine and route assignment."""

import hashlib
import json

from django.conf import settings
from django.core.cache import cache
from drf_spectacular.utils import extend_schema
from rest_framework import status, viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.users.permissions import IsAdminOrReadOnly

from .algorithms.astar import TooManyStopsError
from .models import Route
from .serializers import (
    OptimizeRequestSerializer,
    OptimizeResponseSerializer,
    RouteCreateSerializer,
    RouteSerializer,
)
from .services import compute_optimized_route

# Optimized routes for the same points are deterministic, so results are
# cached. Note: this keeps *repeat* requests fast, but a first-time
# lookup now depends on network latency to OSRM (see services.py) —
# the sub-2s figure documented in Fase 3 was measured before real road
# routing existed and describes the algorithm's own compute time, not
# a third-party network call; see docs/CALIDAD_ISO25010.md.
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

        # Everything computed (order, distances, routing source, real
        # duration, road geometry) depends only on the coordinates, so
        # that is what we cache. Labels come from the current request
        # and are applied on every response, cached or not.
        key = _cache_key(coords)
        cached_result = cache.get(key)
        was_cached = cached_result is not None

        if not was_cached:
            try:
                optimized = compute_optimized_route(coords)
            except TooManyStopsError as exc:
                return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
            result = optimized.result
            cached_result = {
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
                "routing_source": optimized.routing_source,
                "duration_min": optimized.duration_min,
                "geometry": optimized.geometry,
            }
            cache.set(key, cached_result, CACHE_TTL_SECONDS)

        total_km = cached_result["total_distance_km"]
        duration_min = cached_result.get("duration_min")
        estimated_time_min = (
            duration_min if duration_min is not None else round(total_km / avg_speed * 60, 2)
        )

        payload = {
            "order": [ordered_points[i] for i in cached_result["order_indices"]],
            "legs": cached_result["legs"],
            "total_distance_km": total_km,
            "estimated_time_min": estimated_time_min,
            "stops_count": len(stops),
            "cached": was_cached,
            "routing_source": cached_result["routing_source"],
            "geometry": cached_result.get("geometry"),
        }
        return Response(payload)


class DepotConfigView(APIView):
    """
    GET /api/routes/depot/

    Exposes the configured depot (label + coordinates) so the frontend
    can default a delivery's origin to it instead of asking whoever is
    creating the delivery to type in raw coordinates for a location
    that, in practice, is almost always the same warehouse.
    """

    permission_classes = (IsAuthenticated,)

    def get(self, request):
        return Response(
            {
                "label": settings.DEPOT_LABEL,
                "lat": settings.DEPOT_LAT,
                "lng": settings.DEPOT_LNG,
            }
        )


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
        serializer = RouteCreateSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        route = serializer.save()
        return Response(RouteSerializer(route).data, status=status.HTTP_201_CREATED)
