import type { BuildingPolygon, MapObject } from '../types/config';

export interface SearchResult {
  id: string;
  title: string;
  subtitle: string;
  lat: number;
  lon: number;
  type: 'coord' | 'object' | 'building' | 'place';
  zoom: number;
  objectId?: number | string;
  buildingId?: string;
}

/**
 * Checks if a query string matches a lat,lon coordinate pattern.
 */
export function parseCoordinates(query: string): { lat: number; lon: number } | null {
  const trimmed = query.trim();
  // Matches "26.91149, 75.74598" or "26.91149 75.74598" or "26.91149; 75.74598"
  const regex = /^([+-]?\d+(?:\.\d+)?)[,\s;]+([+-]?\d+(?:\.\d+)?)$/;
  const match = trimmed.match(regex);
  if (!match) return null;

  const lat = parseFloat(match[1]);
  const lon = parseFloat(match[2]);

  if (!isNaN(lat) && !isNaN(lon) && lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180) {
    return { lat, lon };
  }
  return null;
}

/**
 * Calculates the polygon centroid for a building.
 */
function getBuildingCentroid(coords: { lat: number; lon: number }[]): { lat: number; lon: number } {
  if (coords.length === 0) return { lat: 0, lon: 0 };
  const sum = coords.reduce(
    (acc, c) => ({ lat: acc.lat + c.lat, lon: acc.lon + c.lon }),
    { lat: 0, lon: 0 }
  );
  return { lat: sum.lat / coords.length, lon: sum.lon / coords.length };
}

/**
 * Searches local objects and buildings matching the query.
 */
export function searchLocalEntities(
  query: string,
  objects: MapObject[],
  buildings: BuildingPolygon[]
): SearchResult[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  const results: SearchResult[] = [];

  // Match objects/cameras
  for (const obj of objects) {
    const matchName = obj.name.toLowerCase().includes(q);
    const matchDesc = obj.description?.toLowerCase().includes(q);
    const matchId = String(obj.id).toLowerCase().includes(q);
    const matchType = obj.cameraType.toLowerCase().includes(q);

    if (matchName || matchDesc || matchId || matchType) {
      results.push({
        id: `obj_${obj.id}`,
        title: obj.name || `Pin #${obj.id}`,
        subtitle: `${obj.cameraType.replace('_', ' ').toUpperCase()} • Lat: ${obj.coordinates.lat.toFixed(5)}, Lon: ${obj.coordinates.lon.toFixed(5)}`,
        lat: obj.coordinates.lat,
        lon: obj.coordinates.lon,
        type: 'object',
        zoom: 20,
        objectId: obj.id,
      });
    }
  }

  // Match buildings
  for (const b of buildings) {
    const matchName = b.name.toLowerCase().includes(q);
    const matchId = b.id.toLowerCase().includes(q);

    if (matchName || matchId) {
      const centroid = getBuildingCentroid(b.coordinates);
      results.push({
        id: `bld_${b.id}`,
        title: b.name,
        subtitle: `Building Polygon • ${b.coordinates.length} points`,
        lat: centroid.lat,
        lon: centroid.lon,
        type: 'building',
        zoom: 19,
        buildingId: b.id,
      });
    }
  }

  return results.slice(0, 4);
}

/**
 * Searches places worldwide via OpenStreetMap Nominatim with fallback to Photon.
 */
export async function searchPlacesOnline(
  query: string,
  signal?: AbortSignal
): Promise<SearchResult[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];

  // 1. Check if user typed coordinates
  const coords = parseCoordinates(trimmed);
  if (coords) {
    return [
      {
        id: `coord_${coords.lat}_${coords.lon}`,
        title: `Coordinates: ${coords.lat.toFixed(6)}, ${coords.lon.toFixed(6)}`,
        subtitle: 'Custom Latitude & Longitude location',
        lat: coords.lat,
        lon: coords.lon,
        type: 'coord',
        zoom: 19,
      },
    ];
  }

  // 2. Query Nominatim
  try {
    const nominatimUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
      trimmed
    )}&limit=5&addressdetails=1`;

    const res = await fetch(nominatimUrl, {
      signal,
      headers: {
        Accept: 'application/json',
      },
    });

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        return data.map((item: any) => {
          const lat = parseFloat(item.lat);
          const lon = parseFloat(item.lon);
          const parts = (item.display_name || '').split(',');
          const mainTitle = item.name || parts[0]?.trim() || trimmed;
          const subtitle = parts.slice(1, 4).join(',').trim() || item.display_name;

          // Determine appropriate zoom level based on place type/rank
          let zoom = 17;
          if (item.type === 'city' || item.type === 'administrative' || item.place_rank <= 16) {
            zoom = 13;
          } else if (item.place_rank <= 12) {
            zoom = 10;
          } else if (item.place_rank <= 8) {
            zoom = 6;
          }

          return {
            id: `nominatim_${item.place_id}`,
            title: mainTitle,
            subtitle: subtitle || item.display_name,
            lat,
            lon,
            type: 'place' as const,
            zoom,
          };
        });
      }
    }
  } catch (err: any) {
    if (err.name === 'AbortError') throw err;
    // Nominatim failed or rate-limited; fallback to Photon below
  }

  // 3. Fallback to Photon (Komoot)
  try {
    const photonUrl = `https://photon.komoot.io/api/?q=${encodeURIComponent(trimmed)}&limit=5`;
    const res = await fetch(photonUrl, { signal });
    if (res.ok) {
      const data = await res.json();
      if (data.features && Array.isArray(data.features)) {
        return data.features.map((feat: any, idx: number) => {
          const [lon, lat] = feat.geometry.coordinates;
          const props = feat.properties || {};
          const title = props.name || trimmed;
          const subtitleParts = [props.city, props.state, props.country].filter(Boolean);
          const subtitle = subtitleParts.join(', ') || props.type || 'Location';

          return {
            id: `photon_${idx}_${props.osm_id || Math.random()}`,
            title,
            subtitle,
            lat,
            lon,
            type: 'place' as const,
            zoom: props.type === 'city' ? 13 : props.type === 'country' ? 6 : 17,
          };
        });
      }
    }
  } catch (err: any) {
    if (err.name === 'AbortError') throw err;
  }

  return [];
}
