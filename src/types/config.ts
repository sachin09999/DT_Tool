export type CameraType = 'location_pin' | 'cctv_camera' | '360_camera' | 'pat_camera';

export interface Coordinates {
  lon: number;
  lat: number;
  height?: number;
}

export interface MapObject {
  id: number | string;
  name: string;
  description?: string;
  coordinates: Coordinates;
  cameraUrl?: string;
  cameraType: CameraType;
  // Preserve any unknown/custom fields from imported JSON
  [key: string]: unknown;
}

export interface BuildingPolygon {
  id: string;
  name: string;
  coordinates: { lat: number; lon: number }[];
  color?: string;
}

export interface ImportSummary {
  placesCount: number;
  cctvCount: number;
  camera360Count: number;
  patCount: number;
  invalidCount: number;
  totalCount: number;
}

export interface ValidationError {
  type: 'error' | 'warning';
  objectId?: number | string;
  message: string;
}

export type ToolMode = 'select' | 'move' | 'place' | 'cctv' | '360' | 'pat' | 'draw_building';

export type LayoutMode = 'grid' | 'perimeter' | 'corners' | 'evenly';

export interface LayoutConfig {
  rows: number;
  cols: number;
  marginMeters: number;
  mode: LayoutMode;
  targetCameraType: CameraType;
}

export interface LayerVisibility {
  location_pin: boolean;
  cctv_camera: boolean;
  '360_camera': boolean;
  pat_camera: boolean;
  building_polygons: boolean;
}

export interface AppState {
  objects: MapObject[];
  buildings: BuildingPolygon[];
  selectedObjectId: number | string | null;
  selectedBuildingId: string | null;
  toolMode: ToolMode;
  layerVisibility: LayerVisibility;
  originalRawJson: unknown | null;
  hasUnsavedChanges: boolean;
}
