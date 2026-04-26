import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Annotation, Point, ToolType, ExportFormat, LabelConfig } from '../types/annotation';

interface HistoryState {
  annotations: Annotation[];
  selectedIds: string[];
}

interface AnnotationState {
  annotations: Annotation[];
  selectedIds: string[];
  activeId: string | null;
  tool: ToolType;
  currentLabel: string;
  currentColor: string;

  zoom: number;
  pan: Point;
  isPanning: boolean;

  imageSrc: string;
  imageName: string;
  imageWidth: number;
  imageHeight: number;

  images: string[];
  currentImageIndex: number;

  history: HistoryState[];
  historyIndex: number;

  drawing: boolean;
  currentPoints: Point[];

  labels: LabelConfig[];

  clipboard: Annotation[];

  autoSave: boolean;
  defaultExportFormat: ExportFormat;

  imageCheckedMap: Record<string, boolean>;

  crosshairVisible: boolean;
  showLabels: boolean;
  fillOpacity: number;

  videoMode: boolean;
  currentFrameIndex: number;
  totalFrames: number;
  fps: number;
  videoPath: string;

  classificationLabel: string;

  setAnnotations: (annotations: Annotation[]) => void;
  addAnnotation: (annotation: Annotation) => void;
  updateAnnotation: (id: string, updates: Partial<Annotation>) => void;
  deleteAnnotation: (id: string) => void;
  deleteSelectedAnnotations: () => void;
  toggleAnnotationVisibility: (id: string, visible?: boolean) => void;
  updateAnnotationPoint: (id: string, pointIndex: number, newPoint: Point) => void;

  setClipboard: (annotations: Annotation[]) => void;
  pasteAnnotations: () => void;

  setSelectedIds: (ids: string[]) => void;
  selectAnnotation: (id: string | null, multi?: boolean) => void;
  setActiveId: (id: string | null) => void;

  setTool: (tool: ToolType) => void;
  setCurrentLabel: (label: string) => void;
  setCurrentColor: (color: string) => void;

  setZoom: (zoom: number) => void;
  setPan: (pan: Point) => void;
  setIsPanning: (isPanning: boolean) => void;

  setImage: (src: string, name: string, width: number, height: number) => void;
  clearImage: () => void;

  setImages: (images: string[]) => void;
  setCurrentImageIndex: (index: number) => void;

  undo: () => void;
  redo: () => void;
  pushHistory: () => void;

  setDrawing: (drawing: boolean) => void;
  setCurrentPoints: (points: Point[]) => void;
  addCurrentPoint: (point: Point) => void;
  clearCurrentPoints: () => void;

  getSelectedAnnotation: () => Annotation | undefined;

  addLabel: (label: LabelConfig) => void;
  removeLabel: (name: string) => void;
  updateLabel: (name: string, updates: Partial<LabelConfig>) => void;

  setAutoSave: (autoSave: boolean) => void;
  setDefaultExportFormat: (format: ExportFormat) => void;

  setImageChecked: (imageName: string, checked: boolean) => void;
  getImageChecked: (imageName: string) => boolean;

  setCrosshairVisible: (visible: boolean) => void;
  setShowLabels: (show: boolean) => void;
  setFillOpacity: (opacity: number) => void;

  setVideoMode: (mode: boolean) => void;
  setCurrentFrameIndex: (index: number) => void;
  setVideoInfo: (path: string, totalFrames: number, fps: number) => void;

  setClassificationLabel: (label: string) => void;

  selectAll: () => void;
  deselectAll: () => void;
  toggleAllVisibility: (visible: boolean) => void;
  duplicateAnnotations: () => void;
  moveAnnotations: (dx: number, dy: number) => void;
}

const DEFAULT_LABELS: LabelConfig[] = [
  { name: 'person', color: '#ef4444' },
  { name: 'car', color: '#3b82f6' },
  { name: 'building', color: '#22c55e' },
  { name: 'tree', color: '#16a34a' },
  { name: 'road', color: '#6b7280' },
];

const DEFAULT_COLOR = '#3b82f6';

export const useAnnotationStore = create<AnnotationState>()(
  persist(
    (set, get) => ({
      annotations: [],
      selectedIds: [],
      activeId: null,
      tool: 'select',
      currentLabel: DEFAULT_LABELS[0].name,
      currentColor: DEFAULT_COLOR,

      zoom: 1,
      pan: { x: 0, y: 0 },
      isPanning: false,

      imageSrc: '',
      imageName: '',
      imageWidth: 0,
      imageHeight: 0,

      images: [],
      currentImageIndex: -1,

      history: [],
      historyIndex: -1,

      drawing: false,
      currentPoints: [],

      labels: DEFAULT_LABELS,

      clipboard: [],

      autoSave: false,
      defaultExportFormat: 'json',

      imageCheckedMap: {},

      crosshairVisible: true,
      showLabels: true,
      fillOpacity: 0.2,

      videoMode: false,
      currentFrameIndex: 0,
      totalFrames: 0,
      fps: 30,
      videoPath: '',

      classificationLabel: '',

      setAnnotations: (annotations) => set({ annotations }),

      addAnnotation: (annotation) => {
        set((state) => ({
          annotations: [...state.annotations, annotation],
          selectedIds: [annotation.id],
          activeId: annotation.id,
        }));
      },

      updateAnnotation: (id, updates) => {
        set((state) => ({
          annotations: state.annotations.map((a) =>
            a.id === id ? { ...a, ...updates } : a
          ),
        }));
      },

      deleteAnnotation: (id) => {
        get().pushHistory();
        set((state) => ({
          annotations: state.annotations.filter((a) => a.id !== id),
          selectedIds: state.selectedIds.filter((sid) => sid !== id),
          activeId: state.activeId === id ? null : state.activeId,
        }));
      },

      deleteSelectedAnnotations: () => {
        const { selectedIds } = get();
        if (selectedIds.length === 0) return;
        get().pushHistory();
        set((state) => ({
          annotations: state.annotations.filter((a) => !selectedIds.includes(a.id)),
          selectedIds: [],
          activeId: null,
        }));
      },

      toggleAnnotationVisibility: (id, visible) => {
        set((state) => ({
          annotations: state.annotations.map(a =>
            a.id === id ? { ...a, visible: visible !== undefined ? visible : !(a.visible ?? true) } : a
          ),
        }));
      },

      updateAnnotationPoint: (id, pointIndex, newPoint) => {
        set((state) => ({
          annotations: state.annotations.map(a => {
            if (a.id !== id) return a;
            const newPoints = [...a.points];
            if (a.type === 'rectangle' && a.points.length === 4) {
              const oppIndex = (pointIndex + 2) % 4;
              const oppPoint = a.points[oppIndex];
              newPoints[0] = { x: Math.min(newPoint.x, oppPoint.x), y: Math.min(newPoint.y, oppPoint.y) };
              newPoints[1] = { x: Math.max(newPoint.x, oppPoint.x), y: Math.min(newPoint.y, oppPoint.y) };
              newPoints[2] = { x: Math.max(newPoint.x, oppPoint.x), y: Math.max(newPoint.y, oppPoint.y) };
              newPoints[3] = { x: Math.min(newPoint.x, oppPoint.x), y: Math.max(newPoint.y, oppPoint.y) };
            } else if (a.type === 'circle' && pointIndex === 1) {
              newPoints[pointIndex] = newPoint;
              const r = Math.sqrt((newPoint.x - a.points[0].x) ** 2 + (newPoint.y - a.points[0].y) ** 2);
              return { ...a, points: newPoints, radius: r };
            } else {
              newPoints[pointIndex] = newPoint;
            }
            return { ...a, points: newPoints };
          }),
        }));
      },

      setClipboard: (annotations) => set({ clipboard: annotations }),

      pasteAnnotations: () => {
        const { clipboard, pushHistory } = get();
        if (clipboard.length === 0) return;
        pushHistory();
        const offset = 20;
        const newAnnotations = clipboard.map(a => ({
          ...a,
          id: crypto.randomUUID(),
          points: a.points.map(p => ({ x: p.x + offset, y: p.y + offset })),
        }));
        set((state) => ({
          annotations: [...state.annotations, ...newAnnotations],
          selectedIds: newAnnotations.map(a => a.id),
          activeId: newAnnotations.length === 1 ? newAnnotations[0].id : null,
        }));
      },

      setSelectedIds: (ids) => set({ selectedIds: ids }),

      selectAnnotation: (id, multi = false) => {
        if (id === null) {
          set({ selectedIds: [], activeId: null });
          return;
        }
        set((state) => {
          if (multi) {
            const isSelected = state.selectedIds.includes(id);
            const newSelected = isSelected
              ? state.selectedIds.filter((sid) => sid !== id)
              : [...state.selectedIds, id];
            return { selectedIds: newSelected, activeId: id };
          }
          return { selectedIds: [id], activeId: id };
        });
      },

      setActiveId: (id) => set({ activeId: id }),

      setTool: (tool) => set({ tool, drawing: false, currentPoints: [] }),

      setCurrentLabel: (label) => {
        set({ currentLabel: label });
        const { selectedIds, annotations, pushHistory } = get();
        if (selectedIds.length > 0) {
          pushHistory();
          set({
            annotations: annotations.map(a =>
              selectedIds.includes(a.id) ? { ...a, label } : a
            ),
          });
        }
      },

      setCurrentColor: (color) => {
        set({ currentColor: color });
        const { selectedIds, annotations, pushHistory } = get();
        if (selectedIds.length > 0) {
          pushHistory();
          set({
            annotations: annotations.map(a =>
              selectedIds.includes(a.id) ? { ...a, color } : a
            ),
          });
        }
      },

      setZoom: (zoom) => set({ zoom: Math.max(0.05, Math.min(50, zoom)) }),

      setPan: (pan) => set({ pan }),

      setIsPanning: (isPanning) => set({ isPanning }),

      setImage: (src, name, width, height) => {
        set({
          imageSrc: src,
          imageName: name,
          imageWidth: width,
          imageHeight: height,
          annotations: [],
          selectedIds: [],
          activeId: null,
          history: [],
          historyIndex: -1,
        });
      },

      clearImage: () => set({
        imageSrc: '',
        imageName: '',
        imageWidth: 0,
        imageHeight: 0,
      }),

      setImages: (images) => set({ images }),

      setCurrentImageIndex: (index) => set({ currentImageIndex: index }),

      undo: () => {
        const { historyIndex, history } = get();
        if (historyIndex > 0) {
          const prevState = history[historyIndex - 1];
          set({
            annotations: prevState.annotations,
            selectedIds: prevState.selectedIds,
            historyIndex: historyIndex - 1,
          });
        }
      },

      redo: () => {
        const { historyIndex, history } = get();
        if (historyIndex < history.length - 1) {
          const nextState = history[historyIndex + 1];
          set({
            annotations: nextState.annotations,
            selectedIds: nextState.selectedIds,
            historyIndex: historyIndex + 1,
          });
        }
      },

      pushHistory: () => {
        const { annotations, selectedIds, history, historyIndex } = get();
        const newState: HistoryState = {
          annotations: JSON.parse(JSON.stringify(annotations)),
          selectedIds: [...selectedIds],
        };
        const newHistory = history.slice(0, historyIndex + 1);
        newHistory.push(newState);
        if (newHistory.length > 100) newHistory.shift();
        set({
          history: newHistory,
          historyIndex: Math.min(newHistory.length - 1, historyIndex + 1),
        });
      },

      setDrawing: (drawing) => set({ drawing }),

      setCurrentPoints: (points) => set({ currentPoints: points }),

      addCurrentPoint: (point) => set((state) => ({
        currentPoints: [...state.currentPoints, point],
      })),

      clearCurrentPoints: () => set({ currentPoints: [], drawing: false }),

      getSelectedAnnotation: () => {
        const { annotations, activeId } = get();
        return annotations.find((a) => a.id === activeId);
      },

      addLabel: (label) => {
        set((state) => ({
          labels: [...state.labels, label],
          currentLabel: label.name,
        }));
      },

      removeLabel: (name) => {
        set((state) => ({
          labels: state.labels.filter((l) => l.name !== name),
        }));
      },

      updateLabel: (name, updates) => {
        set((state) => ({
          labels: state.labels.map((l) =>
            l.name === name ? { ...l, ...updates } : l
          ),
        }));
      },

      setAutoSave: (autoSave) => set({ autoSave }),
      setDefaultExportFormat: (format) => set({ defaultExportFormat: format }),

      setImageChecked: (imageName, checked) => set((state) => ({
        imageCheckedMap: { ...state.imageCheckedMap, [imageName]: checked },
      })),
      getImageChecked: (imageName) => get().imageCheckedMap[imageName] ?? false,

      setCrosshairVisible: (visible) => set({ crosshairVisible: visible }),
      setShowLabels: (show) => set({ showLabels: show }),
      setFillOpacity: (opacity) => set({ fillOpacity: opacity }),

      setVideoMode: (mode) => set({ videoMode: mode }),
      setCurrentFrameIndex: (index) => set({ currentFrameIndex: index }),
      setVideoInfo: (path, totalFrames, fps) => set({ videoPath: path, totalFrames, fps }),

      setClassificationLabel: (label) => set({ classificationLabel: label }),

      selectAll: () => {
        const visibleIds = get().annotations.filter(a => a.visible !== false).map(a => a.id);
        set({ selectedIds: visibleIds });
      },

      deselectAll: () => set({ selectedIds: [], activeId: null }),

      toggleAllVisibility: (visible) => {
        set((state) => ({
          annotations: state.annotations.map(a => ({ ...a, visible })),
        }));
      },

      duplicateAnnotations: () => {
        const { selectedIds, annotations, pushHistory } = get();
        if (selectedIds.length === 0) return;
        pushHistory();
        const selected = annotations.filter(a => selectedIds.includes(a.id));
        const newAnnotations = selected.map(a => ({
          ...a,
          id: crypto.randomUUID(),
          points: a.points.map(p => ({ x: p.x + 15, y: p.y + 15 })),
        }));
        set((state) => ({
          annotations: [...state.annotations, ...newAnnotations],
          selectedIds: newAnnotations.map(a => a.id),
        }));
      },

      moveAnnotations: (dx, dy) => {
        const { selectedIds } = get();
        if (selectedIds.length === 0) return;
        set((state) => ({
          annotations: state.annotations.map(a => {
            if (!selectedIds.includes(a.id)) return a;
            return { ...a, points: a.points.map(p => ({ x: p.x + dx, y: p.y + dy })) };
          }),
        }));
      },
    }),
    {
      name: 'rlabel-annotation-store',
      partialize: (state) => ({
        labels: state.labels,
        autoSave: state.autoSave,
        defaultExportFormat: state.defaultExportFormat,
        crosshairVisible: state.crosshairVisible,
        showLabels: state.showLabels,
        fillOpacity: state.fillOpacity,
        imageCheckedMap: state.imageCheckedMap,
      }),
    }
  )
);
