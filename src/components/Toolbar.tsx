import React from 'react';
import {
  MousePointer,
  Move,
  MapPin,
  Camera,
  Video,
  RotateCw,
  Pentagon,
  XCircle,
} from 'lucide-react';
import type { ToolMode } from '../types/config';

interface ToolbarProps {
  activeTool: ToolMode;
  onSelectTool: (tool: ToolMode) => void;
  selectedObjectId: number | string | null;
  onClearSelection: () => void;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  activeTool,
  onSelectTool,
  selectedObjectId,
  onClearSelection,
}) => {
  return (
    <div className="absolute top-4 left-4 z-20 flex flex-col space-y-2 glass-panel p-2 rounded-xl shadow-2xl border border-slate-700/60 max-w-[200px]">
      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 py-1 border-b border-slate-800">
        Editing Tools
      </div>

      <div className="space-y-1">
        <button
          onClick={() => onSelectTool('select')}
          className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
            activeTool === 'select'
              ? 'bg-brand-600 text-white shadow-md shadow-brand-600/30 font-semibold'
              : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
          }`}
        >
          <MousePointer className="w-4 h-4 text-cyan-400" />
          <span>Select</span>
        </button>

        <button
          onClick={() => onSelectTool('move')}
          className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
            activeTool === 'move'
              ? 'bg-brand-600 text-white shadow-md shadow-brand-600/30 font-semibold'
              : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
          }`}
        >
          <Move className="w-4 h-4 text-amber-400" />
          <span>Move / Drag</span>
        </button>
      </div>

      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 py-1 pt-2 border-t border-slate-800">
        Add Markers
      </div>

      <div className="space-y-1">
        <button
          onClick={() => onSelectTool('place')}
          className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
            activeTool === 'place'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30 font-semibold'
              : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
          }`}
        >
          <MapPin className="w-4 h-4 text-emerald-400" />
          <span>📍 + Place</span>
        </button>

        <button
          onClick={() => onSelectTool('cctv')}
          className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
            activeTool === 'cctv'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 font-semibold'
              : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
          }`}
        >
          <Camera className="w-4 h-4 text-blue-400" />
          <span>📷 + CCTV</span>
        </button>

        <button
          onClick={() => onSelectTool('360')}
          className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
            activeTool === '360'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30 font-semibold'
              : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
          }`}
        >
          <Video className="w-4 h-4 text-purple-400" />
          <span>🎥 + 360</span>
        </button>

        <button
          onClick={() => onSelectTool('pat')}
          className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
            activeTool === 'pat'
              ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30 font-semibold'
              : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
          }`}
        >
          <RotateCw className="w-4 h-4 text-amber-400" />
          <span>🔄 + PAT</span>
        </button>
      </div>

      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 py-1 pt-2 border-t border-slate-800">
        Site Footprint
      </div>

      <button
        onClick={() => onSelectTool('draw_building')}
        className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
          activeTool === 'draw_building'
            ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/30 font-semibold'
            : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
        }`}
      >
        <Pentagon className="w-4 h-4 text-cyan-400" />
        <span>📐 Draw Building</span>
      </button>

      {selectedObjectId && (
        <button
          onClick={onClearSelection}
          className="w-full mt-2 flex items-center justify-center space-x-1 px-2 py-1.5 rounded-lg text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors border border-slate-800"
        >
          <XCircle className="w-3.5 h-3.5" />
          <span>Clear Selection</span>
        </button>
      )}
    </div>
  );
};
