'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Frown, Image as ImageIcon, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { useAnnotationStore } from '../../store/annotationStore';
import { ScrollArea } from '../ui/scroll-area';
import { loadAnnotationsForImage, imagePathToUrl } from '../../utils/fileOps';

export function ImageListSidebar() {
  const { images, currentImageIndex, setCurrentImageIndex, setImage } = useAnnotationStore();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleSelectImage = async (index: number) => {
    if (index === currentImageIndex) return;
    setCurrentImageIndex(index);
    const path = images[index];
    const name = path.split(/[/\\]/).pop() || 'image';
    try {
      const url = await imagePathToUrl(path);
      const img = new window.Image();
      img.onload = async () => {
        setImage(url, name, img.width, img.height);
        await loadAnnotationsForImage(path);
      };
      img.onerror = () => {
        console.error('Failed to load image:', path);
      };
      img.src = url;
    } catch (e) {
      console.error('Failed to read image file:', path, e);
    }
  };

  const getDisplayName = (path: string) => path.split(/[/\\]/).pop() || path;

  return (
    <motion.div 
      initial={false}
      animate={{ 
        width: isCollapsed ? 40 : 200,
      }}
      className="h-full bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col transition-all duration-300 relative z-10"
    >
      <div className={`h-9 min-h-[36px] flex items-center border-b border-gray-200 dark:border-gray-800 ${isCollapsed ? 'justify-center px-1' : 'justify-between px-3'}`}>
        <AnimatePresence>
          {!isCollapsed && (
            <motion.h2 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-xs font-semibold text-gray-700 dark:text-gray-200 whitespace-nowrap overflow-hidden"
            >
              项目文件
            </motion.h2>
          )}
        </AnimatePresence>
        
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="w-6 h-6 rounded-md flex flex-shrink-0 items-center justify-center text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          title={isCollapsed ? "展开侧边栏" : "收起侧边栏"}
        >
          {isCollapsed ? <PanelLeftOpen size={14} /> : <PanelLeftClose size={14} />}
        </button>
      </div>

      {!isCollapsed && (
        <div className="flex-1 flex flex-col overflow-hidden">
          {images.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-4 text-center">
              <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-2">
                <Frown size={18} className="text-gray-400 dark:text-gray-500" />
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">项目为空</p>
              <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">请使用顶栏打开包含图片的文件夹</p>
            </div>
          ) : (
            <>
              <div className="px-3 py-1.5 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
                <span className="text-[10px] text-gray-400 dark:text-gray-500">共 {images.length} 张图片</span>
              </div>
              <ScrollArea className="flex-1">
                <div className="p-1.5 space-y-0.5">
                  {images.map((path, index) => {
                    const isSelected = index === currentImageIndex;
                    const name = getDisplayName(path);
                    return (
                      <button
                        key={path}
                        onClick={() => handleSelectImage(index)}
                        className={`
                          w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-left transition-all group
                          ${isSelected 
                            ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 font-medium' 
                            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-200'
                          }
                        `}
                      >
                        <ImageIcon size={13} className={`flex-shrink-0 ${isSelected ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500'}`} />
                        <span className="text-[11px] truncate leading-none pt-0.5">{name}</span>
                      </button>
                    );
                  })}
                </div>
              </ScrollArea>
            </>
          )}
        </div>
      )}
    </motion.div>
  );
}
