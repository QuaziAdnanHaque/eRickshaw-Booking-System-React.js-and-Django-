from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from django.shortcuts import get_object_or_404
from django.db.models import Q

from .models import Ride
from .serializers import RideSerializer
from .ors import get_route

BASE_FARE = 50
FARE_PER_KM = 10

class RideListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        if user.role == "customer":
            rides = Ride.objects.filter(
                customer=user
            ).order_by("-created_at")        
        elif user.role == "driver":
            # Drivers see all open requests PLUS rides assigned to them
            rides = Ride.objects.filter(
                Q(status="requested") | Q(driver=user)
            ).order_by("-created_at")
        else:
            rides = Ride.objects.none()
        serializer = RideSerializer(
            rides,
            many=True
        )
        return Response(serializer.data)

    def post(self, request):
        if request.user.role != "customer":
            return Response(
                {
                    "error": "Only customers can book rides."
                },
                status=status.HTTP_403_FORBIDDEN
            )
        pickup = request.data.get("pickup")
        drop = request.data.get("drop")
        pickup_lat = request.data.get("pickup_lat")
        pickup_lng = request.data.get("pickup_lng")
        drop_lat = request.data.get("drop_lat")
        drop_lng = request.data.get("drop_lng")

        if not pickup or not drop:
            return Response(
                {
                    "error": "Pickup and drop are required."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        pickup_coords = None
        drop_coords = None
        if pickup_lat is not None and pickup_lng is not None:
            try:
                pickup_coords = [float(pickup_lng), float(pickup_lat)]
            except (ValueError, TypeError):
                pass

        if drop_lat is not None and drop_lng is not None:
            try:
                drop_coords = [float(drop_lng), float(drop_lat)]
            except (ValueError, TypeError):
                pass

        try:
            route_data = get_route(
                pickup,
                drop,
                pickup_coords=pickup_coords,
                drop_coords=drop_coords
            )
        except ValueError as error:
            return Response(
                {
                    "error": str(error)
                },
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as error:
            print("ORS ERROR:", error)
            return Response(
                {
                    "error": "Could not calculate route. Please check the locations and try again."
                },
                status=status.HTTP_502_BAD_GATEWAY
            )
        distance = route_data["distance"]
        route_geometry = route_data["route"]    
        fare = BASE_FARE + (
            distance * FARE_PER_KM
        )
          
        ride = Ride.objects.create(
            customer=request.user,
            pickup=pickup,
            drop=drop,
            distance=round(distance, 2),
            fare=round(fare, 2),
            route_geometry=route_geometry,
            status="requested"
        )
        serializer = RideSerializer(ride)
        return Response(
            serializer.data,
            status=status.HTTP_201_CREATED
        )

class AcceptedRideView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):      
        if request.user.role != "driver":
            return Response(
                {
                    "error": "Only drivers can accept rides."
                },
                status=status.HTTP_403_FORBIDDEN
            )
        ride = get_object_or_404(
            Ride,
            pk=pk
        )       
        if ride.status != "requested":
            return Response(
                {
                    "error": "This ride is no longer available."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # Enforce: One driver can accept only one ride at a time
        active_ride = Ride.objects.filter(
            driver=request.user,
            status="accepted"
        ).first()
        if active_ride:
            return Response(
                {
                    "error": f"You already have an active ride in progress (Ride #{active_ride.id}). Please complete it before accepting another ride."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        ride.driver = request.user       
        ride.status = "accepted"      
        ride.save(
            update_fields=[
                "driver",
                "status"
            ]
        )
        serializer = RideSerializer(ride)
        return Response(
            serializer.data,
            status=status.HTTP_200_OK
        )

class CompleteRideView(APIView):
    permission_classes = [IsAuthenticated]
    def post(self, request, pk):
        
        if request.user.role != "driver":
            return Response(
                {
                    "error": "Only drivers can complete rides."
                },
                status=status.HTTP_403_FORBIDDEN
            )
        ride = get_object_or_404(
            Ride,
            pk=pk
        )        
        if ride.driver != request.user:
            return Response(
                {
                    "error": "You are not assigned to this ride."
                },
                status=status.HTTP_403_FORBIDDEN
            )        
        if ride.status != "accepted":
            return Response(
                {
                    "error": "Only accepted rides can be completed."
                },
                status=status.HTTP_400_BAD_REQUEST
            )     
        ride.status = "completed"
        ride.save(
            update_fields=[
                "status"
            ]
        )
        serializer = RideSerializer(ride)
        return Response(
            serializer.data,
            status=status.HTTP_200_OK
        )

class CancelRideView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        ride = get_object_or_404(
            Ride,
            pk=pk
        )      
        if ride.customer != request.user:
            return Response(
                {
                    "error": "You cannot cancel this ride."
                },
                status=status.HTTP_403_FORBIDDEN
            )    
        if ride.status != "requested":
            return Response(
                {
                    "error": "Only requested rides can be cancelled."
                },
                status=status.HTTP_400_BAD_REQUEST
            )
        ride.status = "cancelled"
        ride.save(
            update_fields=[
                "status"
            ]
        )
        serializer = RideSerializer(ride)
        return Response(
            serializer.data,
            status=status.HTTP_200_OK
        )