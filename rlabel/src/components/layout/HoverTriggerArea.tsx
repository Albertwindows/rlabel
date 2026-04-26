import { ReactNode } from 'react';
import { cn } from '../../lib/utils';

export interface HoverTriggerAreaProps {
  children?: ReactNode;
  triggerPosition: 'left' | 'right' | 'top' | 'bottom';
  onHoverEnter?: () => void;
  onHoverLeave?: () => void;
  className?: string;
  offset?: number;
  height?: number;
}

export function HoverTriggerArea({
  children,
  triggerPosition,
  onHoverEnter,
  onHoverLeave,
  className,
  offset = 0,
  height,
}: HoverTriggerAreaProps) {
  const isVertical = triggerPosition === 'left' || triggerPosition === 'right';
  
  const positionStyles: Record<string, string> = {
    'left': 'fixed left-0',
    'right': 'fixed right-0',
    'top': 'fixed top-0',
    'bottom': 'fixed bottom-0',
  };

  const dimensionStyles = isVertical 
    ? { 
        top: `${offset}%`,
        height: height ? `${height}%` : '100%',
        width: '40px',
      }
    : {
        left: `${offset}%`,
        width: height ? `${height}%` : '100%',
        height: '40px',
      };

  return (
    <div
      className={cn(
        positionStyles[triggerPosition],
        'z-40',
        className
      )}
      style={dimensionStyles}
      onMouseEnter={onHoverEnter}
      onMouseLeave={onHoverLeave}
    >
      {children}
    </div>
  );
}
