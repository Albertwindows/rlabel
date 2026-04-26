import { Annotation, ExportFormat, LabelConfig, Point } from '../types/annotation';
import { getRotatedRectParams, calculateDistance } from './annotationHelpers';

// ======================== EXPORT ========================

export function exportToFormat(
  annotations: Annotation[],
  imageInfo: any,
  format: ExportFormat,
  labels?: LabelConfig[]
): string {
  switch (format) {
    case 'json': return exportAnnotationsJSON(annotations, imageInfo);
    case 'coco': return JSON.stringify(exportAnnotationsCOCO(annotations, imageInfo), null, 2);
    case 'yolo': return exportAnnotationsYOLO(annotations, imageInfo.width, imageInfo.height, labels);
    case 'yoloObb': return exportAnnotationsYOLOOBB(annotations, imageInfo.width, imageInfo.height, labels);
    case 'voc': return exportAnnotationsVOC(annotations, imageInfo);
    case 'labelme': return exportAnnotationsLabelme(annotations, imageInfo);
    case 'dota': return exportAnnotationsDOTA(annotations, labels);
    case 'mot': return exportAnnotationsMOT(annotations);
    case 'ppocr': return exportAnnotationsPPOCR(annotations, imageInfo);
    case 'sharegpt': return exportAnnotationsShareGPT(annotations, imageInfo);
    default: return exportAnnotationsJSON(annotations, imageInfo);
  }
}

export function exportAnnotationsJSON(annotations: Annotation[], imageInfo: any): string {
  return JSON.stringify({ ...imageInfo, annotations }, null, 2);
}

export interface COCOAnnotation {
  id: number; image_id: number; category_id: number;
  segmentation: number[][] | undefined; area: number; bbox: number[]; iscrowd: number;
}

export interface COCOFormat {
  images: Array<{ id: number; file_name: string; width: number; height: number }>;
  annotations: COCOAnnotation[];
  categories: Array<{ id: number; name: string; supercategory?: string }>;
}

export function exportAnnotationsCOCO(annotations: Annotation[], imageInfo: any): COCOFormat {
  const categories = Array.from(new Set(annotations.map(a => a.label)))
    .map((label, index) => ({ id: index + 1, name: label, supercategory: 'object' }));

  const cocoAnnotations: COCOAnnotation[] = annotations.map((a, index) => {
    const category = categories.find(c => c.name === a.label);
    const bbox = getBoundingBox(a);
    const area = bbox[2] * bbox[3];
    let segmentation: number[][] | undefined;
    if (['polygon', 'rectangle', 'quadrilateral', 'rotatedRect'].includes(a.type)) {
      segmentation = [a.points.flatMap(p => [p.x, p.y])];
    }
    return {
      id: index + 1, image_id: 1, category_id: category?.id ?? 0,
      segmentation, area, bbox, iscrowd: a.iscrowd ? 1 : 0,
    };
  });

  return {
    images: [{ id: 1, file_name: imageInfo.name, width: imageInfo.width, height: imageInfo.height }],
    annotations: cocoAnnotations,
    categories,
  };
}

export function exportAnnotationsYOLO(
  annotations: Annotation[], imageWidth: number, imageHeight: number, labels?: LabelConfig[]
): string {
  return annotations.map(a => {
    const bbox = getBoundingBox(a);
    const cx = (bbox[0] + bbox[2] / 2) / imageWidth;
    const cy = (bbox[1] + bbox[3] / 2) / imageHeight;
    const w = bbox[2] / imageWidth;
    const h = bbox[3] / imageHeight;
    const classId = getClassId(a.label, labels);

    if (a.type === 'polygon' && a.points.length >= 3) {
      const segPoints = a.points.map(p => `${(p.x / imageWidth).toFixed(6)} ${(p.y / imageHeight).toFixed(6)}`).join(' ');
      return `${classId} ${segPoints}`;
    }
    return `${classId} ${cx.toFixed(6)} ${cy.toFixed(6)} ${w.toFixed(6)} ${h.toFixed(6)}`;
  }).join('\n');
}

export function exportAnnotationsYOLOOBB(
  annotations: Annotation[], imageWidth: number, imageHeight: number, labels?: LabelConfig[]
): string {
  return annotations.filter(a => a.type === 'rotatedRect' || a.type === 'rectangle').map(a => {
    const classId = getClassId(a.label, labels);
    const pts = a.points.slice(0, 4);
    const coords = pts.map(p => `${(p.x / imageWidth).toFixed(6)} ${(p.y / imageHeight).toFixed(6)}`).join(' ');
    return `${classId} ${coords}`;
  }).join('\n');
}

export function exportAnnotationsVOC(annotations: Annotation[], imageInfo: any): string {
  const objects = annotations.map(a => {
    const bbox = getBoundingBox(a);
    if (a.type === 'rotatedRect') {
      const params = getRotatedRectParams(a.points);
      return `  <object>
    <name>${escapeXml(a.label)}</name>
    <pose>Unspecified</pose>
    <truncated>0</truncated>
    <difficult>${a.difficult ? 1 : 0}</difficult>
    <robndbox>
      <cx>${params.center.x.toFixed(1)}</cx>
      <cy>${params.center.y.toFixed(1)}</cy>
      <w>${params.width.toFixed(1)}</w>
      <h>${params.height.toFixed(1)}</h>
      <angle>${(params.rotation * Math.PI / 180).toFixed(4)}</angle>
    </robndbox>
  </object>`;
    }
    return `  <object>
    <name>${escapeXml(a.label)}</name>
    <pose>Unspecified</pose>
    <truncated>0</truncated>
    <difficult>${a.difficult ? 1 : 0}</difficult>
    <bndbox>
      <xmin>${Math.round(bbox[0])}</xmin>
      <ymin>${Math.round(bbox[1])}</ymin>
      <xmax>${Math.round(bbox[0] + bbox[2])}</xmax>
      <ymax>${Math.round(bbox[1] + bbox[3])}</ymax>
    </bndbox>
  </object>`;
  }).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<annotation>
  <folder>${imageInfo.folder || ''}</folder>
  <filename>${escapeXml(imageInfo.name)}</filename>
  <path>${escapeXml(imageInfo.path || '')}</path>
  <source><database>RLabel</database></source>
  <size>
    <width>${imageInfo.width}</width>
    <height>${imageInfo.height}</height>
    <depth>3</depth>
  </size>
  <segmented>0</segmented>
${objects}
</annotation>`;
}

export function exportAnnotationsLabelme(annotations: Annotation[], imageInfo: any): string {
  const shapes = annotations.map(a => {
    let shape_type = 'polygon';
    let points: number[][] = [];

    switch (a.type) {
      case 'rectangle':
        shape_type = 'rectangle';
        points = [[a.points[0].x, a.points[0].y], [a.points[2].x, a.points[2].y]];
        break;
      case 'polygon': shape_type = 'polygon'; points = a.points.map(p => [p.x, p.y]); break;
      case 'point': shape_type = 'point'; points = [[a.points[0].x, a.points[0].y]]; break;
      case 'line': shape_type = 'line'; points = a.points.map(p => [p.x, p.y]); break;
      case 'linestrip': shape_type = 'linestrip'; points = a.points.map(p => [p.x, p.y]); break;
      case 'circle':
        shape_type = 'circle';
        const r = a.radius ?? (a.points.length >= 2 ? calculateDistance(a.points[0], a.points[1]) : 0);
        points = [[a.points[0].x, a.points[0].y], [a.points[0].x + r, a.points[0].y]];
        break;
      case 'rotatedRect': shape_type = 'rotation'; points = a.points.slice(0, 4).map(p => [p.x, p.y]); break;
      case 'cuboid': shape_type = 'cuboid'; points = a.points.map(p => [p.x, p.y]); break;
      case 'quadrilateral': shape_type = 'polygon'; points = a.points.map(p => [p.x, p.y]); break;
      case 'text': shape_type = 'rectangle'; points = a.points.length >= 2
        ? [[a.points[0].x, a.points[0].y], [a.points[2].x, a.points[2].y]] : []; break;
      default: points = a.points.map(p => [p.x, p.y]); break;
    }

    return {
      label: a.label,
      points,
      group_id: a.groupId ?? null,
      description: a.description ?? '',
      shape_type,
      flags: a.flags ?? {},
      ...(a.ocrText != null ? { text: a.ocrText } : {}),
      ...(a.rotation != null ? { rotation: a.rotation } : {}),
    };
  });

  return JSON.stringify({
    version: '5.4.1',
    flags: {},
    shapes,
    imagePath: imageInfo.name,
    imageData: null,
    imageHeight: imageInfo.height,
    imageWidth: imageInfo.width,
  }, null, 2);
}

export function exportAnnotationsDOTA(annotations: Annotation[], _labels?: LabelConfig[]): string {
  const header = 'imagesource:RLabel\ngsd:null\n';
  const lines = annotations
    .filter(a => ['rotatedRect', 'rectangle', 'quadrilateral'].includes(a.type))
    .map(a => {
      const pts = a.points.slice(0, 4);
      const coords = pts.map(p => `${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
      const diff = a.difficult ? '1' : '0';
      return `${coords} ${a.label} ${diff}`;
    });
  return header + lines.join('\n');
}

export function exportAnnotationsMOT(annotations: Annotation[]): string {
  return annotations
    .filter(a => a.trackId != null)
    .map(a => {
      const bbox = getBoundingBox(a);
      const frame = a.frameIndex ?? 0;
      return `${frame},${a.trackId},${bbox[0].toFixed(1)},${bbox[1].toFixed(1)},${bbox[2].toFixed(1)},${bbox[3].toFixed(1)},${a.score?.toFixed(2) ?? '1.00'},-1,-1,-1`;
    }).join('\n');
}

export function exportAnnotationsPPOCR(annotations: Annotation[], imageInfo: any): string {
  const results = annotations.filter(a => a.type === 'text' || a.ocrText).map(a => {
    const pts = a.points.slice(0, 4).map(p => [Math.round(p.x), Math.round(p.y)]);
    return { transcription: a.ocrText || '', points: pts };
  });
  return `${imageInfo.name}\t${JSON.stringify(results)}`;
}

export function exportAnnotationsShareGPT(annotations: Annotation[], imageInfo: any): string {
  const conversations = [{
    from: 'human',
    value: `<image>\nDescribe the annotations in this image.`,
  }, {
    from: 'gpt',
    value: annotations.map(a => {
      const bbox = getBoundingBox(a);
      return `${a.label}: [${bbox.map(v => Math.round(v)).join(', ')}]`;
    }).join('\n'),
  }];
  return JSON.stringify({
    image: imageInfo.name,
    conversations,
    width: imageInfo.width,
    height: imageInfo.height,
  }, null, 2);
}

// ======================== IMPORT ========================

export function importAnnotationsJSON(data: any): Annotation[] {
  if (data.shapes && Array.isArray(data.shapes)) {
    return data.shapes.map((shape: any, idx: number) => {
      let type = mapShapeType(shape.shape_type);
      const points = (shape.points || []).map((p: number[]) => ({ x: p[0], y: p[1] }));

      if (type === 'rectangle' && points.length === 2) {
        const [tl, br] = points;
        return {
          id: `imported-${Date.now()}-${idx}`, type, label: shape.label || 'unknown',
          points: [tl, { x: br.x, y: tl.y }, br, { x: tl.x, y: br.y }],
          color: '#3b82f6', groupId: shape.group_id, flags: shape.flags,
          ocrText: shape.text, rotation: shape.rotation, description: shape.description,
        };
      }
      if (type === 'circle' && points.length === 2) {
        const r = calculateDistance(points[0], points[1]);
        return {
          id: `imported-${Date.now()}-${idx}`, type, label: shape.label || 'unknown',
          points, color: '#3b82f6', radius: r, groupId: shape.group_id,
        };
      }
      return {
        id: `imported-${Date.now()}-${idx}`, type, label: shape.label || 'unknown',
        points, color: '#3b82f6', groupId: shape.group_id, flags: shape.flags,
        ocrText: shape.text, description: shape.description,
      };
    });
  }
  if (Array.isArray(data)) return data;
  if (data.annotations && Array.isArray(data.annotations)) {
    if (data.categories && Array.isArray(data.categories)) {
      const catMap: Record<number, string> = {};
      data.categories.forEach((c: any) => { catMap[c.id] = c.name; });
      return data.annotations.map((ann: any, idx: number) => {
        let type: Annotation['type'] = 'rectangle';
        let points: Point[] = [];
        if (ann.segmentation?.length > 0 && ann.segmentation[0].length >= 6) {
          type = 'polygon';
          const seg = ann.segmentation[0];
          for (let i = 0; i < seg.length; i += 2) points.push({ x: seg[i], y: seg[i + 1] });
        } else if (ann.bbox) {
          const [x, y, w, h] = ann.bbox;
          points = [{ x, y }, { x: x + w, y }, { x: x + w, y: y + h }, { x, y: y + h }];
        }
        return {
          id: `imported-coco-${Date.now()}-${idx}`, type,
          label: catMap[ann.category_id] || 'unknown', color: '#3b82f6', points,
        };
      });
    }
    return data.annotations;
  }
  return [];
}

export function importAnnotationsYOLO(
  content: string, imageWidth: number, imageHeight: number, labels: LabelConfig[]
): Annotation[] {
  const annotations: Annotation[] = [];
  content.split('\n').forEach((line, idx) => {
    const parts = line.trim().split(/\s+/);
    if (parts.length < 5) return;
    const classId = parseInt(parts[0], 10);
    const labelObj = labels[classId] || labels[0] || { name: `class_${classId}`, color: '#ff0000' };

    if (parts.length === 5) {
      const cx = parseFloat(parts[1]) * imageWidth;
      const cy = parseFloat(parts[2]) * imageHeight;
      const w = parseFloat(parts[3]) * imageWidth;
      const h = parseFloat(parts[4]) * imageHeight;
      annotations.push({
        id: `imported-yolo-${Date.now()}-${idx}`, type: 'rectangle',
        label: labelObj.name, color: labelObj.color,
        points: [
          { x: cx - w / 2, y: cy - h / 2 }, { x: cx + w / 2, y: cy - h / 2 },
          { x: cx + w / 2, y: cy + h / 2 }, { x: cx - w / 2, y: cy + h / 2 },
        ],
      });
    } else if (parts.length === 9) {
      // OBB: 4 corner coordinates
      const points: Point[] = [];
      for (let i = 1; i < 9; i += 2) {
        points.push({ x: parseFloat(parts[i]) * imageWidth, y: parseFloat(parts[i + 1]) * imageHeight });
      }
      annotations.push({
        id: `imported-yolo-obb-${Date.now()}-${idx}`, type: 'rotatedRect',
        label: labelObj.name, color: labelObj.color, points,
      });
    } else {
      const points: Point[] = [];
      for (let i = 1; i < parts.length; i += 2) {
        if (i + 1 < parts.length) {
          points.push({ x: parseFloat(parts[i]) * imageWidth, y: parseFloat(parts[i + 1]) * imageHeight });
        }
      }
      annotations.push({
        id: `imported-yolo-${Date.now()}-${idx}`, type: 'polygon',
        label: labelObj.name, color: labelObj.color, points,
      });
    }
  });
  return annotations;
}

export function importAnnotationsVOC(content: string): Annotation[] {
  const annotations: Annotation[] = [];
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(content, 'text/xml');
    const objects = doc.getElementsByTagName('object');
    for (let i = 0; i < objects.length; i++) {
      const obj = objects[i];
      const name = obj.getElementsByTagName('name')[0]?.textContent || 'unknown';
      const difficult = obj.getElementsByTagName('difficult')[0]?.textContent === '1';

      const robndbox = obj.getElementsByTagName('robndbox')[0];
      if (robndbox) {
        const cx = parseFloat(robndbox.getElementsByTagName('cx')[0]?.textContent || '0');
        const cy = parseFloat(robndbox.getElementsByTagName('cy')[0]?.textContent || '0');
        const w = parseFloat(robndbox.getElementsByTagName('w')[0]?.textContent || '0');
        const h = parseFloat(robndbox.getElementsByTagName('h')[0]?.textContent || '0');
        const angle = parseFloat(robndbox.getElementsByTagName('angle')[0]?.textContent || '0');
        const deg = angle * 180 / Math.PI;
        const hw = w / 2, hh = h / 2;
        const cos = Math.cos(angle), sin = Math.sin(angle);
        const corners: Point[] = [
          { x: cx + (-hw) * cos - (-hh) * sin, y: cy + (-hw) * sin + (-hh) * cos },
          { x: cx + (hw) * cos - (-hh) * sin, y: cy + (hw) * sin + (-hh) * cos },
          { x: cx + (hw) * cos - (hh) * sin, y: cy + (hw) * sin + (hh) * cos },
          { x: cx + (-hw) * cos - (hh) * sin, y: cy + (-hw) * sin + (hh) * cos },
        ];
        annotations.push({
          id: `imported-voc-obb-${Date.now()}-${i}`, type: 'rotatedRect',
          label: name, color: '#3b82f6', points: corners, rotation: deg, difficult,
        });
        continue;
      }

      const bndbox = obj.getElementsByTagName('bndbox')[0];
      if (bndbox) {
        const xmin = parseFloat(bndbox.getElementsByTagName('xmin')[0]?.textContent || '0');
        const ymin = parseFloat(bndbox.getElementsByTagName('ymin')[0]?.textContent || '0');
        const xmax = parseFloat(bndbox.getElementsByTagName('xmax')[0]?.textContent || '0');
        const ymax = parseFloat(bndbox.getElementsByTagName('ymax')[0]?.textContent || '0');
        annotations.push({
          id: `imported-voc-${Date.now()}-${i}`, type: 'rectangle',
          label: name, color: '#3b82f6', difficult,
          points: [{ x: xmin, y: ymin }, { x: xmax, y: ymin }, { x: xmax, y: ymax }, { x: xmin, y: ymax }],
        });
      }
    }
  } catch (e) { console.error('Failed to parse VOC XML', e); }
  return annotations;
}

export function importAnnotationsDOTA(content: string): Annotation[] {
  const annotations: Annotation[] = [];
  const lines = content.split('\n');
  let startIdx = 0;
  if (lines[0]?.startsWith('imagesource:')) startIdx = 1;
  if (lines[1]?.startsWith('gsd:')) startIdx = 2;

  for (let i = startIdx; i < lines.length; i++) {
    const parts = lines[i].trim().split(/\s+/);
    if (parts.length < 9) continue;
    const points: Point[] = [];
    for (let j = 0; j < 8; j += 2) {
      points.push({ x: parseFloat(parts[j]), y: parseFloat(parts[j + 1]) });
    }
    const label = parts[8] || 'unknown';
    const difficult = parts[9] === '1';
    annotations.push({
      id: `imported-dota-${Date.now()}-${i}`, type: 'rotatedRect',
      label, color: '#3b82f6', points, difficult,
    });
  }
  return annotations;
}

export function importAnnotationsMOT(content: string, _imageWidth: number, _imageHeight: number): Annotation[] {
  const annotations: Annotation[] = [];
  content.split('\n').forEach((line, idx) => {
    const parts = line.trim().split(',');
    if (parts.length < 6) return;
    const frame = parseInt(parts[0]);
    const trackId = parseInt(parts[1]);
    const x = parseFloat(parts[2]);
    const y = parseFloat(parts[3]);
    const w = parseFloat(parts[4]);
    const h = parseFloat(parts[5]);
    const score = parts.length >= 7 ? parseFloat(parts[6]) : 1.0;
    annotations.push({
      id: `imported-mot-${Date.now()}-${idx}`, type: 'rectangle',
      label: `track_${trackId}`, color: '#3b82f6',
      points: [{ x, y }, { x: x + w, y }, { x: x + w, y: y + h }, { x, y: y + h }],
      trackId, frameIndex: frame, score,
    });
  });
  return annotations;
}

export function importAnnotationsPPOCR(content: string): Annotation[] {
  const annotations: Annotation[] = [];
  const lines = content.split('\n');
  for (const line of lines) {
    const tabIdx = line.indexOf('\t');
    if (tabIdx < 0) continue;
    try {
      const results = JSON.parse(line.substring(tabIdx + 1));
      if (!Array.isArray(results)) continue;
      results.forEach((r: any, idx: number) => {
        if (r.points && Array.isArray(r.points)) {
          annotations.push({
            id: `imported-ppocr-${Date.now()}-${idx}`, type: 'text',
            label: 'text', color: '#fbbf24',
            points: r.points.map((p: number[]) => ({ x: p[0], y: p[1] })),
            ocrText: r.transcription || '',
          });
        }
      });
    } catch { /* skip malformed lines */ }
  }
  return annotations;
}

// ======================== HELPERS ========================

function getBoundingBox(annotation: Annotation): number[] {
  if (annotation.type === 'circle' && annotation.points.length >= 1) {
    const c = annotation.points[0];
    const r = annotation.radius ?? (annotation.points.length >= 2
      ? calculateDistance(c, annotation.points[1]) : 0);
    return [c.x - r, c.y - r, r * 2, r * 2];
  }
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const p of annotation.points) {
    minX = Math.min(minX, p.x); minY = Math.min(minY, p.y);
    maxX = Math.max(maxX, p.x); maxY = Math.max(maxY, p.y);
  }
  return [minX, minY, maxX - minX, maxY - minY];
}

function getClassId(label: string, labels?: LabelConfig[]): number {
  if (labels && labels.length > 0) {
    const idx = labels.findIndex(l => l.name === label);
    return idx !== -1 ? idx : 0;
  }
  return 0;
}

function mapShapeType(shapeType: string): Annotation['type'] {
  const map: Record<string, Annotation['type']> = {
    rectangle: 'rectangle', polygon: 'polygon', point: 'point',
    line: 'line', linestrip: 'linestrip', circle: 'circle',
    rotation: 'rotatedRect', cuboid: 'cuboid',
  };
  return map[shapeType] || 'polygon';
}

function escapeXml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}

export function downloadFile(content: string, filename: string, mimeType: string = 'text/plain') {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
