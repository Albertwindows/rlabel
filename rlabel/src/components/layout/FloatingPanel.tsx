import { ReactNode } from 'react';
import { cn } from '../../lib/utils';

export interface FloatingPanelProps {
  children: ReactNode;
  position: 'left' | 'right' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  className?: string;
  width?: number;
  height?: number;
}

export function FloatingPanel({
  children,
  position,
  className,
  width = 280,
  height = 350,
}: FloatingPanelProps) {
  const positionStyles: Record<string, string> = {
    'left': 'fixed left-0 top-1/2 -translate-y-1/2',
    'right': 'fixed right-0 top-1/2 -translate-y-1/2',
    'top-left': 'fixed left-0 top-16',
    'top-right': 'fixed right-0 top-16',
    'bottom-left': 'fixed left-0 bottom-16',
    'bottom-right': 'fixed right-0 bottom-16',
  };

  return (
    <div
      className={cn(
        positionStyles[position],
        'glass rounded-xl overflow-hidden transition-all duration-200 ease-in-out',
        'shadow-glass',
        'z-50',
        className
      )}
      style={{ width, height }}
    >
      {children}
    </div>
  );
}
