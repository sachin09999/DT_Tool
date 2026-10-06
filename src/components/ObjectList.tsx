import React, { useState } from 'react';
import {
  Search,
  List,
  MapPin,
  Camera,
  Video,
  RotateCw,
  ChevronRight,
} from 'lucide-react';
import type { CameraType, MapObject } from '../types/config';

interface ObjectListProps {
  objects: MapObject[];
  selectedObjectId: number | string | null;
  onSelectObject: (id: number | string) => void;
  onCenterObject: (obj: MapObject) => void;
}

export const ObjectList: React.FC<ObjectListProps> = ({
  objects,
  selectedObjectId,
  onSelectObject,
  onCenterObject,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');

  const filteredObjects = objects.filter((obj) => {
    const matchesSearch =
      obj.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (obj.description && obj.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      String(obj.id).includes(searchQuery);

    const matchesType = filterType === 'all' || obj.cameraType === filterType;

    return matchesSearch && matchesType;
  });

  const getIconForType = (type: CameraType) => {
    switch (type) {
      case 'location_pin':
        return <MapPin className="w-3.5 h-3.5 text-emerald-400" />;
      case 'cctv_camera':
        return <Camera className="w-3.5 h-3.5 text-blue-400" />;
      case '360_camera':
        return <Video className="w-3.5 h-3.5 text-purple-400" />;
      case 'pat_camera':
        return <RotateCw className="w-3.5 h-3.5 text-amber-400" />;
    }
  };

  return (
    <div className="glass-panel p-3 rounded-xl border border-slate-700/60 shadow-xl flex flex-col max-h-[320px]">
      <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
        <div className="flex items-center space-x-1.5 text-xs font-semibold text-slate-200">
          <List className="w-4 h-4 text-cyan-400" />
          <span>Configured Objects ({objects.length})</span>
        </div>
      </div>

      <div className="space-y-1.5 mb-2">
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search items by name or ID..."
            className="w-full bg-dark-900 border border-slate-700 rounded-lg pl-8 pr-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-brand-500"
          />
        </div>

        <div className="flex items-center space-x-1 text-[11px] overflow-x-auto pb-1">
          {['all', 'location_pin', 'cctv_camera', '360_camera', 'pat_camera'].map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-2 py-0.5 rounded capitalize whitespace-nowrap transition-colors ${
                filterType === type
                  ? 'bg-brand-600 text-white font-medium'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {type === 'all'
                ? 'All'
                : type === 'location_pin'
                ? 'Places'
                : type === 'cctv_camera'
                ? 'CCTV'
                : type === '360_camera'
                ? '360°'
                : 'PAT'}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-1 pr-1">
        {filteredObjects.length === 0 ? (
          <div className="text-center py-4 text-xs text-slate-500 italic">No matching objects found.</div>
        ) : (
          filteredObjects.map((obj) => {
            const isSelected = String(obj.id) === String(selectedObjectId);
            return (
              <div
                key={obj.id}
                onClick={() => {
                  onSelectObject(obj.id);
                  onCenterObject(obj);
                }}
                className={`flex items-center justify-between p-2 rounded-lg cursor-pointer text-xs transition-all border ${
                  isSelected
                    ? 'bg-brand-500/20 border-brand-500/50 text-white font-medium'
                    : 'bg-dark-900/50 border-slate-800/60 hover:bg-slate-800/80 text-slate-300'
                }`}
              >
                <div className="flex items-center space-x-2 truncate">
                  {getIconForType(obj.cameraType)}
                  <span className="truncate">{obj.name}</span>
                </div>
                <div className="flex items-center space-x-1.5 text-[10px] text-slate-500 font-mono">
                  <span>ID:{obj.id}</span>
                  <ChevronRight className="w-3 h-3 text-slate-400" />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
