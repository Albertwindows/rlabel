import { describe, it, expect } from 'vitest'
import {
  calculateDistance,
  calculatePolygonArea,
  calculatePolygonPerimeter,
  isPointInPolygon,
  isPointNearLine,
  isPointNearPoint,
  getAnnotationCenter,
  getAnnotationBoundingBox,
  formatAnnotationSize,
  generateId,
  createAnnotation,
  resizePoint,
  rotatePoint,
  translatePoint,
  normalizePolygon,
  simplifyPolygon
} from '../../../utils/annotationHelpers'

describe('annotationHelpers', () => {
  describe('calculateDistance', () => {
    it('calculates distance between two points', () => {
      const p1 = { x: 0, y: 0 }
      const p2 = { x: 3, y: 4 }
      expect(calculateDistance(p1, p2)).toBe(5)
    })

    it('handles zero distance', () => {
      const p1 = { x: 1, y: 1 }
      const p2 = { x: 1, y: 1 }
      expect(calculateDistance(p1, p2)).toBe(0)
    })
  })

  describe('calculatePolygonArea', () => {
    it('calculates area of a simple square', () => {
      const square = [
        { x: 0, y: 0 },
        { x: 10, y: 0 },
        { x: 10, y: 10 },
        { x: 0, y: 10 }
      ]
      expect(calculatePolygonArea(square)).toBe(100)
    })

    it('returns 0 for invalid polygons', () => {
      const line = [
        { x: 0, y: 0 },
        { x: 10, y: 10 }
      ]
      expect(calculatePolygonArea(line)).toBe(0)
    })
  })

  describe('calculatePolygonPerimeter', () => {
    it('calculates perimeter of a square', () => {
      const square = [
        { x: 0, y: 0 },
        { x: 10, y: 0 },
        { x: 10, y: 10 },
        { x: 0, y: 10 }
      ]
      expect(calculatePolygonPerimeter(square)).toBe(40)
    })
  })

  describe('isPointInPolygon', () => {
    it('detects point inside polygon', () => {
      const polygon = [
        { x: 0, y: 0 },
        { x: 10, y: 0 },
        { x: 10, y: 10 },
        { x: 0, y: 10 }
      ]
      const point = { x: 5, y: 5 }
      expect(isPointInPolygon(point, polygon)).toBe(true)
    })

    it('detects point outside polygon', () => {
      const polygon = [
        { x: 0, y: 0 },
        { x: 10, y: 0 },
        { x: 10, y: 10 },
        { x: 0, y: 10 }
      ]
      const point = { x: 15, y: 15 }
      expect(isPointInPolygon(point, polygon)).toBe(false)
    })

    it('returns false for invalid polygons', () => {
      const line = [
        { x: 0, y: 0 },
        { x: 10, y: 10 }
      ]
      const point = { x: 5, y: 5 }
      expect(isPointInPolygon(point, line)).toBe(false)
    })
  })

  describe('isPointNearLine', () => {
    it('detects point near line', () => {
      const lineStart = { x: 0, y: 0 }
      const lineEnd = { x: 10, y: 0 }
      const point = { x: 5, y: 3 }
      expect(isPointNearLine(point, lineStart, lineEnd, 5)).toBe(true)
    })

    it('detects point not near line', () => {
      const lineStart = { x: 0, y: 0 }
      const lineEnd = { x: 10, y: 0 }
      const point = { x: 5, y: 10 }
      expect(isPointNearLine(point, lineStart, lineEnd, 5)).toBe(false)
    })
  })

  describe('isPointNearPoint', () => {
    it('detects point near another point', () => {
      const p1 = { x: 0, y: 0 }
      const p2 = { x: 3, y: 4 }
      expect(isPointNearPoint(p1, p2, 6)).toBe(true)
    })

    it('detects point not near another point', () => {
      const p1 = { x: 0, y: 0 }
      const p2 = { x: 10, y: 10 }
      expect(isPointNearPoint(p1, p2, 5)).toBe(false)
    })
  })

  describe('getAnnotationCenter', () => {
    it('calculates center of multiple points', () => {
      const annotation = {
        id: '1',
        type: 'polygon' as const,
        label: 'Test',
        points: [
          { x: 0, y: 0 },
          { x: 10, y: 0 },
          { x: 10, y: 10 },
          { x: 0, y: 10 }
        ],
        color: '#FF0000'
      }
      const center = getAnnotationCenter(annotation)
      expect(center.x).toBe(5)
      expect(center.y).toBe(5)
    })

    it('handles single point annotation', () => {
      const annotation = {
        id: '1',
        type: 'point' as const,
        label: 'Test',
        points: [{ x: 10, y: 10 }],
        color: '#FF0000'
      }
      const center = getAnnotationCenter(annotation)
      expect(center.x).toBe(10)
      expect(center.y).toBe(10)
    })

    it('handles empty annotation', () => {
      const annotation = {
        id: '1',
        type: 'point' as const,
        label: 'Test',
        points: [],
        color: '#FF0000'
      }
      const center = getAnnotationCenter(annotation)
      expect(center.x).toBe(0)
      expect(center.y).toBe(0)
    })
  })

  describe('getAnnotationBoundingBox', () => {
    it('calculates bounding box correctly', () => {
      const annotation = {
        id: '1',
        type: 'polygon' as const,
        label: 'Test',
        points: [
          { x: 10, y: 10 },
          { x: 20, y: 30 },
          { x: 40, y: 15 }
        ],
        color: '#FF0000'
      }
      const bbox = getAnnotationBoundingBox(annotation)
      expect(bbox.min.x).toBe(10)
      expect(bbox.min.y).toBe(10)
      expect(bbox.max.x).toBe(40)
      expect(bbox.max.y).toBe(30)
    })
  })

  describe('formatAnnotationSize', () => {
    it('formats point annotation', () => {
      const annotation = {
        id: '1',
        type: 'point' as const,
        label: 'Test',
        points: [{ x: 10, y: 10 }],
        color: '#FF0000'
      }
      expect(formatAnnotationSize(annotation)).toBe('1 point')
    })

    it('formats line annotation', () => {
      const annotation = {
        id: '1',
        type: 'line' as const,
        label: 'Test',
        points: [
          { x: 0, y: 0 },
          { x: 3, y: 4 }
        ],
        color: '#FF0000'
      }
      expect(formatAnnotationSize(annotation)).toBe('5.0px')
    })

    it('formats polygon annotation', () => {
      const annotation = {
        id: '1',
        type: 'polygon' as const,
        label: 'Test',
        points: [
          { x: 0, y: 0 },
          { x: 10, y: 0 },
          { x: 10, y: 10 },
          { x: 0, y: 10 }
        ],
        color: '#FF0000'
      }
      expect(formatAnnotationSize(annotation)).toBe('100px²')
    })
  })

  describe('generateId', () => {
    it('generates unique IDs', () => {
      const id1 = generateId()
      const id2 = generateId()
      expect(id1).not.toBe(id2)
    })

    it('generates string IDs', () => {
      const id = generateId()
      expect(typeof id).toBe('string')
      expect(id.length).toBeGreaterThan(0)
    })
  })

  describe('createAnnotation', () => {
    it('creates point annotation', () => {
      const points = [{ x: 10, y: 10 }]
      const annotation = createAnnotation('point', 'TestLabel', points, '#00FF00')
      expect(annotation.id).toBeDefined()
      expect(annotation.type).toBe('point')
      expect(annotation.label).toBe('TestLabel')
      expect(annotation.color).toBe('#00FF00')
      expect(annotation.points).toEqual(points)
      expect(annotation.attributes).toEqual({})
    })

    it('creates polygon annotation', () => {
      const points = [
        { x: 0, y: 0 },
        { x: 10, y: 0 },
        { x: 10, y: 10 },
        { x: 0, y: 10 }
      ]
      const annotation = createAnnotation('polygon', 'TestLabel', points)
      expect(annotation.type).toBe('polygon')
      expect(annotation.points).toEqual(points)
      expect(annotation.color).toBe('#FF0000')
    })

    it('uses default color if not provided', () => {
      const annotation = createAnnotation('line', 'TestLabel', [{ x: 0, y: 0 }, { x: 10, y: 10 }])
      expect(annotation.color).toBe('#FF0000')
    })
  })

  describe('resizePoint', () => {
    it('scales point by given factors', () => {
      const point = { x: 10, y: 20 }
      const resized = resizePoint(point, 2, 3)
      expect(resized.x).toBe(20)
      expect(resized.y).toBe(60)
    })

    it('handles negative scaling', () => {
      const point = { x: 10, y: 20 }
      const resized = resizePoint(point, -1, -2)
      expect(resized.x).toBe(-10)
      expect(resized.y).toBe(-40)
    })
  })

  describe('rotatePoint', () => {
    it('rotates point 90 degrees', () => {
      const point = { x: 10, y: 0 }
      const center = { x: 0, y: 0 }
      const rotated = rotatePoint(point, center, 90)
      expect(rotated.x).toBeCloseTo(0)
      expect(rotated.y).toBeCloseTo(10)
    })

    it('rotates point 180 degrees', () => {
      const point = { x: 10, y: 0 }
      const center = { x: 0, y: 0 }
      const rotated = rotatePoint(point, center, 180)
      expect(rotated.x).toBeCloseTo(-10)
      expect(rotated.y).toBeCloseTo(0)
    })

    it('rotates point around custom center', () => {
      const point = { x: 10, y: 10 }
      const center = { x: 5, y: 5 }
      const rotated = rotatePoint(point, center, 180)
      expect(rotated.x).toBeCloseTo(0)
      expect(rotated.y).toBeCloseTo(0)
    })
  })

  describe('translatePoint', () => {
    it('translates point by given offsets', () => {
      const point = { x: 10, y: 20 }
      const translated = translatePoint(point, 5, -3)
      expect(translated.x).toBe(15)
      expect(translated.y).toBe(17)
    })
  })

  describe('normalizePolygon', () => {
    it('normalizes polygon points', () => {
      const points = [
        { x: 0, y: 0 },
        { x: 10, y: 0 },
        { x: 10, y: 10 }
      ]
      const normalized = normalizePolygon(points)
      expect(normalized.length).toBe(3)
      expect(normalized[0].x).toBeCloseTo(0, 5)
      expect(normalized[0].y).toBeCloseTo(0, 5)
    })

    it('returns original points if less than 3', () => {
      const points = [{ x: 0, y: 0 }, { x: 10, y: 0 }]
      const normalized = normalizePolygon(points)
      expect(normalized).toEqual(points)
    })
  })

  describe('simplifyPolygon', () => {
    it('simplifies polygon with tolerance', () => {
      const points = [
        { x: 0, y: 0 },
        { x: 1, y: 0.1 },
        { x: 2, y: 0 },
        { x: 3, y: 0.1 },
        { x: 4, y: 0 },
        { x: 4, y: 4 }
      ]
      const simplified = simplifyPolygon(points, 1)
      expect(simplified.length).toBeLessThan(points.length)
    })

    it('returns original if less than 3 points', () => {
      const points = [{ x: 0, y: 0 }, { x: 10, y: 0 }]
      const simplified = simplifyPolygon(points, 1)
      expect(simplified).toEqual(points)
    })
  })
})
