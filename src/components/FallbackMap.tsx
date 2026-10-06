import React, { useRef, useState } from 'react';
import {
  MapPin,
  Camera,
  Video,
  RotateCw,
  ZoomIn,
  ZoomOut,
  Compass,
} from 'lucide-react';
import type {
  BuildingPolygon,
  CameraType,
  LayerVisibility,
  MapObject,
  ToolMode,
} from '../types/config';
import { latLonToMeters, metersToLatLon } from '../utils/geo';
import { MapSearchBar } from './MapSearchBar';
import type { SearchResult } from '../utils/geocoding';

interface FallbackMapProps {
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

export const FallbackMap: React.FC<FallbackMapProps> = ({
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
  const [center, setCenter] = useState({ lat: 26.911490938, lon: 75.745982560 });
  const [zoom, setZoom] = useState(19);

  const [draggingId, setDraggingId] = useState<number | string | null>(null);
  const [dragCoords, setDragCoords] = useState<{ id: number | string; lat: number; lon: number } | null>(null);
  const [drawingPoints, setDrawingPoints] = useState<{ lat: number; lon: number }[]>([]);

  const containerRef = useRef<HTMLDivElement>(null);

  const metersPerPixel = (156543.03392 * Math.cos((center.lat * Math.PI) / 180)) / Math.pow(2, zoom);

  const latLonToPixel = (lat: number, lon: number) => {
    if (!containerRef.current) return { x: 0, y: 0 };
    const rect = containerRef.current.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const meters = latLonToMeters({ lat, lon }, center);
    const x = centerX + meters.x / metersPerPixel;
    const y = centerY - meters.y / metersPerPixel;

    return { x, y };
  };

  const pixelToLatLon = (x: number, y: number) => {
    if (!containerRef.current) return center;
    const rect = containerRef.current.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const dxMeters = (x - centerX) * metersPerPixel;
    const dyMeters = (centerY - y) * metersPerPixel;

    return metersToLatLon({ x: dxMeters, y: dyMeters }, center);
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const coords = pixelToLatLon(x, y);

    if (activeTool === 'place') {
      onCreateObject('location_pin', coords.lat, coords.lon);
    } else if (activeTool === 'cctv') {
      onCreateObject('cctv_camera', coords.lat, coords.lon);
    } else if (activeTool === '360') {
      onCreateObject('360_camera', coords.lat, coords.lon);
    } else if (activeTool === 'pat') {
      onCreateObject('pat_camera', coords.lat, coords.lon);
    } else if (activeTool === 'draw_building') {
      setDrawingPoints((prev) => [...prev, coords]);
    } else if (activeTool === 'select') {
      onSelectObject(null);
      onSelectBuilding(null);
    }
  };

  const finishBuildingDrawing = () => {
    if (drawingPoints.length >= 3) {
      const newBuilding: BuildingPolygon = {
        id: `building_${Date.now()}`,
        name: `Building ${buildings.length + 1}`,
        coordinates: drawingPoints,
        color: '#06b6d4',
      };
      onCreateBuilding(newBuilding);
      setDrawingPoints([]);
    }
  };

  const handleMarkerMouseDown = (e: React.MouseEvent, id: number | string) => {
    e.stopPropagation();
    onSelectObject(id);
    setDraggingId(id);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (draggingId && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const newCoords = pixelToLatLon(x, y);
      setDragCoords({ id: draggingId, lat: newCoords.lat, lon: newCoords.lon });
    }
  };

  const handleMouseUp = () => {
    if (dragCoords) {
      onUpdateObjectCoordinates(dragCoords.id, dragCoords.lat, dragCoords.lon);
      setDragCoords(null);
    }
    setDraggingId(null);
  };

  const handleSelectSearchResult = (result: SearchResult) => {
    setCenter({ lat: result.lat, lon: result.lon });
    setZoom(result.zoom);
    if (result.type === 'object' && result.objectId !== undefined) {
      onSelectObject(result.objectId);
    } else if (result.type === 'building' && result.buildingId !== undefined) {
      onSelectBuilding(result.buildingId);
    }
  };

  const getMarkerIcon = (type: CameraType) => {
    switch (type) {
      case 'location_pin':
        return <MapPin className="w-5 h-5 text-emerald-400 drop-shadow-md" />;
      case 'cctv_camera':
        return <Camera className="w-5 h-5 text-blue-400 drop-shadow-md" />;
      case '360_camera':
        return <Video className="w-5 h-5 text-purple-400 drop-shadow-md" />;
      case 'pat_camera':
        return <RotateCw className="w-5 h-5 text-amber-400 drop-shadow-md" />;
    }
  };

  const visibleObjects = objects.filter((obj) => layerVisibility[obj.cameraType]);

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onClick={handleCanvasClick}
      className="relative w-full h-full bg-slate-950 overflow-hidden cursor-crosshair select-none"
    >
      <div
        className="absolute inset-0 opacity-20 pointer-events-none"
        style={{
          backgroundImage: `
            radial-gradient(circle at 50% 50%, rgba(59, 130, 246, 0.15) 0%, transparent 80%),
            linear-gradient(to right, #1e293b 1px, transparent 1px),
            linear-gradient(to bottom, #1e293b 1px, transparent 1px)
          `,
          backgroundSize: '100% 100%, 40px 40px, 40px 40px',
        }}
      />

      <div className="absolute top-4 right-4 z-20 flex items-center space-x-2">
        <MapSearchBar
          objects={objects}
          buildings={buildings}
          onSelectLocation={handleSelectSearchResult}
        />

        <div className="flex items-center space-x-1 bg-dark-800/90 border border-slate-700/80 rounded-xl p-1 shadow-xl backdrop-blur-md">
          <button
            onClick={() => setZoom((z) => Math.min(z + 1, 22))}
            title="Zoom In"
            className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-300 transition-colors"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={() => setZoom((z) => Math.max(z - 1, 12))}
            title="Zoom Out"
            className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-300 transition-colors"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={() => setCenter({ lat: 26.911490938, lon: 75.745982560 })}
            title="Recenter Map on Jaipur Office"
            className="p-1.5 rounded-lg hover:bg-slate-700 text-cyan-400 transition-colors"
          >
            <Compass className="w-4 h-4" />
          </button>
        </div>
      </div>

      {layerVisibility.building_polygons && (
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
          {buildings.map((b) => {
            const pointsStr = b.coordinates
              .map((pt) => {
                const pix = latLonToPixel(pt.lat, pt.lon);
                return `${pix.x},${pix.y}`;
              })
              .join(' ');

            const isSelected = b.id === selectedBuildingId;

            return (
              <polygon
                key={b.id}
                points={pointsStr}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectBuilding(b.id);
                }}
                className="pointer-events-auto cursor-pointer"
                fill={isSelected ? 'rgba(6, 182, 212, 0.25)' : 'rgba(59, 130, 246, 0.15)'}
                stroke={isSelected ? '#06b6d4' : '#3b82f6'}
                strokeWidth={isSelected ? '3' : '2'}
                strokeDasharray="4 2"
              />
            );
          })}

          {drawingPoints.length > 0 && (
            <polyline
              points={drawingPoints
                .map((pt) => {
                  const pix = latLonToPixel(pt.lat, pt.lon);
                  return `${pix.x},${pix.y}`;
                })
                .join(' ')}
              fill="rgba(6, 182, 212, 0.15)"
              stroke="#06b6d4"
              strokeWidth="2"
            />
          )}
        </svg>
      )}

      {activeTool === 'draw_building' && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-30 bg-cyan-950/90 border border-cyan-500/50 p-2.5 rounded-xl text-xs text-cyan-200 flex items-center space-x-3 shadow-2xl backdrop-blur-md">
          <span>Click map corners to draw building polygon. ({drawingPoints.length} vertices)</span>
          {drawingPoints.length >= 3 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                finishBuildingDrawing();
              }}
              className="px-3 py-1 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-lg shadow-md transition-all"
            >
              Close & Complete Footprint
            </button>
          )}
        </div>
      )}

      <div className="absolute inset-0 pointer-events-none z-20">
        {visibleObjects.map((obj) => {
          const lat = dragCoords && String(dragCoords.id) === String(obj.id) ? dragCoords.lat : obj.coordinates.lat;
          const lon = dragCoords && String(dragCoords.id) === String(obj.id) ? dragCoords.lon : obj.coordinates.lon;
          const pix = latLonToPixel(lat, lon);
          const isSelected = String(obj.id) === String(selectedObjectId);

          return (
            <div
              key={obj.id}
              onClick={(e) => {
                e.stopPropagation();
                onSelectObject(obj.id);
              }}
              onMouseDown={(e) => handleMarkerMouseDown(e, obj.id)}
              style={{
                transform: `translate(${pix.x - 16}px, ${pix.y - 16}px)`,
              }}
              className={`absolute pointer-events-auto cursor-grab active:cursor-grabbing flex flex-col items-center group transition-transform ${
                isSelected ? 'scale-125 z-30' : 'hover:scale-110 z-20'
              }`}
            >
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center border shadow-lg backdrop-blur-md transition-all ${
                  isSelected
                    ? 'bg-brand-600 border-cyan-400 ring-4 ring-brand-500/40 shadow-brand-500/50 selected-marker-ring'
                    : 'bg-dark-800/90 border-slate-700/80 hover:border-slate-500'
                }`}
              >
                {getMarkerIcon(obj.cameraType)}
              </div>

              <div
                className={`mt-1 px-2 py-0.5 rounded text-[10px] font-semibold whitespace-nowrap border shadow-md transition-colors ${
                  isSelected
                    ? 'bg-brand-600 text-white border-brand-400'
                    : 'bg-dark-900/90 text-slate-300 border-slate-800 group-hover:bg-slate-800 group-hover:text-white'
                }`}
              >
                {obj.name}
              </div>
            </div>
          );
        })}
      </div>

      <div className="absolute bottom-3 left-4 z-20 flex items-center space-x-3 text-[11px] text-slate-400 bg-dark-900/80 px-3 py-1.5 rounded-lg border border-slate-800 backdrop-blur-md">
        <span>Map Center: {center.lat.toFixed(6)}°, {center.lon.toFixed(6)}°</span>
        <span>•</span>
        <span>Zoom Level: {zoom}</span>
        <span>•</span>
        <span className="text-emerald-400 font-mono">Interactive Mock Map Canvas</span>
      </div>
    </div>
  );
};
