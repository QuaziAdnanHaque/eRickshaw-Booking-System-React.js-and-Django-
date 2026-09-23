from django.db import models
from django.conf import settings

class Ride(models.Model):
    customer = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name="customer_rides")
    driver = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name="driver_rides")
    pickup = models.CharField(max_length=255)
    drop = models.CharField(max_length=255)
    distance = models.FloatField()
    fare = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    status_choice = (
        ("requested", "Requested"),
        ("accepted", "Accepted"),
        ("completed", "Completed"),
        ("cancelled", "Cancelled"),
    )
    route_geometry = models.JSONField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=status_choice, default="requested")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Ride #{self.id} - {self.pickup} > {self.drop}"