import React, { useEffect, useState } from 'react';
import {
  MapPin,
  Camera,
  Video,
  RotateCw,
  Trash2,
  Check,
  Globe,
  Sliders,
  ExternalLink,
} from 'lucide-react';
import type { CameraType, MapObject } from '../types/config';

interface PropertiesPanelProps {
  selectedObject: MapObject | null;
  onUpdateObject: (updated: MapObject) => void;
  onDeleteObject: (id: number | string) => void;
  onClose: () => void;
}

export const PropertiesPanel: React.FC<PropertiesPanelProps> = ({
  selectedObject,
  onUpdateObject,
  onDeleteObject,
  onClose,
}) => {
  const [formData, setFormData] = useState<MapObject | null>(selectedObject);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    setFormData(selectedObject);
  }, [selectedObject]);

  if (!selectedObject || !formData) {
    return (
      <div className="p-4 text-center text-xs text-slate-500 italic">
        Select a marker on the map to edit its configuration parameters.
      </div>
    );
  }

  const handleChange = (field: string, value: unknown) => {
    if (field.startsWith('coordinates.')) {
      const coordKey = field.split('.')[1] as 'lat' | 'lon' | 'height';
      const numVal = Number(value);
      setFormData((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          coordinates: {
            ...prev.coordinates,
            [coordKey]: isNaN(numVal) ? prev.coordinates[coordKey] : numVal,
          },
        };
      });
    } else {
      setFormData((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          [field]: value,
        };
      });
    }
  };

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData) {
      const lat = Number(formData.coordinates.lat);
      const lon = Number(formData.coordinates.lon);
      const height = Number(formData.coordinates.height ?? 0);

      const cleanedObject: MapObject = {
        ...formData,
        coordinates: {
          lat: isNaN(lat) ? 0 : lat,
          lon: isNaN(lon) ? 0 : lon,
          height: isNaN(height) ? 0 : height,
        },
      };

      onUpdateObject(cleanedObject);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2000);
    }
  };

  const getTypeBadge = (type: CameraType) => {
    switch (type) {
      case 'location_pin':
        return (
          <span className="flex items-center space-x-1 px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[11px] font-medium">
            <MapPin className="w-3 h-3" />
            <span>Location Pin</span>
          </span>
        );
      case 'cctv_camera':
        return (
          <span className="flex items-center space-x-1 px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30 text-[11px] font-medium">
            <Camera className="w-3 h-3" />
            <span>CCTV Camera</span>
          </span>
        );
      case '360_camera':
        return (
          <span className="flex items-center space-x-1 px-2 py-0.5 rounded bg-purple-500/20 text-purple-400 border border-purple-500/30 text-[11px] font-medium">
            <Video className="w-3 h-3" />
            <span>360° Camera</span>
          </span>
        );
      case 'pat_camera':
        return (
          <span className="flex items-center space-x-1 px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[11px] font-medium">
            <RotateCw className="w-3 h-3" />
            <span>PAT Patrol Cam</span>
          </span>
        );
    }
  };

  return (
    <div className="glass-panel p-4 rounded-xl border border-slate-700/60 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div>
          <div className="flex items-center space-x-2">
            <h3 className="font-bold text-sm text-white tracking-wide uppercase truncate max-w-[180px]">
              {formData.name || 'Unnamed Object'}
            </h3>
            <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">
              ID: {formData.id}
            </span>
          </div>
          <div className="mt-1">{getTypeBadge(formData.cameraType)}</div>
        </div>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-white text-xs px-2 py-1 rounded bg-slate-800/80 hover:bg-slate-700 transition-colors"
        >
          ✕
        </button>
      </div>

      <form onSubmit={handleApply} className="space-y-3 text-xs">
        <div>
          <label className="block text-[11px] font-medium text-slate-400 mb-1">
            Camera Type
          </label>
          <select
            value={formData.cameraType}
            onChange={(e) => handleChange('cameraType', e.target.value as CameraType)}
            className="w-full bg-dark-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-brand-500"
          >
            <option value="location_pin">📍 Location Pin</option>
            <option value="cctv_camera">📷 CCTV Camera</option>
            <option value="360_camera">🎥 360 Camera</option>
            <option value="pat_camera">🔄 PAT Camera</option>
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-medium text-slate-400 mb-1">
            Name / Label
          </label>
          <input
            type="text"
            value={formData.name || ''}
            onChange={(e) => handleChange('name', e.target.value)}
            className="w-full bg-dark-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-brand-500 font-medium"
            placeholder="Enter name..."
          />
        </div>

        <div>
          <label className="block text-[11px] font-medium text-slate-400 mb-1">
            Description
          </label>
          <textarea
            rows={2}
            value={formData.description || ''}
            onChange={(e) => handleChange('description', e.target.value)}
            className="w-full bg-dark-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-brand-500"
            placeholder="Location description or notes..."
          />
        </div>

        {formData.cameraType !== 'location_pin' && (
          <div>
            <label className="block text-[11px] font-medium text-slate-400 mb-1 flex items-center justify-between">
              <span>Camera Stream URL</span>
              {formData.cameraUrl && (
                <a
                  href={formData.cameraUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-brand-400 hover:underline flex items-center space-x-1 text-[10px]"
                >
                  <span>Link</span>
                  <ExternalLink className="w-2.5 h-2.5" />
                </a>
              )}
            </label>
            <input
              type="text"
              value={formData.cameraUrl || ''}
              onChange={(e) => handleChange('cameraUrl', e.target.value)}
              className="w-full bg-dark-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 font-mono text-[11px] focus:outline-none focus:border-brand-500"
              placeholder="rtsp:// or http:// stream URL"
            />
          </div>
        )}

        <div className="p-2.5 bg-dark-900/80 rounded-lg border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-[11px] font-medium text-slate-300">
            <span className="flex items-center space-x-1">
              <Globe className="w-3 h-3 text-brand-400" />
              <span>Map Coordinates</span>
            </span>
            <span className="text-[10px] text-slate-500">Auto-updated on drag</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] text-slate-400 mb-0.5">Latitude (°)</label>
              <input
                type="number"
                step="any"
                value={formData.coordinates.lat}
                onChange={(e) => handleChange('coordinates.lat', e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200 font-mono text-[11px]"
              />
            </div>
            <div>
              <label className="block text-[10px] text-slate-400 mb-0.5">Longitude (°)</label>
              <input
                type="number"
                step="any"
                value={formData.coordinates.lon}
                onChange={(e) => handleChange('coordinates.lon', e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200 font-mono text-[11px]"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] text-slate-400 mb-0.5">
              Height / Elevation (m)
            </label>
            <input
              type="number"
              step="0.1"
              value={formData.coordinates.height ?? 0}
              onChange={(e) => handleChange('coordinates.height', e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200 font-mono text-[11px]"
            />
          </div>
        </div>

        <div className="pt-2 flex items-center justify-between space-x-2">
          <button
            type="button"
            onClick={() => onDeleteObject(formData.id)}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-red-500/15 hover:bg-red-500/25 text-red-400 border border-red-500/30 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete</span>
          </button>

          <button
            type="submit"
            className="flex-1 flex items-center justify-center space-x-1.5 px-4 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-500 text-white font-semibold shadow-md shadow-brand-600/20 transition-all"
          >
            {savedSuccess ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-300" />
                <span>Applied!</span>
              </>
            ) : (
              <>
                <Sliders className="w-3.5 h-3.5" />
                <span>Apply Changes</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
