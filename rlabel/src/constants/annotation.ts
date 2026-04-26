import { AnnotationType, KeypointTemplate } from '../types/annotation';

export const COLORS = {
  annotations: [
    '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF',
    '#00FFFF', '#FFA500', '#800080', '#008080', '#FFC0CB',
    '#4B0082', '#008000', '#FFD700', '#FF6347', '#40E0D0',
    '#DC143C', '#00CED1', '#9400D3', '#FF8C00', '#00FA9A',
    '#1E90FF', '#B22222', '#228B22', '#DAA520', '#CD5C5C',
  ],
  selected: '#FF0000',
  hover: '#FFA500',
  grid: '#E0E0E0',
  selectionBox: '#0066FF',
  crosshair: '#FFFFFF',
  guideLine: 'rgba(255, 255, 255, 0.3)',
};

export const LINE_WIDTH = 2;
export const POINT_RADIUS = 5;
export const SELECTION_TOLERANCE = 10;
export const MIN_ZOOM = 0.05;
export const MAX_ZOOM = 50;
export const ZOOM_STEP = 0.1;
export const DEFAULT_ZOOM = 1;
export const VERTEX_RADIUS = 4;
export const CUBOID_DEPTH_RATIO = 0.3;

export const DEFAULT_LABELS = [
  'Person', 'Car', 'Building', 'Tree', 'Road',
  'Sign', 'Traffic Light', 'Other',
];

export const ANNOTATION_TYPES: { type: AnnotationType; label: string; icon: string; group: string }[] = [
  { type: 'point', label: 'Point', icon: '●', group: 'basic' },
  { type: 'line', label: 'Line', icon: '─', group: 'basic' },
  { type: 'linestrip', label: 'Line Strip', icon: '⌇', group: 'basic' },
  { type: 'polygon', label: 'Polygon', icon: '⬠', group: 'basic' },
  { type: 'rectangle', label: 'Rectangle', icon: '▭', group: 'detection' },
  { type: 'rotatedRect', label: 'Rotated Rect', icon: '◇', group: 'detection' },
  { type: 'circle', label: 'Circle', icon: '○', group: 'basic' },
  { type: 'cuboid', label: '3D Cuboid', icon: '⬡', group: 'detection' },
  { type: 'quadrilateral', label: 'Quadrilateral', icon: '◆', group: 'detection' },
  { type: 'text', label: 'Text', icon: 'T', group: 'ocr' },
];

export const TOOL_SHORTCUTS: Record<string, string> = {
  select: 'V',
  pan: 'H',
  rectangle: 'R',
  polygon: 'P',
  point: 'O',
  line: 'L',
  linestrip: 'Shift+L',
  circle: 'C',
  rotatedRect: 'E',
  cuboid: 'D',
  quadrilateral: 'Q',
  text: 'T',
  brush: 'B',
  eraser: 'X',
  sam: 'A',
};

export const COCO_PERSON_KEYPOINTS: KeypointTemplate = {
  name: 'person',
  keypoints: [
    'nose', 'left_eye', 'right_eye', 'left_ear', 'right_ear',
    'left_shoulder', 'right_shoulder', 'left_elbow', 'right_elbow',
    'left_wrist', 'right_wrist', 'left_hip', 'right_hip',
    'left_knee', 'right_knee', 'left_ankle', 'right_ankle',
  ],
  skeleton: [
    [0, 1], [0, 2], [1, 3], [2, 4],
    [5, 6], [5, 7], [7, 9], [6, 8], [8, 10],
    [5, 11], [6, 12], [11, 12],
    [11, 13], [13, 15], [12, 14], [14, 16],
  ],
  colors: [
    '#FF0000', '#FF5500', '#FFAA00', '#FFFF00', '#AAFF00',
    '#55FF00', '#00FF00', '#00FF55', '#00FFAA', '#00FFFF',
    '#00AAFF', '#0055FF', '#0000FF', '#5500FF', '#AA00FF',
    '#FF00FF', '#FF00AA',
  ],
};

export const SUPPORTED_IMAGE_EXTENSIONS = [
  '.jpg', '.jpeg', '.png', '.bmp', '.gif', '.webp', '.tiff', '.tif', '.svg',
];

export const SUPPORTED_VIDEO_EXTENSIONS = [
  '.mp4', '.avi', '.mov', '.mkv', '.wmv', '.flv', '.webm',
];

export const EXPORT_FORMAT_INFO: Record<string, { label: string; ext: string; desc: string }> = {
  json: { label: 'JSON', ext: 'json', desc: '通用格式' },
  yolo: { label: 'YOLO', ext: 'txt', desc: '目标检测 (HBB)' },
  yoloObb: { label: 'YOLO-OBB', ext: 'txt', desc: '旋转目标检测' },
  coco: { label: 'COCO', ext: 'json', desc: '实例分割' },
  voc: { label: 'VOC XML', ext: 'xml', desc: 'Pascal VOC' },
  labelme: { label: 'LabelMe', ext: 'json', desc: 'LabelMe 兼容' },
  dota: { label: 'DOTA', ext: 'txt', desc: '遥感旋转检测' },
  mot: { label: 'MOT', ext: 'txt', desc: '多目标跟踪' },
  mask: { label: 'MASK', ext: 'png', desc: '语义分割掩码' },
  ppocr: { label: 'PPOCR', ext: 'txt', desc: 'PaddleOCR 格式' },
  sharegpt: { label: 'ShareGPT', ext: 'json', desc: 'VLM 对话格式' },
};
