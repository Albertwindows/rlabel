import { useState } from 'react';
import { Button } from '../ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { FolderOpen, Save as SaveIcon, Download } from 'lucide-react';
import { open } from '@tauri-apps/plugin-dialog';
import { readFile } from '@tauri-apps/plugin-fs';
import { exportToFormat } from '../../utils/exportImport';

interface FilePanelProps {
  imageName: string;
  imageWidth: number;
  imageHeight: number;
  annotations: any[];
  onLoadImage: (file: File) => void;
}

export function FilePanel({
  imageName,
  imageWidth,
  imageHeight,
  annotations,
  onLoadImage
}: FilePanelProps) {
  const [loading, setLoading] = useState(false);

  const handleOpenImage = async () => {
    try {
      setLoading(true);
      const selected = await open({
        multiple: false,
        filters: [{
          name: 'Image Files',
          extensions: ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp']
        }]
      });

      if (selected && typeof selected === 'string') {
        const fileData = await readFile(selected);
        const mimeType = getMimeType(selected);
        const blob = new Blob([fileData], { type: mimeType });
        const fileName = selected.split(/[/\\]/).pop() || 'image';
        const file = new File([blob], fileName, { type: mimeType });
        onLoadImage(file);
      }
    } catch (error) {
      console.error('Error opening image:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAnnotations = async () => {
    try {
      const imageInfo = {
        name: imageName,
        width: imageWidth,
        height: imageHeight
      };

      const content = exportToFormat(annotations, imageInfo, 'json');

      const selected = await open({
        multiple: false,
        defaultPath: `${imageName.replace(/\.[^/.]+$/, '')}_annotations.json`,
        filters: [{
          name: 'JSON',
          extensions: ['json']
        }]
      });

      if (selected && typeof selected === 'string') {
        const { writeTextFile } = await import('@tauri-apps/plugin-fs');
        await writeTextFile(selected, content);
      }
    } catch (error) {
      console.error('Error saving annotations:', error);
    }
  };

  const getMimeType = (filename: string): string => {
    const ext = filename.split('.').pop()?.toLowerCase() || '';
    const mimeTypes: Record<string, string> = {
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'bmp': 'image/bmp',
      'webp': 'image/webp'
    };
    return mimeTypes[ext] || 'image/jpeg';
  };

  return (
    <div className="flex flex-col gap-3">
      <Button
        onClick={handleOpenImage}
        disabled={loading}
        className="w-full justify-start"
        data-action="open-image"
      >
        <FolderOpen size={16} className="mr-2" />
        打开图像 (Ctrl+O)
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="w-full justify-start">
            <SaveIcon size={16} className="mr-2" />
            导出
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onClick={handleSaveAnnotations}>
            <Download size={16} className="mr-2" />
            JSON格式
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
