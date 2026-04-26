import { ToolType } from '../types/annotation';

export interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  description: string;
  action: () => void;
}

export const DEFAULT_SHORTCUTS: KeyboardShortcut[] = [
  { key: 'v', description: '选择工具', action: () => {} },
  { key: 'o', description: '点工具', action: () => {} },
  { key: 'l', description: '线工具', action: () => {} },
  { key: 'p', description: '多边形工具', action: () => {} },
  { key: 'r', description: '矩形工具', action: () => {} },
  { key: 'c', description: '圆形工具', action: () => {} },
  { key: 'e', description: '旋转矩形', action: () => {} },
  { key: 'd', description: '3D长方体', action: () => {} },
  { key: 'q', description: '四边形', action: () => {} },
  { key: 't', description: '文本', action: () => {} },
  { key: 'a', description: 'AI分割', action: () => {} },
  { key: 'h', description: '平移', action: () => {} },
  { key: 'Delete', description: '删除选中', action: () => {} },
  { key: 'Backspace', description: '删除选中', action: () => {} },
  { key: 'Escape', description: '取消/取消选择', action: () => {} },
  { key: 'Enter', description: '完成多边形', action: () => {} },
  { key: 'z', ctrl: true, description: '撤销', action: () => {} },
  { key: 'y', ctrl: true, description: '重做', action: () => {} },
  { key: 's', ctrl: true, description: '保存标注', action: () => {} },
  { key: 'o', ctrl: true, description: '打开图像', action: () => {} },
  { key: 'a', ctrl: true, description: '全选', action: () => {} },
  { key: 'd', ctrl: true, description: '复制', action: () => {} },
  { key: 'ArrowLeft', ctrl: true, description: '上一张图像', action: () => {} },
  { key: 'ArrowRight', ctrl: true, description: '下一张图像', action: () => {} },
  { key: '+', description: '放大', action: () => {} },
  { key: '-', description: '缩小', action: () => {} },
  { key: '0', description: '重置视图', action: () => {} },
];

const TOOL_SHORTCUT_MAP: Partial<Record<ToolType, string>> = {
  select: 'V',
  point: 'O',
  line: 'L',
  linestrip: '⇧L',
  polygon: 'P',
  rectangle: 'R',
  rotatedRect: 'E',
  circle: 'C',
  cuboid: 'D',
  quadrilateral: 'Q',
  text: 'T',
  brush: 'B',
  eraser: 'X',
  move: 'M',
  pan: 'H',
  zoom: 'Z',
  sam: 'A',
  aiPolygon: '',
  aiRect: '',
};

export function getToolShortcut(tool: ToolType): string {
  return TOOL_SHORTCUT_MAP[tool] || '';
}
