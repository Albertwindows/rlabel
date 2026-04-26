'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wand2, Play, Loader2, ChevronDown, ChevronRight, Server, Cpu, Zap, RefreshCw } from 'lucide-react';
import { invoke } from '@tauri-apps/api/core';
import { useAnnotationStore } from '../../store/annotationStore';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { createAnnotation } from '../../utils/annotationHelpers';

interface ModelInfo {
  name: string;
  model_type: string;
  task: string;
  backend: string;
  loaded: boolean;
  classes: string[];
  input_size: [number, number] | null;
}

export function AIPanel() {
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [confidence, setConfidence] = useState(0.5);
  const [nmsThreshold, setNmsThreshold] = useState(0.45);
  const [isRunning, setIsRunning] = useState(false);
  const [lastResult, setLastResult] = useState<string>('');
  const [useRemote, setUseRemote] = useState(false);
  const [remoteUrl, setRemoteUrl] = useState('http://localhost:8000');
  const [modelsDir, setModelsDir] = useState('./models');
  const [isExpanded, setIsExpanded] = useState(true);
  const [prompt, setPrompt] = useState('');

  const { imageName, images, currentImageIndex, addAnnotation, pushHistory, currentColor } = useAnnotationStore();

  const handleRefreshModels = useCallback(async () => {
    try {
      const result = await invoke<ModelInfo[]>('list_available_models', { modelsDir });
      setModels(result);
      if (result.length > 0 && !selectedModel) {
        setSelectedModel(result[0].name);
      }
    } catch (e) {
      console.error('Failed to list models:', e);
    }
  }, [modelsDir, selectedModel]);

  const handleRunInference = useCallback(async () => {
    if (!imageName || !selectedModel) return;
    setIsRunning(true);
    setLastResult('');

    try {
      const imagePath = images[currentImageIndex] || '';
      const request = {
        image_path: imagePath,
        model_name: selectedModel,
        confidence_threshold: confidence,
        nms_threshold: nmsThreshold,
        prompt: prompt || null,
        points: null,
        point_labels: null,
      };

      let result: any;
      if (useRemote) {
        result = await invoke('run_remote_inference', { serverUrl: remoteUrl, request });
      } else {
        result = await invoke('run_inference', { request });
      }

      if (result.detections && result.detections.length > 0) {
        pushHistory();
        for (const det of result.detections) {
          const points = det.points?.length > 0
            ? det.points
            : [
                { x: det.bbox.x, y: det.bbox.y },
                { x: det.bbox.x + det.bbox.width, y: det.bbox.y },
                { x: det.bbox.x + det.bbox.width, y: det.bbox.y + det.bbox.height },
                { x: det.bbox.x, y: det.bbox.y + det.bbox.height },
              ];

          const type_ = det.type || 'rectangle';
          const annotation = createAnnotation(
            type_ as any,
            det.label,
            points,
            currentColor,
            {
              score: det.confidence,
              ocrText: det.text,
              trackId: det.track_id,
            }
          );
          addAnnotation(annotation);
        }
        setLastResult(`${result.detections.length} 个检测结果 (${result.inference_time_ms.toFixed(0)}ms)`);
      } else {
        setLastResult('无检测结果');
      }
    } catch (e: unknown) {
      setLastResult(`错误: ${String(e)}`);
      console.error('Inference error:', e);
    } finally {
      setIsRunning(false);
    }
  }, [imageName, selectedModel, confidence, nmsThreshold, useRemote, remoteUrl,
      images, currentImageIndex, pushHistory, addAnnotation, currentColor, prompt]);

  const handleBatchInference = useCallback(async () => {
    if (!selectedModel || images.length === 0) return;
    setIsRunning(true);
    try {
      const result = await invoke<any[]>('batch_inference', {
        imagePaths: images,
        modelName: selectedModel,
        confidenceThreshold: confidence,
      });
      const totalDets = result.reduce((sum: number, r: any) => sum + (r.detections?.length || 0), 0);
      setLastResult(`批量完成: ${images.length} 张图片, ${totalDets} 个检测结果`);
    } catch (e: unknown) {
      setLastResult(`批量推理错误: ${String(e)}`);
    } finally {
      setIsRunning(false);
    }
  }, [selectedModel, images, confidence]);

  return (
    <div className="border-t border-gray-200 dark:border-gray-800">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-3 py-2 flex items-center gap-2 text-[11px] font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors uppercase tracking-wider"
      >
        {isExpanded ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
        <Wand2 size={11} className="text-purple-500" />
        AI 推理引擎
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}
            className="overflow-hidden">
            <div className="px-3 pb-3 space-y-2.5">
              <div className="flex gap-1 p-0.5 rounded-md bg-gray-100 dark:bg-gray-800">
                <button onClick={() => setUseRemote(false)}
                  className={`flex-1 flex items-center justify-center gap-1 py-1 rounded text-[10px] font-medium transition-colors
                    ${!useRemote ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}>
                  <Cpu size={10} /> 本地
                </button>
                <button onClick={() => setUseRemote(true)}
                  className={`flex-1 flex items-center justify-center gap-1 py-1 rounded text-[10px] font-medium transition-colors
                    ${useRemote ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}>
                  <Server size={10} /> 远程
                </button>
              </div>

              {useRemote ? (
                <Input value={remoteUrl} onChange={e => setRemoteUrl(e.target.value)}
                  placeholder="http://localhost:8000"
                  className="h-7 text-[11px] bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200" />
              ) : (
                <div className="flex gap-1">
                  <Input value={modelsDir} onChange={e => setModelsDir(e.target.value)}
                    placeholder="模型目录"
                    className="flex-1 h-7 text-[11px] bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200" />
                  <button onClick={handleRefreshModels}
                    className="w-7 h-7 rounded-md flex items-center justify-center text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800">
                    <RefreshCw size={12} />
                  </button>
                </div>
              )}

              <select value={selectedModel} onChange={e => setSelectedModel(e.target.value)}
                className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md p-1.5 text-[11px] text-gray-700 dark:text-gray-200">
                <option value="">选择模型...</option>
                {models.map(m => (
                  <option key={m.name} value={m.name}>{m.name} ({m.task})</option>
                ))}
              </select>

              <Input value={prompt} onChange={e => setPrompt(e.target.value)}
                placeholder="文本提示 (可选, 用于 Grounding/VLM)"
                className="h-7 text-[11px] bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200" />

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[10px] text-gray-500 dark:text-gray-400">置信度: {(confidence * 100).toFixed(0)}%</label>
                  <input type="range" min="0" max="100" value={confidence * 100}
                    onChange={e => setConfidence(Number(e.target.value) / 100)}
                    className="w-full accent-purple-500 h-1" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-gray-500 dark:text-gray-400">NMS: {(nmsThreshold * 100).toFixed(0)}%</label>
                  <input type="range" min="0" max="100" value={nmsThreshold * 100}
                    onChange={e => setNmsThreshold(Number(e.target.value) / 100)}
                    className="w-full accent-purple-500 h-1" />
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={handleRunInference} disabled={isRunning || !imageName || !selectedModel}
                  className="flex-1 h-7 text-[11px] bg-purple-500 hover:bg-purple-600 text-white disabled:opacity-40">
                  {isRunning ? <Loader2 size={12} className="animate-spin mr-1" /> : <Play size={12} className="mr-1" />}
                  推理
                </Button>
                <Button onClick={handleBatchInference} disabled={isRunning || images.length === 0 || !selectedModel}
                  className="flex-1 h-7 text-[11px] bg-purple-400 hover:bg-purple-500 text-white disabled:opacity-40">
                  <Zap size={12} className="mr-1" /> 批量
                </Button>
              </div>

              {lastResult && (
                <div className={`text-[10px] px-2 py-1.5 rounded-md ${
                  lastResult.startsWith('错误') ? 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400' : 'bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400'
                }`}>
                  {lastResult}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
