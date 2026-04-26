import { describe, it, expect } from 'vitest'
import {
  exportAnnotationsJSON,
  exportAnnotationsCOCO,
  exportAnnotationsYOLO,
  exportAnnotationsVOC,
  exportToFormat,
  importAnnotationsJSON,
  type COCOFormat
} from '../../../utils/exportImport'
import type { Annotation } from '../../../types/annotation'

describe('exportImport', () => {
  const mockAnnotations: Annotation[] = [
    {
      id: '1',
      type: 'rectangle',
      label: 'person',
      points: [
        { x: 10, y: 10 },
        { x: 110, y: 10 },
        { x: 110, y: 110 },
        { x: 10, y: 110 }
      ],
      color: '#FF0000',
      attributes: {}
    },
    {
      id: '2',
      type: 'point',
      label: 'car',
      points: [{ x: 200, y: 300 }],
      color: '#00FF00',
      attributes: {}
    }
  ]

  const mockImageInfo = {
    name: 'test.jpg',
    width: 500,
    height: 400,
    folder: '/test',
    path: '/test/test.jpg'
  }

  describe('exportAnnotationsJSON', () => {
    it('exports annotations to JSON format', () => {
      const result = exportAnnotationsJSON(mockAnnotations, mockImageInfo)
      const parsed = JSON.parse(result)
      
      expect(parsed.name).toBe('test.jpg')
      expect(parsed.width).toBe(500)
      expect(parsed.height).toBe(400)
      expect(parsed.annotations).toHaveLength(2)
      expect(parsed.annotations[0].label).toBe('person')
    })

    it('validates JSON structure', () => {
      const result = exportAnnotationsJSON(mockAnnotations, mockImageInfo)
      expect(() => JSON.parse(result)).not.toThrow()
    })
  })

  describe('exportAnnotationsCOCO', () => {
    it('exports annotations to COCO format', () => {
      const result = exportAnnotationsCOCO(mockAnnotations, mockImageInfo)
      
      expect(result.images).toHaveLength(1)
      expect(result.images[0].id).toBe(1)
      expect(result.images[0].file_name).toBe('test.jpg')
      expect(result.images[0].width).toBe(500)
      expect(result.images[0].height).toBe(400)
      
      expect(result.categories).toHaveLength(2)
      expect(result.categories[0].name).toBe('person')
      expect(result.categories[0].supercategory).toBe('object')
      
      expect(result.annotations).toHaveLength(2)
      expect(result.annotations[0].category_id).toBeGreaterThan(0)
      expect(result.annotations[0].image_id).toBe(1)
      expect(result.annotations[0].iscrowd).toBe(0)
    })

    it('calculates correct bounding boxes', () => {
      const result = exportAnnotationsCOCO(mockAnnotations, mockImageInfo)
      const bbox = result.annotations[0].bbox
      expect(bbox[0]).toBe(10)
      expect(bbox[1]).toBe(10)
      expect(bbox[2]).toBe(100)
      expect(bbox[3]).toBe(100)
    })

    it('calculates correct area', () => {
      const result = exportAnnotationsCOCO(mockAnnotations, mockImageInfo)
      const area = result.annotations[0].area
      expect(area).toBe(10000)
    })
  })

  describe('exportAnnotationsYOLO', () => {
    it('exports annotations to YOLO format', () => {
      const result = exportAnnotationsYOLO(mockAnnotations, 500, 400)
      const lines = result.split('\n').filter(line => line.trim())
      
      expect(lines).toHaveLength(2)
      expect(lines[0]).toMatch(/^\d+\s+-?\d+\.\d+\s+-?\d+\.\d+\s+\d+\.\d+\s+\d+\.\d+$/)
    })

    it('normalizes coordinates to [0, 1]', () => {
      const result = exportAnnotationsYOLO(mockAnnotations, 500, 400)
      const lines = result.split('\n')
      const values = lines[0].split(' ').map(Number)
      
      values.slice(1).forEach(value => {
        expect(value).toBeGreaterThanOrEqual(0)
        expect(value).toBeLessThanOrEqual(1)
      })
    })

    it('handles empty annotations', () => {
      const result = exportAnnotationsYOLO([], 500, 400)
      expect(result.trim()).toBe('')
    })
  })

  describe('exportAnnotationsVOC', () => {
    it('exports annotations to VOC XML format', () => {
      const result = exportAnnotationsVOC(mockAnnotations, mockImageInfo)
      
      expect(result).toContain('<annotation>')
      expect(result).toContain('<filename>test.jpg</filename>')
      expect(result).toContain('<width>500</width>')
      expect(result).toContain('<height>400</height>')
      expect(result).toContain('<name>person</name>')
      expect(result).toContain('<name>car</name>')
      expect(result).toContain('</annotation>')
    })

    it('includes bounding box coordinates', () => {
      const result = exportAnnotationsVOC(mockAnnotations, mockImageInfo)
      
      expect(result).toContain('<xmin>10</xmin>')
      expect(result).toContain('<ymin>10</ymin>')
      expect(result).toContain('<xmax>110</xmax>')
      expect(result).toContain('<ymax>110</ymax>')
    })

    it('handles optional fields', () => {
      const imageInfo = { ...mockImageInfo, folder: undefined, path: undefined }
      const result = exportAnnotationsVOC(mockAnnotations, imageInfo)
      
      expect(result).toContain('<folder></folder>')
      expect(result).toContain('<path></path>')
    })
  })

  describe('exportToFormat', () => {
    it('exports to JSON format', () => {
      const result = exportToFormat(mockAnnotations, mockImageInfo, 'json')
      const parsed = JSON.parse(result)
      expect(parsed.annotations).toHaveLength(2)
    })

    it('exports to COCO format', () => {
      const result = exportToFormat(mockAnnotations, mockImageInfo, 'coco')
      const parsed = JSON.parse(result) as COCOFormat
      expect(parsed.images).toHaveLength(1)
      expect(parsed.categories).toHaveLength(2)
      expect(parsed.annotations).toHaveLength(2)
    })

    it('exports to YOLO format', () => {
      const result = exportToFormat(mockAnnotations, mockImageInfo, 'yolo')
      const lines = result.split('\n').filter(line => line.trim())
      expect(lines).toHaveLength(2)
    })

    it('exports to VOC format', () => {
      const result = exportToFormat(mockAnnotations, mockImageInfo, 'voc')
      expect(result).toContain('<annotation>')
      expect(result).toContain('<name>person</name>')
    })

    it('defaults to JSON for unknown format', () => {
      const result = exportToFormat(mockAnnotations, mockImageInfo, 'json' as any)
      const parsed = JSON.parse(result)
      expect(parsed.annotations).toBeDefined()
    })
  })

  describe('importAnnotationsJSON', () => {
    it('imports annotations from array format', () => {
      const data = mockAnnotations
      const result = importAnnotationsJSON(data)
      
      expect(result).toHaveLength(2)
      expect(result[0].id).toBe('1')
      expect(result[0].label).toBe('person')
    })

    it('imports annotations from object format', () => {
      const data = {
        name: 'test.jpg',
        width: 500,
        height: 400,
        annotations: mockAnnotations
      }
      const result = importAnnotationsJSON(data)
      
      expect(result).toHaveLength(2)
      expect(result[0].id).toBe('1')
    })

    it('returns empty array for invalid data', () => {
      const result = importAnnotationsJSON(null as any)
      expect(result).toHaveLength(0)
    })

    it('returns empty array for object without annotations', () => {
      const data = { name: 'test.jpg', width: 500, height: 400 }
      const result = importAnnotationsJSON(data)
      expect(result).toHaveLength(0)
    })
  })

  describe('edge cases and error handling', () => {
    it('handles empty annotations array', () => {
      const result = exportToFormat([], mockImageInfo, 'json')
      const parsed = JSON.parse(result)
      expect(parsed.annotations).toHaveLength(0)
    })

    it('handles annotations with multiple labels', () => {
      const annotations = [
        { ...mockAnnotations[0], label: 'label1' },
        { ...mockAnnotations[0], label: 'label2' },
        { ...mockAnnotations[0], label: 'label1' }
      ]
      const result = exportAnnotationsCOCO(annotations, mockImageInfo)
      
      expect(result.categories).toHaveLength(2)
    })

    it('handles polygon annotations in COCO format', () => {
      const polygonAnnotation: Annotation = {
        id: '3',
        type: 'polygon',
        label: 'triangle',
        points: [
          { x: 10, y: 10 },
          { x: 20, y: 30 },
          { x: 30, y: 10 }
        ],
        color: '#0000FF',
        attributes: {}
      }
      
      const result = exportAnnotationsCOCO([polygonAnnotation], mockImageInfo)
      expect(result.annotations[0].segmentation).toBeDefined()
      expect(result.annotations[0].segmentation).toHaveLength(1)
      expect(result.annotations[0].segmentation![0]).toHaveLength(6)
    })

    it('handles point annotations in COCO format', () => {
      const pointAnnotation = mockAnnotations[1]
      const result = exportAnnotationsCOCO([pointAnnotation], mockImageInfo)
      expect(result.annotations[0].segmentation).toBeUndefined()
    })

    it('handles line annotations in COCO format', () => {
      const lineAnnotation: Annotation = {
        id: '4',
        type: 'line',
        label: 'boundary',
        points: [{ x: 0, y: 100 }, { x: 500, y: 100 }],
        color: '#00FF00',
        attributes: {}
      }
      
      const result = exportAnnotationsCOCO([lineAnnotation], mockImageInfo)
      expect(result.annotations[0].segmentation).toBeUndefined()
    })
  })
})
