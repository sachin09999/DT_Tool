import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  Loader2,
  X,
  MapPin,
  Building2,
  Navigation,
  Camera,
  Globe,
} from 'lucide-react';
import type { BuildingPolygon, MapObject } from '../types/config';
import {
  searchLocalEntities,
  searchPlacesOnline,
  type SearchResult,
} from '../utils/geocoding';

interface MapSearchBarProps {
  objects: MapObject[];
  buildings: BuildingPolygon[];
  onSelectLocation: (result: SearchResult) => void;
}

const PRESET_PLACES: SearchResult[] = [
  {
    id: 'preset_jaipur',
    title: 'Jaipur Office (HQ)',
    subtitle: 'Jaipur, Rajasthan, India',
    lat: 26.911490938,
    lon: 75.74598256,
    type: 'place',
    zoom: 19,
  },
  {
    id: 'preset_dubai',
    title: 'Dubai Downtown',
    subtitle: 'Burj Khalifa & Downtown Dubai, UAE',
    lat: 25.197197,
    lon: 55.274376,
    type: 'place',
    zoom: 18,
  },
  {
    id: 'preset_udaipur',
    title: 'Udaipur City Palace',
    subtitle: 'Udaipur, Rajasthan, India',
    lat: 24.585445,
    lon: 73.712479,
    type: 'place',
    zoom: 18,
  },
];

export const MapSearchBar: React.FC<MapSearchBarProps> = ({
  objects,
  buildings,
  onSelectLocation,
}) => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced search when query changes
  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setResults([]);
      setIsLoading(false);
      setHasSearched(false);
      return;
    }

    // 1. Immediately get local matching objects & buildings
    const localMatches = searchLocalEntities(trimmed, objects, buildings);

    // 2. Fetch online places with 300ms debounce
    setIsLoading(true);
    setHasSearched(true);

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    const timer = setTimeout(async () => {
      try {
        const remoteMatches = await searchPlacesOnline(trimmed, abortController.signal);
        setResults([...localMatches, ...remoteMatches]);
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          console.warn('Geocoding search error:', err);
          setResults(localMatches);
        }
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => {
      clearTimeout(timer);
      abortController.abort();
    };
  }, [query, objects, buildings]);

  const handleSelect = (result: SearchResult) => {
    onSelectLocation(result);
    setQuery(result.title);
    setIsOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;

    if (results.length > 0) {
      handleSelect(results[0]);
      return;
    }

    // If results haven't returned yet, fetch directly and pick first
    setIsLoading(true);
    try {
      const localMatches = searchLocalEntities(trimmed, objects, buildings);
      if (localMatches.length > 0) {
        handleSelect(localMatches[0]);
        return;
      }

      const remoteMatches = await searchPlacesOnline(trimmed);
      if (remoteMatches.length > 0) {
        handleSelect(remoteMatches[0]);
      } else {
        setResults([]);
        setHasSearched(true);
        setIsOpen(true);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    setQuery('');
    setResults([]);
    setHasSearched(false);
  };

  const getResultIcon = (type: SearchResult['type']) => {
    switch (type) {
      case 'object':
        return <Camera className="w-3.5 h-3.5 text-emerald-400 shrink-0" />;
      case 'building':
        return <Building2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />;
      case 'coord':
        return <Navigation className="w-3.5 h-3.5 text-amber-400 shrink-0" />;
      default:
        return <MapPin className="w-3.5 h-3.5 text-blue-400 shrink-0" />;
    }
  };

  const getBadge = (type: SearchResult['type']) => {
    switch (type) {
      case 'object':
        return <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-950/70 border border-emerald-700/60 text-emerald-300">Pin</span>;
      case 'building':
        return <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-950/70 border border-cyan-700/60 text-cyan-300">Polygon</span>;
      case 'coord':
        return <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-950/70 border border-amber-700/60 text-amber-300">Coords</span>;
      default:
        return <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-950/70 border border-blue-700/60 text-blue-300">Place</span>;
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <form onSubmit={handleSubmit} className="relative flex items-center">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
          ) : (
            <Search className="w-4 h-4" />
          )}
        </div>

        <input
          type="text"
          value={query}
          onFocus={() => setIsOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          placeholder="Search any place, address, pin or coords..."
          className="bg-dark-800/90 border border-slate-700/80 rounded-xl pl-9 pr-8 py-1.5 text-xs text-slate-200 placeholder-slate-400 focus:outline-none focus:border-cyan-500 w-72 md:w-80 shadow-xl backdrop-blur-md transition-all"
        />

        {query && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 p-0.5 rounded-full transition-colors"
            title="Clear search"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </form>

      {/* Autocomplete / Results Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-1.5 w-80 md:w-96 bg-slate-900/95 border border-slate-700/90 rounded-xl shadow-2xl backdrop-blur-xl z-[2000] overflow-hidden max-h-80 overflow-y-auto">
          {query.trim().length === 0 ? (
            <div>
              <div className="px-3 py-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800 flex items-center justify-between">
                <span>Quick Landmarks</span>
                <Globe className="w-3 h-3 text-slate-500" />
              </div>
              {PRESET_PLACES.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handleSelect(preset)}
                  className="w-full text-left px-3 py-2 hover:bg-slate-800/80 flex items-center justify-between border-b border-slate-800/40 last:border-0 transition-colors"
                >
                  <div className="flex items-center space-x-2.5 min-w-0 pr-2">
                    <MapPin className="w-4 h-4 text-cyan-400 shrink-0" />
                    <div className="min-w-0">
                      <div className="text-xs font-medium text-slate-200 truncate">{preset.title}</div>
                      <div className="text-[10px] text-slate-400 truncate">{preset.subtitle}</div>
                    </div>
                  </div>
                  <span className="text-[10px] text-cyan-400/80 font-mono shrink-0">Preset</span>
                </button>
              ))}
            </div>
          ) : results.length > 0 ? (
            <div>
              <div className="px-3 py-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800 flex items-center justify-between">
                <span>Results ({results.length})</span>
                {isLoading && <Loader2 className="w-3 h-3 animate-spin text-cyan-400" />}
              </div>
              {results.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelect(item)}
                  className="w-full text-left px-3 py-2 hover:bg-cyan-950/40 hover:border-l-2 hover:border-l-cyan-400 px-2.5 flex items-center justify-between border-b border-slate-800/40 last:border-0 transition-all"
                >
                  <div className="flex items-center space-x-2.5 min-w-0 pr-2">
                    {getResultIcon(item.type)}
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-slate-100 truncate">{item.title}</div>
                      <div className="text-[10px] text-slate-400 truncate">{item.subtitle}</div>
                    </div>
                  </div>
                  <div className="shrink-0 ml-2">{getBadge(item.type)}</div>
                </button>
              ))}
            </div>
          ) : !isLoading && hasSearched ? (
            <div className="p-4 text-center">
              <MapPin className="w-6 h-6 text-slate-500 mx-auto mb-1.5 opacity-60" />
              <div className="text-xs text-slate-300 font-medium">No places found</div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                Try searching for another city, street, landmark, or paste lat,lon coordinates.
              </div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
};
