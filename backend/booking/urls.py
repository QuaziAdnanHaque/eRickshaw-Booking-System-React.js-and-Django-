from django.urls import path

from .views import RideListCreateView, AcceptedRideView, CompleteRideView, CancelRideView

urlpatterns = [
    path("",RideListCreateView.as_view(), name="ride-list-create"),
    path("<int:pk>/accept/", AcceptedRideView.as_view(), name="accept-ride"), 
    path("<int:pk>/complete/", CompleteRideView.as_view(), name="complete-ride"),
    path("<int:pk>/cancel/", CancelRideView.as_view(), name="cancel-ride"),
]
