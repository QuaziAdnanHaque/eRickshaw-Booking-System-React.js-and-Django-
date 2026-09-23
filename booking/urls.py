from django.urls import path
from .views import (RideListCreateView, CalculateRouteView,AcceptedRideView, CompleteRideView, CancelRideView)

urlpatterns = [
    path("", RideListCreateView.as_view(), name="ride-list-create"),
    path("calculate-route/", CalculateRouteView.as_view(), name="calculate-route"),
    path("<int:pk>/accept/", AcceptedRideView.as_view(), name="accept-ride"), 
    path("<int:pk>/complete/", CompleteRideView.as_view(), name="complete-ride"),
    path("<int:pk>/cancel/", CancelRideView.as_view(), name="cancel-ride"),
]
