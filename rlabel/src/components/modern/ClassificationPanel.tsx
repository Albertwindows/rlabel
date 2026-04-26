'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Tag, ChevronDown, ChevronRight, Check } from 'lucide-react';
import { useAnnotationStore } from '../../store/annotationStore';
import { ScrollArea } from '../ui/scroll-area';
import { Input } from '../ui/input';

export function ClassificationPanel() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [customLabel, setCustomLabel] = useState('');
  const { labels, classificationLabel, setClassificationLabel, imageName } = useAnnotationStore();

  const handleSetLabel = useCallback((label: string) => {
    setClassificationLabel(label);
  }, [setClassificationLabel]);

  const handleAddCustom = useCallback(() => {
    if (customLabel.trim()) {
      setClassificationLabel(customLabel.trim());
      setCustomLabel('');
    }
  }, [customLabel, setClassificationLabel]);

  return (
    <div className="border-t border-gray-200 dark:border-gray-800">
      <button onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-3 py-2 flex items-center gap-2 text-[11px] font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors uppercase tracking-wider">
        {isExpanded ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
        <Tag size={11} className="text-emerald-500" />
        图像分类
        {classificationLabel && (
          <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-normal normal-case">{classificationLabel}</span>
        )}
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
            <div className="px-3 pb-3 space-y-2">
              {!imageName ? (
                <p className="text-[10px] text-gray-400 dark:text-gray-500">请先加载图片</p>
              ) : (
                <>
                  <ScrollArea className="max-h-[150px]">
                    <div className="space-y-0.5">
                      {labels.map(label => (
                        <button key={label.name} onClick={() => handleSetLabel(label.name)}
                          className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-left text-[11px] transition-all
                            ${classificationLabel === label.name
                              ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30'
                              : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 border border-transparent'}`}>
                          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: label.color }} />
                          <span className="flex-1">{label.name}</span>
                          {classificationLabel === label.name && <Check size={12} />}
                        </button>
                      ))}
                    </div>
                  </ScrollArea>
                  <div className="flex gap-1">
                    <Input value={customLabel} onChange={e => setCustomLabel(e.target.value)}
                      placeholder="自定义类别..."
                      onKeyDown={e => e.key === 'Enter' && handleAddCustom()}
                      className="flex-1 h-6 text-[10px] bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200" />
                  </div>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
