"""
Performance reporting for the admin dashboard.

Every endpoint here is admin-only (IsAdmin) and read-only — this module
is intentionally excluded from the driver's app (see roadmap design
note: reports live only in the main NexusRoute Dashboard).
"""
import csv
from datetime import timedelta

from django.contrib.auth import get_user_model
from django.db.models import Avg, Count, F, Sum
from django.db.models.functions import TruncDate
from django.http import HttpResponse
from django.utils import timezone
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.deliveries.models import Delivery
from apps.routes.models import Route
from apps.users.permissions import IsAdmin

from .serializers import (
    DailyCountSerializer,
    DriverPerformanceSerializer,
    PerformanceSummarySerializer,
)

User = get_user_model()


class PerformanceSummaryView(APIView):
    """GET /api/reports/performance/ — fleet-wide KPIs for the dashboard."""

    permission_classes = (IsAdmin,)

    def get(self, request):
        qs = Delivery.objects.all()
        total = qs.count()
        pending = qs.filter(status=Delivery.Status.PENDING).count()
        in_transit = qs.filter(status=Delivery.Status.IN_TRANSIT).count()
        delivered = qs.filter(status=Delivery.Status.DELIVERED).count()
        completion_rate = round(delivered / total * 100, 1) if total else 0.0

        active_drivers = (
            Delivery.objects.filter(driver__isnull=False)
            .values("driver")
            .distinct()
            .count()
        )

        avg_duration = (
            Delivery.objects.filter(status=Delivery.Status.DELIVERED)
            .annotate(duration=F("delivered_at") - F("created_at"))
            .aggregate(avg=Avg("duration"))["avg"]
        )
        avg_delivery_time_min = (
            round(avg_duration.total_seconds() / 60, 1) if avg_duration else None
        )

        total_distance_km = (
            Route.objects.aggregate(total=Sum("total_distance_km"))["total"] or 0.0
        )

        data = {
            "total_deliveries": total,
            "pending": pending,
            "in_transit": in_transit,
            "delivered": delivered,
            "completion_rate": completion_rate,
            "active_drivers": active_drivers,
            "avg_delivery_time_min": avg_delivery_time_min,
            "total_distance_km": round(total_distance_km, 2),
        }
        return Response(PerformanceSummarySerializer(data).data)


class DriverPerformanceView(APIView):
    """GET /api/reports/by-driver/ — per-driver breakdown (for the bar chart)."""

    permission_classes = (IsAdmin,)

    def get(self, request):
        results = []
        for driver in User.objects.filter(role=User.Role.DRIVER):
            assigned = Delivery.objects.filter(driver=driver).count()
            if assigned == 0:
                continue
            delivered = Delivery.objects.filter(
                driver=driver, status=Delivery.Status.DELIVERED
            ).count()
            distance = (
                Route.objects.filter(driver=driver).aggregate(
                    total=Sum("total_distance_km")
                )["total"]
                or 0.0
            )
            results.append(
                {
                    "driver_id": driver.id,
                    "driver_name": driver.first_name or driver.username,
                    "assigned": assigned,
                    "delivered": delivered,
                    "completion_rate": round(delivered / assigned * 100, 1),
                    "total_distance_km": round(distance, 2),
                }
            )
        results.sort(key=lambda r: r["assigned"], reverse=True)
        return Response(DriverPerformanceSerializer(results, many=True).data)


class DeliveriesPerDayView(APIView):
    """GET /api/reports/deliveries-per-day/?days=14 — time series (line chart)."""

    permission_classes = (IsAdmin,)

    def get(self, request):
        try:
            days = min(max(int(request.query_params.get("days", 14)), 1), 90)
        except ValueError:
            days = 14

        since = timezone.now() - timedelta(days=days - 1)
        rows = (
            Delivery.objects.filter(created_at__gte=since)
            .annotate(day=TruncDate("created_at"))
            .values("day")
            .annotate(count=Count("id"))
        )
        by_day = {r["day"]: r["count"] for r in rows}

        today = timezone.localdate()
        series = [
            {
                "date": today - timedelta(days=i),
                "count": by_day.get(today - timedelta(days=i), 0),
            }
            for i in range(days - 1, -1, -1)
        ]
        return Response(DailyCountSerializer(series, many=True).data)


class ExportDeliveriesCSVView(APIView):
    """GET /api/reports/export/ — CSV export of all deliveries."""

    permission_classes = (IsAdmin,)

    def get(self, request):
        response = HttpResponse(content_type="text/csv")
        response["Content-Disposition"] = 'attachment; filename="entregas_nexusroute.csv"'

        writer = csv.writer(response)
        writer.writerow(
            ["codigo", "cliente", "destino", "estado", "conductor", "vehiculo", "creada", "entregada"]
        )
        qs = (
            Delivery.objects.select_related("package", "driver", "vehicle")
            .order_by("-created_at")
        )
        for d in qs:
            writer.writerow(
                [
                    d.package.tracking_code,
                    d.package.client_name,
                    d.package.destination_address,
                    d.get_status_display(),
                    d.driver.username if d.driver else "",
                    d.vehicle.plate if d.vehicle else "",
                    d.created_at.isoformat(),
                    d.delivered_at.isoformat() if d.delivered_at else "",
                ]
            )
        return response
