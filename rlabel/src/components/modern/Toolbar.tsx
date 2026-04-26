'use client';

import { motion } from 'framer-motion';
import {
  MousePointer2, Square, Pentagon, Hand, Undo2, Redo2, Sun, Moon, Trash2,
  Circle, Minus, GitBranchPlus, RotateCcw, Box, Diamond, Type, Wand2,
  Crosshair, Tag, Copy,
} from 'lucide-react';
import { useAnnotationStore } from '../../store/annotationStore';
import { useThemeStore } from '../../store/themeStore';
import { useLocaleStore } from '../../store/localeStore';
import { ToolType } from '../../types/annotation';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';

interface ToolButtonProps {
  icon: React.ReactNode;
  label: string;
  shortcut?: string;
  isActive?: boolean;
  onClick: () => void;
  disabled?: boolean;
}

function ToolButton({ icon, label, shortcut, isActive, onClick, disabled }: ToolButtonProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onClick}
          disabled={disabled}
          className={`
            relative w-8 h-8 rounded-md flex items-center justify-center transition-all duration-150
            ${isActive
              ? 'bg-blue-500 text-white shadow-sm'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800'
            }
            ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
          `}
        >
          {icon}
        </motion.button>
      </TooltipTrigger>
      <TooltipContent side="right" sideOffset={10}>
        <div className="flex items-center gap-2">
          <span className="text-xs">{label}</span>
          {shortcut && (
            <kbd className="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-[10px] font-mono text-gray-500 dark:text-gray-400">{shortcut}</kbd>
          )}
        </div>
      </TooltipContent>
    </Tooltip>
  );
}

function ActionButton({ icon, label, onClick, disabled, variant = 'default' }: {
  icon: React.ReactNode; label: string; onClick: () => void; disabled?: boolean;
  variant?: 'default' | 'danger';
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onClick}
          disabled={disabled}
          className={`
            w-7 h-7 rounded-md flex items-center justify-center transition-all duration-150
            ${variant === 'danger'
              ? 'text-red-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10'
              : disabled
                ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800'
            }
          `}
        >
          {icon}
        </motion.button>
      </TooltipTrigger>
      <TooltipContent side="right" sideOffset={10}>
        <span className="text-xs">{label}</span>
      </TooltipContent>
    </Tooltip>
  );
}

export function Toolbar() {
  const { t } = useLocaleStore();
  const {
    tool, setTool, historyIndex, history, undo, redo,
    selectedIds, clearCurrentPoints, showLabels, setShowLabels,
    crosshairVisible, setCrosshairVisible, duplicateAnnotations,
  } = useAnnotationStore();
  const { theme, toggleTheme } = useThemeStore();

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;
  const hasSelection = selectedIds.length > 0;

  const basicTools: { type: ToolType; icon: React.ReactNode; label: string; shortcut: string }[] = [
    { type: 'select', icon: <MousePointer2 size={15} />, label: '选择', shortcut: 'V' },
    { type: 'pan', icon: <Hand size={15} />, label: '平移', shortcut: 'H' },
  ];

  const annotationTools: { type: ToolType; icon: React.ReactNode; label: string; shortcut: string }[] = [
    { type: 'point', icon: <Crosshair size={15} />, label: '点', shortcut: 'O' },
    { type: 'line', icon: <Minus size={15} />, label: '线段', shortcut: 'L' },
    { type: 'linestrip', icon: <GitBranchPlus size={15} />, label: '折线', shortcut: '⇧L' },
    { type: 'rectangle', icon: <Square size={15} />, label: '矩形', shortcut: 'R' },
    { type: 'rotatedRect', icon: <RotateCcw size={15} />, label: '旋转矩形', shortcut: 'E' },
    { type: 'polygon', icon: <Pentagon size={15} />, label: '多边形', shortcut: 'P' },
    { type: 'circle', icon: <Circle size={15} />, label: '圆形', shortcut: 'C' },
    { type: 'cuboid', icon: <Box size={15} />, label: '3D 长方体', shortcut: 'D' },
    { type: 'quadrilateral', icon: <Diamond size={15} />, label: '四边形', shortcut: 'Q' },
    { type: 'text', icon: <Type size={15} />, label: '文本区域', shortcut: 'T' },
  ];

  const aiTools: { type: ToolType; icon: React.ReactNode; label: string; shortcut: string }[] = [
    { type: 'sam', icon: <Wand2 size={15} />, label: 'AI 分割 (SAM)', shortcut: 'A' },
  ];

  return (
    <div className="w-[44px] h-full bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col items-center py-2 gap-0.5 overflow-y-auto scroll-thin">
      <div className="flex flex-col items-center gap-0.5">
        {basicTools.map(t => (
          <ToolButton key={t.type} icon={t.icon} label={t.label} shortcut={t.shortcut}
            isActive={tool === t.type}
            onClick={() => { setTool(t.type); clearCurrentPoints(); }}
          />
        ))}
      </div>

      <div className="w-6 h-px bg-gray-200 dark:bg-gray-700 my-1.5" />

      <div className="flex flex-col items-center gap-0.5">
        {annotationTools.map(t => (
          <ToolButton key={t.type} icon={t.icon} label={t.label} shortcut={t.shortcut}
            isActive={tool === t.type}
            onClick={() => { setTool(t.type); clearCurrentPoints(); }}
          />
        ))}
      </div>

      <div className="w-6 h-px bg-gray-200 dark:bg-gray-700 my-1.5" />

      <div className="flex flex-col items-center gap-0.5">
        {aiTools.map(t => (
          <ToolButton key={t.type} icon={t.icon} label={t.label} shortcut={t.shortcut}
            isActive={tool === t.type}
            onClick={() => { setTool(t.type); clearCurrentPoints(); }}
          />
        ))}
      </div>

      <div className="w-6 h-px bg-gray-200 dark:bg-gray-700 my-1.5" />

      <div className="flex flex-col items-center gap-0.5">
        <ActionButton icon={<Undo2 size={13} />} label={`${t.tools.undo} (Ctrl+Z)`} onClick={undo} disabled={!canUndo} />
        <ActionButton icon={<Redo2 size={13} />} label={`${t.tools.redo} (Ctrl+Y)`} onClick={redo} disabled={!canRedo} />
        <ActionButton icon={<Copy size={13} />} label="复制 (Ctrl+D)" onClick={duplicateAnnotations} disabled={!hasSelection} />
        <ActionButton icon={<Trash2 size={13} />} label={`${t.tools.delete} (Del)`}
          onClick={() => useAnnotationStore.getState().deleteSelectedAnnotations()}
          disabled={!hasSelection} variant="danger"
        />
      </div>

      <div className="flex-1" />

      <div className="flex flex-col items-center gap-0.5">
        <ActionButton
          icon={showLabels ? <Tag size={13} /> : <Tag size={13} className="opacity-40" />}
          label={showLabels ? '隐藏标签' : '显示标签'}
          onClick={() => setShowLabels(!showLabels)}
        />
        <ActionButton
          icon={crosshairVisible ? <Crosshair size={13} /> : <Crosshair size={13} className="opacity-40" />}
          label={crosshairVisible ? '隐藏十字准线' : '显示十字准线'}
          onClick={() => setCrosshairVisible(!crosshairVisible)}
        />
        <ActionButton
          icon={theme === 'dark' ? <Sun size={13} /> : <Moon size={13} />}
          label={theme === 'dark' ? t.theme.light : t.theme.dark}
          onClick={toggleTheme}
        />
      </div>
    </div>
  );
}
