export type AnnotationType =
  | 'point'
  | 'line'
  | 'linestrip'
  | 'polygon'
  | 'rectangle'
  | 'rotatedRect'
  | 'circle'
  | 'cuboid'
  | 'quadrilateral'
  | 'text'
  | 'mask';

export type ShapeGroup =
  | 'detection'
  | 'segmentation'
  | 'classification'
  | 'pose'
  | 'tracking'
  | 'ocr'
  | 'grounding';

export interface Point {
  x: number;
  y: number;
}

export interface Annotation {
  id: string;
  type: AnnotationType;
  label: string;
  points: Point[];
  color: string;
  attributes?: Record<string, string | number | boolean>;
  visible?: boolean;
  groupId?: string | null;
  description?: string;
  difficult?: boolean;
  iscrowd?: boolean;
  score?: number;
  flags?: Record<string, boolean>;

  rotation?: number;
  radius?: number;

  trackId?: number;
  frameIndex?: number;

  ocrText?: string;
  ocrConfidence?: number;

  keypointLabels?: string[];
  keypointVisible?: number[];

  classificationLabel?: string;

  maskRLE?: string;
  maskData?: number[][];
}

export interface ImageInfo {
  id: string;
  name: string;
  path: string;
  width: number;
  height: number;
  annotations: Annotation[];
  checked?: boolean;
  classificationLabel?: string;
  frameIndex?: number;
}

export interface VideoInfo {
  id: string;
  name: string;
  path: string;
  width: number;
  height: number;
  fps: number;
  totalFrames: number;
  duration: number;
}

export type ToolType =
  | 'select'
  | 'point'
  | 'line'
  | 'linestrip'
  | 'polygon'
  | 'rectangle'
  | 'rotatedRect'
  | 'circle'
  | 'cuboid'
  | 'quadrilateral'
  | 'text'
  | 'brush'
  | 'eraser'
  | 'move'
  | 'pan'
  | 'zoom'
  | 'sam'
  | 'aiPolygon'
  | 'aiRect';

export type ExportFormat =
  | 'json'
  | 'coco'
  | 'yolo'
  | 'yoloObb'
  | 'voc'
  | 'labelme'
  | 'dota'
  | 'mot'
  | 'mask'
  | 'ppocr'
  | 'sharegpt';

export interface ModelConfig {
  name: string;
  type: string;
  path: string;
  backend: 'onnx' | 'tensorrt' | 'opencv';
  taskType: ShapeGroup;
  inputSize?: [number, number];
  classes?: string[];
  confidenceThreshold?: number;
  nmsThreshold?: number;
}

export interface ProjectConfig {
  name: string;
  imageDir: string;
  outputDir: string;
  labels: LabelConfig[];
  defaultFormat: ExportFormat;
  autoSave: boolean;
  modelConfigs?: ModelConfig[];
}

export interface LabelConfig {
  name: string;
  color: string;
  shortcut?: string;
  attributes?: AttributeConfig[];
}

export interface AttributeConfig {
  name: string;
  type: 'text' | 'number' | 'boolean' | 'select';
  options?: string[];
  default?: string | number | boolean;
}

export interface KeypointTemplate {
  name: string;
  keypoints: string[];
  skeleton: [number, number][];
  colors: string[];
}
