import { ScrollArea } from '../ui/scroll-area';
import { History as HistoryIcon } from 'lucide-react';
import { Card } from '../ui/card';
import { cn } from '../../lib/utils';

export interface HistoryItem {
  id: number;
  timestamp: Date;
  action: string;
  description: string;
  data?: any;
}

interface HistoryPanelProps {
  history: HistoryItem[];
  currentIndex: number;
}

export function HistoryPanel({
  history,
  currentIndex
}: HistoryPanelProps) {
  const formatTime = (date: Date): string => {
    return new Intl.DateTimeFormat('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    }).format(date);
  };

  const getActionLabel = (action: string): string => {
    const labels: Record<string, string> = {
      'create': '创建',
      'delete': '删除',
      'update': '更新',
      'import': '导入',
      'export': '导出',
      'load': '加载',
    };
    return labels[action] || action;
  };

  const getActionIcon = (action: string): string => {
    const icons: Record<string, string> = {
      'create': '➕',
      'delete': '🗑️',
      'update': '✏️',
      'import': '📥',
      'export': '📤',
      'load': '📂',
    };
    return icons[action] || '📝';
  };

  return (
    <div className="flex flex-col gap-2 h-full">
      <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        <HistoryIcon size={14} />
        操作历史 ({history.length})
      </div>

      {history.length === 0 ? (
        <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
          暂无操作历史
        </div>
      ) : (
        <ScrollArea className="flex-1">
          <div className="space-y-2">
            {history.slice(0, 50).map((item, index) => (
              <Card
                key={item.id}
                className={cn(
                  index === currentIndex
                    ? "bg-primary/20 border-primary/50"
                    : "bg-background/50"
                )}
              >
                <div className="p-2">
                  <div className="flex items-start gap-2">
                    <span className="text-base">{getActionIcon(item.action)}</span>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium">{getActionLabel(item.action)}</div>
                      <div className="text-xs text-muted-foreground truncate">
                        {item.description}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {formatTime(item.timestamp)}
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}
