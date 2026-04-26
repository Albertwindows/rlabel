import { ReactNode } from 'react';
import { cn } from '../../lib/utils';
import { CardHeader } from '../ui/card';

export interface PanelHeaderProps {
  title: string;
  children?: ReactNode;
  className?: string;
}

export function PanelHeader({ title, children, className }: PanelHeaderProps) {
  return (
    <CardHeader
      className={cn(
        'px-4 py-3 border-b border-glass-border/50 bg-glass/50',
        'flex items-center justify-between space-y-0 pb-3',
        className
      )}
    >
      <h3 className="text-title text-foreground font-semibold">{title}</h3>
      <div className="flex items-center gap-2">
        {children}
      </div>
    </CardHeader>
  );
}
