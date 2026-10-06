# DT Map Configuration Studio

**DT Map Configuration Studio** is a production-ready visual map editor and JSON configurator built specifically for the **DT Command Center**.

It enables engineers and field technicians to visually position, arrange, edit, and configure places and cameras on Google Satellite Maps without manually calculating latitude/longitude coordinates.

---

## 🌟 Key Features

* **Visual Map Canvas**: Built with Google Maps JavaScript API supporting Satellite view, Road view, pan, zoom, location search, and full-screen editing.
* **Fallback Canvas Engine**: High-fidelity interactive mock canvas fallback mode if offline or Google Maps API Key is pending.
* **Lossless Schema Preservation**: 100% preservation of top-level wrapper fields, original item IDs, stream URLs, descriptions, and custom/unknown JSON properties upon import and export.
* **Visual Editing Tools**:
  * 📍 Place Pins (`location_pin`)
  * 📷 CCTV Cameras (`cctv_camera`)
  * 🎥 360° Cameras (`360_camera`)
  * 🔄 PAT Patrol Cameras (`pat_camera`)
  * 📐 Building Footprint Polygon Drawing (`draw_building`)
* **Interactive Marker Drag & Drop**: Real-time lat/lon coordinate updates directly into application state during drag.
* **Automated Camera Layout Engine**: Local meter-based projection algorithm (using Equirectangular/Azimuthal projection around site centroids) generating Grid (e.g. 3x2 for Jaipur Office), Perimeter, Corner, and Distributed layouts.
* **Polygon Containment Warnings**: Automatic ray-casting checks alerting when cameras fall outside defined building footprints (`⚠ Cam6 outside building`).
* **Undo & Redo**: Full operation stack history (`Ctrl+Z`, `Ctrl+Y`).
* **Local-First & Draft Saving**: Auto-saves drafts to browser LocalStorage (`Save Draft`, `Clear Draft`).
* **Configuration Validation**: Real-time validation checking coordinate boundaries, duplicate IDs, missing names, and polygon containment issues before export.

---

## 🛠️ Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Google Maps API Key

Copy the `.env.example` file to `.env`:

```bash
cp .env.example .env
```

Edit `.env` and set your API key:

```env
VITE_GOOGLE_MAPS_API_KEY=AIzaSy...
```

*Note: You can also configure or update your Google Maps API Key directly within the app UI using the **Settings (⚙️)** button in the top header.*

### 3. Run Development Server

```bash
npm run dev
```

Open your browser at `http://localhost:5173`.

---

## 🗺️ How to Use

1. **Import Existing Configuration**:
   * Click **Import JSON** in the top header.
   * Drag & drop a `.json` file or click **Load Jaipur Sample** to immediately load the Jaipur Office 6-camera test configuration.
   * View the instant import summary (Counts of Places, CCTV, 360, PAT).

2. **Visually Position & Drag Markers**:
   * Select any camera or place pin on the map.
   * Drag markers across the satellite map canvas; coordinates update automatically in the Properties Panel.

3. **Define Building Footprint**:
   * Click **📐 Draw Building** in the toolbar.
   * Click corner vertices on the map to define the building boundary.
   * Click **Close & Complete Footprint**.

4. **Auto-Arrange Cameras**:
   * Switch to the **Auto Layout** tab in the right sidebar.
   * Select your target building polygon.
   * Choose layout pattern (Grid 3x2, Perimeter, Corners, Distributed) and inset margin.
   * Click **Generate Layout**. Cameras will be distributed mathematically in meters inside the polygon.

5. **Validate & Export JSON**:
   * Click the **Validation Status** badge in the header to view schema & containment report.
   * Click **Export JSON** to download a clean, 100% compatible `.json` file ready for immediate use in DT Command Center.

---

## 📊 Sample Data

A pre-configured Jaipur Office test file is included in `src/data/sampleJaipur.json`:

```json
[
  {
    "id": 310,
    "name": "Jaipur Office Complex",
    "coordinates": {
      "lon": 75.74598256005991,
      "lat": 26.91149093801618,
      "height": 0
    },
    "cameraType": "location_pin"
  },
  {
    "id": 314,
    "name": "Jaipur-Office Cam1",
    "coordinates": {
      "lon": 75.745882,
      "lat": 26.911590,
      "height": 2.5
    },
    "cameraUrl": "rtsp://admin:pass@192.168.1.101:554/stream1",
    "cameraType": "cctv_camera",
    "someFutureField": "CONF_SEC_01"
  }
]
```

---

## 💻 Tech Stack

* **Frontend**: React 18, TypeScript, Vite
* **Styling**: Tailwind CSS v4, Lucide Icons, Glassmorphism UI
* **Maps API**: Google Maps JavaScript API (`@googlemaps/js-api-loader`)
* **Geometry Engine**: Equirectangular & Haversine projections, 2D Ray-Casting Point-in-Polygon

---

## 📄 License

DT Command Center Engineering Tool.
