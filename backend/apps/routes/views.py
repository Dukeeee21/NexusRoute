"""Views for the route optimization engine."""
import hashlib
import json

from django.core.cache import cache
from drf_spectacular.utils import extend_schema
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .algorithms.astar import TooManyStopsError, optimize_route
from .serializers import OptimizeRequestSerializer, OptimizeResponseSerializer

# Optimized routes for the same points are deterministic, so results are
# cached to keep the endpoint well within the < 2s SLA on repeat calls.
CACHE_TTL_SECONDS = 60 * 60  # 1 hour


def _cache_key(points, avg_speed) -> str:
    payload = json.dumps(
        {"points": points, "speed": avg_speed}, sort_keys=True
    ).encode()
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

        key = _cache_key(coords, avg_speed)
        cached = cache.get(key)
        if cached is not None:
            cached["cached"] = True
            return Response(cached)

        try:
            result = optimize_route(coords, start_index=0)
        except TooManyStopsError as exc:
            return Response(
                {"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST
            )

        ordered = [ordered_points[i] for i in result.order]
        legs = [
            {
                "from_index": leg.from_index,
                "to_index": leg.to_index,
                "distance_km": round(leg.distance_km, 4),
            }
            for leg in result.legs
        ]
        estimated_time_min = round(result.total_distance_km / avg_speed * 60, 2)

        payload = {
            "order": ordered,
            "legs": legs,
            "total_distance_km": result.total_distance_km,
            "estimated_time_min": estimated_time_min,
            "stops_count": len(stops),
            "cached": False,
        }

        cache.set(key, payload, CACHE_TTL_SECONDS)
        return Response(payload)
