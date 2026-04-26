'use client';

import { useEffect } from 'react';
import { useAnnotationStore } from '../store/annotationStore';
import { ToolType } from '../types/annotation';
import { MIN_ZOOM, MAX_ZOOM } from '../constants/annotation';

const toolShortcuts: Record<string, ToolType> = {
  'v': 'select',
  'h': 'pan',
  'r': 'rectangle',
  'p': 'polygon',
  'o': 'point',
  'l': 'line',
  'c': 'circle',
  'e': 'rotatedRect',
  'd': 'cuboid',
  'q': 'quadrilateral',
  't': 'text',
  'a': 'sam',
};

function zoomAroundCenter(newZoom: number) {
  const state = useAnnotationStore.getState();
  const oldZoom = state.zoom;
  if (newZoom === oldZoom) return;

  const canvas = document.querySelector('[data-canvas-container]') as HTMLElement | null;
  if (canvas) {
    const cw = canvas.clientWidth;
    const ch = canvas.clientHeight;
    const cx = cw / 2;
    const cy = ch / 2;
    const scale = newZoom / oldZoom;
    const newPanX = cx - (cx - state.pan.x) * scale;
    const newPanY = cy - (cy - state.pan.y) * scale;
    state.setZoom(newZoom);
    state.setPan({ x: newPanX, y: newPanY });
  } else {
    state.setZoom(newZoom);
  }
}

export function useKeyboardShortcuts() {
  const {
    setTool, undo, redo, deleteSelectedAnnotations, selectedIds,
    clearCurrentPoints, zoom, duplicateAnnotations,
    selectAll, deselectAll, moveAnnotations,
  } = useAnnotationStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      const key = e.key.toLowerCase();

      if (e.ctrlKey || e.metaKey) {
        switch (key) {
          case 'z': e.preventDefault(); if (e.shiftKey) redo(); else undo(); break;
          case 'y': e.preventDefault(); redo(); break;
          case 'a': e.preventDefault(); selectAll(); break;
          case 'd': e.preventDefault(); duplicateAnnotations(); break;
          case 's': e.preventDefault(); window.dispatchEvent(new CustomEvent('request-save')); break;
          case 'c': {
            e.preventDefault();
            const st = useAnnotationStore.getState();
            const sel = st.annotations.filter(a => st.selectedIds.includes(a.id));
            if (sel.length > 0) st.setClipboard(sel);
            break;
          }
          case 'v': e.preventDefault(); useAnnotationStore.getState().pasteAnnotations(); break;
        }
        return;
      }

      if (e.shiftKey && key === 'l') {
        e.preventDefault();
        setTool('linestrip');
        clearCurrentPoints();
        return;
      }

      if (toolShortcuts[key]) {
        e.preventDefault();
        setTool(toolShortcuts[key]);
        clearCurrentPoints();
        return;
      }

      switch (key) {
        case 'delete':
        case 'backspace':
          if (selectedIds.length > 0) { e.preventDefault(); deleteSelectedAnnotations(); }
          break;
        case 'escape':
          clearCurrentPoints();
          deselectAll();
          break;
        case '=': case '+':
          e.preventDefault();
          zoomAroundCenter(Math.min(zoom * 1.25, MAX_ZOOM));
          break;
        case '-':
          e.preventDefault();
          zoomAroundCenter(Math.max(zoom / 1.25, MIN_ZOOM));
          break;
        case 'arrowleft':
          if (selectedIds.length > 0) { e.preventDefault(); moveAnnotations(e.shiftKey ? -10 : -1, 0); }
          break;
        case 'arrowright':
          if (selectedIds.length > 0) { e.preventDefault(); moveAnnotations(e.shiftKey ? 10 : 1, 0); }
          break;
        case 'arrowup':
          if (selectedIds.length > 0) { e.preventDefault(); moveAnnotations(0, e.shiftKey ? -10 : -1); }
          break;
        case 'arrowdown':
          if (selectedIds.length > 0) { e.preventDefault(); moveAnnotations(0, e.shiftKey ? 10 : 1); }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setTool, undo, redo, deleteSelectedAnnotations, selectedIds, clearCurrentPoints,
      zoom, duplicateAnnotations, selectAll, deselectAll, moveAnnotations]);
}
