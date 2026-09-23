import { useEffect, useState } from "react";
import type { Dispatch, SetStateAction, SyntheticEvent } from "react";
import {MapContainer, Marker, TileLayer, useMap, useMapEvents, Polyline} from "react-leaflet";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "../styles/CustomerDashboard.css";

interface RouteGeometry {
    type: string;
    coordinates: [number, number][];
}

interface Ride {
    id: number;
    customer: number;
    customer_name: string;
    driver: number | null;
    driver_name: string | null;
    pickup: string;
    drop: string;
    distance: number;
    fare: string;
    route_geometry?: RouteGeometry;
    status: string;
    created_at: string;
}

interface Location {
    lat: number;
    lng: number;
    address: string;
}

delete (L.Icon.Default.prototype as any)._getIconUrl;

L.Icon.Default.mergeOptions({
    iconRetinaUrl:
        "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    iconUrl:
        "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    shadowUrl:
        "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png"
});

const pickupIcon = L.icon({
    iconUrl:
        "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png",
    shadowUrl:
        "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

const dropIcon = L.icon({
    iconUrl:
        "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
    shadowUrl:
        "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

interface MapClickHandlerProps {
    pickup: Location | null;
    drop: Location | null;
    setPickup: Dispatch<SetStateAction<Location | null>>;
    setDrop: Dispatch<SetStateAction<Location | null>>;
    setError: Dispatch<SetStateAction<string>>;
}

const MapClickHandler = ({ pickup, drop, setPickup, setDrop, setError }: MapClickHandlerProps) => {
    useMapEvents({
        click: async (event) => {
            const { lat, lng } = event.latlng;
            setError("");

            try {
                const response = await axios.get("https://nominatim.openstreetmap.org/reverse", {
                    params: {
                        lat,
                        lon: lng,
                        format: "json",
                        zoom: 18,
                        addressdetails: 1
                    },
                    headers: { "Accept-Language": "en" }
                });

                const address = response.data.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
                const location: Location = { lat, lng, address };

                if (!pickup) {
                    setPickup(location);
                } else if (!drop) {
                    setDrop(location);
                } else {
                    setPickup(location);
                    setDrop(null);
                }
            } catch (err) {
                console.warn("Reverse geocode failed, using coordinates fallback:", err);
                const location: Location = {
                    lat,
                    lng,
                    address: `Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`
                };

                if (!pickup) {
                    setPickup(location);
                } else if (!drop) {
                    setDrop(location);
                } else {
                    setPickup(location);
                    setDrop(null);
                }
            }
        }
    });

    return null;
};

const MapResizeHandler = () => {
    const map = useMap();
    useEffect(() => {
        const timer = setTimeout(() => {
            map.invalidateSize();
        }, 150);
        return () => clearTimeout(timer);
    }, [map]);
    return null;
};

const AutoFitBounds = ({ positions }: { positions: [number, number][] }) => {
    const map = useMap();
    useEffect(() => {
        if (positions && positions.length > 0) {
            map.fitBounds(positions, { padding: [50, 50], maxZoom: 15 });
        }
    }, [positions, map]);
    return null;
};

const CustomerDashboard = () => {
    const navigate = useNavigate();

    const [pickup, setPickup] = useState<Location | null>(null);
    const [drop, setDrop] = useState<Location | null>(null);
    const [rides, setRides] = useState<Ride[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [expandedRideId, setExpandedRideId] = useState<number | null>(null);

    const [previewRoute, setPreviewRoute] = useState<[number, number][]>([]);
    const [previewDetails, setPreviewDetails] = useState<{ distance: number; fare: number } | null>(null);
    const [previewLoading, setPreviewLoading] = useState(false);

    const mapCenter: [number, number] = [22.725086, 88.507271];

    const storedUser = localStorage.getItem("user");
    const user = storedUser ? JSON.parse(storedUser) : null;
    const userName = user?.name || "Customer";

    const getToken = () => localStorage.getItem("access_token");

    useEffect(() => {
        if (!pickup || !drop) {
            setPreviewRoute([]);
            setPreviewDetails(null);
            return;
        }

        const controller = new AbortController();
        const calculateRoute = async () => {
            setPreviewLoading(true);
            try {
                const token = getToken();
                const res = await axios.post(
                    "http://127.0.0.1:3000/api/rides/calculate-route/",
                    {
                        pickup: pickup.address,
                        drop: drop.address,
                        pickup_lat: pickup.lat,
                        pickup_lng: pickup.lng,
                        drop_lat: drop.lat,
                        drop_lng: drop.lng
                    },
                    {
                        headers: {
                            Authorization: token ? `Bearer ${token}` : "",
                            "Content-Type": "application/json"
                        },
                        signal: controller.signal
                    }
                );

                if (res.data?.route_geometry?.coordinates) {
                    const coords: [number, number][] = res.data.route_geometry.coordinates.map(
                        ([lng, lat]: [number, number]) => [lat, lng]
                    );
                    setPreviewRoute(coords);
                    setPreviewDetails({
                        distance: res.data.distance,
                        fare: res.data.fare
                    });
                }
            } catch (err: any) {
                if (axios.isCancel(err) || err.name === "CanceledError") return;
                console.warn("Backend route calculation error:", err.response?.data || err.message);
                setPreviewRoute([]);
                setPreviewDetails(null);
            } finally {
                if (!controller.signal.aborted) {
                    setPreviewLoading(false);
                }
            }
        };

        calculateRoute();

        return () => {
            controller.abort();
        };
    }, [pickup, drop]);

    const loadRides = async (silent = false) => {
        try {
            if (!silent) setError("");
            const token = getToken();

            if (!token) {
                navigate("/login");
                return;
            }

            const response = await axios.get("http://127.0.0.1:3000/api/rides/", {
                headers: { Authorization: `Bearer ${token}` }
            });

            setRides(response.data);
        } catch (err: any) {
            console.error("Load rides error:", err.response?.data);
            if (err.response?.status === 401) {
                logout();
            } else if (!silent) {
                setError("Could not load rides. Please check connection.");
            }
        }
    };

    useEffect(() => {
        loadRides(false);
        const interval = setInterval(() => {
            loadRides(true);
        }, 3500);
        return () => clearInterval(interval);
    }, []);

    const createRide = async (e: SyntheticEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError("");

        if (!pickup) {
            setError("Please click on the map to set your Pickup location.");
            return;
        }
        if (!drop) {
            setError("Please click on the map to set your Destination.");
            return;
        }

        setLoading(true);

        try {
            const token = getToken();
            if (!token) {
                navigate("/login");
                return;
            }

            const rideData = {
                pickup: pickup.address,
                drop: drop.address,
                pickup_lat: pickup.lat,
                pickup_lng: pickup.lng,
                drop_lat: drop.lat,
                drop_lng: drop.lng
            };

            await axios.post("http://127.0.0.1:3000/api/rides/", rideData, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json"
                }
            });

            setPickup(null);
            setDrop(null);
            setPreviewRoute([]);
            setPreviewDetails(null);
            await loadRides();
        } catch (err: any) {
            console.error("Create ride error:", err.response?.data);
            setError(err.response?.data?.error || "Could not book ride. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const cancelRide = async (id: number) => {
        try {
            setError("");
            const token = getToken();
            if (!token) {
                navigate("/login");
                return;
            }

            await axios.post(
                `http://127.0.0.1:3000/api/rides/${id}/cancel/`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );

            await loadRides();
        } catch (err: any) {
            console.error("Cancel ride error:", err.response?.data);
            setError(err.response?.data?.error || "Could not cancel this ride.");
        }
    };

    const logout = () => {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        localStorage.removeItem("user");
        localStorage.removeItem("user_id");
        navigate("/login");
    };

    const getRoutePositions = (ride: Ride): [number, number][] => {
        if (!ride.route_geometry?.coordinates?.length) return [];
        return ride.route_geometry.coordinates.map(([lng, lat]) => [lat, lng]);
    };

    return (
        <div className="dashboard-container">

            <nav className="dashboard-nav">
                <div className="nav-brand">
                    <span className="brand-icon">⚡</span>
                    <h2>E-Rickshaw</h2>
                    <span className="role-tag">Customer</span>
                </div>
                <div className="nav-actions">
                    <span className="user-welcome">Hi, <strong>{userName}</strong></span>
                    <button className="logout-btn" onClick={logout}>Logout</button>
                </div>
            </nav>

            <main className="dashboard-content">

                {error && <div className="dash-alert error">{error}</div>}

                <section className="booking-card-main">
                    <div className="booking-header">
                        <div>
                            <h1>Book an E-Rickshaw</h1>
                            <p className="subtitle">Select your pickup and drop locations on the interactive map</p>
                        </div>

                        <div className="booking-steps">
                            <span className={`step-badge ${pickup ? "completed" : "active"}`}>
                                1. Pickup {pickup ? "✓" : ""}
                            </span>
                            <span className="step-arrow">→</span>
                            <span className={`step-badge ${drop ? "completed" : pickup ? "active" : ""}`}>
                                2. Destination {drop ? "✓" : ""}
                            </span>
                            <span className="step-arrow">→</span>
                            <span className={`step-badge ${pickup && drop ? "active" : ""}`}>
                                3. Confirm
                            </span>
                        </div>
                    </div>

                    <div className="locations-preview">
                        <div className="location-chips-container">
                            <div className={`location-chip ${pickup ? "filled" : ""}`}>
                                <span className="dot dot-pickup"></span>
                                <div className="chip-content">
                                    <label>Pickup Location</label>
                                    <p title={pickup ? pickup.address : ""}>
                                        {pickup ? pickup.address : "Click map to set pickup point"}
                                    </p>
                                </div>
                            </div>

                            <div className={`location-chip ${drop ? "filled" : ""}`}>
                                <span className="dot dot-drop"></span>
                                <div className="chip-content">
                                    <label>Destination</label>
                                    <p title={drop ? drop.address : ""}>
                                        {drop ? drop.address : "Click map to set destination point"}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {(pickup || drop) && (
                            <button
                                type="button"
                                className="reset-pins-btn"
                                onClick={() => {
                                    setPickup(null);
                                    setDrop(null);
                                    setPreviewRoute([]);
                                    setPreviewDetails(null);
                                }}
                            >
                                ✕ Clear Selection
                            </button>
                        )}
                    </div>

                    <div className="map-frame">
                        <MapContainer
                            center={mapCenter}
                            zoom={13}
                            scrollWheelZoom={true}
                            className="leaflet-map"
                        >
                            <MapResizeHandler />
                            <TileLayer
                                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                                url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
                            />
                            <MapClickHandler
                                pickup={pickup}
                                drop={drop}
                                setPickup={setPickup}
                                setDrop={setDrop}
                                setError={setError}
                            />
                            {pickup && (
                                <Marker position={[pickup.lat, pickup.lng]} icon={pickupIcon} />
                            )}
                            {drop && (
                                <Marker position={[drop.lat, drop.lng]} icon={dropIcon} />
                            )}
                            {previewRoute.length > 0 && (
                                <>
                                    <Polyline
                                        positions={previewRoute}
                                        color="#00FF9D"
                                        weight={5}
                                        opacity={0.85}
                                    />
                                    <AutoFitBounds positions={previewRoute} />
                                </>
                            )}
                        </MapContainer>
                    </div>

                    {previewLoading && (
                        <div className="route-estimate-banner">
                            <span>🔄 Calculating road path & fare estimate...</span>
                        </div>
                    )}

                    {previewDetails && !previewLoading && (
                        <div className="route-estimate-banner">
                            <div className="estimate-item">
                                <span className="estimate-label">Calculated Distance</span>
                                <span className="estimate-value">{previewDetails.distance} km</span>
                            </div>
                            <div className="estimate-item">
                                <span className="estimate-label">Estimated Fare</span>
                                <span className="estimate-value highlight">₹{previewDetails.fare}</span>
                            </div>
                        </div>
                    )}

                    <form className="booking-actions" onSubmit={createRide}>
                        <p className="instruction-hint">
                            {!pickup
                                ? "👉 Step 1: Click anywhere on the map above to select your pickup location."
                                : !drop
                                ? "👉 Step 2: Click on the map to set your destination."
                                : "✅ Locations ready! Click below to calculate route and request your ride."}
                        </p>

                        <button
                            type="submit"
                            className="btn-book"
                            disabled={loading || !pickup || !drop}
                        >
                            {loading ? "Calculating Route & Fare..." : "⚡ Confirm & Book Ride"}
                        </button>
                    </form>
                </section>

                <section className="rides-history-section">
                    <div className="section-header">
                        <h2>My Rides History</h2>
                        <span className="rides-count">{rides.length} Total Bookings</span>
                    </div>

                    {rides.length === 0 ? (
                        <div className="empty-state">
                            <p>No rides booked yet. Choose points on the map above to take your first ride!</p>
                        </div>
                    ) : (
                        <div className="rides-grid">
                            {rides.map((ride) => {
                                const routePositions = getRoutePositions(ride);
                                const isExpanded = expandedRideId === ride.id;

                                return (
                                    <div className="ride-card" key={ride.id}>
                                        <div className="ride-card-top">
                                            <div className="ride-id-box">
                                                <span className="ride-num">Ride #{ride.id}</span>
                                                <span className={`status-pill status-${ride.status.toLowerCase()}`}>
                                                    {ride.status}
                                                </span>
                                            </div>
                                            <div className="ride-fare-box">
                                                <span className="fare-label">Fare</span>
                                                <span className="fare-amount">₹{ride.fare}</span>
                                            </div>
                                        </div>

                                        <div className="ride-details">
                                            <div className="detail-row">
                                                <span className="dot dot-pickup"></span>
                                                <div>
                                                    <small>From</small>
                                                    <p>{ride.pickup}</p>
                                                </div>
                                            </div>
                                            <div className="detail-row">
                                                <span className="dot dot-drop"></span>
                                                <div>
                                                    <small>To</small>
                                                    <p>{ride.drop}</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="ride-meta-bar">
                                            <span><strong>Distance:</strong> {ride.distance} km</span>
                                            <span><strong>Driver:</strong> {ride.driver_name || "Unassigned"}</span>
                                        </div>

                                        {routePositions.length > 0 && (
                                            <button
                                                type="button"
                                                className="btn-toggle-route"
                                                onClick={() => setExpandedRideId(isExpanded ? null : ride.id)}
                                            >
                                                {isExpanded ? "Hide Route Map ▲" : "View Route on Map ▼"}
                                            </button>
                                        )}

                                        {isExpanded && routePositions.length > 0 && (
                                            <div className="ride-mini-map-wrap">
                                                <MapContainer
                                                    bounds={routePositions}
                                                    scrollWheelZoom={false}
                                                    className="mini-map"
                                                >
                                                    <MapResizeHandler />
                                                    <TileLayer
                                                        attribution='&copy; OpenStreetMap'
                                                        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
                                                    />
                                                    <Polyline positions={routePositions} color="#02F5A1" weight={4} />
                                                    <Marker position={routePositions[0]} icon={pickupIcon} />
                                                    <Marker position={routePositions[routePositions.length - 1]} icon={dropIcon} />
                                                </MapContainer>
                                            </div>
                                        )}

                                        {ride.status === "requested" && (
                                            <div className="ride-card-actions">
                                                <button
                                                    type="button"
                                                    className="btn-cancel"
                                                    onClick={() => cancelRide(ride.id)}
                                                >
                                                    Cancel Ride
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </section>
            </main>
        </div>
    );
};

export default CustomerDashboard;
