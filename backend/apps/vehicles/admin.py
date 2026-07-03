from django.contrib import admin

from .models import Vehicle


@admin.register(Vehicle)
class VehicleAdmin(admin.ModelAdmin):
    list_display = ("plate", "vehicle_type", "capacity_kg", "driver", "is_active")
    list_filter = ("vehicle_type", "is_active")
    search_fields = ("plate", "model")
    autocomplete_fields = ("driver",)
