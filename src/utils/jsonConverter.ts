import type { BuildingPolygon, CameraType, ImportSummary, MapObject, ValidationError } from '../types/config';
import { isPointInGeographicPolygon } from './geo';

export interface ParseResult {
  objects: MapObject[];
  buildings: BuildingPolygon[];
  rawJson: unknown;
  summary: ImportSummary;
  errors: string[];
}

export function normalizeCameraType(typeStr?: string): CameraType {
  if (!typeStr) return 'cctv_camera';
  const lower = typeStr.toLowerCase();
  if (lower.includes('location') || lower.includes('place') || lower === 'location_pin') return 'location_pin';
  if (lower.includes('360') || lower === '360_camera') return '360_camera';
  if (lower.includes('pat') || lower === 'pat_camera') return 'pat_camera';
  return 'cctv_camera';
}

export function sanitizeObjectIds(objects: MapObject[]): MapObject[] {
  if (!Array.isArray(objects)) return [];
  const seenIds = new Set<string>();
  let nextId = 1000;

  return objects.map((obj, index) => {
    let id = obj.id;
    if (id === undefined || id === null || seenIds.has(String(id))) {
      while (seenIds.has(String(nextId))) {
        nextId++;
      }
      if (typeof obj.id === 'number') {
        id = nextId++;
      } else if (obj.id) {
        id = `${obj.id}_${index + 1}`;
      } else {
        id = nextId++;
      }

      if (seenIds.has(String(id))) {
        id = `obj_${Date.now()}_${index}`;
      }
    }
    seenIds.add(String(id));
    return {
      ...obj,
      id,
    };
  });
}

export function parseDTJson(jsonText: string): ParseResult {
  const errors: string[] = [];
  const objects: MapObject[] = [];
  const buildings: BuildingPolygon[] = [];

  let summary: ImportSummary = {
    placesCount: 0,
    cctvCount: 0,
    camera360Count: 0,
    patCount: 0,
    invalidCount: 0,
    totalCount: 0,
  };

  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonText);
  } catch (err) {
    return {
      objects: [],
      buildings: [],
      rawJson: null,
      summary,
      errors: [`Invalid JSON format: ${(err as Error).message}`],
    };
  }

  let itemsToProcess: unknown[] = [];

  if (Array.isArray(parsed)) {
    itemsToProcess = parsed;
  } else if (parsed && typeof parsed === 'object') {
    const obj = parsed as Record<string, unknown>;
    if (Array.isArray(obj.items)) itemsToProcess = obj.items;
    else if (Array.isArray(obj.locations)) itemsToProcess = obj.locations;
    else if (Array.isArray(obj.places)) itemsToProcess = [...(obj.places as unknown[])];
    else if (Array.isArray(obj.cameras)) itemsToProcess = [...itemsToProcess, ...(obj.cameras as unknown[])];
    else if (Array.isArray(obj.data)) itemsToProcess = obj.data;
    else {
      itemsToProcess = [obj];
    }

    if (Array.isArray(obj.buildings)) {
      (obj.buildings as unknown[]).forEach((b, idx) => {
        if (b && typeof b === 'object') {
          const bObj = b as Record<string, unknown>;
          if (Array.isArray(bObj.coordinates)) {
            buildings.push({
              id: (bObj.id as string) || `building_${idx + 1}`,
              name: (bObj.name as string) || `Building ${idx + 1}`,
              coordinates: bObj.coordinates as { lat: number; lon: number }[],
              color: (bObj.color as string) || '#3b82f6',
            });
          }
        }
      });
    }
  }

  const seenIds = new Set<string>();
  let nextId = 1000;

  itemsToProcess.forEach((item, index) => {
    if (!item || typeof item !== 'object') {
      summary.invalidCount++;
      errors.push(`Item at index ${index} is not a valid JSON object.`);
      return;
    }

    const rawObj = item as Record<string, unknown>;

    let lat: number | null = null;
    let lon: number | null = null;
    let height = 0;

    if (rawObj.coordinates && typeof rawObj.coordinates === 'object') {
      const coords = rawObj.coordinates as Record<string, unknown>;
      if (typeof coords.lat === 'number') lat = coords.lat;
      if (typeof coords.lon === 'number') lon = coords.lon;
      if (typeof coords.lng === 'number' && lon === null) lon = coords.lng;
      if (typeof coords.height === 'number') height = coords.height;
    } else {
      if (typeof rawObj.lat === 'number') lat = rawObj.lat;
      if (typeof rawObj.lon === 'number') lon = rawObj.lon;
      if (typeof rawObj.lng === 'number' && lon === null) lon = rawObj.lng;
    }

    if (lat === null || lon === null || isNaN(lat) || isNaN(lon)) {
      summary.invalidCount++;
      errors.push(`Item "${rawObj.name || index}" missing valid lat/lon coordinates.`);
      return;
    }

    const cameraType = normalizeCameraType(rawObj.cameraType as string);
    let id = rawObj.id as number | string | undefined;

    if (id === undefined || id === null || seenIds.has(String(id))) {
      while (seenIds.has(String(nextId))) {
        nextId++;
      }
      id = nextId++;
    }
    seenIds.add(String(id));

    const mapObject: MapObject = {
      ...rawObj,
      id,
      name: (rawObj.name as string) || `Object ${id}`,
      description: (rawObj.description as string) || '',
      coordinates: { lat, lon, height },
      cameraUrl: (rawObj.cameraUrl as string) || '',
      cameraType,
    };

    objects.push(mapObject);

    if (cameraType === 'location_pin') summary.placesCount++;
    else if (cameraType === 'cctv_camera') summary.cctvCount++;
    else if (cameraType === '360_camera') summary.camera360Count++;
    else if (cameraType === 'pat_camera') summary.patCount++;
  });

  const cleanObjects = sanitizeObjectIds(objects);
  summary.totalCount = cleanObjects.length;

  return {
    objects: cleanObjects,
    buildings,
    rawJson: parsed,
    summary,
    errors,
  };
}

export function validateDTConfig(objects: MapObject[], buildings: BuildingPolygon[]): ValidationError[] {
  const issues: ValidationError[] = [];
  const seenIds = new Set<string>();

  objects.forEach((obj, idx) => {
    if (!obj.name || obj.name.trim() === '') {
      issues.push({
        type: 'warning',
        objectId: obj.id,
        message: `Object #${idx + 1} (ID ${obj.id}) has no name.`,
      });
    }

    if (seenIds.has(String(obj.id))) {
      issues.push({
        type: 'error',
        objectId: obj.id,
        message: `Duplicate ID detected: ${obj.id}`,
      });
    }
    seenIds.add(String(obj.id));

    if (obj.coordinates.lat < -90 || obj.coordinates.lat > 90) {
      issues.push({
        type: 'error',
        objectId: obj.id,
        message: `Object "${obj.name}" has invalid latitude: ${obj.coordinates.lat}`,
      });
    }

    if (obj.coordinates.lon < -180 || obj.coordinates.lon > 180) {
      issues.push({
        type: 'error',
        objectId: obj.id,
        message: `Object "${obj.name}" has invalid longitude: ${obj.coordinates.lon}`,
      });
    }

    if (buildings.length > 0 && obj.cameraType !== 'location_pin') {
      const isInsideAny = buildings.some((b) => isPointInGeographicPolygon(obj.coordinates, b.coordinates));
      if (!isInsideAny) {
        issues.push({
          type: 'warning',
          objectId: obj.id,
          message: `Camera "${obj.name}" is positioned outside defined building footprint.`,
        });
      }
    }
  });

  return issues;
}

export function exportDTJson(
  objects: MapObject[],
  buildings: BuildingPolygon[],
  originalRawJson: unknown | null
): string {
  const serializedObjects = objects.map((obj) => {
    const clone = { ...obj };
    clone.coordinates = {
      lon: obj.coordinates.lon,
      lat: obj.coordinates.lat,
      height: obj.coordinates.height ?? 0,
    };
    return clone;
  });

  if (Array.isArray(originalRawJson)) {
    return JSON.stringify(serializedObjects, null, 2);
  } else if (originalRawJson && typeof originalRawJson === 'object') {
    const rawObj = JSON.parse(JSON.stringify(originalRawJson)) as Record<string, unknown>;

    if (Array.isArray(rawObj.items)) rawObj.items = serializedObjects;
    else if (Array.isArray(rawObj.locations)) rawObj.locations = serializedObjects;
    else if (Array.isArray(rawObj.places)) rawObj.places = serializedObjects;
    else if (Array.isArray(rawObj.cameras)) rawObj.cameras = serializedObjects;
    else if (Array.isArray(rawObj.data)) rawObj.data = serializedObjects;
    else rawObj.data = serializedObjects;

    if (buildings.length > 0) {
      rawObj.buildings = buildings;
    }

    return JSON.stringify(rawObj, null, 2);
  }

  const defaultExport: Record<string, unknown> = {
    data: serializedObjects,
  };
  if (buildings.length > 0) {
    defaultExport.buildings = buildings;
  }

  return JSON.stringify(serializedObjects, null, 2);
}
