import math
import requests
from django.conf import settings

GEOCODING_URL = "https://api.heigit.org/pelias/v1/search"
DIRECTIONS_URL = (
    "https://api.heigit.org/openrouteservice/v2/"
    "directions/driving-car/geojson"
)

def haversine_distance(coord1, coord2):
    """Calculate approximate road distance in km using Haversine formula with a 1.25x road winding factor."""
    lng1, lat1 = coord1
    lng2, lat2 = coord2
    r = 6371  # Earth radius in km
    dlat = math.radians(lat2 - lat1)
    dlng = math.radians(lng2 - lng1)
    a = (
        math.sin(dlat / 2) ** 2
        + math.cos(math.radians(lat1))
        * math.cos(math.radians(lat2))
        * math.sin(dlng / 2) ** 2
    )
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return max(0.5, round(r * c * 1.25, 2))

def geocode_location(location):
    headers = {
        "Authorization": settings.ORS_API_KEY
    }
    params = {
        "text": location,
        "size": 1
    }
    response = requests.get(
        GEOCODING_URL,
        params=params,
        headers=headers,
        timeout=10
    )
    response.raise_for_status()
    data = response.json()
    features = data.get("features", [])
    if not features:
        raise ValueError(
            f"Could not find location: {location}"
        )
    coordinates = features[0].get("geometry", {}).get("coordinates")
    if not coordinates or len(coordinates) < 2:
        raise ValueError(
            f"Could not get coordinates for: {location}"
        )
    return coordinates

def get_route(pickup, drop, pickup_coords=None, drop_coords=None):
    if not settings.ORS_API_KEY:
        raise ValueError(
            "ORS_API_KEY is not configured"
        )

    # Use coordinates directly if provided by the interactive map; otherwise geocode the text
    if pickup_coords and len(pickup_coords) == 2:
        pickup_coordinates = pickup_coords
    else:
        pickup_coordinates = geocode_location(pickup)

    if drop_coords and len(drop_coords) == 2:
        drop_coordinates = drop_coords
    else:
        drop_coordinates = geocode_location(drop)

    headers = {
        "Authorization": settings.ORS_API_KEY,
        "Content-Type": "application/json"
    }
    body = {
        "coordinates": [
            pickup_coordinates,
            drop_coordinates
        ]
    }
    try:
        response = requests.post(
            DIRECTIONS_URL,
            json=body,
            headers=headers,
            timeout=15
        )
        response.raise_for_status()
        data = response.json()
        features = data.get("features", [])
        if not features:
            raise ValueError("No features returned from ORS")
            
        feature = features[0]
        summary = feature.get("properties", {}).get("summary", {})
        distance_meters = summary.get("distance")
        if distance_meters is None:
            raise ValueError("Distance is missing in summary")
        distance_km = distance_meters / 1000
        route_geometry = feature.get("geometry")
        if not route_geometry:
            raise ValueError("Missing geometry")
            
        return {
            "distance": round(distance_km, 2),
            "route": route_geometry
        }
    except Exception as err:
        print("ORS Driving Directions Warning (using fallback geometry):", err)
        fallback_distance = haversine_distance(pickup_coordinates, drop_coordinates)
        return {
            "distance": fallback_distance,
            "route": {
                "type": "LineString",
                "coordinates": [
                    pickup_coordinates,
                    drop_coordinates
                ]
            }
        }