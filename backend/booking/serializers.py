from rest_framework import serializers
from .models import Ride

class RideSerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(source="customer.name", read_only=True)
    driver_name = serializers.CharField(source="driver.name", read_only=True)

    class Meta:
        model = Ride
        fields = [
            "id",
            "customer",
            "customer_name",
            "driver",
            "driver_name",
            "pickup",
            "drop",
            "distance",
            "fare",
            "route_geometry",
            "status",
            "created_at",
        ]
        read_only_fields = [
            "id",
            "customer",
            "customer_name",
            "driver",
            "driver_name",
            "distance",
            "fare",
            "route_geometry",
            "status",
            "created_at",
        ]