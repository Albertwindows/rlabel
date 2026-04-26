import { ReactNode } from 'react';
import { cn } from '../../lib/utils';
import { CardContent } from '../ui/card';

export interface PanelContentProps {
  children: ReactNode;
  className?: string;
  withScroll?: boolean;
}

export function PanelContent({ children, className, withScroll = true }: PanelContentProps) {
  return (
    <CardContent
      className={cn(
        withScroll && 'scroll-uniform overflow-y-auto',
        'p-4 text-uniform text-foreground pt-0',
        className
      )}
    >
      {children}
    </CardContent>
  );
}
