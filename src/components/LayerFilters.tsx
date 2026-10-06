import React from 'react';
import { Layers, MapPin, Camera, Video, RotateCw, Pentagon } from 'lucide-react';
import type { LayerVisibility } from '../types/config';

interface LayerFiltersProps {
  visibility: LayerVisibility;
  onToggleLayer: (layer: keyof LayerVisibility) => void;
}

export const LayerFilters: React.FC<LayerFiltersProps> = ({ visibility, onToggleLayer }) => {
  return (
    <div className="glass-panel p-3 rounded-xl border border-slate-700/60 shadow-xl space-y-2">
      <div className="flex items-center space-x-2 text-xs font-semibold text-slate-300 border-b border-slate-800 pb-1.5">
        <Layers className="w-3.5 h-3.5 text-brand-400" />
        <span>Map Layers</span>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs">
        <label className="flex items-center space-x-2 cursor-pointer p-1.5 rounded hover:bg-slate-800/60 transition-colors">
          <input
            type="checkbox"
            checked={visibility.location_pin}
            onChange={() => onToggleLayer('location_pin')}
            className="rounded border-slate-700 bg-slate-900 text-emerald-500 focus:ring-emerald-500/20"
          />
          <MapPin className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-slate-300">Places</span>
        </label>

        <label className="flex items-center space-x-2 cursor-pointer p-1.5 rounded hover:bg-slate-800/60 transition-colors">
          <input
            type="checkbox"
            checked={visibility.cctv_camera}
            onChange={() => onToggleLayer('cctv_camera')}
            className="rounded border-slate-700 bg-slate-900 text-blue-500 focus:ring-blue-500/20"
          />
          <Camera className="w-3.5 h-3.5 text-blue-400" />
          <span className="text-slate-300">CCTV</span>
        </label>

        <label className="flex items-center space-x-2 cursor-pointer p-1.5 rounded hover:bg-slate-800/60 transition-colors">
          <input
            type="checkbox"
            checked={visibility['360_camera']}
            onChange={() => onToggleLayer('360_camera')}
            className="rounded border-slate-700 bg-slate-900 text-purple-500 focus:ring-purple-500/20"
          />
          <Video className="w-3.5 h-3.5 text-purple-400" />
          <span className="text-slate-300">360 Cam</span>
        </label>

        <label className="flex items-center space-x-2 cursor-pointer p-1.5 rounded hover:bg-slate-800/60 transition-colors">
          <input
            type="checkbox"
            checked={visibility.pat_camera}
            onChange={() => onToggleLayer('pat_camera')}
            className="rounded border-slate-700 bg-slate-900 text-amber-500 focus:ring-amber-500/20"
          />
          <RotateCw className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-slate-300">PAT Cam</span>
        </label>

        <label className="flex items-center space-x-2 cursor-pointer p-1.5 rounded hover:bg-slate-800/60 transition-colors col-span-2 border-t border-slate-800/60 pt-1.5">
          <input
            type="checkbox"
            checked={visibility.building_polygons}
            onChange={() => onToggleLayer('building_polygons')}
            className="rounded border-slate-700 bg-slate-900 text-cyan-500 focus:ring-cyan-500/20"
          />
          <Pentagon className="w-3.5 h-3.5 text-cyan-400" />
          <span className="text-slate-300">Building Geometry</span>
        </label>
      </div>
    </div>
  );
};
