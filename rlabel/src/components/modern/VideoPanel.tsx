'use client';

import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Film, Play, Pause, SkipBack, SkipForward, ChevronDown, ChevronRight, FolderOpen, Loader2 } from 'lucide-react';
import { invoke } from '@tauri-apps/api/core';
import { open } from '@tauri-apps/plugin-dialog';
import { useAnnotationStore } from '../../store/annotationStore';
import { imagePathToUrl } from '../../utils/fileOps';
import { Button } from '../ui/button';
import { Input } from '../ui/input';

interface VideoFrameInfo {
  frame_index: number;
  timestamp_ms: number;
  path: string;
}

export function VideoPanel() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [frames, setFrames] = useState<VideoFrameInfo[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [frameInterval, setFrameInterval] = useState(1);
  const [videoInfo, setVideoInfo] = useState<any>(null);

  const {
    videoMode, setVideoMode, currentFrameIndex, setCurrentFrameIndex,
    setVideoInfo: storeSetVideoInfo, setImage, setImages, setCurrentImageIndex,
    videoPath, fps,
  } = useAnnotationStore();

  const handleOpenVideo = useCallback(async () => {
    try {
      const selected = await open({
        multiple: false,
        filters: [{ name: 'Video Files', extensions: ['mp4', 'avi', 'mov', 'mkv', 'wmv', 'webm'] }],
      });

      if (selected && typeof selected === 'string') {
        const info = await invoke<any>('get_video_info', { videoPath: selected });
        setVideoInfo(info);
        storeSetVideoInfo(selected, info.total_frames || 0, info.fps || 30);
        setVideoMode(true);
      }
    } catch (e) {
      console.error('Error opening video:', e);
    }
  }, [storeSetVideoInfo, setVideoMode]);

  const handleExtractFrames = useCallback(async () => {
    if (!videoPath) return;
    setIsExtracting(true);
    try {
      const outputDir = videoPath.replace(/\.[^/.]+$/, '') + '_frames';
      const result = await invoke<VideoFrameInfo[]>('extract_video_frames', {
        videoPath,
        outputDir,
        frameInterval,
      });
      setFrames(result);

      if (result.length > 0) {
        const paths = result.map(f => f.path);
        setImages(paths);
        setCurrentImageIndex(0);
        setCurrentFrameIndex(0);

        const firstFrame = result[0];
        const url = await imagePathToUrl(firstFrame.path);
        const img = new window.Image();
        img.onload = () => {
          setImage(url, firstFrame.path.split(/[/\\]/).pop() || 'frame', img.width, img.height);
        };
        img.src = url;
      }
    } catch (e) {
      console.error('Error extracting frames:', e);
    } finally {
      setIsExtracting(false);
    }
  }, [videoPath, frameInterval, setImages, setCurrentImageIndex, setCurrentFrameIndex, setImage]);

  const handleGoToFrame = useCallback(async (idx: number) => {
    if (idx < 0 || idx >= frames.length) return;
    setCurrentFrameIndex(idx);
    setCurrentImageIndex(idx);
    const frame = frames[idx];
    try {
      const url = await imagePathToUrl(frame.path);
      const img = new window.Image();
      img.onload = () => {
        setImage(url, frame.path.split(/[/\\]/).pop() || 'frame', img.width, img.height);
      };
      img.src = url;
    } catch (e) {
      console.error('Failed to load frame:', frame.path, e);
    }
  }, [frames, setCurrentFrameIndex, setCurrentImageIndex, setImage]);

  useEffect(() => {
    if (!isPlaying || frames.length === 0) return;
    const interval = setInterval(() => {
      const nextIdx = currentFrameIndex + 1;
      if (nextIdx >= frames.length) {
        setIsPlaying(false);
        return;
      }
      handleGoToFrame(nextIdx);
    }, 1000 / (fps || 30));
    return () => clearInterval(interval);
  }, [isPlaying, currentFrameIndex, frames, fps, handleGoToFrame]);

  return (
    <div className="border-t border-gray-200 dark:border-gray-800">
      <button onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-3 py-2 flex items-center gap-2 text-[11px] font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors uppercase tracking-wider">
        {isExpanded ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
        <Film size={11} className="text-amber-500" />
        视频标注
        {videoMode && <span className="ml-auto text-[10px] text-amber-500 font-normal normal-case">ON</span>}
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
            <div className="px-3 pb-3 space-y-2.5">
              <Button onClick={handleOpenVideo} className="w-full h-7 text-[11px] bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-500/20 border border-amber-200 dark:border-amber-500/20">
                <FolderOpen size={12} className="mr-1" /> 打开视频文件
              </Button>

              {videoInfo && (
                <div className="text-[10px] text-gray-500 dark:text-gray-400 space-y-0.5 bg-gray-50 dark:bg-gray-800 rounded-md p-2 border border-gray-100 dark:border-gray-700">
                  <div>分辨率: {videoInfo.width}×{videoInfo.height}</div>
                  <div>FPS: {videoInfo.fps?.toFixed(1)}</div>
                  <div>总帧数: {videoInfo.total_frames}</div>
                  <div>时长: {(videoInfo.duration || 0).toFixed(1)}s</div>
                </div>
              )}

              {videoPath && (
                <>
                  <div className="flex gap-2 items-center">
                    <label className="text-[10px] text-gray-500 dark:text-gray-400 whitespace-nowrap">帧间隔:</label>
                    <Input type="number" value={frameInterval} min={1}
                      onChange={e => setFrameInterval(Math.max(1, parseInt(e.target.value) || 1))}
                      className="h-6 text-[10px] w-16 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200" />
                    <Button onClick={handleExtractFrames} disabled={isExtracting}
                      className="flex-1 h-6 text-[10px] bg-amber-500 hover:bg-amber-600 text-white disabled:opacity-40">
                      {isExtracting ? <Loader2 size={10} className="animate-spin mr-1" /> : null}
                      提取帧
                    </Button>
                  </div>

                  {frames.length > 0 && (
                    <>
                      <div className="flex items-center gap-1 justify-center">
                        <button onClick={() => handleGoToFrame(currentFrameIndex - 1)}
                          disabled={currentFrameIndex <= 0}
                          className="w-7 h-7 rounded-md flex items-center justify-center text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-30">
                          <SkipBack size={14} />
                        </button>
                        <button onClick={() => setIsPlaying(!isPlaying)}
                          className="w-8 h-8 rounded-full flex items-center justify-center bg-amber-50 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-500/30">
                          {isPlaying ? <Pause size={14} /> : <Play size={14} />}
                        </button>
                        <button onClick={() => handleGoToFrame(currentFrameIndex + 1)}
                          disabled={currentFrameIndex >= frames.length - 1}
                          className="w-7 h-7 rounded-md flex items-center justify-center text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-30">
                          <SkipForward size={14} />
                        </button>
                      </div>

                      <div className="space-y-1">
                        <input type="range" min={0} max={frames.length - 1} value={currentFrameIndex}
                          onChange={e => handleGoToFrame(parseInt(e.target.value))}
                          className="w-full accent-amber-500 h-1" />
                        <div className="flex justify-between text-[10px] text-gray-400 dark:text-gray-500 font-mono">
                          <span>帧 {currentFrameIndex + 1}/{frames.length}</span>
                          <span>{(frames[currentFrameIndex]?.timestamp_ms / 1000 || 0).toFixed(1)}s</span>
                        </div>
                      </div>
                    </>
                  )}
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
