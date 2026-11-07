"use client";

import React from "react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from "recharts";
import { TrendingUp } from "lucide-react";

interface ScoreDistributionTabProps {
  scoreDistribution: Array<{
    range: string;
    count: number;
  }>;
}

const BIN_COLORS = [
  "#F43F5E", // 0-1
  "#FB7185", // 1-2
  "#F97316", // 2-3
  "#F59E0B", // 3-4
  "#EAB308", // 4-5
  "#06B6D4", // 5-6
  "#0EA5E9", // 6-7
  "#3B82F6", // 7-8
  "#10B981", // 8-9
  "#059669", // 9-10
];

export function ScoreDistributionTab({ scoreDistribution }: ScoreDistributionTabProps) {
  const totalCompleted = React.useMemo(
    () => scoreDistribution.reduce((acc, curr) => acc + curr.count, 0),
    [scoreDistribution]
  );

  return (
    <div className="bg-white dark:bg-navy-blue/40 border border-gray-100 dark:border-white/5 rounded-[3rem] p-8 md:p-10 shadow-sm overflow-hidden relative">
       <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-8">
          <h3 className="text-xl font-bold flex items-center gap-3 text-dark-blue dark:text-white">
            <TrendingUp className="size-5 text-blue-500" />
            Phân phối điểm số (10 khoảng)
          </h3>
          <span className="text-xs font-bold text-gray-navy opacity-60">
            Tổng cộng: {totalCompleted} thí sinh đã hoàn thành
          </span>
       </div>
       
       <div className="h-[450px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={scoreDistribution} margin={{ top: 20, right: 20, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
              <XAxis 
                dataKey="range" 
                axisLine={false} 
                tickLine={false} 
                interval={0}
                tick={{ fontSize: 12, fontWeight: 700 }}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                allowDecimals={false}
                tick={{ fontSize: 12, fontWeight: 600 }}
              />
              <Tooltip 
                cursor={{ fill: 'rgba(59, 130, 246, 0.05)' }}
                formatter={(value: any) => [`${value} thí sinh`, "Số lượng"]}
                labelFormatter={(label) => `Khoảng điểm: ${label}`}
                contentStyle={{ 
                  borderRadius: '1rem', 
                  border: 'none', 
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                  fontWeight: 'bold',
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                }}
              />
              <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                {scoreDistribution.map((entry, index) => (
                  <Cell 
                    key={`cell-${entry.range}-${index}`} 
                    fill={BIN_COLORS[index % BIN_COLORS.length]} 
                    fillOpacity={0.85} 
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
       </div>
    </div>
  );
}
