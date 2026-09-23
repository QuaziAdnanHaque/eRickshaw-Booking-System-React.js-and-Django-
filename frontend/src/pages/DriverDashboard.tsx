import { useEffect, useState } from "react";
import {
    MapContainer,
    TileLayer,
    Polyline,
    Marker
} from "react-leaflet";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "../styles/DriverDashboard.css";

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

const DriverDashboard = () => {
    const navigate = useNavigate();

    const [rides, setRides] = useState<Ride[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<number | null>(null);
    const [error, setError] = useState("");
    const [expandedRideId, setExpandedRideId] = useState<number | null>(null);

    const storedUser = localStorage.getItem("user");
    const user = storedUser ? JSON.parse(storedUser) : null;
    const driverName = user?.name || "Driver";
    const driverId = Number(user?.id || localStorage.getItem("user_id") || 0);

    const getToken = () => localStorage.getItem("access_token");

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
                setError("Could not load rides. Please check your connection.");
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadRides(false);
        const interval = setInterval(() => {
            loadRides(true);
        }, 3500);
        return () => clearInterval(interval);
    }, []);

    const acceptRide = async (id: number) => {
        try {
            setError("");
            setActionLoading(id);
            const token = getToken();

            if (!token) {
                navigate("/login");
                return;
            }

            await axios.post(
                `http://127.0.0.1:3000/api/rides/${id}/accept/`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );

            await loadRides();
        } catch (err: any) {
            console.error("Accept ride error:", err.response?.data);
            setError(err.response?.data?.error || "Could not accept this ride.");
        } finally {
            setActionLoading(null);
        }
    };

    const completeRide = async (id: number) => {
        try {
            setError("");
            setActionLoading(id);
            const token = getToken();

            if (!token) {
                navigate("/login");
                return;
            }

            await axios.post(
                `http://127.0.0.1:3000/api/rides/${id}/complete/`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );

            await loadRides();
        } catch (err: any) {
            console.error("Complete ride error:", err.response?.data);
            setError(err.response?.data?.error || "Could not complete this ride.");
        } finally {
            setActionLoading(null);
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

    const activeTrips = rides.filter(
        (r) => r.status === "accepted" && Number(r.driver) === driverId
    );
    const availableRequests = rides.filter((r) => r.status === "requested");

    if (loading) {
        return (
            <div className="dashboard-container">
                <nav className="dashboard-nav">
                    <div className="nav-brand">
                        <span className="brand-icon">⚡</span>
                        <h2>E-Rickshaw</h2>
                        <span className="role-tag">Driver</span>
                    </div>
                    <button className="logout-btn" onClick={logout}>Logout</button>
                </nav>
                <div className="loading-state">
                    <div className="spinner"></div>
                    <p>Connecting to live ride stream...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="dashboard-container">

            <nav className="dashboard-nav">
                <div className="nav-brand">
                    <span className="brand-icon">⚡</span>
                    <h2>E-Rickshaw</h2>
                    <span className="role-tag">Driver Portal</span>
                </div>
                <div className="nav-actions">
                    <span className="user-welcome">Driver: <strong>{driverName}</strong></span>
                    <button className="logout-btn" onClick={logout}>Logout</button>
                </div>
            </nav>

            <main className="dashboard-content">

                {error && <div className="dash-alert error">{error}</div>}

                <section className="driver-overview">
                    <div className="overview-text">
                        <h1>Driver Dashboard</h1>
                        <p className="subtitle">Real-time live ride requests and trip management</p>
                    </div>

                    <div className="overview-right">
                        <div className="stat-badge">
                            <span className="stat-val">{availableRequests.length}</span>
                            <span className="stat-lbl">New Requests</span>
                        </div>
                        {activeTrips.length > 0 && (
                            <div className="stat-badge active-stat">
                                <span className="stat-val">{activeTrips.length}</span>
                                <span className="stat-lbl">Active Trip</span>
                            </div>
                        )}
                        <button
                            type="button"
                            onClick={() => loadRides(false)}
                            className="btn-refresh"
                        >
                            🔄 Refresh Feed
                        </button>
                    </div>
                </section>

                {activeTrips.length > 0 && (
                    <section className="driver-rides-section active-trips-section">
                        <div className="section-header">
                            <h2>🚗 Active Trip In Progress</h2>
                            <span className="active-badge">Accepted by You</span>
                        </div>

                        <div className="rides-grid">
                            {activeTrips.map((ride) => {
                                const routePositions = getRoutePositions(ride);
                                const isExpanded = expandedRideId === ride.id;

                                return (
                                    <div className="ride-card card-highlight" key={ride.id}>
                                        <div className="ride-card-top">
                                            <div className="ride-id-box">
                                                <span className="ride-num">Ride #{ride.id}</span>
                                                <span className="status-pill status-accepted">
                                                    Trip Active
                                                </span>
                                            </div>
                                            <div className="ride-fare-box">
                                                <span className="fare-label">Your Earning</span>
                                                <span className="fare-amount">₹{ride.fare}</span>
                                            </div>
                                        </div>

                                        <div className="ride-details">
                                            <div className="detail-row">
                                                <span className="dot dot-pickup"></span>
                                                <div>
                                                    <small>Pickup Point</small>
                                                    <p>{ride.pickup}</p>
                                                </div>
                                            </div>
                                            <div className="detail-row">
                                                <span className="dot dot-drop"></span>
                                                <div>
                                                    <small>Drop Destination</small>
                                                    <p>{ride.drop}</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="ride-meta-bar">
                                            <span><strong>Passenger:</strong> {ride.customer_name}</span>
                                            <span><strong>Distance:</strong> {ride.distance} km</span>
                                        </div>

                                        {routePositions.length > 0 && (
                                            <button
                                                type="button"
                                                className="btn-toggle-route"
                                                onClick={() => setExpandedRideId(isExpanded ? null : ride.id)}
                                            >
                                                {isExpanded ? "Hide Map Route ▲" : "Preview Route Map ▼"}
                                            </button>
                                        )}

                                        {isExpanded && routePositions.length > 0 && (
                                            <div className="ride-mini-map-wrap">
                                                <MapContainer
                                                    bounds={routePositions}
                                                    scrollWheelZoom={false}
                                                    className="mini-map"
                                                >
                                                    <TileLayer
                                                        attribution='&copy; OpenStreetMap'
                                                        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
                                                    />
                                                    <Polyline positions={routePositions} color="#00FF9D" weight={5} />
                                                    <Marker position={routePositions[0]} icon={pickupIcon} />
                                                    <Marker position={routePositions[routePositions.length - 1]} icon={dropIcon} />
                                                </MapContainer>
                                            </div>
                                        )}

                                        <div className="driver-actions">
                                            <div className="action-row">
                                                <button
                                                    type="button"
                                                    className="btn-complete"
                                                    onClick={() => completeRide(ride.id)}
                                                    disabled={actionLoading === ride.id}
                                                >
                                                    {actionLoading === ride.id ? "Completing..." : "✓ Complete Ride (Passenger Dropped)"}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </section>
                )}

                <section className="driver-rides-section">
                    <div className="section-header">
                        <h2>Available Ride Requests</h2>
                        
                    </div>

                    {activeTrips.length > 0 && (
                        <div className="driver-limit-banner">
                            ℹ️ <strong>One Ride Policy:</strong> You have an active trip in progress above. Please complete it before accepting another ride.
                        </div>
                    )}

                    {availableRequests.length === 0 ? (
                        <div className="empty-state">
                            <p>No new ride requests right now. The feed automatically updates when a customer books a ride!</p>
                        </div>
                    ) : (
                        <div className="rides-grid">
                            {availableRequests.map((ride) => {
                                const routePositions = getRoutePositions(ride);
                                const isExpanded = expandedRideId === ride.id;

                                return (
                                    <div className="ride-card" key={ride.id}>
                                        <div className="ride-card-top">
                                            <div className="ride-id-box">
                                                <span className="ride-num">Ride #{ride.id}</span>
                                                <span className="status-pill status-requested">
                                                    Requested
                                                </span>
                                            </div>
                                            <div className="ride-fare-box">
                                                <span className="fare-label">Estimated Fare</span>
                                                <span className="fare-amount">₹{ride.fare}</span>
                                            </div>
                                        </div>

                                        <div className="ride-details">
                                            <div className="detail-row">
                                                <span className="dot dot-pickup"></span>
                                                <div>
                                                    <small>Pickup Point</small>
                                                    <p>{ride.pickup}</p>
                                                </div>
                                            </div>
                                            <div className="detail-row">
                                                <span className="dot dot-drop"></span>
                                                <div>
                                                    <small>Drop Destination</small>
                                                    <p>{ride.drop}</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="ride-meta-bar">
                                            <span><strong>Customer:</strong> {ride.customer_name}</span>
                                            <span><strong>Distance:</strong> {ride.distance} km</span>
                                        </div>

                                        {routePositions.length > 0 && (
                                            <button
                                                type="button"
                                                className="btn-toggle-route"
                                                onClick={() => setExpandedRideId(isExpanded ? null : ride.id)}
                                            >
                                                {isExpanded ? "Hide Map Route ▲" : "Preview Route Map ▼"}
                                            </button>
                                        )}

                                        {isExpanded && routePositions.length > 0 && (
                                            <div className="ride-mini-map-wrap">
                                                <MapContainer
                                                    bounds={routePositions}
                                                    scrollWheelZoom={false}
                                                    className="mini-map"
                                                >
                                                    <TileLayer
                                                        attribution='&copy; OpenStreetMap'
                                                        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
                                                    />
                                                    <Polyline positions={routePositions} color="#00FF9D" weight={4} />
                                                    <Marker position={routePositions[0]} icon={pickupIcon} />
                                                    <Marker position={routePositions[routePositions.length - 1]} icon={dropIcon} />
                                                </MapContainer>
                                            </div>
                                        )}

                                        <div className="driver-actions">
                                            {activeTrips.length > 0 ? (
                                                <button
                                                    type="button"
                                                    className="btn-accept btn-disabled-limit"
                                                    disabled={true}
                                                    title="Complete your active trip first before accepting another ride"
                                                >
                                                    🔒 Complete Active Trip First
                                                </button>
                                            ) : (
                                                <button
                                                    type="button"
                                                    className="btn-accept"
                                                    onClick={() => acceptRide(ride.id)}
                                                    disabled={actionLoading === ride.id}
                                                >
                                                    {actionLoading === ride.id ? "Accepting..." : "⚡ Accept Ride"}
                                                </button>
                                            )}
                                        </div>
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

export default DriverDashboard;
