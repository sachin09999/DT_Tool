import { useCallback, useEffect, useState } from 'react';
import type { BuildingPolygon, MapObject } from '../types/config';

export interface HistoryState {
  objects: MapObject[];
  buildings: BuildingPolygon[];
}

export function useHistory(initialObjects: MapObject[], initialBuildings: BuildingPolygon[]) {
  const [past, setPast] = useState<HistoryState[]>([]);
  const [present, setPresent] = useState<HistoryState>({
    objects: initialObjects,
    buildings: initialBuildings,
  });
  const [future, setFuture] = useState<HistoryState[]>([]);

  const canUndo = past.length > 0;
  const canRedo = future.length > 0;

  const pushState = useCallback(
    (newObjects: MapObject[], newBuildings: BuildingPolygon[]) => {
      setPast((prev) => [...prev, present]);
      setPresent({
        objects: newObjects,
        buildings: newBuildings,
      });
      setFuture([]);
    },
    [present]
  );

  const undo = useCallback(() => {
    if (!canUndo) return;
    const previous = past[past.length - 1];
    const newPast = past.slice(0, past.length - 1);

    setPast(newPast);
    setFuture((prev) => [present, ...prev]);
    setPresent(previous);
  }, [canUndo, past, present]);

  const redo = useCallback(() => {
    if (!canRedo) return;
    const next = future[0];
    const newFuture = future.slice(1);

    setPast((prev) => [...prev, present]);
    setPresent(next);
    setFuture(newFuture);
  }, [canRedo, future, present]);

  const resetHistory = useCallback((newObjects: MapObject[], newBuildings: BuildingPolygon[]) => {
    setPast([]);
    setPresent({ objects: newObjects, buildings: newBuildings });
    setFuture([]);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isInput =
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement;

      if (isInput) return;

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        if (e.shiftKey) {
          e.preventDefault();
          redo();
        } else {
          e.preventDefault();
          undo();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        redo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);

  return {
    objects: present.objects,
    buildings: present.buildings,
    pushState,
    undo,
    redo,
    canUndo,
    canRedo,
    resetHistory,
  };
}
