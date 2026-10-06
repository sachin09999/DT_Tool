import React, { useEffect, useState } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  Polygon,
  Polyline,
  useMapEvents,
  useMap,
} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Search, Compass } from 'lucide-react';
import type {
  BuildingPolygon,
  CameraType,
  LayerVisibility,
  MapObject,
  ToolMode,
} from '../types/config';

interface MapCanvasProps {
  objects: MapObject[];
  buildings: BuildingPolygon[];
  selectedObjectId: number | string | null;
  selectedBuildingId: string | null;
  activeTool: ToolMode;
  layerVisibility: LayerVisibility;
  onSelectObject: (id: number | string | null) => void;
  onSelectBuilding: (id: string | null) => void;
  onUpdateObjectCoordinates: (id: number | string, lat: number, lon: number) => void;
  onCreateObject: (type: CameraType, lat: number, lon: number) => void;
  onCreateBuilding: (building: BuildingPolygon) => void;
}

const MapEventsHandler: React.FC<{
  activeTool: ToolMode;
  justInteractedRef: React.RefObject<boolean>;
  onCreateObject: (type: CameraType, lat: number, lon: number) => void;
  onAddDrawingPoint: (pt: { lat: number; lon: number }) => void;
  onSelectObject: (id: number | string | null) => void;
  onSelectBuilding: (id: string | null) => void;
  onZoomChange: (zoom: number) => void;
}> = ({ activeTool, justInteractedRef, onCreateObject, onAddDrawingPoint, onSelectObject, onSelectBuilding, onZoomChange }) => {
  useMapEvents({
    zoomend(e) {
      onZoomChange(e.target.getZoom());
    },
    click(e) {
      if (justInteractedRef.current) {
        return;
      }
      const { lat, lng } = e.latlng;
      if (activeTool === 'place') {
        onCreateObject('location_pin', lat, lng);
      } else if (activeTool === 'cctv') {
        onCreateObject('cctv_camera', lat, lng);
      } else if (activeTool === '360') {
        onCreateObject('360_camera', lat, lng);
      } else if (activeTool === 'pat') {
        onCreateObject('pat_camera', lat, lng);
      } else if (activeTool === 'draw_building') {
        onAddDrawingPoint({ lat, lon: lng });
      } else if (activeTool === 'select') {
        onSelectObject(null);
        onSelectBuilding(null);
      }
    },
  });
  return null;
};

const MapController: React.FC<{ center: [number, number] }> = ({ center }) => {
  const map = useMap();
  const prevCenterRef = React.useRef<[number, number] | null>(null);

  useEffect(() => {
    if (center) {
      if (
        !prevCenterRef.current ||
        prevCenterRef.current[0] !== center[0] ||
        prevCenterRef.current[1] !== center[1]
      ) {
        prevCenterRef.current = center;
        map.setView(center, map.getZoom());
      }
    }
  }, [center, map]);
  return null;
};

export const MapCanvas: React.FC<MapCanvasProps> = ({
  objects,
  buildings,
  selectedObjectId,
  selectedBuildingId,
  activeTool,
  layerVisibility,
  onSelectObject,
  onSelectBuilding,
  onUpdateObjectCoordinates,
  onCreateObject,
  onCreateBuilding,
}) => {
  const [mapCenter, setMapCenter] = useState<[number, number]>([26.911490938, 75.745982560]);
  const [mapZoom, setMapZoom] = useState<number>(19);
  // Default to Pure Satellite Imagery (No Shops, No POIs, ONLY DT Pins)
  const [tileMode, setTileMode] = useState<'google_satellite' | 'google_hybrid' | 'google_roadmap' | 'osm'>('google_satellite');
  const [searchQuery, setSearchQuery] = useState('');
  const [drawingPoints, setDrawingPoints] = useState<{ lat: number; lon: number }[]>([]);

  const prevSelectedIdRef = React.useRef<number | string | null>(null);
  const justInteractedRef = React.useRef<boolean>(false);

  const markInteracted = () => {
    justInteractedRef.current = true;
    setTimeout(() => {
      justInteractedRef.current = false;
    }, 400);
  };

  useEffect(() => {
    if (activeTool !== 'draw_building') {
      setDrawingPoints([]);
    }
  }, [activeTool]);

  useEffect(() => {
    if (selectedObjectId !== null && selectedObjectId !== undefined) {
      if (String(selectedObjectId) !== String(prevSelectedIdRef.current)) {
        prevSelectedIdRef.current = selectedObjectId;
        const selected = objects.find((o) => String(o.id) === String(selectedObjectId));
        if (selected) {
          setMapCenter([selected.coordinates.lat, selected.coordinates.lon]);
        }
      }
    } else {
      prevSelectedIdRef.current = null;
    }
  }, [selectedObjectId, objects]);

  const createCustomIcon = (type: CameraType, name: string, isSelected: boolean) => {
    const color =
      type === 'location_pin'
        ? '#10b981'
        : type === 'cctv_camera'
        ? '#3b82f6'
        : type === '360_camera'
        ? '#a855f7'
        : '#f59e0b';

    const iconSymbol =
      type === 'location_pin'
        ? '📍'
        : type === 'cctv_camera'
        ? '📷'
        : type === '360_camera'
        ? '🎥'
        : '🔄';

    const ringStyle = isSelected
      ? 'ring-4 ring-cyan-400 scale-125 z-50 border-white'
      : 'border-slate-800 hover:scale-110';

    const html = `
      <div class="flex flex-col items-center group cursor-pointer transition-all">
        <div class="w-8 h-8 rounded-xl flex items-center justify-center text-sm shadow-xl backdrop-blur-md border transition-all ${ringStyle}" style="background-color: ${color};">
          <span>${iconSymbol}</span>
        </div>
        <div class="mt-1 px-2 py-0.5 rounded text-[10px] font-bold whitespace-nowrap bg-slate-900/90 text-white border border-slate-700 shadow-md">
          ${name}
        </div>
      </div>
    `;

    return L.divIcon({
      html,
      className: 'custom-leaflet-marker',
      iconSize: [36, 48],
      iconAnchor: [18, 24],
    });
  };

  const handleFinishBuildingDrawing = () => {
    if (drawingPoints.length >= 3) {
      const newBuilding: BuildingPolygon = {
        id: `building_${Date.now()}`,
        name: `Building Footprint ${buildings.length + 1}`,
        coordinates: drawingPoints,
        color: '#06b6d4',
      };
      onCreateBuilding(newBuilding);
      setDrawingPoints([]);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchQuery.toLowerCase();
    if (query.includes('jaipur')) {
      setMapCenter([26.911490938, 75.745982560]);
      setMapZoom(19);
    } else if (query.includes('dubai')) {
      setMapCenter([25.197197, 55.274376]);
      setMapZoom(18);
    } else if (query.includes('udaipur')) {
      setMapCenter([24.585445, 73.712479]);
      setMapZoom(18);
    }
  };

  const visibleObjects = objects.filter((obj) => layerVisibility[obj.cameraType]);

  const tileUrls = {
    google_satellite: 'https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}', // Pure Satellite (Clean, NO shops/POIs)
    google_hybrid: 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',    // Hybrid (Satellite + Labels)
    google_roadmap: 'https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}',   // Roadmap
    osm: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  };

  return (
    <div className="relative w-full h-full bg-slate-950 overflow-hidden">
      <div className="absolute top-4 right-4 z-[1000] flex items-center space-x-2">
        <form onSubmit={handleSearchSubmit} className="relative">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search location (e.g. Jaipur Office)..."
            className="bg-dark-800/90 border border-slate-700/80 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-brand-500 w-64 shadow-xl backdrop-blur-md"
          />
        </form>

        <div className="flex items-center space-x-1 bg-dark-800/90 border border-slate-700/80 rounded-xl p-1 shadow-xl backdrop-blur-md">
          <select
            value={tileMode}
            onChange={(e: any) => setTileMode(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-200 focus:outline-none focus:border-brand-500 font-semibold"
          >
            <option value="google_satellite">🌍 Pure Satellite (Clean - No POIs/Shops)</option>
            <option value="google_hybrid">🛰️ Satellite + Labels</option>
            <option value="google_roadmap">🗺️ Google Roadmap</option>
            <option value="osm">🌐 OpenStreetMap</option>
          </select>

          <button
            onClick={() => setMapCenter([26.911490938, 75.745982560])}
            title="Recenter on Jaipur Office"
            className="p-1.5 rounded-lg hover:bg-slate-700 text-cyan-400 transition-colors"
          >
            <Compass className="w-4 h-4" />
          </button>
        </div>
      </div>

      {activeTool === 'draw_building' && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] bg-dark-800/95 border border-cyan-500/50 p-2.5 rounded-xl text-xs text-cyan-200 flex items-center space-x-3 shadow-2xl backdrop-blur-md">
          <span>Click satellite map corners to draw building footprint. ({drawingPoints.length} vertices)</span>
          {drawingPoints.length >= 3 && (
            <button
              onClick={handleFinishBuildingDrawing}
              className="px-3 py-1 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-lg shadow-md transition-all"
            >
              Close & Save Footprint
            </button>
          )}
        </div>
      )}

      <MapContainer
        center={mapCenter}
        zoom={mapZoom}
        zoomControl={false}
        className="w-full h-full z-10"
      >
        <MapController center={mapCenter} />

        <TileLayer
          url={tileUrls[tileMode]}
          maxZoom={22}
          subdomains={['mt0', 'mt1', 'mt2', 'mt3']}
          attribution='&copy; Google Maps / DT Command Center'
        />

        <MapEventsHandler
          activeTool={activeTool}
          justInteractedRef={justInteractedRef}
          onCreateObject={onCreateObject}
          onAddDrawingPoint={(pt) => setDrawingPoints((prev) => [...prev, pt])}
          onSelectObject={onSelectObject}
          onSelectBuilding={onSelectBuilding}
          onZoomChange={(z) => setMapZoom(z)}
        />

        {layerVisibility.building_polygons &&
          buildings.map((b) => {
            const isSelected = b.id === selectedBuildingId;
            const positions: [number, number][] = b.coordinates.map((pt) => [pt.lat, pt.lon]);

            return (
              <Polygon
                key={b.id}
                positions={positions}
                pathOptions={{
                  color: isSelected ? '#06b6d4' : '#3b82f6',
                  fillColor: isSelected ? '#06b6d4' : '#3b82f6',
                  fillOpacity: isSelected ? 0.35 : 0.2,
                  weight: isSelected ? 3 : 2,
                  dashArray: '4 2',
                }}
                eventHandlers={{
                  click: (e) => {
                    markInteracted();
                    e.originalEvent.stopPropagation();
                    onSelectBuilding(b.id);
                  },
                  mousedown: () => {
                    markInteracted();
                  },
                }}
              />
            );
          })}

        {drawingPoints.length > 0 && (
          <Polyline
            positions={drawingPoints.map((pt) => [pt.lat, pt.lon])}
            pathOptions={{ color: '#06b6d4', weight: 3, opacity: 0.9 }}
          />
        )}

        {visibleObjects.map((obj) => {
          const isSelected = String(obj.id) === String(selectedObjectId);
          const position: [number, number] = [obj.coordinates.lat, obj.coordinates.lon];
          const icon = createCustomIcon(obj.cameraType, obj.name, isSelected);

          return (
            <Marker
              key={obj.id}
              position={position}
              icon={icon}
              draggable={true}
              eventHandlers={{
                click: (e) => {
                  markInteracted();
                  (e as any).originalEvent?.stopPropagation();
                  onSelectObject(obj.id);
                },
                mousedown: () => {
                  markInteracted();
                },
                dragstart: (e) => {
                  markInteracted();
                  (e as any).originalEvent?.stopPropagation();
                  onSelectObject(obj.id);
                },
                drag: () => {
                  justInteractedRef.current = true;
                },
                dragend: (e) => {
                  markInteracted();
                  const marker = e.target;
                  const newPos = marker.getLatLng();
                  onUpdateObjectCoordinates(obj.id, newPos.lat, newPos.lng);
                },
              }}
            />
          );
        })}
      </MapContainer>
    </div>
  );
};
