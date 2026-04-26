import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { X, PieChart, AlertTriangle } from 'lucide-react';
import { useAnnotationStore } from '../../store/annotationStore';

export function StatsDialog({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { annotations } = useAnnotationStore();

  const stats = useMemo(() => {
    const counts: Record<string, number> = {};
    let smallAnnotations = 0;

    annotations.forEach(a => {
      counts[a.label] = (counts[a.label] || 0) + 1;

      if (a.type === 'rectangle' && a.points.length >= 2) {
        const [p1, p2] = a.points;
        const width = Math.abs(p2.x - p1.x);
        const height = Math.abs(p2.y - p1.y);
        if (width < 10 || height < 10) smallAnnotations++;
      } else if (a.type === 'polygon' && a.points.length > 2) {
        const xs = a.points.map(p => p.x);
        const ys = a.points.map(p => p.y);
        const width = Math.max(...xs) - Math.min(...xs);
        const height = Math.max(...ys) - Math.min(...ys);
        if (width < 10 || height < 10) smallAnnotations++;
      }
    });

    return {
      total: annotations.length,
      counts,
      smallAnnotations
    };
  }, [annotations]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-md bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-elevated overflow-hidden flex flex-col"
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-sm font-semibold flex items-center gap-2 text-gray-900 dark:text-gray-100">
            <PieChart size={16} className="text-blue-500" />
            标注统计与分析
          </h2>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors">
            <X size={16} />
          </button>
        </div>

        <div className="p-4 space-y-5">
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
              <div className="text-[11px] text-gray-500 dark:text-gray-400 mb-1">总标注数</div>
              <div className="text-xl font-bold text-gray-900 dark:text-gray-100">{stats.total}</div>
            </div>
            <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
              <div className="text-[11px] text-gray-500 dark:text-gray-400 mb-1">类别数</div>
              <div className="text-xl font-bold text-gray-900 dark:text-gray-100">{Object.keys(stats.counts).length}</div>
            </div>
          </div>

          <div>
            <h3 className="text-[11px] font-medium text-gray-600 dark:text-gray-300 mb-2 border-b border-gray-100 dark:border-gray-800 pb-2 uppercase tracking-wider">类别分布</h3>
            <div className="space-y-2.5 max-h-[160px] overflow-y-auto scroll-thin pr-2">
              {Object.entries(stats.counts).sort((a, b) => b[1] - a[1]).map(([label, count]) => (
                <div key={label} className="flex flex-col gap-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-gray-700 dark:text-gray-300">{label}</span>
                    <span className="text-gray-400 dark:text-gray-500">{count} ({(count / stats.total * 100).toFixed(1)}%)</span>
                  </div>
                  <div className="h-1 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full" style={{ width: `${(count / stats.total) * 100}%` }} />
                  </div>
                </div>
              ))}
              {Object.keys(stats.counts).length === 0 && (
                <div className="text-[11px] text-gray-400 dark:text-gray-500 text-center py-4">暂无标注类别</div>
              )}
            </div>
          </div>

          <div>
            <h3 className="text-[11px] font-medium text-gray-600 dark:text-gray-300 mb-2 border-b border-gray-100 dark:border-gray-800 pb-2 flex items-center gap-2 uppercase tracking-wider">
              质量检查
            </h3>
            <div className="space-y-2">
              <div className={`flex items-start gap-3 p-3 rounded-lg border ${stats.smallAnnotations > 0 ? 'bg-yellow-50 dark:bg-yellow-500/10 border-yellow-200 dark:border-yellow-500/20' : 'bg-green-50 dark:bg-green-500/10 border-green-200 dark:border-green-500/20'}`}>
                {stats.smallAnnotations > 0 ? (
                  <AlertTriangle size={14} className="text-yellow-500 mt-0.5" />
                ) : (
                  <div className="w-3.5 h-3.5 rounded-full bg-green-500 flex items-center justify-center mt-0.5 flex-shrink-0">
                    <div className="w-1.5 h-1.5 bg-white rounded-full" />
                  </div>
                )}
                <div>
                  <div className={`text-[11px] font-medium ${stats.smallAnnotations > 0 ? 'text-yellow-600 dark:text-yellow-500' : 'text-green-600 dark:text-green-500'}`}>
                    微小尺寸对象检查
                  </div>
                  <div className={`text-[10px] mt-0.5 ${stats.smallAnnotations > 0 ? 'text-yellow-500/80' : 'text-green-500/80'}`}>
                    {stats.smallAnnotations > 0 
                      ? `发现 ${stats.smallAnnotations} 个尺寸过小 (宽高<10px) 的标注，可能为误操作。` 
                      : '未发现过小的异常标注对象。'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
