import React from 'react';
import { Pentagon, Trash2, Plus } from 'lucide-react';
import type { BuildingPolygon } from '../types/config';

interface BuildingEditorProps {
  buildings: BuildingPolygon[];
  selectedBuildingId: string | null;
  onSelectBuilding: (id: string | null) => void;
  onDeleteBuilding: (id: string) => void;
  onStartDrawing: () => void;
}

export const BuildingEditor: React.FC<BuildingEditorProps> = ({
  buildings,
  selectedBuildingId,
  onSelectBuilding,
  onDeleteBuilding,
  onStartDrawing,
}) => {
  return (
    <div className="glass-panel p-3 rounded-xl border border-slate-700/60 shadow-xl space-y-2">
      <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
        <div className="flex items-center space-x-1.5 text-xs font-semibold text-cyan-400">
          <Pentagon className="w-4 h-4" />
          <span>Building Geometry ({buildings.length})</span>
        </div>

        <button
          onClick={onStartDrawing}
          className="flex items-center space-x-1 px-2 py-1 rounded bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 text-[11px] font-medium border border-cyan-500/30 transition-colors"
        >
          <Plus className="w-3 h-3" />
          <span>Draw New</span>
        </button>
      </div>

      {buildings.length === 0 ? (
        <div className="text-center py-3 text-xs text-slate-500 italic">
          No building footprint defined yet. Click "Draw New" or "Draw Building" in toolbar.
        </div>
      ) : (
        <div className="space-y-1 max-h-36 overflow-y-auto pr-1 text-xs">
          {buildings.map((b) => {
            const isSelected = b.id === selectedBuildingId;
            return (
              <div
                key={b.id}
                onClick={() => onSelectBuilding(b.id)}
                className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-all border ${
                  isSelected
                    ? 'bg-cyan-500/20 border-cyan-500/50 text-white font-medium'
                    : 'bg-dark-900/50 border-slate-800/60 hover:bg-slate-800/80 text-slate-300'
                }`}
              >
                <div className="flex items-center space-x-2 truncate">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: b.color || '#3b82f6' }}
                  />
                  <span className="truncate">{b.name}</span>
                </div>

                <div className="flex items-center space-x-2">
                  <span className="text-[10px] text-slate-500 font-mono">
                    {b.coordinates.length} pts
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteBuilding(b.id);
                    }}
                    className="text-slate-400 hover:text-red-400 p-1 rounded hover:bg-red-500/10 transition-colors"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
