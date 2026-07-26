from django.contrib import admin

from .models import Route, RouteStop


class RouteStopInline(admin.TabularInline):
    model = RouteStop
    extra = 0
    autocomplete_fields = ("delivery",)


@admin.register(Route)
class RouteAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "driver",
        "vehicle",
        "total_distance_km",
        "estimated_time_min",
        "created_at",
    )
    list_filter = ("created_at",)
    autocomplete_fields = ("driver", "vehicle", "created_by")
    inlines = [RouteStopInline]
