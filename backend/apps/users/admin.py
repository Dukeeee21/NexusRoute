from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.utils.translation import gettext_lazy as _

from .models import User


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ("username", "email", "role", "is_active", "is_staff")
    list_filter = ("role", "is_active", "is_staff")
    search_fields = ("username", "email", "first_name", "last_name")
    fieldsets = BaseUserAdmin.fieldsets + ((_("NexusRoute"), {"fields": ("role", "phone")}),)
    add_fieldsets = BaseUserAdmin.add_fieldsets + (
        (_("NexusRoute"), {"fields": ("role", "phone")}),
    )
