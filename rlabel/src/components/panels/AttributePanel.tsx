'use client';

import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { useAnnotationStore } from '../../store/annotationStore';
import { Input } from '../ui/input';

export function AttributePanel() {
  const { activeId, annotations, updateAnnotation } = useAnnotationStore();
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');

  const selectedAnnotation = annotations.find(a => a.id === activeId);

  if (!selectedAnnotation) return null;

  const attributes = selectedAnnotation.attributes || {};

  const handleAdd = () => {
    if (newKey.trim() && newValue.trim()) {
      updateAnnotation(selectedAnnotation.id, {
        attributes: {
          ...attributes,
          [newKey.trim()]: newValue.trim()
        }
      });
      setNewKey('');
      setNewValue('');
    }
  };

  const handleRemove = (keyToRemove: string) => {
    const newAttributes = { ...attributes };
    delete newAttributes[keyToRemove];
    updateAnnotation(selectedAnnotation.id, {
      attributes: newAttributes
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAdd();
    }
  };

  return (
    <div className="space-y-2 mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
      <label className="text-[10px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider">
        自定义属性
      </label>
      
      <div className="space-y-1.5">
        {Object.entries(attributes).map(([key, value]) => (
          <div key={key} className="flex items-center gap-2 p-2 rounded-md bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
            <span className="flex-1 text-[11px] text-gray-700 dark:text-gray-300 font-medium truncate" title={key}>
              {key}
            </span>
            <span className="flex-1 text-[11px] text-gray-500 dark:text-gray-400 truncate" title={String(value)}>
              {String(value)}
            </span>
            <button
              onClick={() => handleRemove(key)}
              className="w-5 h-5 rounded flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
            >
              <X size={12} />
            </button>
          </div>
        ))}
        
        {Object.keys(attributes).length === 0 && (
          <div className="text-[10px] text-gray-400 dark:text-gray-500 text-center py-2 bg-gray-50 dark:bg-gray-800 rounded-md border border-gray-100 dark:border-gray-700 border-dashed">
            暂无自定义属性
          </div>
        )}
      </div>

      <div className="flex gap-1.5">
        <Input
          placeholder="键名"
          value={newKey}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewKey(e.target.value)}
          onKeyDown={handleKeyDown}
          className="flex-1 h-7 px-2 text-[11px] bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200"
        />
        <Input
          placeholder="值"
          value={newValue}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewValue(e.target.value)}
          onKeyDown={handleKeyDown}
          className="flex-1 h-7 px-2 text-[11px] bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200"
        />
        <button
          onClick={handleAdd}
          disabled={!newKey.trim() || !newValue.trim()}
          className="w-7 h-7 rounded-md flex items-center justify-center bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors"
        >
          <Plus size={13} />
        </button>
      </div>
    </div>
  );
}
