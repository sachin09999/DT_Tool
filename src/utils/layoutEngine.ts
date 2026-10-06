import type { LatLon, Point2D } from './geo';
import { calculateCentroid, isPointInPolygon2D, latLonToMeters, metersToLatLon } from './geo';
import type { BuildingPolygon, LayoutConfig } from '../types/config';

export interface GeneratedPosition {
  lat: number;
  lon: number;
  isInsideBuilding: boolean;
}

export function generateCameraLayout(
  targetCount: number,
  building: BuildingPolygon | null,
  centerAnchor: LatLon,
  config: LayoutConfig
): GeneratedPosition[] {
  if (targetCount <= 0) return [];

  const polygonGeo = building && building.coordinates.length >= 3 ? building.coordinates : null;
  const origin = polygonGeo ? calculateCentroid(polygonGeo) : centerAnchor;

  let localPolygon: Point2D[] = [];
  if (polygonGeo) {
    localPolygon = polygonGeo.map((p) => latLonToMeters(p, origin));
  }

  const resultLocalPoints: Point2D[] = [];

  if (localPolygon.length >= 3) {
    const minX = Math.min(...localPolygon.map((p) => p.x));
    const maxX = Math.max(...localPolygon.map((p) => p.x));
    const minY = Math.min(...localPolygon.map((p) => p.y));
    const maxY = Math.max(...localPolygon.map((p) => p.y));

    const margin = config.marginMeters || 2;
    const usableMinX = minX + margin;
    const usableMaxX = maxX - margin;
    const usableMinY = minY + margin;
    const usableMaxY = maxY - margin;

    const width = Math.max(1, usableMaxX - usableMinX);
    const height = Math.max(1, usableMaxY - usableMinY);

    if (config.mode === 'grid') {
      const rows = config.rows || Math.ceil(Math.sqrt(targetCount));
      const cols = config.cols || Math.ceil(targetCount / rows);

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          if (resultLocalPoints.length >= targetCount) break;

          const x = cols === 1 ? (usableMinX + usableMaxX) / 2 : usableMinX + (c / (cols - 1)) * width;
          const y = rows === 1 ? (usableMinY + usableMaxY) / 2 : usableMaxY - (r / (rows - 1)) * height;

          resultLocalPoints.push({ x, y });
        }
      }
    } else if (config.mode === 'corners') {
      for (let i = 0; i < targetCount; i++) {
        const polyIdx = i % localPolygon.length;
        const corner = localPolygon[polyIdx];
        const shrinkFactor = 0.85;
        resultLocalPoints.push({
          x: corner.x * shrinkFactor,
          y: corner.y * shrinkFactor,
        });
      }
    } else if (config.mode === 'perimeter') {
      const step = (width * 2 + height * 2) / targetCount;
      let curr = 0;
      for (let i = 0; i < targetCount; i++) {
        let x = usableMinX, y = usableMinY;
        if (curr < width) {
          x = usableMinX + curr;
          y = usableMaxY;
        } else if (curr < width + height) {
          x = usableMaxX;
          y = usableMaxY - (curr - width);
        } else if (curr < width * 2 + height) {
          x = usableMaxX - (curr - (width + height));
          y = usableMinY;
        } else {
          x = usableMinX;
          y = usableMinY + (curr - (width * 2 + height));
        }
        resultLocalPoints.push({ x, y });
        curr += step;
      }
    } else {
      const stepX = width / Math.max(1, Math.ceil(Math.sqrt(targetCount)));
      const stepY = height / Math.max(1, Math.ceil(Math.sqrt(targetCount)));
      let x = usableMinX + stepX / 2;
      let y = usableMaxY - stepY / 2;

      for (let i = 0; i < targetCount; i++) {
        resultLocalPoints.push({ x, y });
        x += stepX;
        if (x > usableMaxX) {
          x = usableMinX + stepX / 2;
          y -= stepY;
        }
      }
    }
  } else {
    const rows = config.rows || Math.ceil(Math.sqrt(targetCount));
    const cols = config.cols || Math.ceil(targetCount / rows);
    const spacing = 15;

    const startX = -((cols - 1) * spacing) / 2;
    const startY = ((rows - 1) * spacing) / 2;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (resultLocalPoints.length >= targetCount) break;
        resultLocalPoints.push({
          x: startX + c * spacing,
          y: startY - r * spacing,
        });
      }
    }
  }

  return resultLocalPoints.map((localPt) => {
    const geoPt = metersToLatLon(localPt, origin);
    const isInside = localPolygon.length >= 3 ? isPointInPolygon2D(localPt, localPolygon) : true;
    return {
      lat: geoPt.lat,
      lon: geoPt.lon,
      isInsideBuilding: isInside,
    };
  });
}
