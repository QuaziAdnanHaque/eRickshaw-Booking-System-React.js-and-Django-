import math
import requests
from django.conf import settings

GEOCODING_URL = "https://api.heigit.org/pelias/v1/search"
DIRECTIONS_URL = (
    "https://api.heigit.org/openrouteservice/v2/"
    "directions/driving-car/geojson"
)

def haversine_distance(coord1, coord2):
    lng1, lat1 = coord1
    lng2, lat2 = coord2
    r = 6371
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
        raise ValueError(f"Could not find location: {location}")
    coordinates = features[0].get("geometry", {}).get("coordinates")
    if not coordinates or len(coordinates) < 2:
        raise ValueError(f"Could not get coordinates for: {location}")
    return coordinates

def get_osrm_route(coord1, coord2):
    lng1, lat1 = coord1
    lng2, lat2 = coord2
    url = f"https://router.project-osrm.org/route/v1/driving/{lng1},{lat1};{lng2},{lat2}?overview=full&geometries=geojson"
    resp = requests.get(url, timeout=10)
    resp.raise_for_status()
    data = resp.json()
    routes = data.get("routes", [])
    if not routes:
        raise ValueError("No route found from OSRM")
    route = routes[0]
    distance_meters = route.get("distance", 0)
    geometry = route.get("geometry")
    if not geometry:
        raise ValueError("Missing geometry in OSRM response")
    return {
        "distance": round(distance_meters / 1000, 2),
        "route": geometry
    }

def get_route(pickup, drop, pickup_coords=None, drop_coords=None):
    if pickup_coords and len(pickup_coords) == 2:
        pickup_coordinates = pickup_coords
    else:
        pickup_coordinates = geocode_location(pickup)

    if drop_coords and len(drop_coords) == 2:
        drop_coordinates = drop_coords
    else:
        drop_coordinates = geocode_location(drop)

    # 1. Try OpenRouteService if API key is configured
    if getattr(settings, "ORS_API_KEY", None):
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
                timeout=12
            )
            response.raise_for_status()
            data = response.json()
            features = data.get("features", [])
            if features:
                feature = features[0]
                summary = feature.get("properties", {}).get("summary", {})
                distance_meters = summary.get("distance")
                route_geometry = feature.get("geometry")
                if distance_meters is not None and route_geometry:
                    return {
                        "distance": round(distance_meters / 1000, 2),
                        "route": route_geometry
                    }
        except Exception as err:
            print("ORS Driving Directions Warning (trying OSRM fallback):", err)

    # 2. Fallback to OSRM
    try:
        return get_osrm_route(pickup_coordinates, drop_coordinates)
    except Exception as osrm_err:
        print("OSRM Driving Directions Warning (using haversine fallback):", osrm_err)

    # 3. Final fallback to Haversine straight line
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