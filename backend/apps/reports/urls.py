"""URL routes for the reports app (mounted at /api/reports/). Admin only."""
from django.urls import path

from .views import (
    DeliveriesPerDayView,
    DriverPerformanceView,
    ExportDeliveriesCSVView,
    PerformanceSummaryView,
)

urlpatterns = [
    path("performance/", PerformanceSummaryView.as_view(), name="report-performance"),
    path("by-driver/", DriverPerformanceView.as_view(), name="report-by-driver"),
    path(
        "deliveries-per-day/",
        DeliveriesPerDayView.as_view(),
        name="report-deliveries-per-day",
    ),
    path("export/", ExportDeliveriesCSVView.as_view(), name="report-export"),
]
