# E-Rickshaw Booking System (React.js & Django) ⚡🛺

A full-stack electric rickshaw ride-booking web application built with **React 19 (Vite + TypeScript)**, **Tailored Dark-Teal & Electric Mint Design**, and **Django REST Framework**.

---

## 🌟 Key Features

### 1. Customer Dashboard 📍
- **Interactive OpenStreetMap with Leaflet**:
  - Click on the map to place a **Classic Green Pin (Pickup)**.
  - Click again to place a **Classic Red Pin (Destination)**.
  - **Reverse Geocoding**: Translates GPS coordinates into street addresses automatically using Nominatim.
- **Instant Route Preview**:
  - As soon as pickup and drop points are selected, the driving route is calculated and displayed in electric emerald (`#00FF9D`).
  - Automatically calculates distance (km) and estimated fare (`₹50 base + ₹10/km`).
  - Viewport auto-fits to frame the entire route path.
- **Real-Time Live Updates (SPA Architecture)**:
  - Background live polling keeps ride status (`Requested` ➔ `Accepted` ➔ `Completed`) synced without ever having to refresh the page.
- **My Rides History**:
  - Inspect past and active rides.
  - Expandable on-demand route polyline preview for each ride.
  - One-click cancellation for pending requested rides.

### 2. Driver Dashboard 🚗
- **Live Ride Requests Feed**:
  - Live stream of incoming customer ride requests with pickup, drop, distance, and earnings in ₹.
  - Expandable map route preview before accepting.
- **Strict Single-Ride Policy**:
  - Enforced on both frontend and backend: A driver can accept **only one ride at a time**.
  - Accepting a ride moves it to a prominent **"Active Trip In Progress"** section at the top, while locking further accepts until the trip is completed.
- **One-Click Trip Completion**:
  - Drivers can finish trips directly with **"✓ Complete Ride (Passenger Dropped)"**.

---

## 🛠️ Tech Stack

### Frontend
- **React 19** with **TypeScript** & **Vite**
- **React-Leaflet & Leaflet 1.9** (Maps, Polylines, Markers)
- **Axios** (HTTP client with JWT Bearer authentication)
- **Vanilla CSS** with a unified cyber dark-teal (`#07191E` / `#0b252b`) and electric green (`#02F5A1`) aesthetic.

### Backend
- **Django 5** & **Django REST Framework (DRF)**
- **SimpleJWT** for access & refresh token authentication
- **OpenRouteService (ORS)** with direct GPS coordinate routing and Haversine fallback
- **SQLite3** database

---

## 🚀 Getting Started

### 1. Backend Setup
```bash
cd backend
python -m venv .venv
# On Windows:
.venv\Scripts\activate
# On macOS/Linux:
source .venv/bin/activate

pip install -r requirements.txt # or install django djangorestframework djangorestframework-simplejwt django-cors-headers requests
python manage.py migrate
python manage.py runserver 3000
```

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

---

## 🔐 Authentication & Roles
- **Register**: Register as either a **Customer** or a **Driver**.
- **Login**: Automatically routes customers to `/customer` and drivers to `/driver`.
