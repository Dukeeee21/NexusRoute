from django.contrib import admin

from .models import Delivery, Package


@admin.register(Package)
class PackageAdmin(admin.ModelAdmin):
    list_display = ("tracking_code", "client_name", "destination_address", "weight_kg")
    search_fields = ("tracking_code", "client_name", "destination_address")


@admin.register(Delivery)
class DeliveryAdmin(admin.ModelAdmin):
    list_display = ("package", "status", "driver", "vehicle", "created_at")
    list_filter = ("status",)
    search_fields = ("package__tracking_code", "package__client_name")
    autocomplete_fields = ("driver", "vehicle")
