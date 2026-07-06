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

export function ScoreDistributionTab({ scoreDistribution }: ScoreDistributionTabProps) {
  return (
    <div className="bg-white dark:bg-navy-blue/40 border border-gray-100 dark:border-white/5 rounded-[3rem] p-8 md:p-10 shadow-sm overflow-hidden relative">
       <div className="flex justify-between items-center mb-10">
          <h3 className="text-xl font-bold flex items-center gap-3">
            <TrendingUp className="size-5 text-blue-500" />
            Phân phối điểm số
          </h3>
       </div>
       
       <div className="h-[450px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={scoreDistribution} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
              <XAxis 
                dataKey="range" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 12, fontWeight: 700 }}
              />
              <YAxis axisLine={false} tickLine={false} />
              <Tooltip 
                cursor={{ fill: 'rgba(59, 130, 246, 0.05)' }}
                contentStyle={{ 
                  borderRadius: '1rem', 
                  border: 'none', 
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                  fontWeight: 'bold'
                }}
              />
              <Bar dataKey="count" radius={[10, 10, 0, 0]}>
                {scoreDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={['#3B82F6', '#10B981', '#6366F1', '#F59E0B', '#EF4444'][index % 5]} fillOpacity={0.8} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
       </div>
    </div>
  );
}
