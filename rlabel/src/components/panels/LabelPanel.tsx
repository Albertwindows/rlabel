import { DEFAULT_LABELS } from '../../constants/annotation';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { cn } from '../../lib/utils';

interface LabelPanelProps {
  currentLabel: string;
  currentColor: string;
  onLabelChange: (label: string) => void;
  onColorChange: (color: string) => void;
}

const PRESET_COLORS = [
  '#3b82f6',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#8b5cf6',
];

export function LabelPanel({
  currentLabel,
  currentColor,
  onLabelChange,
  onColorChange
}: LabelPanelProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="space-y-2">
        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">标签</div>
        <Select value={currentLabel} onValueChange={onLabelChange}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {DEFAULT_LABELS.map(label => (
              <SelectItem key={label} value={label}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">颜色</div>
        <div className="grid grid-cols-5 gap-2">
          {PRESET_COLORS.map(color => (
            <button
              key={color}
              onClick={() => onColorChange(color)}
              className={cn(
                "w-full aspect-square rounded-lg border-2 transition-all",
                currentColor === color ? 'border-primary scale-110' : 'border-transparent'
              )}
              style={{ backgroundColor: color }}
              title={color}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
