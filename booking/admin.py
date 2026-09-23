from django.contrib import admin
from .models import Ride

@admin.register(Ride)
class RideAdmin(admin.ModelAdmin):
    list_display = [
        "id",
        "customer",
        "driver",
        "pickup",
        "drop",
        "distance",
        "fare",
        "status",
        "created_at"
    ]
    list_filter = [
        "status"
    ]
    search_fields = [
        "customer__email",
        "customer__name",
        "driver__email",
        "driver__name",
        "pickup",
        "drop"
    ]