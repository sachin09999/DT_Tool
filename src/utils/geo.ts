/**
 * Geographic and local meter coordinate conversion utilities.
 * Uses Azimuthal / Equirectangular projection around a local geographic center
 * to allow accurate distance, grid layout, and polygon operations in meters.
 */

export interface LatLon {
  lat: number;
  lon: number;
}

export interface Point2D {
  x: number; // meters East
  y: number; // meters North
}

const EARTH_RADIUS = 6371000; // Earth mean radius in meters

/**
 * Converts Geographic Lat/Lon to Local Meters (X = East, Y = North)
 * centered relative to origin point (centerLat, centerLon).
 */
export function latLonToMeters(point: LatLon, origin: LatLon): Point2D {
  const dLat = (point.lat - origin.lat) * (Math.PI / 180);
  const dLon = (point.lon - origin.lon) * (Math.PI / 180);

  const centerLatRad = origin.lat * (Math.PI / 180);

  const x = dLon * EARTH_RADIUS * Math.cos(centerLatRad);
  const y = dLat * EARTH_RADIUS;

  return { x, y };
}

/**
 * Converts Local Meters (X = East, Y = North) back to Geographic Lat/Lon
 * relative to origin point (centerLat, centerLon).
 */
export function metersToLatLon(point: Point2D, origin: LatLon): LatLon {
  const centerLatRad = origin.lat * (Math.PI / 180);

  const dLat = point.y / EARTH_RADIUS;
  const dLon = point.x / (EARTH_RADIUS * Math.cos(centerLatRad));

  const lat = origin.lat + dLat * (180 / Math.PI);
  const lon = origin.lon + dLon * (180 / Math.PI);

  return { lat, lon };
}

/**
 * Calculates centroid of a set of geographic coordinates.
 */
export function calculateCentroid(points: LatLon[]): LatLon {
  if (points.length === 0) {
    return { lat: 0, lon: 0 };
  }
  let sumLat = 0;
  let sumLon = 0;
  for (const p of points) {
    sumLat += p.lat;
    sumLon += p.lon;
  }
  return {
    lat: sumLat / points.length,
    lon: sumLon / points.length,
  };
}

/**
 * Distance in meters between two lat/lon points using Haversine formula.
 */
export function haversineDistanceMeters(p1: LatLon, p2: LatLon): number {
  const dLat = (p2.lat - p1.lat) * (Math.PI / 180);
  const dLon = (p2.lon - p1.lon) * (Math.PI / 180);

  const lat1Rad = p1.lat * (Math.PI / 180);
  const lat2Rad = p2.lat * (Math.PI / 180);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1Rad) * Math.cos(lat2Rad);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return EARTH_RADIUS * c;
}

/**
 * Ray-casting algorithm to test if a local meter point (x, y) is inside a 2D polygon.
 */
export function isPointInPolygon2D(point: Point2D, polygon: Point2D[]): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x, yi = polygon[i].y;
    const xj = polygon[j].x, yj = polygon[j].y;

    const intersect =
      yi > point.y !== yj > point.y &&
      point.x < ((xj - xi) * (point.y - yi)) / (yj - yi) + xi;

    if (intersect) inside = !inside;
  }
  return inside;
}

/**
 * Test if a geographic point (lat, lon) is inside a polygon of geographic points.
 */
export function isPointInGeographicPolygon(point: LatLon, polygon: LatLon[]): boolean {
  if (polygon.length < 3) return true;
  const origin = calculateCentroid(polygon);
  const localPoint = latLonToMeters(point, origin);
  const localPoly = polygon.map((p) => latLonToMeters(p, origin));
  return isPointInPolygon2D(localPoint, localPoly);
}
