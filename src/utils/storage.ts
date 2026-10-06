import type { BuildingPolygon, MapObject } from '../types/config';

const DRAFT_STORAGE_KEY = 'dt_map_config_draft_v1';
const API_KEY_STORAGE_KEY = 'dt_map_google_api_key';

export interface DraftData {
  objects: MapObject[];
  buildings: BuildingPolygon[];
  originalRawJson: unknown | null;
  savedAt: string;
}

export function saveDraftToStorage(
  objects: MapObject[],
  buildings: BuildingPolygon[],
  originalRawJson: unknown | null
): void {
  try {
    if (!Array.isArray(objects) || !Array.isArray(buildings)) return;
    const draft: DraftData = {
      objects,
      buildings,
      originalRawJson,
      savedAt: new Date().toISOString(),
    };
    localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));
  } catch (err) {
    console.error('Failed to save draft to localStorage:', err);
  }
}

export function loadDraftFromStorage(): DraftData | null {
  try {
    const raw = localStorage.getItem(DRAFT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && Array.isArray(parsed.objects) && Array.isArray(parsed.buildings)) {
      return parsed as DraftData;
    }
    return null;
  } catch (err) {
    console.error('Failed to load draft from localStorage:', err);
    return null;
  }
}

export function clearDraftFromStorage(): void {
  try {
    localStorage.removeItem(DRAFT_STORAGE_KEY);
  } catch (err) {
    console.error('Failed to clear draft from localStorage:', err);
  }
}

export function saveCustomApiKey(key: string): void {
  try {
    localStorage.setItem(API_KEY_STORAGE_KEY, key.trim());
  } catch (err) {
    console.error('Failed to save custom API key:', err);
  }
}

export function getStoredApiKey(): string {
  try {
    return localStorage.getItem(API_KEY_STORAGE_KEY) || '';
  } catch {
    return '';
  }
}
