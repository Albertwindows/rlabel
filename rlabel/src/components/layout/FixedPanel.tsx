import { ReactNode } from 'react';
import { cn } from '../../lib/utils';
import { Card } from '../ui/card';

export interface FixedPanelProps {
  children: ReactNode;
  className?: string;
  width?: number;
  height?: number;
  style?: React.CSSProperties;
}

export function FixedPanel({
  children,
  className,
  width = 280,
  height,
  style,
}: FixedPanelProps) {
  return (
    <Card
      className={cn(
        'glass transition-all duration-200 ease-in-out',
        'shadow-glass',
        className
      )}
      style={{ 
        width,
        height,
        ...style
      }}
    >
      {children}
    </Card>
  );
}
