'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, Send, ChevronDown, ChevronRight, Loader2, Trash2 } from 'lucide-react';
import { invoke } from '@tauri-apps/api/core';
import { useAnnotationStore } from '../../store/annotationStore';
import { Input } from '../ui/input';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export function ChatbotPanel() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [serverUrl, setServerUrl] = useState('http://localhost:8000');
  const scrollRef = useRef<HTMLDivElement>(null);

  const { images, currentImageIndex } = useAnnotationStore();

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const handleSend = useCallback(async () => {
    if (!input.trim() || isLoading) return;

    const userMsg: ChatMessage = { role: 'user', content: input.trim(), timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const imagePath = images[currentImageIndex] || '';
      const result = await invoke<any>('run_remote_inference', {
        serverUrl,
        request: {
          image_path: imagePath,
          model_name: 'chatbot',
          confidence_threshold: 0.5,
          nms_threshold: 0.45,
          prompt: input.trim(),
          points: null,
          point_labels: null,
        },
      });

      const responseText = result.detections?.[0]?.text || '无响应';
      const assistantMsg: ChatMessage = { role: 'assistant', content: responseText, timestamp: Date.now() };
      setMessages(prev => [...prev, assistantMsg]);
    } catch (e: unknown) {
      const errorMsg: ChatMessage = {
        role: 'assistant',
        content: `连接错误: ${String(e)}. 请确保 VLM 服务已启动。`,
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, images, currentImageIndex, serverUrl]);

  return (
    <div className="border-t border-gray-200 dark:border-gray-800">
      <button onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-3 py-2 flex items-center gap-2 text-[11px] font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors uppercase tracking-wider">
        {isExpanded ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
        <MessageCircle size={11} className="text-cyan-500" />
        VQA / Chatbot
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
            <div className="px-3 pb-3 space-y-2">
              <Input value={serverUrl} onChange={e => setServerUrl(e.target.value)}
                placeholder="VLM 服务地址"
                className="h-6 text-[10px] bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200" />

              <div ref={scrollRef} className="h-[200px] overflow-auto scroll-thin space-y-2 bg-gray-50 dark:bg-gray-800 rounded-md p-2 border border-gray-100 dark:border-gray-700">
                {messages.length === 0 && (
                  <div className="text-center text-[10px] text-gray-400 dark:text-gray-500 py-4">
                    <MessageCircle size={20} className="mx-auto mb-2 opacity-30" />
                    发送消息开始对话
                    <br />
                    支持 Qwen-VL, Gemini, ChatGPT, GLM 等模型
                  </div>
                )}
                {messages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] px-2 py-1.5 rounded-md text-[10px] leading-relaxed
                      ${msg.role === 'user'
                        ? 'bg-blue-500 text-white'
                        : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600'}`}>
                      {msg.content}
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="px-2 py-1.5 rounded-md bg-white dark:bg-gray-700 text-gray-400 border border-gray-200 dark:border-gray-600">
                      <Loader2 size={12} className="animate-spin" />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-1">
                <Input value={input} onChange={e => setInput(e.target.value)}
                  placeholder="输入问题..."
                  onKeyDown={e => e.key === 'Enter' && handleSend()}
                  className="flex-1 h-7 text-[10px] bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200" />
                <button onClick={handleSend} disabled={isLoading || !input.trim()}
                  className="w-7 h-7 rounded-md flex items-center justify-center bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-30">
                  <Send size={12} />
                </button>
                <button onClick={() => setMessages([])}
                  className="w-7 h-7 rounded-md flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10">
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
