import { exists, readFile, readTextFile, writeTextFile } from '@tauri-apps/plugin-fs';
import { useAnnotationStore } from '../store/annotationStore';
import { importAnnotationsJSON, exportToFormat } from './exportImport';

const MIME_TYPES: Record<string, string> = {
  jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png',
  gif: 'image/gif', bmp: 'image/bmp', webp: 'image/webp',
  tif: 'image/tiff', tiff: 'image/tiff', svg: 'image/svg+xml',
};

let _prevBlobUrl: string | null = null;

export async function imagePathToUrl(path: string): Promise<string> {
  if (_prevBlobUrl) {
    URL.revokeObjectURL(_prevBlobUrl);
    _prevBlobUrl = null;
  }
  const data = await readFile(path);
  const ext = path.split('.').pop()?.toLowerCase() || 'png';
  const blob = new Blob([data], { type: MIME_TYPES[ext] || 'image/png' });
  _prevBlobUrl = URL.createObjectURL(blob);
  return _prevBlobUrl;
}

export async function saveAnnotationsForImage(imagePath: string): Promise<boolean> {
  try {
    const state = useAnnotationStore.getState();
    const { annotations, imageName, imageWidth, imageHeight, labels, defaultExportFormat } = state;
    if (!imageName || annotations.length === 0) return false;

    const imageInfo = { name: imageName, width: imageWidth, height: imageHeight };
    const content = exportToFormat(annotations, imageInfo, defaultExportFormat, labels);

    const basePath = imagePath.replace(/\.[^/.]+$/, '');
    const ext = defaultExportFormat === 'json' ? 'json' : defaultExportFormat === 'yolo' ? 'txt' : 'json';
    const savePath = `${basePath}.${ext}`;

    await writeTextFile(savePath, content);
    return true;
  } catch (e) {
    console.error('Auto-save failed:', e);
    return false;
  }
}

export async function loadAnnotationsForImage(imagePath: string) {
  try {
    const basePath = imagePath.replace(/\.[^/.]+$/, '');
    const jsonPath1 = `${basePath}_annotations.json`;
    const jsonPath2 = `${basePath}.json`;
    
    let targetPath = null;
    if (await exists(jsonPath1)) targetPath = jsonPath1;
    else if (await exists(jsonPath2)) targetPath = jsonPath2;
    
    if (targetPath) {
      const content = await readTextFile(targetPath);
      const data = JSON.parse(content);
      const annotations = importAnnotationsJSON(data);
      if (annotations && annotations.length > 0) {
        useAnnotationStore.getState().setAnnotations(annotations);
      }
    }
  } catch (e) {
    console.error('Failed to auto-load annotations:', e);
  }
}
