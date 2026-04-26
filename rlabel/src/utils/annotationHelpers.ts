import { Annotation, Point, AnnotationType } from '../types/annotation';

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function createAnnotation(
  type: AnnotationType,
  label: string,
  points: Point[],
  color: string = '#FF0000',
  extra?: Partial<Annotation>
): Annotation {
  return {
    id: generateId(),
    type,
    label,
    points: [...points],
    color,
    attributes: {},
    ...extra,
  };
}

export function calculateDistance(p1: Point, p2: Point): number {
  return Math.sqrt((p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2);
}

export function calculatePolygonArea(points: Point[]): number {
  if (points.length < 3) return 0;
  let area = 0;
  const n = points.length;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    area += points[i].x * points[j].y;
    area -= points[j].x * points[i].y;
  }
  return Math.abs(area) / 2;
}

export function calculatePolygonPerimeter(points: Point[]): number {
  if (points.length < 2) return 0;
  let perimeter = 0;
  const n = points.length;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    perimeter += calculateDistance(points[i], points[j]);
  }
  return perimeter;
}

export function isPointInPolygon(point: Point, polygon: Point[]): boolean {
  if (polygon.length < 3) return false;
  let inside = false;
  const n = polygon.length;
  for (let i = 0, j = n - 1; i < n; j = i++) {
    const xi = polygon[i].x, yi = polygon[i].y;
    const xj = polygon[j].x, yj = polygon[j].y;
    if (((yi > point.y) !== (yj > point.y)) &&
        (point.x < (xj - xi) * (point.y - yi) / (yj - yi) + xi)) {
      inside = !inside;
    }
  }
  return inside;
}

export function isPointNearLine(point: Point, lineStart: Point, lineEnd: Point, threshold: number = 5): boolean {
  const dist = pointToSegmentDistance(point, lineStart, lineEnd);
  return dist < threshold;
}

export function isPointNearPoint(point: Point, target: Point, threshold: number = 5): boolean {
  return calculateDistance(point, target) < threshold;
}

export function isPointInCircle(point: Point, center: Point, radius: number, tolerance: number = 5): boolean {
  const dist = calculateDistance(point, center);
  return Math.abs(dist - radius) < tolerance || dist < radius;
}

export function isPointOnCircleEdge(point: Point, center: Point, radius: number, tolerance: number = 5): boolean {
  const dist = calculateDistance(point, center);
  return Math.abs(dist - radius) < tolerance;
}

export function isPointInRotatedRect(point: Point, corners: Point[]): boolean {
  if (corners.length < 4) return false;
  return isPointInPolygon(point, corners);
}

export function isPointNearPolyline(point: Point, polyline: Point[], threshold: number = 5): boolean {
  for (let i = 0; i < polyline.length - 1; i++) {
    if (isPointNearLine(point, polyline[i], polyline[i + 1], threshold)) {
      return true;
    }
  }
  return false;
}

export function isPointInCuboid(point: Point, cuboidPoints: Point[]): boolean {
  if (cuboidPoints.length < 8) return false;
  const front = cuboidPoints.slice(0, 4);
  const back = cuboidPoints.slice(4, 8);
  return isPointInPolygon(point, front) || isPointInPolygon(point, back);
}

export function hitTestAnnotation(point: Point, annotation: Annotation, tolerance: number = 10): boolean {
  if (annotation.visible === false) return false;

  switch (annotation.type) {
    case 'point':
      return isPointNearPoint(point, annotation.points[0], tolerance);

    case 'line':
      return annotation.points.length >= 2 &&
        isPointNearLine(point, annotation.points[0], annotation.points[1], tolerance);

    case 'linestrip':
      return isPointNearPolyline(point, annotation.points, tolerance);

    case 'polygon':
    case 'rectangle':
    case 'quadrilateral':
      return isPointInPolygon(point, annotation.points);

    case 'rotatedRect':
      return isPointInRotatedRect(point, annotation.points);

    case 'circle': {
      if (annotation.points.length < 1) return false;
      const center = annotation.points[0];
      const radius = annotation.radius ?? (annotation.points.length >= 2
        ? calculateDistance(center, annotation.points[1])
        : 0);
      return isPointInCircle(point, center, radius, tolerance);
    }

    case 'cuboid':
      return isPointInCuboid(point, annotation.points);

    case 'text':
      return annotation.points.length >= 4 && isPointInPolygon(point, annotation.points);

    case 'mask':
      return isPointInPolygon(point, annotation.points);

    default:
      return false;
  }
}

export function getAnnotationCenter(annotation: Annotation): Point {
  if (annotation.points.length === 0) return { x: 0, y: 0 };
  if (annotation.points.length === 1) return annotation.points[0];

  let sumX = 0, sumY = 0;
  for (const point of annotation.points) {
    sumX += point.x;
    sumY += point.y;
  }
  return {
    x: sumX / annotation.points.length,
    y: sumY / annotation.points.length,
  };
}

export function getAnnotationBoundingBox(annotation: Annotation): { min: Point; max: Point } {
  if (annotation.points.length === 0) {
    return { min: { x: 0, y: 0 }, max: { x: 0, y: 0 } };
  }

  if (annotation.type === 'circle' && annotation.points.length >= 1) {
    const center = annotation.points[0];
    const radius = annotation.radius ?? (annotation.points.length >= 2
      ? calculateDistance(center, annotation.points[1])
      : 0);
    return {
      min: { x: center.x - radius, y: center.y - radius },
      max: { x: center.x + radius, y: center.y + radius },
    };
  }

  let minX = Infinity, minY = Infinity;
  let maxX = -Infinity, maxY = -Infinity;
  for (const point of annotation.points) {
    minX = Math.min(minX, point.x);
    minY = Math.min(minY, point.y);
    maxX = Math.max(maxX, point.x);
    maxY = Math.max(maxY, point.y);
  }
  return { min: { x: minX, y: minY }, max: { x: maxX, y: maxY } };
}

export function resizePoint(point: Point, scaleX: number, scaleY: number): Point {
  return { x: point.x * scaleX, y: point.y * scaleY };
}

export function rotatePoint(point: Point, center: Point, angle: number): Point {
  const radians = angle * Math.PI / 180;
  const cos = Math.cos(radians);
  const sin = Math.sin(radians);
  const dx = point.x - center.x;
  const dy = point.y - center.y;
  return {
    x: center.x + dx * cos - dy * sin,
    y: center.y + dx * sin + dy * cos,
  };
}

export function translatePoint(point: Point, dx: number, dy: number): Point {
  return { x: point.x + dx, y: point.y + dy };
}

export function rectToRotatedRect(
  topLeft: Point,
  bottomRight: Point,
  rotation: number = 0
): { center: Point; width: number; height: number; rotation: number; corners: Point[] } {
  const center: Point = {
    x: (topLeft.x + bottomRight.x) / 2,
    y: (topLeft.y + bottomRight.y) / 2,
  };
  const width = Math.abs(bottomRight.x - topLeft.x);
  const height = Math.abs(bottomRight.y - topLeft.y);
  const hw = width / 2;
  const hh = height / 2;

  const corners: Point[] = [
    { x: center.x - hw, y: center.y - hh },
    { x: center.x + hw, y: center.y - hh },
    { x: center.x + hw, y: center.y + hh },
    { x: center.x - hw, y: center.y + hh },
  ];

  const rotatedCorners = corners.map(p => rotatePoint(p, center, rotation));
  return { center, width, height, rotation, corners: rotatedCorners };
}

export function getRotatedRectParams(points: Point[]): {
  center: Point; width: number; height: number; rotation: number;
} {
  if (points.length < 4) return { center: { x: 0, y: 0 }, width: 0, height: 0, rotation: 0 };
  const center = getAnnotationCenter({ id: '', type: 'rotatedRect', label: '', points, color: '' });
  const width = calculateDistance(points[0], points[1]);
  const height = calculateDistance(points[1], points[2]);
  const dx = points[1].x - points[0].x;
  const dy = points[1].y - points[0].y;
  const rotation = Math.atan2(dy, dx) * 180 / Math.PI;
  return { center, width, height, rotation };
}

export function createCuboidFromRect(
  topLeft: Point, bottomRight: Point, depthRatio: number = 0.3
): Point[] {
  const w = bottomRight.x - topLeft.x;
  const h = bottomRight.y - topLeft.y;
  const dx = w * depthRatio;
  const dy = h * depthRatio;

  const front: Point[] = [
    topLeft,
    { x: bottomRight.x, y: topLeft.y },
    bottomRight,
    { x: topLeft.x, y: bottomRight.y },
  ];
  const back: Point[] = [
    { x: topLeft.x + dx, y: topLeft.y - dy },
    { x: bottomRight.x + dx, y: topLeft.y - dy },
    { x: bottomRight.x + dx, y: bottomRight.y - dy },
    { x: topLeft.x + dx, y: bottomRight.y - dy },
  ];
  return [...front, ...back];
}

export function simplifyPolygon(points: Point[], tolerance: number = 1): Point[] {
  if (points.length <= 2) return points;
  const start = points[0];
  const end = points[points.length - 1];
  let maxDist = 0;
  let maxIndex = 0;
  for (let i = 1; i < points.length - 1; i++) {
    const dist = pointToSegmentDistance(points[i], start, end);
    if (dist > maxDist) {
      maxDist = dist;
      maxIndex = i;
    }
  }
  if (maxDist > tolerance) {
    const left = simplifyPolygon(points.slice(0, maxIndex + 1), tolerance);
    const right = simplifyPolygon(points.slice(maxIndex), tolerance);
    return left.slice(0, -1).concat(right);
  }
  return [start, end];
}

function pointToSegmentDistance(point: Point, lineStart: Point, lineEnd: Point): number {
  const A = point.x - lineStart.x;
  const B = point.y - lineStart.y;
  const C = lineEnd.x - lineStart.x;
  const D = lineEnd.y - lineStart.y;
  const dot = A * C + B * D;
  const lenSq = C * C + D * D;
  let param = lenSq !== 0 ? dot / lenSq : -1;
  let xx: number, yy: number;
  if (param < 0) { xx = lineStart.x; yy = lineStart.y; }
  else if (param > 1) { xx = lineEnd.x; yy = lineEnd.y; }
  else { xx = lineStart.x + param * C; yy = lineStart.y + param * D; }
  return Math.sqrt((point.x - xx) ** 2 + (point.y - yy) ** 2);
}

export function formatAnnotationSize(annotation: Annotation): string {
  switch (annotation.type) {
    case 'point':
      return '1 point';
    case 'line': {
      const len = calculateDistance(annotation.points[0], annotation.points[1]);
      return `${len.toFixed(1)}px`;
    }
    case 'linestrip': {
      let total = 0;
      for (let i = 0; i < annotation.points.length - 1; i++) {
        total += calculateDistance(annotation.points[i], annotation.points[i + 1]);
      }
      return `${total.toFixed(1)}px (${annotation.points.length} pts)`;
    }
    case 'circle': {
      const r = annotation.radius ?? (annotation.points.length >= 2
        ? calculateDistance(annotation.points[0], annotation.points[1]) : 0);
      return `r=${r.toFixed(1)}px`;
    }
    case 'rotatedRect': {
      const params = getRotatedRectParams(annotation.points);
      return `${params.width.toFixed(0)}×${params.height.toFixed(0)} @${params.rotation.toFixed(1)}°`;
    }
    case 'cuboid':
      return `${annotation.points.length} vertices`;
    case 'text':
      return annotation.ocrText ? `"${annotation.ocrText.substring(0, 20)}"` : 'text region';
    case 'polygon':
    case 'rectangle':
    case 'quadrilateral':
    default: {
      const area = calculatePolygonArea(annotation.points);
      return `${area.toFixed(0)}px²`;
    }
  }
}

export function normalizePolygon(points: Point[]): Point[] {
  if (points.length < 3) return points;
  const centroid = getAnnotationCenter({ id: '', type: 'polygon', label: '', points, color: '' });
  let maxDist = 0;
  for (const point of points) {
    const dist = calculateDistance(point, centroid);
    if (dist > maxDist) maxDist = dist;
  }
  const scale = maxDist > 0 ? 1 / maxDist : 1;
  return points.map(p => ({
    x: (p.x - centroid.x) * scale + centroid.x,
    y: (p.y - centroid.y) * scale + centroid.y,
  }));
}

export function clampPoint(point: Point, width: number, height: number): Point {
  return {
    x: Math.max(0, Math.min(width, point.x)),
    y: Math.max(0, Math.min(height, point.y)),
  };
}
