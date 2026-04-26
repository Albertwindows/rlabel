import { ImageInfo } from '../../types/project';
import { Button } from '../ui/button';
import { ChevronLeft, ChevronRight, FolderOpen } from 'lucide-react';
import { Card, CardContent } from '../ui/card';
import { open } from '@tauri-apps/plugin-dialog';

interface ProjectPanelProps {
  images: ImageInfo[];
  currentIndex: number;
  onNavigate: (direction: 'prev' | 'next') => void;
}

export function ProjectPanel({
  images,
  currentIndex,
  onNavigate
}: ProjectPanelProps) {
  const handleOpenFolder = async () => {
    try {
      const selected = await open({
        multiple: false,
        directory: true,
        title: '选择图像文件夹'
      });

      console.log('Open folder:', selected);
    } catch (error) {
      console.error('Error opening folder:', error);
    }
  };

  const currentImage = currentIndex >= 0 ? images[currentIndex] : null;

  return (
    <div className="flex flex-col gap-3">
      {currentImage && (
        <div className="space-y-2">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">当前图像</div>
          <Card>
            <CardContent className="p-3 space-y-1">
              <div className="text-sm font-medium truncate">{currentImage.name}</div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{currentImage.width} × {currentImage.height}px</span>
                <span>{currentImage.annotations?.length || 0} 个标注</span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="space-y-2">
        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">导航</div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => onNavigate('prev')}
            disabled={currentIndex <= 0}
            title="上一张 (Ctrl+←)"
          >
            <ChevronLeft size={16} />
          </Button>
          <div className="flex-1 text-center text-sm font-medium">
            {currentIndex >= 0 ? `${currentIndex + 1} / ${images.length}` : '-'}
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={() => onNavigate('next')}
            disabled={currentIndex >= images.length - 1}
            title="下一张 (Ctrl+→)"
          >
            <ChevronRight size={16} />
          </Button>
        </div>
      </div>

      <Button
        variant="outline"
        onClick={handleOpenFolder}
        className="w-full justify-start"
      >
        <FolderOpen size={16} className="mr-2" />
        打开文件夹
      </Button>
    </div>
  );
}
