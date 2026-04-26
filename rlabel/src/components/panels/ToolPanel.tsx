import { ToolType } from '../../types/annotation';
import { Button } from '../ui/button';
import { Slider } from '../ui/slider';
import {
  MousePointer2,
  Dot,
  Minus,
  Hexagon,
  Square,
  Search,
  Undo2,
  Redo2,
  Trash2,
  Plus
} from 'lucide-react';
import { getToolShortcut } from '../../utils/keyboardShortcuts';

interface ToolPanelProps {
  currentTool: ToolType;
  onToolChange: (tool: ToolType) => void;
  zoom: number;
  onZoomChange: (zoom: number) => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetView: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onDeleteSelected: () => void;
  canUndo: boolean;
  canRedo: boolean;
  hasSelection: boolean;
}

const tools = [
  { type: 'select' as ToolType, label: '选择', icon: MousePointer2 },
  { type: 'point' as ToolType, label: '点', icon: Dot },
  { type: 'line' as ToolType, label: '线', icon: Minus },
  { type: 'polygon' as ToolType, label: '多边形', icon: Hexagon },
  { type: 'rectangle' as ToolType, label: '矩形', icon: Square },
  { type: 'zoom' as ToolType, label: '缩放', icon: Search },
];

export function ToolPanel({
  currentTool,
  onToolChange,
  zoom,
  onZoomChange,
  onZoomIn,
  onZoomOut,
  onResetView,
  onUndo,
  onRedo,
  onDeleteSelected,
  canUndo,
  canRedo,
  hasSelection
}: ToolPanelProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="space-y-2">
        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">工具</div>
        <div className="grid grid-cols-2 gap-2">
          {tools.map(tool => (
            <Button
              key={tool.type}
              variant={currentTool === tool.type ? 'default' : 'outline'}
              size="sm"
              onClick={() => onToolChange(tool.type)}
              className="justify-start"
              title={`${tool.label} (${getToolShortcut(tool.type)})`}
            >
              <tool.icon size={16} className="mr-2" />
              {tool.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">缩放</div>
        <div className="flex items-center gap-2">
          <Button size="icon" variant="outline" onClick={onZoomOut}>
            <Minus size={16} />
          </Button>
          <Slider
            value={[zoom * 100]}
            onValueChange={([value]) => onZoomChange(value / 100)}
            min={10}
            max={500}
            step={10}
            className="flex-1"
          />
          <Button size="icon" variant="outline" onClick={onZoomIn}>
            <Plus size={16} />
          </Button>
        </div>
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>-</span>
          <span className="font-medium">{Math.round(zoom * 100)}%</span>
          <span>+</span>
        </div>
        <Button variant="outline" size="sm" onClick={onResetView} className="w-full">
          重置视图 (0)
        </Button>
      </div>

      <div className="space-y-2">
        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">操作</div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onUndo}
            disabled={!canUndo}
            className="flex-1"
          >
            <Undo2 size={16} className="mr-1" />
            撤销
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onRedo}
            disabled={!canRedo}
            className="flex-1"
          >
            <Redo2 size={16} className="mr-1" />
            重做
          </Button>
        </div>
        <Button
          variant="destructive"
          size="sm"
          onClick={onDeleteSelected}
          disabled={!hasSelection}
          className="w-full"
        >
          <Trash2 size={16} className="mr-2" />
          删除选中 (Delete)
        </Button>
      </div>
    </div>
  );
}
