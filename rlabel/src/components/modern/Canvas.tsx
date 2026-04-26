'use client';

import { useRef, useEffect, useCallback, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useAnnotationStore } from '../../store/annotationStore';
import { Point, Annotation } from '../../types/annotation';
import { createAnnotation, hitTestAnnotation, calculateDistance, getRotatedRectParams, createCuboidFromRect } from '../../utils/annotationHelpers';
import { LINE_WIDTH, POINT_RADIUS, SELECTION_TOLERANCE, MIN_ZOOM, MAX_ZOOM, VERTEX_RADIUS } from '../../constants/annotation';
import { isPointNearPoint } from '../../utils/annotationHelpers';

export function Canvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const animFrameRef = useRef<number>(0);

  const {
    imageSrc, annotations, selectedIds, tool, currentLabel, currentColor,
    zoom, pan, drawing, currentPoints, showLabels, fillOpacity, crosshairVisible,
    setDrawing, setCurrentPoints, addCurrentPoint, clearCurrentPoints,
    addAnnotation, selectAnnotation, setPan, setZoom, pushHistory,
    setIsPanning, isPanning,
  } = useAnnotationStore();

  const fitImageToView = useCallback(() => {
    const container = containerRef.current;
    const img = imageRef.current;
    if (!container || !img) return;
    const cw = container.clientWidth;
    const ch = container.clientHeight;
    if (cw === 0 || ch === 0) return;
    const scaleX = cw / img.naturalWidth;
    const scaleY = ch / img.naturalHeight;
    const fitZoom = Math.min(scaleX, scaleY);
    const clampedZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, fitZoom));
    const offsetX = (cw - img.naturalWidth * clampedZoom) / 2;
    const offsetY = (ch - img.naturalHeight * clampedZoom) / 2;
    setZoom(clampedZoom);
    setPan({ x: offsetX, y: offsetY });
  }, [setZoom, setPan]);

  useEffect(() => {
    if (!imageSrc) { imageRef.current = null; setImageLoaded(false); return; }
    setImageLoaded(false);
    imageRef.current = null;
    let cancelled = false;
    const img = new Image();
    img.onload = () => {
      if (cancelled) return;
      imageRef.current = img;
      setImageLoaded(true);
    };
    img.src = imageSrc;
    return () => { cancelled = true; };
  }, [imageSrc]);

  useEffect(() => {
    if (!imageLoaded || !imageRef.current) return;
    let retries = 0;
    let rafId = 0;
    const tryFit = () => {
      const container = containerRef.current;
      if (container && container.clientWidth > 0 && container.clientHeight > 0) {
        fitImageToView();
      } else if (retries++ < 20) {
        rafId = requestAnimationFrame(tryFit);
      }
    };
    rafId = requestAnimationFrame(tryFit);
    return () => cancelAnimationFrame(rafId);
  }, [imageLoaded, fitImageToView]);

  const getCanvasCoordinates = useCallback((clientX: number, clientY: number): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: (clientX - rect.left - pan.x) / zoom,
      y: (clientY - rect.top - pan.y) / zoom,
    };
  }, [pan, zoom]);

  const findAnnotationAtPoint = useCallback((point: Point): string | null => {
    for (let i = annotations.length - 1; i >= 0; i--) {
      const a = annotations[i];
      if (hitTestAnnotation(point, a, SELECTION_TOLERANCE / zoom)) {
        return a.id;
      }
    }
    return null;
  }, [annotations, zoom]);

  // ---------- Drawing routines ----------

  const drawLabel = useCallback((ctx: CanvasRenderingContext2D, annotation: Annotation) => {
    if (!showLabels) return;
    const center = annotation.points[0];
    if (!center) return;
    const fontSize = Math.max(10, 12 / zoom);
    ctx.font = `bold ${fontSize}px Inter, system-ui, sans-serif`;
    const text = annotation.label + (annotation.score != null ? ` ${(annotation.score * 100).toFixed(0)}%` : '');
    const metrics = ctx.measureText(text);
    const pad = 3 / zoom;
    const bgX = center.x - pad;
    const bgY = center.y - fontSize - pad * 2;
    ctx.fillStyle = annotation.color;
    ctx.globalAlpha = 0.85;
    ctx.fillRect(bgX, bgY, metrics.width + pad * 2, fontSize + pad * 2);
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#ffffff';
    ctx.fillText(text, center.x, center.y - pad);
  }, [showLabels, zoom]);

  const drawAnnotation = useCallback((
    ctx: CanvasRenderingContext2D, annotation: Annotation, isSelected: boolean, isHovered: boolean
  ) => {
    const color = annotation.color;
    const lw = (isSelected ? LINE_WIDTH * 2 : LINE_WIDTH) / zoom;
    const pr = (isSelected ? POINT_RADIUS * 1.5 : POINT_RADIUS) / zoom;
    const vr = VERTEX_RADIUS / zoom;

    ctx.strokeStyle = isSelected ? '#ef4444' : (isHovered ? '#f97316' : color);
    ctx.fillStyle = color;
    ctx.lineWidth = lw;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const drawVertices = (points: Point[]) => {
      if (!isSelected && !isHovered) return;
      ctx.fillStyle = ctx.strokeStyle;
      points.forEach(p => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, vr, 0, Math.PI * 2);
        ctx.fill();
      });
    };

    switch (annotation.type) {
      case 'point': {
        const p = annotation.points[0];
        ctx.beginPath();
        ctx.arc(p.x, p.y, pr, 0, Math.PI * 2);
        ctx.fill();
        if (isSelected) ctx.stroke();
        break;
      }
      case 'line': {
        const [s, e] = annotation.points;
        ctx.beginPath();
        ctx.moveTo(s.x, s.y);
        ctx.lineTo(e.x, e.y);
        ctx.stroke();
        drawVertices(annotation.points);
        break;
      }
      case 'linestrip': {
        if (annotation.points.length < 2) break;
        ctx.beginPath();
        ctx.moveTo(annotation.points[0].x, annotation.points[0].y);
        for (let i = 1; i < annotation.points.length; i++) {
          ctx.lineTo(annotation.points[i].x, annotation.points[i].y);
        }
        ctx.stroke();
        drawVertices(annotation.points);
        break;
      }
      case 'polygon':
      case 'rectangle':
      case 'quadrilateral': {
        ctx.beginPath();
        ctx.moveTo(annotation.points[0].x, annotation.points[0].y);
        for (let i = 1; i < annotation.points.length; i++) {
          ctx.lineTo(annotation.points[i].x, annotation.points[i].y);
        }
        ctx.closePath();
        ctx.globalAlpha = fillOpacity;
        ctx.fill();
        ctx.globalAlpha = 1.0;
        ctx.stroke();
        drawVertices(annotation.points);
        break;
      }
      case 'rotatedRect': {
        if (annotation.points.length < 4) break;
        ctx.beginPath();
        ctx.moveTo(annotation.points[0].x, annotation.points[0].y);
        for (let i = 1; i < 4; i++) {
          ctx.lineTo(annotation.points[i].x, annotation.points[i].y);
        }
        ctx.closePath();
        ctx.globalAlpha = fillOpacity;
        ctx.fill();
        ctx.globalAlpha = 1.0;
        ctx.stroke();
        drawVertices(annotation.points.slice(0, 4));
        if (isSelected) {
          const params = getRotatedRectParams(annotation.points);
          const fontSize = Math.max(8, 10 / zoom);
          ctx.font = `${fontSize}px monospace`;
          ctx.fillStyle = '#ffffff';
          ctx.fillText(`${params.rotation.toFixed(1)}°`, params.center.x, params.center.y);
        }
        break;
      }
      case 'circle': {
        const center = annotation.points[0];
        const radius = annotation.radius ?? (annotation.points.length >= 2
          ? calculateDistance(center, annotation.points[1]) : 0);
        if (radius <= 0) break;
        ctx.beginPath();
        ctx.arc(center.x, center.y, radius, 0, Math.PI * 2);
        ctx.globalAlpha = fillOpacity;
        ctx.fill();
        ctx.globalAlpha = 1.0;
        ctx.stroke();
        if (isSelected || isHovered) {
          ctx.fillStyle = ctx.strokeStyle;
          ctx.beginPath();
          ctx.arc(center.x, center.y, vr, 0, Math.PI * 2);
          ctx.fill();
          if (annotation.points.length >= 2) {
            ctx.beginPath();
            ctx.arc(annotation.points[1].x, annotation.points[1].y, vr, 0, Math.PI * 2);
            ctx.fill();
          }
        }
        break;
      }
      case 'cuboid': {
        if (annotation.points.length < 8) break;
        const front = annotation.points.slice(0, 4);
        const back = annotation.points.slice(4, 8);
        // front face
        ctx.beginPath();
        ctx.moveTo(front[0].x, front[0].y);
        for (let i = 1; i < 4; i++) ctx.lineTo(front[i].x, front[i].y);
        ctx.closePath();
        ctx.globalAlpha = fillOpacity;
        ctx.fill();
        ctx.globalAlpha = 1.0;
        ctx.stroke();
        // back face
        ctx.beginPath();
        ctx.moveTo(back[0].x, back[0].y);
        for (let i = 1; i < 4; i++) ctx.lineTo(back[i].x, back[i].y);
        ctx.closePath();
        ctx.setLineDash([4 / zoom, 4 / zoom]);
        ctx.globalAlpha = fillOpacity * 0.5;
        ctx.fill();
        ctx.globalAlpha = 1.0;
        ctx.stroke();
        ctx.setLineDash([]);
        // connecting edges
        for (let i = 0; i < 4; i++) {
          ctx.beginPath();
          ctx.moveTo(front[i].x, front[i].y);
          ctx.lineTo(back[i].x, back[i].y);
          ctx.stroke();
        }
        drawVertices(annotation.points);
        break;
      }
      case 'text': {
        if (annotation.points.length < 4) break;
        ctx.beginPath();
        ctx.moveTo(annotation.points[0].x, annotation.points[0].y);
        for (let i = 1; i < annotation.points.length; i++) {
          ctx.lineTo(annotation.points[i].x, annotation.points[i].y);
        }
        ctx.closePath();
        ctx.globalAlpha = fillOpacity * 0.5;
        ctx.fillStyle = '#fbbf24';
        ctx.fill();
        ctx.globalAlpha = 1.0;
        ctx.strokeStyle = isSelected ? '#ef4444' : '#fbbf24';
        ctx.stroke();
        drawVertices(annotation.points);
        if (annotation.ocrText) {
          const fontSize = Math.max(10, 12 / zoom);
          ctx.font = `${fontSize}px Inter, system-ui, sans-serif`;
          ctx.fillStyle = '#ffffff';
          const p = annotation.points[0];
          ctx.fillText(annotation.ocrText, p.x, p.y - 4 / zoom);
        }
        break;
      }
      case 'mask': {
        if (annotation.points.length < 3) break;
        ctx.beginPath();
        ctx.moveTo(annotation.points[0].x, annotation.points[0].y);
        for (let i = 1; i < annotation.points.length; i++) {
          ctx.lineTo(annotation.points[i].x, annotation.points[i].y);
        }
        ctx.closePath();
        ctx.globalAlpha = fillOpacity * 0.6;
        ctx.fill();
        ctx.globalAlpha = 0.8;
        ctx.stroke();
        ctx.globalAlpha = 1.0;
        break;
      }
    }

    drawLabel(ctx, annotation);
  }, [fillOpacity, showLabels, zoom, drawLabel]);

  const drawCurrentAnnotation = useCallback((
    ctx: CanvasRenderingContext2D, points: Point[], currentTool: string, _mousePos?: Point
  ) => {
    if (points.length === 0) return;
    const lw = LINE_WIDTH / zoom;
    const pr = POINT_RADIUS / zoom;
    ctx.strokeStyle = '#ef4444';
    ctx.fillStyle = '#ef4444';
    ctx.lineWidth = lw;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    switch (currentTool) {
      case 'point': {
        ctx.beginPath();
        ctx.arc(points[0].x, points[0].y, pr, 0, Math.PI * 2);
        ctx.fill();
        break;
      }
      case 'line': {
        if (points.length < 2) break;
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        ctx.lineTo(points[1].x, points[1].y);
        ctx.stroke();
        break;
      }
      case 'linestrip': {
        if (points.length < 1) break;
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) ctx.lineTo(points[i].x, points[i].y);
        ctx.stroke();
        points.forEach(p => {
          ctx.beginPath();
          ctx.arc(p.x, p.y, pr / 2, 0, Math.PI * 2);
          ctx.fill();
        });
        break;
      }
      case 'rectangle': {
        if (points.length < 2) break;
        const [s, e] = points;
        ctx.strokeRect(
          Math.min(s.x, e.x), Math.min(s.y, e.y),
          Math.abs(e.x - s.x), Math.abs(e.y - s.y)
        );
        break;
      }
      case 'polygon': {
        if (points.length < 1) break;
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) ctx.lineTo(points[i].x, points[i].y);
        ctx.stroke();
        points.forEach(p => {
          ctx.beginPath();
          ctx.arc(p.x, p.y, pr / 2, 0, Math.PI * 2);
          ctx.fill();
        });
        if (points.length >= 3) {
          ctx.setLineDash([3 / zoom, 3 / zoom]);
          ctx.beginPath();
          ctx.moveTo(points[points.length - 1].x, points[points.length - 1].y);
          ctx.lineTo(points[0].x, points[0].y);
          ctx.stroke();
          ctx.setLineDash([]);
        }
        break;
      }
      case 'rotatedRect': {
        if (points.length < 2) break;
        if (points.length === 2) {
          ctx.beginPath();
          ctx.moveTo(points[0].x, points[0].y);
          ctx.lineTo(points[1].x, points[1].y);
          ctx.stroke();
        } else if (points.length >= 3) {
          const [p1, p2, p3] = points;
          const dx = p2.x - p1.x;
          const dy = p2.y - p1.y;
          const len = Math.sqrt(dx * dx + dy * dy);
          if (len === 0) break;
          const nx = -dy / len;
          const ny = dx / len;
          const proj = (p3.x - p1.x) * nx + (p3.y - p1.y) * ny;
          const corners = [
            p1,
            p2,
            { x: p2.x + nx * proj, y: p2.y + ny * proj },
            { x: p1.x + nx * proj, y: p1.y + ny * proj },
          ];
          ctx.beginPath();
          ctx.moveTo(corners[0].x, corners[0].y);
          for (let i = 1; i < 4; i++) ctx.lineTo(corners[i].x, corners[i].y);
          ctx.closePath();
          ctx.globalAlpha = 0.15;
          ctx.fill();
          ctx.globalAlpha = 1;
          ctx.stroke();
        }
        break;
      }
      case 'circle': {
        if (points.length < 2) break;
        const r = calculateDistance(points[0], points[1]);
        ctx.beginPath();
        ctx.arc(points[0].x, points[0].y, r, 0, Math.PI * 2);
        ctx.globalAlpha = 0.15;
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.stroke();
        break;
      }
      case 'cuboid': {
        if (points.length < 2) break;
        const cuboidPts = createCuboidFromRect(points[0], points[1]);
        const front = cuboidPts.slice(0, 4);
        const back = cuboidPts.slice(4, 8);
        ctx.beginPath();
        ctx.moveTo(front[0].x, front[0].y);
        for (let i = 1; i < 4; i++) ctx.lineTo(front[i].x, front[i].y);
        ctx.closePath();
        ctx.globalAlpha = 0.15;
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.stroke();
        ctx.setLineDash([3 / zoom, 3 / zoom]);
        ctx.beginPath();
        ctx.moveTo(back[0].x, back[0].y);
        for (let i = 1; i < 4; i++) ctx.lineTo(back[i].x, back[i].y);
        ctx.closePath();
        ctx.stroke();
        ctx.setLineDash([]);
        for (let i = 0; i < 4; i++) {
          ctx.beginPath();
          ctx.moveTo(front[i].x, front[i].y);
          ctx.lineTo(back[i].x, back[i].y);
          ctx.stroke();
        }
        break;
      }
      case 'quadrilateral': {
        if (points.length < 1) break;
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) ctx.lineTo(points[i].x, points[i].y);
        if (points.length === 4) ctx.closePath();
        ctx.stroke();
        points.forEach(p => {
          ctx.beginPath();
          ctx.arc(p.x, p.y, pr / 2, 0, Math.PI * 2);
          ctx.fill();
        });
        break;
      }
      case 'text': {
        if (points.length < 2) break;
        const [s2, e2] = points;
        ctx.strokeStyle = '#fbbf24';
        ctx.strokeRect(
          Math.min(s2.x, e2.x), Math.min(s2.y, e2.y),
          Math.abs(e2.x - s2.x), Math.abs(e2.y - s2.y)
        );
        break;
      }
    }
  }, [zoom]);

  // ---------- Rendering ----------

  const hoveredAnnotationId = useRef<string | null>(null);
  const panStartRef = useRef<Point>({ x: 0, y: 0 });
  const isDrawingRef = useRef(false);
  const isDraggingVertexRef = useRef(false);
  const draggedVertexInfoRef = useRef<{ id: string; index: number } | null>(null);
  const mousePosRef = useRef<Point>({ x: 0, y: 0 });
  const isDraggingAnnotationRef = useRef(false);
  const dragStartRef = useRef<Point>({ x: 0, y: 0 });

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    const img = imageRef.current;
    if (!canvas || !ctx || !img || !imageLoaded) return;

    const container = containerRef.current;
    if (container) {
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(pan.x, pan.y);
    ctx.scale(zoom, zoom);

    ctx.imageSmoothingEnabled = zoom < 2;
    ctx.drawImage(img, 0, 0);

    annotations.forEach(annotation => {
      if (annotation.visible === false) return;
      const isSelected = selectedIds.includes(annotation.id);
      const isHovered = annotation.id === hoveredAnnotationId.current;
      drawAnnotation(ctx, annotation, isSelected, isHovered);
    });

    if (currentPoints.length > 0 && isDrawingRef.current) {
      drawCurrentAnnotation(ctx, currentPoints, tool, mousePosRef.current);
    }

    ctx.restore();

    if (crosshairVisible && ['point', 'line', 'linestrip', 'polygon', 'rectangle', 'rotatedRect', 'circle', 'cuboid', 'quadrilateral', 'text'].includes(tool)) {
      const mp = mousePosRef.current;
      const sx = mp.x * zoom + pan.x;
      const sy = mp.y * zoom + pan.y;
      ctx.save();
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = 'rgba(255,255,255,0.7)';
      ctx.beginPath();
      ctx.moveTo(sx, 0); ctx.lineTo(sx, canvas.height);
      ctx.moveTo(0, sy); ctx.lineTo(canvas.width, sy);
      ctx.stroke();
      ctx.lineDashOffset = 4;
      ctx.strokeStyle = 'rgba(0,0,0,0.5)';
      ctx.beginPath();
      ctx.moveTo(sx, 0); ctx.lineTo(sx, canvas.height);
      ctx.moveTo(0, sy); ctx.lineTo(canvas.width, sy);
      ctx.stroke();
      ctx.restore();
    }
  }, [annotations, selectedIds, tool, currentPoints, zoom, pan, imageLoaded,
      drawAnnotation, drawCurrentAnnotation, crosshairVisible, fillOpacity]);

  useEffect(() => {
    cancelAnimationFrame(animFrameRef.current);
    animFrameRef.current = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [render]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const observer = new ResizeObserver(() => {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = requestAnimationFrame(render);
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, [render]);

  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      const delta = -e.deltaY;
      const intensity = Math.min(Math.abs(delta) / 100, 1);
      const baseFactor = delta > 0 ? 1.15 : 1 / 1.15;
      const factor = 1 + (baseFactor - 1) * Math.max(intensity, 0.5);
      const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoom * factor));
      if (newZoom === zoom) return;
      const scale = newZoom / zoom;
      const newPanX = mouseX - (mouseX - pan.x) * scale;
      const newPanY = mouseY - (mouseY - pan.y) * scale;
      setZoom(newZoom);
      setPan({ x: newPanX, y: newPanY });
    };
    const container = containerRef.current;
    container?.addEventListener('wheel', handleWheel, { passive: false });
    return () => container?.removeEventListener('wheel', handleWheel);
  }, [zoom, pan, setZoom, setPan]);

  // ---------- Interaction handlers ----------

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!imageLoaded) return;
    const point = getCanvasCoordinates(e.clientX, e.clientY);
    mousePosRef.current = point;

    // Pan
    if (tool === 'pan' || e.button === 1 || (e.button === 0 && e.altKey)) {
      setIsPanning(true);
      panStartRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
      return;
    }

    if (tool === 'zoom') {
      const factor = e.shiftKey ? 0.8 : 1.25;
      setZoom(Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoom * factor)));
      return;
    }

    // Select tool
    if (tool === 'select') {
      // vertex dragging
      for (const id of selectedIds) {
        const annotation = annotations.find(a => a.id === id);
        if (annotation && annotation.visible !== false) {
          for (let i = 0; i < annotation.points.length; i++) {
            if (isPointNearPoint(point, annotation.points[i], SELECTION_TOLERANCE / zoom)) {
              pushHistory();
              isDraggingVertexRef.current = true;
              draggedVertexInfoRef.current = { id, index: i };
              return;
            }
          }
        }
      }
      // annotation dragging
      const hitId = findAnnotationAtPoint(point);
      if (hitId && selectedIds.includes(hitId)) {
        isDraggingAnnotationRef.current = true;
        dragStartRef.current = point;
        pushHistory();
        return;
      }
      const isMulti = e.ctrlKey || e.metaKey || e.shiftKey;
      selectAnnotation(hitId, isMulti);
      if (hitId) {
        isDraggingAnnotationRef.current = true;
        dragStartRef.current = point;
        pushHistory();
      }
      return;
    }

    // Drawing tools
    const drawingTools = ['point', 'line', 'linestrip', 'polygon', 'rectangle', 'rotatedRect', 'circle', 'cuboid', 'quadrilateral', 'text'];
    if (drawingTools.includes(tool)) {
      if (tool === 'point') {
        pushHistory();
        addAnnotation(createAnnotation('point', currentLabel, [point], currentColor));
        return;
      }

      // Click-by-click tools
      if (['polygon', 'linestrip', 'quadrilateral', 'rotatedRect'].includes(tool)) {
        if (!isDrawingRef.current) {
          isDrawingRef.current = true;
          setDrawing(true);
          setCurrentPoints([point]);
        } else {
          addCurrentPoint(point);
          // auto-complete quadrilateral at 4 points
          if (tool === 'quadrilateral' && currentPoints.length === 3) {
            pushHistory();
            addAnnotation(createAnnotation('quadrilateral', currentLabel, [...currentPoints, point], currentColor));
            clearCurrentPoints();
            isDrawingRef.current = false;
            return;
          }
          // auto-complete rotatedRect at 3 points
          if (tool === 'rotatedRect' && currentPoints.length === 2) {
            const [p1, p2] = currentPoints;
            const dx = p2.x - p1.x;
            const dy = p2.y - p1.y;
            const len = Math.sqrt(dx * dx + dy * dy);
            if (len > 0) {
              const nx = -dy / len;
              const ny = dx / len;
              const proj = (point.x - p1.x) * nx + (point.y - p1.y) * ny;
              const corners = [
                p1, p2,
                { x: p2.x + nx * proj, y: p2.y + ny * proj },
                { x: p1.x + nx * proj, y: p1.y + ny * proj },
              ];
              pushHistory();
              addAnnotation(createAnnotation('rotatedRect', currentLabel, corners, currentColor));
            }
            clearCurrentPoints();
            isDrawingRef.current = false;
            return;
          }
        }
        return;
      }

      // Drag-based tools
      isDrawingRef.current = true;
      setDrawing(true);
      setCurrentPoints([point]);
    }
  }, [tool, imageLoaded, pan, zoom, getCanvasCoordinates, findAnnotationAtPoint,
      selectAnnotation, setDrawing, setCurrentPoints, addCurrentPoint,
      pushHistory, currentLabel, currentColor, addAnnotation, setIsPanning,
      setZoom, selectedIds, annotations, clearCurrentPoints]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const point = getCanvasCoordinates(e.clientX, e.clientY);
    mousePosRef.current = point;

    if (isPanning) {
      setPan({
        x: e.clientX - panStartRef.current.x,
        y: e.clientY - panStartRef.current.y,
      });
      return;
    }

    if (isDraggingVertexRef.current && draggedVertexInfoRef.current) {
      const { id, index } = draggedVertexInfoRef.current;
      useAnnotationStore.getState().updateAnnotationPoint(id, index, point);
      return;
    }

    if (isDraggingAnnotationRef.current) {
      const dx = point.x - dragStartRef.current.x;
      const dy = point.y - dragStartRef.current.y;
      useAnnotationStore.getState().moveAnnotations(dx, dy);
      dragStartRef.current = point;
      return;
    }

    if (!imageLoaded) return;

    if (isDrawingRef.current) {
      if (['line', 'rectangle', 'circle', 'cuboid', 'text'].includes(tool)) {
        setCurrentPoints([currentPoints[0], point]);
      } else if (tool === 'polygon' || tool === 'linestrip') {
        // show rubber-band line from last point to mouse
        const pts = [...currentPoints];
        pts[pts.length - 1] = point;
        // Actually don't modify stored points, just re-render
      }
    } else {
      const annotationId = findAnnotationAtPoint(point);
      if (hoveredAnnotationId.current !== annotationId) {
        hoveredAnnotationId.current = annotationId;
      }
    }

    // Request re-render for crosshair / hover
    cancelAnimationFrame(animFrameRef.current);
    animFrameRef.current = requestAnimationFrame(render);
  }, [isPanning, imageLoaded, tool, currentPoints, getCanvasCoordinates,
      findAnnotationAtPoint, setCurrentPoints, setPan, render]);

  const handleMouseUp = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsPanning(false);
    isDraggingAnnotationRef.current = false;

    if (isDraggingVertexRef.current) {
      isDraggingVertexRef.current = false;
      draggedVertexInfoRef.current = null;
      return;
    }

    if (!isDrawingRef.current) return;
    if (!imageLoaded) return;

    const point = getCanvasCoordinates(e.clientX, e.clientY);

    // Drag-based tools complete on mouse up
    if (['line', 'rectangle', 'circle', 'cuboid', 'text'].includes(tool) && currentPoints.length >= 1) {
      const dist = calculateDistance(currentPoints[0], point);
      if (dist < 3 / zoom) {
        // Too small, cancel
        clearCurrentPoints();
        isDrawingRef.current = false;
        return;
      }

      pushHistory();
      if (tool === 'line') {
        addAnnotation(createAnnotation('line', currentLabel, [currentPoints[0], point], currentColor));
      } else if (tool === 'rectangle') {
        const [start] = currentPoints;
        const finalPoints = [
          { x: Math.min(start.x, point.x), y: Math.min(start.y, point.y) },
          { x: Math.max(start.x, point.x), y: Math.min(start.y, point.y) },
          { x: Math.max(start.x, point.x), y: Math.max(start.y, point.y) },
          { x: Math.min(start.x, point.x), y: Math.max(start.y, point.y) },
        ];
        addAnnotation(createAnnotation('rectangle', currentLabel, finalPoints, currentColor));
      } else if (tool === 'circle') {
        const r = calculateDistance(currentPoints[0], point);
        addAnnotation(createAnnotation('circle', currentLabel, [currentPoints[0], point], currentColor, { radius: r }));
      } else if (tool === 'cuboid') {
        const pts = createCuboidFromRect(currentPoints[0], point);
        addAnnotation(createAnnotation('cuboid', currentLabel, pts, currentColor));
      } else if (tool === 'text') {
        const [s] = currentPoints;
        const textPts = [
          { x: Math.min(s.x, point.x), y: Math.min(s.y, point.y) },
          { x: Math.max(s.x, point.x), y: Math.min(s.y, point.y) },
          { x: Math.max(s.x, point.x), y: Math.max(s.y, point.y) },
          { x: Math.min(s.x, point.x), y: Math.max(s.y, point.y) },
        ];
        addAnnotation(createAnnotation('text', currentLabel, textPts, currentColor, { ocrText: '' }));
      }
      clearCurrentPoints();
      isDrawingRef.current = false;
    }
  }, [tool, currentPoints, imageLoaded, getCanvasCoordinates, pushHistory,
      currentLabel, currentColor, addAnnotation, clearCurrentPoints, setIsPanning, zoom]);

  const handleDoubleClick = useCallback((_e: React.MouseEvent<HTMLCanvasElement>) => {
    if (tool === 'polygon' && drawing && currentPoints.length >= 3) {
      pushHistory();
      addAnnotation(createAnnotation('polygon', currentLabel, currentPoints, currentColor));
      clearCurrentPoints();
      isDrawingRef.current = false;
    }
    if (tool === 'linestrip' && drawing && currentPoints.length >= 2) {
      pushHistory();
      addAnnotation(createAnnotation('linestrip', currentLabel, currentPoints, currentColor));
      clearCurrentPoints();
      isDrawingRef.current = false;
    }
  }, [tool, drawing, currentPoints, pushHistory, currentLabel, currentColor, addAnnotation, clearCurrentPoints]);

  const resetTo100 = useCallback(() => {
    const container = containerRef.current;
    const img = imageRef.current;
    if (!container || !img) return;
    const cw = container.clientWidth;
    const ch = container.clientHeight;
    const offsetX = (cw - img.naturalWidth) / 2;
    const offsetY = (ch - img.naturalHeight) / 2;
    setZoom(1);
    setPan({ x: offsetX, y: offsetY });
  }, [setZoom, setPan]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const target = e.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT') return;

    if (e.key === 'Enter') {
      if (tool === 'polygon' && drawing && currentPoints.length >= 3) {
        pushHistory();
        addAnnotation(createAnnotation('polygon', currentLabel, currentPoints, currentColor));
        clearCurrentPoints();
        isDrawingRef.current = false;
      } else if (tool === 'linestrip' && drawing && currentPoints.length >= 2) {
        pushHistory();
        addAnnotation(createAnnotation('linestrip', currentLabel, currentPoints, currentColor));
        clearCurrentPoints();
        isDrawingRef.current = false;
      }
    } else if (e.key === 'Escape') {
      clearCurrentPoints();
      isDrawingRef.current = false;
    } else if (e.key === 'f' || e.key === 'F') {
      if (!e.ctrlKey && !e.metaKey) fitImageToView();
    } else if (e.key === '0' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      resetTo100();
    }
  }, [tool, drawing, currentPoints, pushHistory, currentLabel, currentColor, addAnnotation, clearCurrentPoints, fitImageToView, resetTo100]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const handleMouseLeave = useCallback(() => {
    setIsPanning(false);
    isDraggingAnnotationRef.current = false;
    hoveredAnnotationId.current = null;
    cancelAnimationFrame(animFrameRef.current);
    animFrameRef.current = requestAnimationFrame(render);
  }, [setIsPanning, render]);

  const cursor = useMemo(() => {
    if (isPanning) return 'grabbing';
    if (isDraggingVertexRef.current) return 'move';
    if (tool === 'pan') return 'grab';
    if (tool === 'zoom') return 'zoom-in';
    if (tool === 'select') return hoveredAnnotationId.current ? 'pointer' : 'default';
    return 'crosshair';
  }, [isPanning, tool]);

  if (!imageSrc) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-[#e8e8e8] dark:bg-gray-950">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
          <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-white dark:bg-gray-800 flex items-center justify-center border border-gray-200 dark:border-gray-700 shadow-sm">
            <svg className="w-10 h-10 text-gray-300 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-base font-medium text-gray-600 dark:text-gray-300 mb-1">未加载图像</h3>
          <p className="text-sm text-gray-400 dark:text-gray-500">打开图像或文件夹开始标注</p>
          <p className="text-xs text-gray-300 dark:text-gray-600 mt-1">支持图片与视频标注</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div ref={containerRef} data-canvas-container className="w-full h-full overflow-hidden relative" style={{ cursor }}>
      <div className="absolute inset-0 bg-[#e8e8e8] dark:bg-gray-950" />
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onDoubleClick={handleDoubleClick}
        className="absolute inset-0 w-full h-full"
      />
      <Minimap />
      <ZoomControls onFitView={fitImageToView} onReset100={resetTo100} />
    </div>
  );
}

function ZoomControls({ onFitView, onReset100 }: { onFitView: () => void; onReset100: () => void }) {
  const { zoom, setZoom, setPan, pan } = useAnnotationStore();

  const zoomCenter = (factor: number) => {
    const container = document.querySelector('[data-canvas-container]') as HTMLElement | null;
    const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoom * factor));
    if (newZoom === zoom) return;
    if (container) {
      const cx = container.clientWidth / 2;
      const cy = container.clientHeight / 2;
      const scale = newZoom / zoom;
      setPan({ x: cx - (cx - pan.x) * scale, y: cy - (cy - pan.y) * scale });
    }
    setZoom(newZoom);
  };
  const handleZoomIn = () => zoomCenter(1.3);
  const handleZoomOut = () => zoomCenter(1 / 1.3);

  return (
    <div className="absolute top-3 right-3 flex items-center gap-0.5 bg-white/95 dark:bg-gray-900/90 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-md shadow-sm">
      <button onClick={handleZoomOut} className="w-7 h-7 flex items-center justify-center text-gray-500 hover:text-gray-800 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-l-md transition-colors text-sm font-medium" title="缩小">
        −
      </button>
      <button onClick={onReset100} className="h-7 px-1.5 flex items-center justify-center text-[11px] text-gray-600 dark:text-gray-300 font-mono tabular-nums hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors min-w-[48px]" title="重置为 100% (Ctrl+0)">
        {(zoom * 100).toFixed(0)}%
      </button>
      <button onClick={handleZoomIn} className="w-7 h-7 flex items-center justify-center text-gray-500 hover:text-gray-800 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-sm font-medium" title="放大">
        +
      </button>
      <div className="w-px h-4 bg-gray-200 dark:bg-gray-700" />
      <button onClick={onFitView} className="w-7 h-7 flex items-center justify-center text-gray-500 hover:text-gray-800 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-r-md transition-colors" title="适配视口 (F)">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
        </svg>
      </button>
    </div>
  );
}

function Minimap() {
  const miniCanvasRef = useRef<HTMLCanvasElement>(null);
  const { imageSrc, zoom, pan, annotations } = useAnnotationStore();

  useEffect(() => {
    if (!imageSrc || !miniCanvasRef.current) return;
    const canvas = miniCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      const scale = Math.min(140 / img.width, 90 / img.height);
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      ctx.fillStyle = 'rgba(59, 130, 246, 0.15)';
      annotations.forEach(a => {
        if (a.visible === false) return;
        if (a.points.length >= 2) {
          let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
          a.points.forEach(p => {
            minX = Math.min(minX, p.x); minY = Math.min(minY, p.y);
            maxX = Math.max(maxX, p.x); maxY = Math.max(maxY, p.y);
          });
          ctx.fillRect(minX * scale, minY * scale, (maxX - minX) * scale, (maxY - minY) * scale);
        }
      });

      const container = document.querySelector('[data-canvas-container]') as HTMLElement | null;
      if (container) {
        const cw = container.clientWidth;
        const ch = container.clientHeight;
        const vx = (-pan.x / zoom) * scale;
        const vy = (-pan.y / zoom) * scale;
        const vw = (cw / zoom) * scale;
        const vh = (ch / zoom) * scale;
        ctx.strokeStyle = 'rgba(59, 130, 246, 0.8)';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(
          Math.max(0, vx), Math.max(0, vy),
          Math.min(vw, canvas.width - Math.max(0, vx)),
          Math.min(vh, canvas.height - Math.max(0, vy))
        );
        ctx.fillStyle = 'rgba(59, 130, 246, 0.05)';
        ctx.fillRect(
          Math.max(0, vx), Math.max(0, vy),
          Math.min(vw, canvas.width - Math.max(0, vx)),
          Math.min(vh, canvas.height - Math.max(0, vy))
        );
      }
    };
    img.src = imageSrc;
  }, [imageSrc, annotations, zoom, pan]);

  if (!imageSrc) return null;

  return (
    <div className="absolute bottom-3 right-3 rounded-md bg-white/95 dark:bg-gray-900/90 backdrop-blur-sm border border-gray-200 dark:border-gray-700 overflow-hidden shadow-panel-lg">
      <canvas ref={miniCanvasRef} className="block" style={{ maxWidth: 140, maxHeight: 90 }} />
    </div>
  );
}
