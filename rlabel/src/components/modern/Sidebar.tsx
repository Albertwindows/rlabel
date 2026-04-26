'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, MapPin, Eye, EyeOff, Search } from 'lucide-react';
import { useAnnotationStore } from '../../store/annotationStore';
import { useLocaleStore } from '../../store/localeStore';
import { ScrollArea } from '../ui/scroll-area';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Annotation } from '../../types/annotation';
import { Input } from '../ui/input';
import { AttributePanel } from '../panels/AttributePanel';
import { formatAnnotationSize } from '../../utils/annotationHelpers';

const TYPE_LABELS: Record<string, string> = {
  point: '点', line: '线段', linestrip: '折线', polygon: '多边形',
  rectangle: '矩形', rotatedRect: '旋转矩形', circle: '圆形',
  cuboid: '3D长方体', quadrilateral: '四边形', text: '文本', mask: '掩码',
};

function AnnotationItem({ annotation, isSelected }: { annotation: Annotation; isSelected: boolean }) {
  const { selectAnnotation, deleteAnnotation, setPan, setZoom, toggleAnnotationVisibility } = useAnnotationStore();

  const handleLocate = useCallback(() => {
    selectAnnotation(annotation.id);
    if (annotation.points.length >= 1) {
      setPan({ x: 0, y: 0 });
      setZoom(2);
    }
  }, [annotation, selectAnnotation, setPan, setZoom]);

  return (
    <motion.div layout initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
      className={`group relative p-2 rounded-md border transition-all duration-150 cursor-pointer
        ${isSelected
          ? 'bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/30'
          : 'bg-white dark:bg-gray-800/50 border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-800 hover:border-gray-200 dark:hover:border-gray-600'}`}
      onClick={() => selectAnnotation(annotation.id)}
    >
      <div className="flex items-start gap-2">
        <div className="w-2.5 h-2.5 rounded-full mt-1 flex-shrink-0 ring-1 ring-black/10" style={{ backgroundColor: annotation.color }} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1">
            <span className="text-[11px] font-medium text-gray-800 dark:text-gray-200 truncate">{annotation.label}</span>
            <span className="text-[9px] px-1 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 uppercase">
              {TYPE_LABELS[annotation.type] || annotation.type}
            </span>
            {annotation.trackId != null && (
              <span className="text-[9px] px-1 py-0.5 rounded bg-purple-50 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400">#{annotation.trackId}</span>
            )}
            {annotation.score != null && (
              <span className="text-[9px] px-1 py-0.5 rounded bg-green-50 dark:bg-green-500/20 text-green-600 dark:text-green-400">{(annotation.score * 100).toFixed(0)}%</span>
            )}
          </div>
          <div className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5 font-mono">
            {formatAnnotationSize(annotation)}
            {annotation.ocrText && <span className="ml-1 text-amber-600 dark:text-amber-400">"{annotation.ocrText.substring(0, 15)}"</span>}
          </div>
        </div>
      </div>

      <div className="absolute right-1 top-1 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <Tooltip>
          <TooltipTrigger asChild>
            <button onClick={e => { e.stopPropagation(); toggleAnnotationVisibility(annotation.id); }}
              className="w-5 h-5 rounded flex items-center justify-center text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700">
              {annotation.visible === false ? <EyeOff size={10} /> : <Eye size={10} />}
            </button>
          </TooltipTrigger>
          <TooltipContent>{annotation.visible === false ? '显示' : '隐藏'}</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <button onClick={e => { e.stopPropagation(); handleLocate(); }}
              className="w-5 h-5 rounded flex items-center justify-center text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10">
              <MapPin size={10} />
            </button>
          </TooltipTrigger>
          <TooltipContent>定位</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <button onClick={e => { e.stopPropagation(); deleteAnnotation(annotation.id); }}
              className="w-5 h-5 rounded flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10">
              <Trash2 size={10} />
            </button>
          </TooltipTrigger>
          <TooltipContent>删除</TooltipContent>
        </Tooltip>
      </div>
    </motion.div>
  );
}

export function Sidebar() {
  const [searchTerm, setSearchTerm] = useState('');
  const { t } = useLocaleStore();
  const {
    annotations, selectedIds, activeId, labels,
    setCurrentLabel, setCurrentColor, deleteSelectedAnnotations,
    updateAnnotation,
  } = useAnnotationStore();

  const selectedAnnotation = annotations.find(a => a.id === activeId);

  const filteredAnnotations = annotations.filter(a => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return a.label.toLowerCase().includes(term) || a.type.toLowerCase().includes(term)
      || (a.ocrText && a.ocrText.toLowerCase().includes(term))
      || (a.trackId != null && `track_${a.trackId}`.includes(term));
  });

  const groupedByLabel: Record<string, Annotation[]> = {};
  filteredAnnotations.forEach(a => {
    if (!groupedByLabel[a.label]) groupedByLabel[a.label] = [];
    groupedByLabel[a.label].push(a);
  });

  return (
    <div className="w-full h-full flex flex-col">
      {/* Properties Panel */}
      <div className="px-3 py-2 border-b border-gray-200 dark:border-gray-800">
        <h2 className="text-[11px] font-semibold text-gray-700 dark:text-gray-200 flex items-center gap-1.5 uppercase tracking-wider">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
          {t.sidebar.properties}
        </h2>
      </div>

      {selectedAnnotation ? (
        <div className="overflow-auto scroll-thin border-b border-gray-200 dark:border-gray-800">
          <div className="p-3 space-y-3">
            <div className="space-y-1">
              <label className="text-[10px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider">{t.labels.label}</label>
              <Select value={selectedAnnotation.label} onValueChange={setCurrentLabel}>
                <SelectTrigger className="bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200 h-7 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700">
                  {labels.map((label) => (
                    <SelectItem key={label.name} value={label.name} className="text-gray-800 dark:text-gray-200 text-xs focus:bg-gray-100 dark:focus:bg-gray-800 focus:text-gray-900 dark:focus:text-white">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: label.color }} />
                        {label.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider">{t.labels.color}</label>
              <div className="flex items-center gap-2">
                <input type="color" value={selectedAnnotation.color} onChange={e => setCurrentColor(e.target.value)}
                  className="w-7 h-7 rounded-md cursor-pointer border-0 bg-transparent" />
                <Input type="text" value={selectedAnnotation.color} onChange={e => setCurrentColor(e.target.value)}
                  className="flex-1 h-7 px-2 rounded-md bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 font-mono text-[10px]" />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider">{t.labels.type}</label>
              <div className="px-2 py-1.5 rounded-md bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
                <span className="text-xs text-gray-700 dark:text-gray-300 capitalize">
                  {TYPE_LABELS[selectedAnnotation.type] || selectedAnnotation.type}
                </span>
                <span className="text-[10px] text-gray-400 dark:text-gray-500 ml-2">
                  {formatAnnotationSize(selectedAnnotation)}
                </span>
              </div>
            </div>

            {(selectedAnnotation.type === 'text' || selectedAnnotation.ocrText != null) && (
              <div className="space-y-1">
                <label className="text-[10px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider">OCR 文本</label>
                <Input
                  value={selectedAnnotation.ocrText || ''}
                  onChange={e => updateAnnotation(selectedAnnotation.id, { ocrText: e.target.value })}
                  placeholder="输入识别文本..."
                  className="h-7 text-xs bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200"
                />
              </div>
            )}

            {selectedAnnotation.trackId != null && (
              <div className="space-y-1">
                <label className="text-[10px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider">跟踪 ID</label>
                <Input type="number" value={selectedAnnotation.trackId}
                  onChange={e => updateAnnotation(selectedAnnotation.id, { trackId: parseInt(e.target.value) || 0 })}
                  className="h-7 text-xs bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200" />
              </div>
            )}

            <div className="space-y-1">
              <label className="text-[10px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider">{t.labels.coordinates}</label>
              <div className="p-2 rounded-md bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 max-h-[80px] overflow-auto scroll-thin">
                <div className="grid grid-cols-2 gap-1 text-[10px] font-mono">
                  {selectedAnnotation.points.slice(0, 8).map((point, i) => (
                    <div key={i} className="flex items-center gap-1">
                      <span className="text-gray-400 dark:text-gray-500">P{i + 1}:</span>
                      <span className="text-gray-600 dark:text-gray-300">{Math.round(point.x)},{Math.round(point.y)}</span>
                    </div>
                  ))}
                  {selectedAnnotation.points.length > 8 && (
                    <div className="text-gray-400 dark:text-gray-500 col-span-2">...+{selectedAnnotation.points.length - 8} more</div>
                  )}
                </div>
              </div>
            </div>

            <AttributePanel />
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-center p-4 border-b border-gray-200 dark:border-gray-800">
          <div className="text-center">
            <div className="w-8 h-8 mx-auto mb-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
              <MapPin size={14} className="text-gray-400 dark:text-gray-500" />
            </div>
            <p className="text-[11px] text-gray-400 dark:text-gray-500">{t.sidebar.selectAnnotation}</p>
          </div>
        </div>
      )}

      {/* Annotation List */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="px-3 py-2 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
          <div>
            <h3 className="text-[11px] font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wider">{t.sidebar.annotations}</h3>
            <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">{annotations.length} {t.sidebar.items}</p>
          </div>
          {selectedIds.length > 0 && (
            <motion.button initial={{ scale: 0 }} animate={{ scale: 1 }} onClick={deleteSelectedAnnotations}
              className="px-2 py-1 rounded-md text-[10px] font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors">
              {t.tools.delete} ({selectedIds.length})
            </motion.button>
          )}
        </div>

        <div className="px-3 py-1.5 border-b border-gray-100 dark:border-gray-800">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" size={11} />
            <Input placeholder="搜索标签或类型..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
              className="pl-7 h-7 text-[11px] bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 rounded-md" />
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1">
            <AnimatePresence mode="popLayout">
              {filteredAnnotations.length === 0 ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-6">
                  <p className="text-[11px] text-gray-400 dark:text-gray-500">{t.sidebar.noAnnotations}</p>
                  <p className="text-[10px] text-gray-300 dark:text-gray-600 mt-0.5">{t.sidebar.useToolsToStart}</p>
                </motion.div>
              ) : (
                filteredAnnotations.map(annotation => (
                  <AnnotationItem key={annotation.id} annotation={annotation} isSelected={selectedIds.includes(annotation.id)} />
                ))
              )}
            </AnimatePresence>
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
