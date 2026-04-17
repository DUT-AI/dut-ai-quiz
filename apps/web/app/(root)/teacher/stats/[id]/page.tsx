"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";
import { useExam, useExamStats, useExternalUsers } from "@/lib/queries";
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
import { 
  ArrowLeft, 
  Users, 
  CheckCircle2, 
  Trophy, 
  Clock, 
  AlertTriangle,
  ChevronRight,
  HelpCircle,
  TrendingUp,
  Activity
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function ExamStatsDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  
  const { data: exam, isLoading: loadingExam } = useExam(id);
  const { data: stats, isLoading: loadingStats } = useExamStats(id);
  const { data: externalUsersData } = useExternalUsers();
  
  const externalUsers = externalUsersData?.data || [];
  const userMap = React.useMemo(() => {
    const map = new Map();
    externalUsers.forEach(u => map.set(u.id, u));
    return map;
  }, [externalUsers]);

  if (loadingExam || loadingStats) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center space-y-4">
        <div className="size-12 border-4 border-blue-500 border-t-transparent animate-spin rounded-full" />
        <p className="font-bold text-blue-500 animate-pulse">Đang phân tích dữ liệu...</p>
      </div>
    );
  }

  if (!exam || !stats) return <div>Không tìm thấy dữ liệu</div>;

  const { summary, score_distribution, participants, question_stats } = stats;

  return (
    <div className="max-w-7xl mx-auto space-y-10 pb-20">
      {/* Back & Title */}
      <div className="space-y-6">
        <button
          onClick={() => router.push("/teacher/stats")}
          className="flex items-center gap-2 text-gray-navy hover:text-blue-500 font-bold transition-colors"
        >
          <ArrowLeft className="size-4" />
          Quay lại danh sách
        </button>
        
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 rounded-full bg-blue-500/10 text-blue-500 text-[10px] font-black uppercase tracking-widest">
                Phân tích chi tiết
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-dark-blue dark:text-white leading-tight">
              {exam.title}
            </h1>
          </div>
          
          <div className="flex gap-4 p-4 rounded-3xl bg-white dark:bg-navy-blue/40 border border-gray-100 dark:border-white/5 shadow-sm">
            <div className="text-center px-4">
              <p className="text-[10px] font-black uppercase text-gray-navy opacity-40 mb-1">Điểm TB</p>
              <p className="text-2xl font-black text-blue-500">{summary.average_score}</p>
            </div>
            <div className="w-px h-10 bg-gray-100 dark:bg-white/10" />
            <div className="text-center px-4">
              <p className="text-[10px] font-black uppercase text-gray-navy opacity-40 mb-1">Hoàn thành</p>
              <p className="text-2xl font-black text-green-500">
                {Math.round((summary.total_completed / (summary.total_assigned || 1)) * 100)}%
              </p>
            </div>
          </div>
        </header>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard 
          icon={Users} 
          label="Đang tham gia" 
          value={`${summary.total_started}/${summary.total_assigned}`} 
          color="blue"
        />
        <MetricCard 
          icon={CheckCircle2} 
          label="Đã hoàn thành" 
          value={summary.total_completed} 
          color="green"
        />
        <MetricCard 
          icon={Trophy} 
          label="Điểm cao nhất" 
          value={summary.max_score} 
          color="primary"
        />
        <MetricCard 
          icon={Activity} 
          label="Tổng lượt thi" 
          value={participants.reduce((acc, p) => acc + p.attempts_count, 0)} 
          color="orange"
        />
      </div>

      {/* Main Dashboard Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Chart Section */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white dark:bg-navy-blue/40 border border-gray-100 dark:border-white/5 rounded-[3rem] p-8 md:p-10 shadow-sm overflow-hidden relative">
             <div className="flex justify-between items-center mb-10">
                <h3 className="text-xl font-bold flex items-center gap-3">
                  <TrendingUp className="size-5 text-blue-500" />
                  Phân phối điểm số
                </h3>
             </div>
             
             <div className="h-[350px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={score_distribution} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
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
                      {score_distribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={['#3B82F6', '#10B981', '#6366F1', '#F59E0B', '#EF4444'][index % 5]} fillOpacity={0.8} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
             </div>
          </div>

          {/* Questions Analysis */}
          <div className="bg-white dark:bg-navy-blue/40 border border-gray-100 dark:border-white/5 rounded-[3rem] p-8 md:p-10 shadow-sm">
            <h3 className="text-xl font-bold mb-8 flex items-center gap-3">
              <HelpCircle className="size-5 text-blue-500" />
              Phân tích câu hỏi
            </h3>
            <div className="space-y-6">
              {question_stats.map((q, idx) => (
                <div key={q.question_id} className="space-y-3">
                  <div className="flex justify-between items-start gap-4">
                    <p className="text-sm font-bold text-dark-blue dark:text-white line-clamp-2">
                       {idx + 1}. {q.content}
                    </p>
                    <span className={cn(
                      "text-xs font-black",
                      q.correct_rate > 0.7 ? "text-green-500" : q.correct_rate < 0.4 ? "text-red" : "text-orange"
                    )}>
                      {Math.round(q.correct_rate * 100)}% đúng
                    </span>
                  </div>
                  <div className="h-2 w-full bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${q.correct_rate * 100}%` }}
                      transition={{ duration: 1, delay: idx * 0.1 }}
                      className={cn(
                        "h-full rounded-full transition-all",
                        q.correct_rate > 0.7 ? "bg-green-500" : q.correct_rate < 0.4 ? "bg-red shadow-sm shadow-red/20" : "bg-orange"
                      )}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar / Detailed Users */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-navy-blue/40 border border-gray-100 dark:border-white/5 rounded-[3rem] p-8 shadow-sm h-full flex flex-col">
            <h3 className="text-xl font-bold mb-8 flex items-center gap-3">
              <Users className="size-5 text-blue-500" />
              Thí sinh ({participants.length})
            </h3>
            
            <div className="space-y-4 overflow-y-auto pr-2 max-h-[800px] flex-1">
              {participants.sort((a, b) => (b.best_score || 0) - (a.best_score || 0)).map((p) => {
                const user = userMap.get(p.user_id);
                return (
                  <div key={p.user_id} className="group p-4 rounded-2xl bg-gray-50 dark:bg-white/5 border border-transparent hover:border-blue-500/20 transition-all">
                    <div className="flex items-center gap-4 mb-3">
                      <div className="size-10 rounded-full bg-blue-500/10 flex items-center justify-center font-black text-blue-500 overflow-hidden">
                        {user?.avatar_url ? (
                          <img src={user.avatar_url} alt="" className="size-full object-cover" />
                        ) : (
                          user?.name?.charAt(0) || p.user_id
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-dark-blue dark:text-white truncate">
                          {user?.name || `User #${p.user_id}`}
                        </p>
                        <p className="text-[10px] text-gray-navy opacity-60 uppercase font-black truncate">
                          {p.attempts_count} lượt làm bài
                        </p>
                      </div>
                      <div className="text-right">
                        <p className={cn(
                          "text-lg font-black",
                          p.best_score && p.best_score >= 8 ? "text-green-500" : 
                          p.best_score && p.best_score >= 5 ? "text-blue-500" : "text-gray-navy"
                        )}>
                          {p.best_score ?? "N/A"}
                        </p>
                      </div>
                    </div>
                    
                    {p.max_tab_out > 0 && (
                      <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-red/10 text-red text-[10px] font-black uppercase tracking-tighter w-fit">
                        <AlertTriangle className="size-3" />
                        {p.max_tab_out} lần thoát tab
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ icon: Icon, label, value, color }: { 
  icon: any, 
  label: string, 
  value: string | number, 
  color: "blue" | "green" | "primary" | "orange" 
}) {
  const colors = {
    blue: "bg-blue-500/10 text-blue-500",
    green: "bg-green-500/10 text-green-500",
    primary: "bg-primary/10 text-primary",
    orange: "bg-orange/10 text-orange",
  };

  return (
    <motion.div 
      whileHover={{ y: -5 }}
      className="bg-white dark:bg-navy-blue/40 border border-gray-100 dark:border-white/5 rounded-[2.5rem] p-6 shadow-sm flex items-center gap-6"
    >
      <div className={cn("size-14 rounded-2xl flex items-center justify-center shrink-0", colors[color])}>
        <Icon className="size-7" />
      </div>
      <div>
        <p className="text-[10px] font-black uppercase text-gray-navy opacity-40 mb-1">{label}</p>
        <p className="text-2xl font-black text-dark-blue dark:text-white leading-none">{value}</p>
      </div>
    </motion.div>
  );
}
