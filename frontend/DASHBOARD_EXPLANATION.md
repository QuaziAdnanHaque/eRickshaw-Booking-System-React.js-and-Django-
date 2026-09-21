# E-Rickshaw Dashboards: Architecture, Changes & Explanation Guide

This guide provides a comprehensive, easy-to-understand walkthrough of both the **Customer Dashboard** and the **Driver Dashboard**. Use this document to understand the codebase or to explain the project during demos, viva presentations, or code reviews.

---

## 1. Design & Aesthetic Alignment
Both dashboards use the unified brand theme from the Landing, Login, and Registration pages:
- **Background**: `#07191E` (deep dark cyber-teal)
- **Cards & Containers**: `#0b252b` with subtle glowing borders (`rgba(2, 245, 161, 0.15)`)
- **Accent / Action Color**: `#02F5A1` (vibrant electric mint green)
- **Instant Route Preview Upon Selection Complete**:
  - As soon as the customer selects both pickup and drop points on the interactive map, the actual road route is immediately fetched and drawn in glowing emerald green (`#00FF9D`), and the map smoothly auto-fits its bounds to show both points.
  - A real-time route estimate banner appears showing calculated distance (km) and estimated fare (₹) before the customer even clicks "Book Ride".
- **Strict Single-Ride Driver Policy (One Ride at a Time)**:
  - **Backend**: `AcceptedRideView` in `views.py` verifies if `Ride.objects.filter(driver=request.user, status="accepted")` exists. If so, it blocks accepting any other ride with a 400 error.
  - **Frontend**: `DriverDashboard.tsx` checks `activeTrips.length > 0`. If the driver has an active trip, all "Accept Ride" buttons in the available feed are disabled with a lock icon (`🔒 Complete Active Trip First`), and an informative warning banner is displayed.
- **Container Containment & Overflow Prevention**:
  - Encapsulated location summary chips into a responsive `min-width: 0` flex/grid container (`.location-chips-container`).
  - Added strict boundary enforcement (`box-sizing: border-box`, `overflow: hidden`, `text-overflow: ellipsis`) so long addresses and the "Clear Selection" button stay 100% inside the card box on all screen sizes.
- **Map Markers**:
  - **Pickup Pin**: Classic Leaflet Green Marker Pin (`marker-icon-2x-green.png`).
  - **Destination Pin**: Classic Leaflet Red Marker Pin (`marker-icon-2x-red.png`).
- **Real-Time Live Polling**: Automatic SPA background polling every 3.5 seconds so both drivers and customers see live status updates (requests, acceptance, completion) without ever refreshing the page.
- **Direct Coordinate Routing**: Backend bypasses Pelias text forward-geocoding errors by routing directly on GPS coordinates (`[lng, lat]`) with fallback geometry, ensuring no location fails to calculate.
- **Active Trip Workflow**: Drivers retain accepted rides in an explicit "Active Trip" card right at the top, enabling seamless one-click completion.
- **Status Indicators**:
  - `Requested` (Amber): `#fbbf24`
  - `Accepted` (Sky Blue): `#38bdf8`
  - `Completed` (Electric Mint): `#02F5A1`
  - `Cancelled` (Coral Red): `#ff6b6b`

---

## 2. Customer Dashboard (`CustomerDashboard.tsx`)

### Purpose
Allows an authenticated customer to select pickup and destination locations on an interactive OpenStreetMap Leaflet map, request an e-rickshaw ride, view estimated fares and distances, track ride status, and cancel pending rides.

### Key State Variables
| State | Type | Description |
|---|---|---|
| `pickup` | `Location \| null` | Stores the clicked pickup coordinate (`lat`, `lng`) and reverse-geocoded street address. |
| `drop` | `Location \| null` | Stores the clicked drop/destination coordinate and reverse-geocoded address. |
| `rides` | `Ride[]` | List of all rides created by this customer retrieved from `GET /api/rides/`. |
| `loading` | `boolean` | Indicates whether the ride booking request is being processed. |
| `error` | `string` | Displays user-friendly error messages if API requests or geocoding fails. |
| `expandedRideId` | `number \| null` | Tracks which ride card has its interactive route polyline map expanded. |

### How It Works (Step-by-Step Flow)
1. **Authentication Check**:
   - On component mount (`useEffect`), checks `localStorage.getItem("access_token")`.
   - If missing or if the server returns `401 Unauthorized`, clears local storage and redirects to `/login`.
2. **Interactive Map Selection (`MapClickHandler`)**:
   - The user clicks anywhere on the Leaflet map.
   - `MapClickHandler` captures `event.latlng` and calls the OpenStreetMap Nominatim reverse geocoding API (`https://nominatim.openstreetmap.org/reverse`).
   - If `pickup` is empty ➔ First click becomes **Pickup** (marked with a green pin).
   - If `pickup` is set but `drop` is empty ➔ Second click becomes **Destination** (marked with a red pin).
   - If both are set ➔ Third click resets and starts a new selection.
   - A **"Clear Selection"** button is also provided for instant reset.
3. **Ride Creation (`createRide`)**:
   - User clicks **"⚡ Confirm & Book Ride"**.
   - Sends `POST http://127.0.0.1:3000/api/rides/` with:
     ```json
     {
       "pickup": "Address string",
       "drop": "Address string",
       "pickup_lat": 22.5726,
       "pickup_lng": 88.3639,
       "drop_lat": 22.5800,
       "drop_lng": 88.3700
     }
     ```
   - Backend calculates real driving route coordinates via OpenRouteService (ORS), computes distance and fare (`₹50 base + ₹10/km`), and saves the ride with `status="requested"`.
   - On success, `pickup` and `drop` states are reset and `loadRides()` refreshes the ride list.
4. **Ride Cards & Route Preview**:
   - Displays a grid of the customer's rides showing Ride #ID, status badge, Fare, Distance, and Driver name.
   - **Performance Optimization**: Instead of mounting 10+ heavy Leaflet map instances at the same time, each card includes a **"View Route on Map ▼"** toggle button. Clicking it dynamically displays the route polyline with pickup and drop markers.
5. **Ride Cancellation (`cancelRide`)**:
   - For rides where `status === "requested"`, a **"Cancel Ride"** button sends `POST /api/rides/${id}/cancel/` and refreshes the feed.

---

## 3. Driver Dashboard (`DriverDashboard.tsx`)

### Purpose
Allows an authenticated driver to view available ride requests in real-time, inspect pickup/drop points and distances, accept requests, preview routes, and complete active rides.

### Key State Variables
| State | Type | Description |
|---|---|---|
| `rides` | `Ride[]` | List of available requests (`status="requested"`) returned by `GET /api/rides/`. |
| `loading` | `boolean` | Loading spinner for the initial fetch. |
| `actionLoading` | `number \| null` | The ID of the ride currently being accepted, completed, or cancelled (disables duplicate button clicks). |
| `expandedRideId` | `number \| null` | Controls which ride card has its route preview opened. |

### How It Works (Step-by-Step Flow)
1. **Authentication & Profile Detection**:
   - Validates `access_token` and extracts driver profile information (`driverName`, `driverId`) from `localStorage.getItem("user")`.
2. **Dashboard Overview & Stats Bar**:
   - Displays real-time request counts:
     - **New Requests** (`rides.filter(r => r.status === "requested").length`)
     - **Active Trips** (if any ride is currently assigned to this driver)
   - Features a **"🔄 Refresh Feed"** button so drivers can check for newly placed ride requests at any time.
3. **Accepting a Ride (`acceptRide`)**:
   - When a ride is in `requested` status, the driver sees the **"⚡ Accept Ride"** action.
   - Clicking it calls `POST http://127.0.0.1:3000/api/rides/${id}/accept/`.
   - Backend assigns the authenticated driver to the ride and updates its status to `accepted`.
4. **Completing a Ride (`completeRide`)**:
   - When a ride is accepted by this driver, the card highlights and displays **"✓ Complete Ride"**.
   - Calling `POST http://127.0.0.1:3000/api/rides/${id}/complete/` marks the ride as `completed`.
5. **Route Preview on Map**:
   - Drivers can expand **"Preview Route Map ▼"** to inspect the turn-by-turn polyline geometry, pickup pin, and drop destination before or during the trip.

---

## 4. Key Improvements Made Over Previous Version

1. **Brand Consistency**:
   - Replaced plain white/blue light theme with the application's signature dark cyber-teal (`#07191E` / `#0b252b`) and electric green (`#02F5A1`) styling from the Login, Registration, and Landing pages.
2. **Code Simplicity & Readability**:
   - Eliminated single-token line breaks that bloated the files to 750+ and 480+ lines.
   - Clean, modular TypeScript structure with clear comments and intuitive variable names.
3. **Performance & Lightweight Rendering**:
   - Replaced unconditional map rendering inside every card with on-demand route expansion, preventing browser lag when multiple rides exist.
4. **Driver ID Fix**:
   - Resolved user ID resolution by reading from the stored `user` object in `localStorage`.
5. **Step-by-Step Visual Guidance**:
   - Added interactive step indicators (`1. Pickup → 2. Destination → 3. Confirm`) to make the booking workflow intuitive and easy to present.

---

## 5. How to Explain in a 2-Minute Presentation or Viva

> *"Our frontend is built with React 19, TypeScript, Vite, and Leaflet Maps, styled with a cohesive dark-teal and electric green theme. We have two dedicated role-based dashboards:
>
> 1. **Customer Dashboard**:
>    - Uses OpenStreetMap and Leaflet with custom green and red pins.
>    - When a customer clicks on the map, Nominatim reverse geocoding translates the coordinates into a readable street address.
>    - Customers follow a clear 3-step flow: Pick start, Pick drop, and Confirm.
>    - The booking request is sent to our Django backend, which uses OpenRouteService to calculate real road distance and fare.
>    - Customers can monitor active rides and preview their routes on interactive mini-maps.
>
> 2. **Driver Dashboard**:
>    - Drivers have a live feed of incoming requests.
>    - They can view pickup/drop locations, distance, and earnings.
>    - Drivers can accept requests, view the route polyline, and mark rides as completed upon drop-off.
>
> Both dashboards communicate securely with our REST API using JWT Bearer authentication."*
