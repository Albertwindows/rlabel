import { Annotation } from '../../types/annotation';
import { BarChart3 } from 'lucide-react';
import { useEffect, useRef } from 'react';
import * as echarts from 'echarts';
import { Card, CardContent } from '../ui/card';

interface StatsPanelProps {
  annotations: Annotation[];
}

export function StatsPanel({ annotations }: StatsPanelProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);

  const calculateLabelStats = () => {
    const labelMap = new Map<string, { label: string; count: number; color: string }>();

    annotations.forEach(annotation => {
      if (!labelMap.has(annotation.label)) {
        labelMap.set(annotation.label, {
          label: annotation.label,
          count: 0,
          color: annotation.color
        });
      }
      labelMap.get(annotation.label)!.count++;
    });

    return Array.from(labelMap.values()).sort((a, b) => b.count - a.count);
  };

  const labelStats = calculateLabelStats();

  useEffect(() => {
    if (!chartRef.current) return;

    if (!chartInstance.current) {
      chartInstance.current = echarts.init(chartRef.current);
    }

    if (labelStats.length > 0) {
      const option: echarts.EChartsOption = {
        tooltip: {
          trigger: 'item',
          formatter: '{b}: {c} ({d}%)'
        },
        series: [
          {
            type: 'pie',
            radius: ['40%', '70%'],
            avoidLabelOverlap: false,
            itemStyle: {
              borderRadius: 10,
              borderColor: '#fff',
              borderWidth: 2
            },
            label: {
              show: false,
              position: 'center'
            },
            emphasis: {
              label: {
                show: true,
                fontSize: 14,
                fontWeight: 'bold'
              }
            },
            labelLine: {
              show: false
            },
            data: labelStats.map(stat => ({
              value: stat.count,
              name: stat.label,
              itemStyle: {
                color: stat.color
              }
            }))
          }
        ]
      };

      chartInstance.current.setOption(option);
    } else {
      chartInstance.current.clear();
    }

    const handleResize = () => {
      chartInstance.current?.resize();
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [labelStats]);

  return (
    <div className="flex flex-col gap-3">
      <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        统计信息
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/20 rounded-lg">
              <BarChart3 size={20} className="text-primary" />
            </div>
            <div>
              <div className="text-xs text-muted-foreground">总标注数</div>
              <div className="text-2xl font-bold">{annotations.length}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {labelStats.length > 0 && (
        <div className="space-y-2">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            按标签分布
          </div>
          <Card>
            <CardContent className="p-4">
              <div ref={chartRef} className="w-full h-64" />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
