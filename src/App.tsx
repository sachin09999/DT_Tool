import { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import type {
  BuildingPolygon,
  CameraType,
  LayerVisibility,
  LayoutConfig,
  MapObject,
  ToolMode,
} from './types/config';
import { useHistory } from './hooks/useHistory';
import { useGoogleMaps } from './hooks/useGoogleMaps';
import { Header } from './components/Header';
import { Toolbar } from './components/Toolbar';
import { LayerFilters } from './components/LayerFilters';
import { PropertiesPanel } from './components/PropertiesPanel';
import { ObjectList } from './components/ObjectList';
import { AutoLayoutPanel } from './components/AutoLayoutPanel';
import { BuildingEditor } from './components/BuildingEditor';
import { MapCanvas } from './components/MapCanvas';
import { ImportModal } from './components/ImportModal';
import { ValidationModal } from './components/ValidationModal';
import { ApiKeyModal } from './components/ApiKeyModal';
import {
  exportDTJson,
  parseDTJson,
  sanitizeObjectIds,
  validateDTConfig,
} from './utils/jsonConverter';
import {
  clearDraftFromStorage,
  loadDraftFromStorage,
  saveDraftToStorage,
} from './utils/storage';
import { generateCameraLayout } from './utils/layoutEngine';

import sampleJaipurText from './data/sampleJaipur.json?raw';

export function App() {
  const initialJaipurResult = parseDTJson(sampleJaipurText);

  const savedDraft = loadDraftFromStorage();
  const rawInitialObjects = (savedDraft && Array.isArray(savedDraft.objects)) ? savedDraft.objects : (initialJaipurResult.objects || []);
  const initialObjects = sanitizeObjectIds(rawInitialObjects);
  const initialBuildings = (savedDraft && Array.isArray(savedDraft.buildings)) ? savedDraft.buildings : (initialJaipurResult.buildings || []);

  const {
    objects = [],
    buildings = [],
    pushState,
    undo,
    redo,
    canUndo,
    canRedo,
    resetHistory,
  } = useHistory(initialObjects, initialBuildings);

  const [originalRawJson, setOriginalRawJson] = useState<unknown | null>(
    savedDraft ? savedDraft.originalRawJson : initialJaipurResult.rawJson
  );
  const [selectedObjectId, setSelectedObjectId] = useState<number | string | null>(null);
  const [selectedBuildingId, setSelectedBuildingId] = useState<string | null>(null);
  const [activeTool, setActiveTool] = useState<ToolMode>('select');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const [activeSidebarTab, setActiveSidebarTab] = useState<'objects' | 'layout' | 'buildings'>('objects');

  const [layerVisibility, setLayerVisibility] = useState<LayerVisibility>({
    location_pin: true,
    cctv_camera: true,
    '360_camera': true,
    pat_camera: true,
    building_polygons: true,
  });

  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isValidationOpen, setIsValidationOpen] = useState(false);
  const [isApiKeyOpen, setIsApiKeyOpen] = useState(false);

  const { updateApiKey } = useGoogleMaps();

  const selectedObject = objects.find((o) => String(o.id) === String(selectedObjectId)) || null;
  const validationIssues = validateDTConfig(objects, buildings);

  useEffect(() => {
    saveDraftToStorage(objects, buildings, originalRawJson);
    setHasUnsavedChanges(true);
  }, [objects, buildings, originalRawJson]);

  const handleUpdateObject = (updated: MapObject) => {
    const newObjects = objects.map((o) => (String(o.id) === String(updated.id) ? updated : o));
    pushState(newObjects, buildings);
  };

  const handleUpdateObjectCoordinates = (id: number | string, lat: number, lon: number) => {
    const newObjects = objects.map((o) => {
      if (String(o.id) === String(id)) {
        return {
          ...o,
          coordinates: {
            ...o.coordinates,
            lat,
            lon,
          },
        };
      }
      return o;
    });
    pushState(newObjects, buildings);
  };

  const handleCreateObject = (type: CameraType, lat: number, lon: number) => {
    const existingIds = new Set(objects.map((o) => String(o.id)));
    let newId = Date.now();
    while (existingIds.has(String(newId))) {
      newId++;
    }

    const typeLabel =
      type === 'location_pin'
        ? 'Place Pin'
        : type === 'cctv_camera'
        ? 'CCTV Cam'
        : type === '360_camera'
        ? '360 Cam'
        : 'PAT Patrol Cam';

    const newObj: MapObject = {
      id: newId,
      name: `${typeLabel} #${newId.toString().slice(-4)}`,
      description: 'New position created on map',
      coordinates: { lat, lon, height: 0 },
      cameraUrl: type === 'location_pin' ? '' : `rtsp://192.168.1.${Math.floor(Math.random() * 200 + 10)}/stream`,
      cameraType: type,
    };

    const newObjects = [...objects, newObj];
    pushState(newObjects, buildings);
    setSelectedObjectId(newId);
    setActiveTool('select');
  };

  const handleDeleteObject = (id: number | string) => {
    const newObjects = objects.filter((o) => String(o.id) !== String(id));
    pushState(newObjects, buildings);
    if (String(selectedObjectId) === String(id)) setSelectedObjectId(null);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isInput =
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement;

      if (isInput) return;

      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedObjectId !== null && selectedObjectId !== undefined) {
          handleDeleteObject(selectedObjectId);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedObjectId, objects, buildings]);

  const handleCreateBuilding = (building: BuildingPolygon) => {
    const newBuildings = [...buildings, building];
    pushState(objects, newBuildings);
    setSelectedBuildingId(building.id);
    setActiveTool('select');
  };

  const handleDeleteBuilding = (id: string) => {
    const newBuildings = buildings.filter((b) => b.id !== id);
    pushState(objects, newBuildings);
    if (selectedBuildingId === id) setSelectedBuildingId(null);
  };

  const handleGenerateLayout = (cameraCount: number, config: LayoutConfig) => {
    const targetBuilding = buildings.find((b) => b.id === selectedBuildingId) || null;
    const centerAnchor =
      objects.length > 0
        ? { lat: objects[0].coordinates.lat, lon: objects[0].coordinates.lon }
        : { lat: 26.911490938, lon: 75.745982560 };

    const positions = generateCameraLayout(cameraCount, targetBuilding, centerAnchor, config);

    const existingIds = new Set(objects.map((o) => String(o.id)));
    let nextId = Date.now();

    const newGeneratedObjects: MapObject[] = positions.map((pos, idx) => {
      while (existingIds.has(String(nextId))) {
        nextId++;
      }
      const currentId = nextId++;
      existingIds.add(String(currentId));

      return {
        id: currentId,
        name: `Jaipur-Office Cam${idx + 1}`,
        description: `Auto-generated ${config.mode} layout camera ${idx + 1}`,
        coordinates: { lat: pos.lat, lon: pos.lon, height: 2.5 },
        cameraUrl: `rtsp://admin:pass@192.168.1.${100 + idx}/stream1`,
        cameraType: config.targetCameraType,
        someFutureField: `GEN_SEC_${idx + 1}`,
      };
    });

    const nonCameraObjects = objects.filter((o) => o.cameraType === 'location_pin');
    const newObjectsList = [...nonCameraObjects, ...newGeneratedObjects];

    pushState(newObjectsList, buildings);

    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
    });
  };

  const handleImportConfirmed = (
    newObjects: MapObject[],
    newBuildings: BuildingPolygon[],
    rawJson: unknown
  ) => {
    const cleanObjects = sanitizeObjectIds(newObjects);
    setOriginalRawJson(rawJson);
    resetHistory(cleanObjects, newBuildings);
    setSelectedObjectId(null);

    confetti({
      particleCount: 100,
      spread: 90,
      origin: { y: 0.5 },
    });
  };

  const handleLoadSampleJaipur = () => {
    const parsed = parseDTJson(sampleJaipurText);
    setOriginalRawJson(parsed.rawJson);
    resetHistory(parsed.objects, parsed.buildings);
    setSelectedObjectId(314);
  };

  const handleExport = () => {
    const jsonStr = exportDTJson(objects, buildings, originalRawJson);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    const dateStr = new Date().toISOString().slice(0, 10);
    link.download = `dt-config-${dateStr}.json`;
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
    setHasUnsavedChanges(false);
  };

  const handleSaveDraft = () => {
    saveDraftToStorage(objects, buildings, originalRawJson);
    alert('Draft saved to local browser storage.');
  };

  const handleClearDraft = () => {
    if (confirm('Are you sure you want to clear the saved draft?')) {
      clearDraftFromStorage();
      handleLoadSampleJaipur();
    }
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-dark-900 overflow-hidden font-sans text-slate-100">
      <Header
        onOpenImport={() => setIsImportOpen(true)}
        onExport={handleExport}
        onSaveDraft={handleSaveDraft}
        onClearDraft={handleClearDraft}
        onUndo={undo}
        onRedo={redo}
        canUndo={canUndo}
        canRedo={canRedo}
        validationIssues={validationIssues}
        onOpenValidation={() => setIsValidationOpen(true)}
        onOpenSettings={() => setIsApiKeyOpen(true)}
        onLoadSampleJaipur={handleLoadSampleJaipur}
        objectCount={objects.length}
        hasUnsavedChanges={hasUnsavedChanges}
      />

      <div className="flex-1 relative flex overflow-hidden">
        <Toolbar
          activeTool={activeTool}
          onSelectTool={(tool) => setActiveTool(tool)}
          selectedObjectId={selectedObjectId}
          onClearSelection={() => setSelectedObjectId(null)}
        />

        <div className="flex-1 relative h-full">
          <MapCanvas
            objects={objects}
            buildings={buildings}
            selectedObjectId={selectedObjectId}
            selectedBuildingId={selectedBuildingId}
            activeTool={activeTool}
            layerVisibility={layerVisibility}
            onSelectObject={(id) => {
              setSelectedObjectId(id);
              if (id !== null && ['place', 'cctv', '360', 'pat'].includes(activeTool)) {
                setActiveTool('select');
              }
            }}
            onSelectBuilding={(id) => setSelectedBuildingId(id)}
            onUpdateObjectCoordinates={handleUpdateObjectCoordinates}
            onCreateObject={handleCreateObject}
            onCreateBuilding={handleCreateBuilding}
          />

          <div className="absolute bottom-4 left-4 z-20 max-w-[220px]">
            <LayerFilters
              visibility={layerVisibility}
              onToggleLayer={(layer) =>
                setLayerVisibility((prev) => ({ ...prev, [layer]: !prev[layer] }))
              }
            />
          </div>
        </div>

        <div className="w-80 lg:w-96 bg-dark-800/95 border-l border-slate-800 p-4 flex flex-col space-y-3 z-20 shadow-2xl overflow-y-auto">
          {selectedObject && (
            <PropertiesPanel
              selectedObject={selectedObject}
              onUpdateObject={handleUpdateObject}
              onDeleteObject={handleDeleteObject}
              onClose={() => setSelectedObjectId(null)}
            />
          )}

          <div className="flex items-center space-x-1 bg-dark-900 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setActiveSidebarTab('objects')}
              className={`flex-1 py-1.5 rounded-lg font-semibold transition-all ${
                activeSidebarTab === 'objects'
                  ? 'bg-brand-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Objects ({objects.length})
            </button>
            <button
              onClick={() => setActiveSidebarTab('layout')}
              className={`flex-1 py-1.5 rounded-lg font-semibold transition-all ${
                activeSidebarTab === 'layout'
                  ? 'bg-brand-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Auto Layout
            </button>
            <button
              onClick={() => setActiveSidebarTab('buildings')}
              className={`flex-1 py-1.5 rounded-lg font-semibold transition-all ${
                activeSidebarTab === 'buildings'
                  ? 'bg-brand-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Buildings ({buildings.length})
            </button>
          </div>

          {activeSidebarTab === 'objects' && (
            <ObjectList
              objects={objects}
              selectedObjectId={selectedObjectId}
              onSelectObject={(id) => setSelectedObjectId(id)}
              onCenterObject={() => {}}
            />
          )}

          {activeSidebarTab === 'layout' && (
            <AutoLayoutPanel
              buildings={buildings}
              selectedBuildingId={selectedBuildingId}
              onSelectBuilding={(id) => setSelectedBuildingId(id)}
              onGenerateLayout={handleGenerateLayout}
              totalCamerasCount={objects.filter((o) => o.cameraType !== 'location_pin').length}
            />
          )}

          {activeSidebarTab === 'buildings' && (
            <BuildingEditor
              buildings={buildings}
              selectedBuildingId={selectedBuildingId}
              onSelectBuilding={(id) => setSelectedBuildingId(id)}
              onDeleteBuilding={handleDeleteBuilding}
              onStartDrawing={() => setActiveTool('draw_building')}
            />
          )}
        </div>
      </div>

      <ImportModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onImportConfirmed={handleImportConfirmed}
        onLoadSampleJaipur={handleLoadSampleJaipur}
      />

      <ValidationModal
        isOpen={isValidationOpen}
        onClose={() => setIsValidationOpen(false)}
        issues={validationIssues}
        onSelectObject={(id) => setSelectedObjectId(id)}
      />

      <ApiKeyModal
        isOpen={isApiKeyOpen}
        onClose={() => setIsApiKeyOpen(false)}
        onSaveKey={updateApiKey}
      />
    </div>
  );
}

export default App;
