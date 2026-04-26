'use client';

import { useRef, useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  FolderOpen, ChevronLeft, ChevronRight, Save, FileImage, Download,
  Plus, X, Palette, Archive, PieChart, Upload, Settings, CheckSquare,
  Globe,
} from 'lucide-react';
import { useAnnotationStore } from '../../store/annotationStore';
import { useLocaleStore } from '../../store/localeStore';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';
import { exportToFormat, importAnnotationsJSON, importAnnotationsYOLO, importAnnotationsVOC, importAnnotationsDOTA, importAnnotationsMOT, importAnnotationsPPOCR } from '../../utils/exportImport';
import { writeTextFile, readDir, readTextFile, exists } from '@tauri-apps/plugin-fs';
import { save, open } from '@tauri-apps/plugin-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { loadAnnotationsForImage, imagePathToUrl } from '../../utils/fileOps';
import { StatsDialog } from './StatsDialog';
import { ExportFormat } from '../../types/annotation';
import { EXPORT_FORMAT_INFO, SUPPORTED_IMAGE_EXTENSIONS } from '../../constants/annotation';

function isImageFile(filename: string): boolean {
  const ext = filename.toLowerCase();
  return SUPPORTED_IMAGE_EXTENSIONS.some(e => ext.endsWith(e));
}

export function TopNav() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { t, locale, setLocale } = useLocaleStore();
  const [showLabelManager, setShowLabelManager] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showLocale, setShowLocale] = useState(false);
  const [exportFormat, setExportFormat] = useState<ExportFormat>('json');

  const {
    imageName, imageWidth, imageHeight, annotations, setImage,
    currentImageIndex, images, setImages, setCurrentImageIndex, labels,
    autoSave, setAutoSave, defaultExportFormat, setDefaultExportFormat,
    fillOpacity, setFillOpacity, setImageChecked, getImageChecked,
  } = useAnnotationStore();

  const handleLoadImage = useCallback((file: File) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => { setImage(url, file.name, img.width, img.height); };
    img.src = url;
  }, [setImage]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleLoadImage(file);
  }, [handleLoadImage]);

  const handleOpenFolder = useCallback(async () => {
    try {
      const selected = await open({ directory: true, multiple: false });
      if (selected && typeof selected === 'string') {
        const entries = await readDir(selected);
        const imageFiles: string[] = [];
        for (const entry of entries) {
          if (entry.name && isImageFile(entry.name)) imageFiles.push(entry.name);
        }
        if (imageFiles.length > 0) {
          imageFiles.sort();
          const fullPaths = imageFiles.map(name => `${selected}/${name}`);
          setImages(fullPaths);
          setCurrentImageIndex(0);
          const url = await imagePathToUrl(fullPaths[0]);
          const firstImg = new window.Image();
          firstImg.onload = () => {
            setImage(url, imageFiles[0], firstImg.width, firstImg.height);
          };
          firstImg.src = url;
        }
      }
    } catch (error) { console.error('Error opening folder:', error); }
  }, [setImages, setCurrentImageIndex, setImage]);

  const handleLoadImageFromPath = useCallback(async (path: string, name: string) => {
    try {
      const url = await imagePathToUrl(path);
      const img = new window.Image();
      img.onload = async () => {
        setImage(url, name, img.width, img.height);
        await loadAnnotationsForImage(path);
      };
      img.onerror = () => console.error('Failed to load image:', path);
      img.src = url;
    } catch (e) {
      console.error('Failed to read image file:', path, e);
    }
  }, [setImage]);

  const handlePrevImage = useCallback(() => {
    if (currentImageIndex > 0) {
      const newIndex = currentImageIndex - 1;
      setCurrentImageIndex(newIndex);
      handleLoadImageFromPath(images[newIndex], images[newIndex].split(/[/\\]/).pop() || 'image');
    }
  }, [currentImageIndex, images, setCurrentImageIndex, handleLoadImageFromPath]);

  const handleNextImage = useCallback(() => {
    if (currentImageIndex < images.length - 1) {
      const newIndex = currentImageIndex + 1;
      setCurrentImageIndex(newIndex);
      handleLoadImageFromPath(images[newIndex], images[newIndex].split(/[/\\]/).pop() || 'image');
    }
  }, [currentImageIndex, images, setCurrentImageIndex, handleLoadImageFromPath]);

  const handleExport = useCallback(async () => {
    if (!imageName || annotations.length === 0) return;
    try {
      const imageInfo = { name: imageName, width: imageWidth, height: imageHeight };
      const content = exportToFormat(annotations, imageInfo, exportFormat, labels);
      const ext = EXPORT_FORMAT_INFO[exportFormat]?.ext || 'json';
      const selected = await save({
        defaultPath: `${imageName.replace(/\.[^/.]+$/, '')}_annotations.${ext}`,
        filters: [{ name: ext.toUpperCase(), extensions: [ext] }],
      });
      if (selected && typeof selected === 'string') {
        await writeTextFile(selected, content);
      }
    } catch (error) { console.error('Error exporting:', error); }
    setShowExportDialog(false);
  }, [annotations, imageName, imageWidth, imageHeight, exportFormat, labels]);

  const handleExportProject = async () => {
    if (images.length === 0) return;
    try {
      const projectData: any[] = [];
      for (const path of images) {
        const basePath = path.replace(/\.[^/.]+$/, '');
        const jsonPath1 = `${basePath}_annotations.json`;
        const jsonPath2 = `${basePath}.json`;
        let targetPath = null;
        if (await exists(jsonPath1)) targetPath = jsonPath1;
        else if (await exists(jsonPath2)) targetPath = jsonPath2;
        if (targetPath) {
          const content = await readTextFile(targetPath);
          projectData.push({ imagePath: path, data: JSON.parse(content) });
        }
      }
      if (projectData.length === 0) { alert('未发现任何已保存的标注文件！'); return; }
      const content = JSON.stringify({ project: 'RLabel', count: projectData.length, images: projectData }, null, 2);
      let defaultName = 'project_all_annotations.json';
      try { const parts = images[0].split(/[/\\]/); if (parts.length > 1) defaultName = `${parts[parts.length - 2]}_all_annotations.json`; } catch {}
      const selected = await save({ defaultPath: defaultName, filters: [{ name: 'JSON', extensions: ['json'] }] });
      if (selected && typeof selected === 'string') await writeTextFile(selected, content);
    } catch (error) { console.error('Error exporting project:', error); }
  };

  const handleImport = async () => {
    try {
      const selected = await open({
        multiple: false,
        filters: [{ name: 'Annotation Files', extensions: ['json', 'txt', 'xml'] }],
      });
      if (selected && typeof selected === 'string') {
        const content = await readTextFile(selected);
        const ext = selected.split('.').pop()?.toLowerCase();
        let newAnnotations: any[] = [];
        if (ext === 'json') {
          newAnnotations = importAnnotationsJSON(JSON.parse(content));
        } else if (ext === 'txt') {
          if (content.startsWith('imagesource:') || content.match(/^\d+\.\d+ \d+\.\d+ \d+\.\d+ \d+\.\d+/m)) {
            newAnnotations = importAnnotationsDOTA(content);
          } else if (content.includes('\t')) {
            newAnnotations = importAnnotationsPPOCR(content);
          } else if (content.match(/^\d+,\d+,/m)) {
            newAnnotations = importAnnotationsMOT(content, imageWidth, imageHeight);
          } else if (imageName) {
            newAnnotations = importAnnotationsYOLO(content, imageWidth, imageHeight, labels);
          } else {
            alert('请先加载图片以确定尺寸和类别映射。');
            return;
          }
        } else if (ext === 'xml') {
          newAnnotations = importAnnotationsVOC(content);
        }
        if (newAnnotations.length > 0) {
          useAnnotationStore.getState().setAnnotations([...annotations, ...newAnnotations]);
        }
      }
    } catch (error) { console.error('Error importing annotations:', error); }
  };

  const handleToggleChecked = () => {
    if (imageName) {
      const current = getImageChecked(imageName);
      setImageChecked(imageName, !current);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'o') { e.preventDefault(); handleOpenFolder(); }
      if (e.key === 'ArrowLeft' && e.ctrlKey) { e.preventDefault(); handlePrevImage(); }
      if (e.key === 'ArrowRight' && e.ctrlKey) { e.preventDefault(); handleNextImage(); }
    };
    const handleRequestSave = () => {
      if (imageName && annotations.length > 0) { setExportFormat('json'); setShowExportDialog(true); }
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('request-save', handleRequestSave as EventListener);
    return () => { window.removeEventListener('keydown', handleKeyDown); window.removeEventListener('request-save', handleRequestSave as EventListener); };
  }, [handleOpenFolder, handlePrevImage, handleNextImage, imageName, annotations.length]);

  const NavBtn = ({ icon, tip, onClick, disabled }: { icon: React.ReactNode; tip: string; onClick: () => void; disabled?: boolean }) => (
    <Tooltip>
      <TooltipTrigger asChild>
        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={onClick} disabled={disabled}
          className={`w-7 h-7 rounded-md flex items-center justify-center transition-all ${disabled ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800'}`}>
          {icon}
        </motion.button>
      </TooltipTrigger>
      <TooltipContent>{tip}</TooltipContent>
    </Tooltip>
  );

  return (
    <>
      <div className="h-10 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex items-center px-3 gap-1.5 shadow-sm">
        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />

        <NavBtn icon={<FileImage size={15} />} tip={t.topNav.openImage} onClick={() => fileInputRef.current?.click()} />
        <NavBtn icon={<FolderOpen size={15} />} tip={t.topNav.openFolder} onClick={handleOpenFolder} />

        <div className="w-px h-4 bg-gray-200 dark:bg-gray-700 mx-0.5" />

        <NavBtn icon={<ChevronLeft size={15} />} tip={t.topNav.previousImage}
          onClick={handlePrevImage} disabled={currentImageIndex <= 0 || images.length === 0} />
        <NavBtn icon={<ChevronRight size={15} />} tip={t.topNav.nextImage}
          onClick={handleNextImage} disabled={currentImageIndex >= images.length - 1 || images.length === 0} />

        {images.length > 0 && (
          <span className="text-[11px] text-gray-400 dark:text-gray-500 font-mono tabular-nums">{currentImageIndex + 1}/{images.length}</span>
        )}

        {imageName && (
          <NavBtn
            icon={<CheckSquare size={15} className={getImageChecked(imageName) ? 'text-green-500' : ''} />}
            tip={getImageChecked(imageName) ? '标记为未审核' : '标记为已审核'}
            onClick={handleToggleChecked}
          />
        )}

        <div className="flex-1 flex items-center justify-center gap-2">
          {imageName ? (
            <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-1.5">
              <FileImage size={13} className="text-blue-500" />
              <span className="text-xs font-medium text-gray-700 dark:text-gray-200">{imageName}</span>
              <span className="text-[10px] text-gray-400 dark:text-gray-500 font-mono tabular-nums">{imageWidth}×{imageHeight}</span>
            </motion.div>
          ) : (
            <span className="text-xs text-gray-400 dark:text-gray-500">{t.topNav.noImageLoaded}</span>
          )}
        </div>

        <div className="flex items-center gap-0.5">
          <NavBtn icon={<Globe size={15} />} tip="语言 / Language" onClick={() => setShowLocale(!showLocale)} />
          <NavBtn icon={<Palette size={15} />} tip="标签管理" onClick={() => setShowLabelManager(true)} />
          <NavBtn icon={<PieChart size={15} />} tip="标注统计" onClick={() => setShowStats(true)} />
          <NavBtn icon={<Settings size={15} />} tip="设置" onClick={() => setShowSettings(true)} />

          <div className="w-px h-4 bg-gray-200 dark:bg-gray-700 mx-0.5" />

          <NavBtn icon={<Download size={15} />} tip="导出当前图片"
            onClick={() => { setExportFormat(defaultExportFormat); setShowExportDialog(true); }}
            disabled={!imageName || annotations.length === 0} />
          <NavBtn icon={<Archive size={15} />} tip="导出整个项目" onClick={handleExportProject} disabled={images.length === 0} />
          <NavBtn icon={<Upload size={15} />} tip="导入标注" onClick={handleImport} />

          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            onClick={() => { setExportFormat(defaultExportFormat); setShowExportDialog(true); }}
            disabled={!imageName || annotations.length === 0}
            className={`ml-1 px-3 py-1 rounded-md text-xs font-medium transition-all flex items-center gap-1.5
              ${imageName && annotations.length > 0
                ? 'bg-blue-500 text-white hover:bg-blue-600'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 cursor-not-allowed'}`}>
            <Save size={13} /> {t.topNav.save}
          </motion.button>
        </div>
      </div>

      {/* Export Dialog */}
      <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
        <DialogContent className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-gray-900 dark:text-gray-100">导出标注</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm text-gray-500 dark:text-gray-400">导出格式</label>
              <div className="grid grid-cols-3 gap-2">
                {Object.entries(EXPORT_FORMAT_INFO).map(([key, info]) => (
                  <button key={key} onClick={() => setExportFormat(key as ExportFormat)}
                    className={`p-2.5 rounded-lg border text-left transition-all
                      ${exportFormat === key ? 'border-blue-500 bg-blue-50 dark:bg-blue-500/10' : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700'}`}>
                    <div className="text-xs font-medium text-gray-800 dark:text-gray-200">{info.label}</div>
                    <div className="text-[10px] text-gray-400 dark:text-gray-500">{info.desc}</div>
                  </button>
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setShowExportDialog(false)} className="text-gray-500">取消</Button>
              <Button onClick={handleExport} className="bg-blue-500 hover:bg-blue-600 text-white">导出</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Settings Dialog */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-gray-900 dark:text-gray-100">设置</DialogTitle>
          </DialogHeader>
          <div className="space-y-5 py-4">
            <div className="flex items-center justify-between">
              <label className="text-sm text-gray-700 dark:text-gray-300">自动保存</label>
              <button onClick={() => setAutoSave(!autoSave)}
                className={`w-10 h-6 rounded-full transition-colors ${autoSave ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'}`}>
                <div className={`w-4 h-4 rounded-full bg-white transition-transform mx-1 shadow-sm ${autoSave ? 'translate-x-4' : ''}`} />
              </button>
            </div>
            <div className="space-y-2">
              <label className="text-sm text-gray-700 dark:text-gray-300">默认导出格式</label>
              <select value={defaultExportFormat} onChange={e => setDefaultExportFormat(e.target.value as ExportFormat)}
                className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md p-2 text-sm text-gray-800 dark:text-gray-200">
                {Object.entries(EXPORT_FORMAT_INFO).map(([k, v]) => (
                  <option key={k} value={k}>{v.label} - {v.desc}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm text-gray-700 dark:text-gray-300">填充透明度: {(fillOpacity * 100).toFixed(0)}%</label>
              <input type="range" min="0" max="100" value={fillOpacity * 100}
                onChange={e => setFillOpacity(Number(e.target.value) / 100)}
                className="w-full accent-blue-500" />
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Language Selector */}
      <Dialog open={showLocale} onOpenChange={setShowLocale}>
        <DialogContent className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 max-w-sm">
          <DialogHeader><DialogTitle className="text-gray-900 dark:text-gray-100">语言 / Language</DialogTitle></DialogHeader>
          <div className="space-y-2 py-4">
            {[
              { code: 'zh', label: '简体中文' },
              { code: 'en', label: 'English' },
              { code: 'ja', label: '日本語' },
              { code: 'ko', label: '한국어' },
            ].map(l => (
              <button key={l.code} onClick={() => { setLocale(l.code as any); setShowLocale(false); }}
                className={`w-full p-3 rounded-lg border text-left transition-all text-sm
                  ${locale === l.code ? 'border-blue-500 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400' : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}`}>
                {l.label}
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      <StatsDialog isOpen={showStats} onClose={() => setShowStats(false)} />
      <LabelManager open={showLabelManager} onClose={() => setShowLabelManager(false)} />
    </>
  );
}

function LabelManager({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { labels, addLabel, removeLabel } = useAnnotationStore();
  const [newLabel, setNewLabel] = useState('');
  const [newColor, setNewColor] = useState('#3b82f6');

  const handleAddLabel = () => {
    if (newLabel.trim()) {
      addLabel({ name: newLabel.trim(), color: newColor });
      setNewLabel('');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 max-w-md">
        <DialogHeader>
          <DialogTitle className="text-gray-900 dark:text-gray-100 flex items-center justify-between">
            标签管理
            <button onClick={onClose} className="w-7 h-7 rounded-md flex items-center justify-center text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800">
              <X size={15} />
            </button>
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="flex gap-2">
            <Input value={newLabel} onChange={e => setNewLabel(e.target.value)} placeholder="标签名称"
              className="flex-1 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200" onKeyDown={e => e.key === 'Enter' && handleAddLabel()} />
            <input type="color" value={newColor} onChange={e => setNewColor(e.target.value)}
              className="w-10 h-10 rounded-md cursor-pointer border border-gray-200 dark:border-gray-700 bg-transparent" />
            <Button onClick={handleAddLabel} className="bg-blue-500 hover:bg-blue-600 text-white"><Plus size={16} /></Button>
          </div>
          <div className="space-y-2 max-h-[300px] overflow-auto scroll-thin">
            {labels.map(label => (
              <div key={label.name} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: label.color }} />
                <span className="flex-1 text-sm text-gray-800 dark:text-gray-200">{label.name}</span>
                <button onClick={() => removeLabel(label.name)}
                  className="w-6 h-6 rounded-md flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10">
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
