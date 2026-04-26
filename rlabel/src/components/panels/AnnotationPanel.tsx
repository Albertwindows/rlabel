import { Annotation } from '../../types/annotation';
import { formatAnnotationSize } from '../../utils/annotationHelpers';
import { ScrollArea } from '../ui/scroll-area';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import {
  Dot,
  Minus,
  Hexagon,
  Square,
  Trash2
} from 'lucide-react';
import { cn } from '../../lib/utils';

interface AnnotationPanelProps {
  annotations: Annotation[];
  selectedIds: string[];
  onSelect: (id: string | null, isMultiSelect: boolean) => void;
  onDelete: (id: string) => void;
}

export function AnnotationPanel({
  annotations,
  selectedIds,
  onSelect,
  onDelete
}: AnnotationPanelProps) {
  const getTypeIcon = (type: Annotation['type']) => {
    switch (type) {
      case 'point': return Dot;
      case 'line': return Minus;
      case 'polygon': return Hexagon;
      case 'rectangle': return Square;
      default: return Square;
    }
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(id);
  };

  return (
    <div className="flex flex-col gap-2 h-full">
      <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        标注 ({annotations.length})
      </div>

      {annotations.length === 0 ? (
        <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
          暂无标注
        </div>
      ) : (
        <ScrollArea className="flex-1">
          <div className="space-y-2">
            {annotations.map(annotation => {
              const Icon = getTypeIcon(annotation.type);
              const isSelected = selectedIds.includes(annotation.id);

              return (
                <Card
                  key={annotation.id}
                  className={cn(
                    "cursor-pointer transition-all",
                    isSelected
                      ? "bg-primary/20 border-primary/50"
                      : "bg-background/50 hover:bg-background/80"
                  )}
                  onClick={(e) => onSelect(annotation.id, e.ctrlKey || e.metaKey || e.shiftKey)}
                >
                  <div className="flex items-center gap-2 p-3">
                    <div
                      className="w-3 h-3 rounded-sm flex-shrink-0"
                      style={{ backgroundColor: annotation.color }}
                    />
                    <Icon size={16} className="flex-shrink-0 text-muted-foreground" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{annotation.label}</div>
                      <div className="text-xs text-muted-foreground">
                        {formatAnnotationSize(annotation)}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 flex-shrink-0"
                      onClick={(e) => handleDelete(annotation.id, e)}
                    >
                      <Trash2 size={14} className="text-destructive" />
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}
