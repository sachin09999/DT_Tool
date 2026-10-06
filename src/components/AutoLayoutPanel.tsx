import React, { useState } from 'react';
import {
  Grid,
  Square,
  Maximize2,
  Sliders,
  Sparkles,
  AlertTriangle,
  Pentagon,
} from 'lucide-react';
import type { BuildingPolygon, CameraType, LayoutConfig, LayoutMode } from '../types/config';

interface AutoLayoutPanelProps {
  buildings: BuildingPolygon[];
  selectedBuildingId: string | null;
  onSelectBuilding: (id: string | null) => void;
  onGenerateLayout: (cameraCount: number, config: LayoutConfig) => void;
  totalCamerasCount?: number;
}

export const AutoLayoutPanel: React.FC<AutoLayoutPanelProps> = ({
  buildings,
  selectedBuildingId,
  onSelectBuilding,
  onGenerateLayout,
}) => {
  const [mode, setMode] = useState<LayoutMode>('grid');
  const [rows, setRows] = useState<number>(3);
  const [cols, setCols] = useState<number>(2);
  const [marginMeters, setMarginMeters] = useState<number>(3);
  const [targetCameraType, setTargetCameraType] = useState<CameraType>('cctv_camera');
  const [customCameraCount, setCustomCameraCount] = useState<number>(6);

  const selectedBuilding = buildings.find((b) => b.id === selectedBuildingId) || null;

  const handleGenerate = () => {
    onGenerateLayout(customCameraCount, {
      mode,
      rows,
      cols,
      marginMeters,
      targetCameraType,
    });
  };

  return (
    <div className="glass-panel p-4 rounded-xl border border-slate-700/60 shadow-xl space-y-3">
      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
        <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wide text-white">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>Automatic Camera Layout</span>
        </div>
      </div>

      <div>
        <label className="block text-[11px] font-medium text-slate-400 mb-1 flex items-center space-x-1">
          <Pentagon className="w-3.5 h-3.5 text-cyan-400" />
          <span>Target Building Polygon</span>
        </label>
        <select
          value={selectedBuildingId || ''}
          onChange={(e) => onSelectBuilding(e.target.value || null)}
          className="w-full bg-dark-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-brand-500"
        >
          <option value="">No Building Selected (Use Map Center Anchor)</option>
          {buildings.map((b) => (
            <option key={b.id} value={b.id}>
              📐 {b.name} ({b.coordinates.length} vertices)
            </option>
          ))}
        </select>
        {selectedBuilding && (
          <p className="text-[10px] text-cyan-400 mt-1 font-mono">
            Centroid & Local Meter Projection Active
          </p>
        )}
      </div>

      <div>
        <label className="block text-[11px] font-medium text-slate-400 mb-1">
          Placement Pattern
        </label>
        <div className="grid grid-cols-2 gap-1.5 text-xs">
          <button
            type="button"
            onClick={() => setMode('grid')}
            className={`flex items-center justify-center space-x-1.5 p-2 rounded-lg border transition-all ${
              mode === 'grid'
                ? 'bg-brand-600/30 border-brand-500 text-white font-semibold'
                : 'bg-dark-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Grid className="w-3.5 h-3.5" />
            <span>Grid (3x2)</span>
          </button>

          <button
            type="button"
            onClick={() => setMode('perimeter')}
            className={`flex items-center justify-center space-x-1.5 p-2 rounded-lg border transition-all ${
              mode === 'perimeter'
                ? 'bg-brand-600/30 border-brand-500 text-white font-semibold'
                : 'bg-dark-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Square className="w-3.5 h-3.5" />
            <span>Perimeter</span>
          </button>

          <button
            type="button"
            onClick={() => setMode('corners')}
            className={`flex items-center justify-center space-x-1.5 p-2 rounded-lg border transition-all ${
              mode === 'corners'
                ? 'bg-brand-600/30 border-brand-500 text-white font-semibold'
                : 'bg-dark-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Corners</span>
          </button>

          <button
            type="button"
            onClick={() => setMode('evenly')}
            className={`flex items-center justify-center space-x-1.5 p-2 rounded-lg border transition-all ${
              mode === 'evenly'
                ? 'bg-brand-600/30 border-brand-500 text-white font-semibold'
                : 'bg-dark-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span>Distributed</span>
          </button>
        </div>
      </div>

      {mode === 'grid' && (
        <div className="grid grid-cols-2 gap-2 text-xs p-2 bg-dark-900/60 rounded-lg border border-slate-800">
          <div>
            <label className="block text-[10px] text-slate-400 mb-0.5">Rows</label>
            <input
              type="number"
              min={1}
              max={10}
              value={rows}
              onChange={(e) => {
                const r = Number(e.target.value);
                setRows(r);
                setCustomCameraCount(r * cols);
              }}
              className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200 text-xs font-mono"
            />
          </div>
          <div>
            <label className="block text-[10px] text-slate-400 mb-0.5">Columns</label>
            <input
              type="number"
              min={1}
              max={10}
              value={cols}
              onChange={(e) => {
                const c = Number(e.target.value);
                setCols(c);
                setCustomCameraCount(rows * c);
              }}
              className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200 text-xs font-mono"
            />
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2 text-xs">
        <div>
          <label className="block text-[10px] text-slate-400 mb-0.5">Inset Margin (meters)</label>
          <input
            type="number"
            min={0}
            max={50}
            value={marginMeters}
            onChange={(e) => setMarginMeters(Number(e.target.value))}
            className="w-full bg-dark-900 border border-slate-700 rounded px-2 py-1 text-slate-200 font-mono text-xs"
          />
        </div>
        <div>
          <label className="block text-[10px] text-slate-400 mb-0.5">Total Cameras</label>
          <input
            type="number"
            min={1}
            max={50}
            value={customCameraCount}
            onChange={(e) => setCustomCameraCount(Number(e.target.value))}
            className="w-full bg-dark-900 border border-slate-700 rounded px-2 py-1 text-slate-200 font-mono text-xs"
          />
        </div>
      </div>

      <div>
        <label className="block text-[10px] text-slate-400 mb-0.5">Camera Type to Assign</label>
        <select
          value={targetCameraType}
          onChange={(e) => setTargetCameraType(e.target.value as CameraType)}
          className="w-full bg-dark-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-brand-500"
        >
          <option value="cctv_camera">📷 CCTV Camera</option>
          <option value="360_camera">🎥 360 Camera</option>
          <option value="pat_camera">🔄 PAT Camera</option>
        </select>
      </div>

      {!selectedBuilding && (
        <div className="flex items-center space-x-1.5 text-[10px] text-amber-400 bg-amber-500/10 p-2 rounded border border-amber-500/20">
          <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
          <span>Draw a building polygon first to enforce boundary containment checks!</span>
        </div>
      )}

      <button
        onClick={handleGenerate}
        className="w-full flex items-center justify-center space-x-2 py-2 rounded-lg bg-gradient-to-r from-brand-600 to-cyan-600 hover:from-brand-500 hover:to-cyan-500 text-white font-bold text-xs shadow-lg shadow-brand-600/30 border border-brand-400/30 transition-all"
      >
        <Sparkles className="w-4 h-4" />
        <span>Generate {customCameraCount} Cameras Layout</span>
      </button>
    </div>
  );
};
