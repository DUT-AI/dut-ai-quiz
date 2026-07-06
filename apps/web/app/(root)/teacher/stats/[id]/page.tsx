"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";
import { useExam, useExamStats, useExternalUsers, useExamQuestions } from "@/lib/queries";
import {
  ArrowLeft,
  Users,
  CheckCircle2,
  Trophy,
  HelpCircle,
  TrendingUp,
  Activity
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

import { MetricCard } from "@/features/exams/components/exam-stats/metric-card";
import { ScoreDistributionTab } from "@/features/exams/components/exam-stats/score-distribution-tab";
import { ParticipantsTab } from "@/features/exams/components/exam-stats/participants-tab";
import { QuestionAnalysisTab } from "@/features/exams/components/exam-stats/question-analysis-tab";

export default function ExamStatsDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const { data: exam, isLoading: loadingExam } = useExam(id);
  const { data: stats, isLoading: loadingStats } = useExamStats(id);
  const { data: externalUsersData } = useExternalUsers();
  const { data: examQuestions } = useExamQuestions(id);

  const userMap = React.useMemo(() => {
    const map = new Map();
    const list = externalUsersData?.data || [];
    list.forEach(u => map.set(u.id, u));
    return map;
  }, [externalUsersData?.data]);

  const questionMap = React.useMemo(() => {
    const map = new Map();
    const list = examQuestions || [];
    list.forEach(q => map.set(q.id, q));
    return map;
  }, [examQuestions]);

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

      {/* Main Content inside Tabs */}
      <Tabs defaultValue="score-distribution" className="w-full space-y-8">
        <TabsList>
          <TabsTrigger value="score-distribution">
            <TrendingUp className="size-4" />
            Phân phối điểm số
          </TabsTrigger>
          <TabsTrigger value="participants">
            <Users className="size-4" />
            Thí sinh ({participants.length})
          </TabsTrigger>
          <TabsTrigger value="questions">
            <HelpCircle className="size-4" />
            Phân tích câu hỏi
          </TabsTrigger>
        </TabsList>

        <TabsContent value="score-distribution" className="outline-none mt-0">
          <ScoreDistributionTab scoreDistribution={score_distribution} />
        </TabsContent>

        <TabsContent value="participants" className="outline-none mt-0">
          <ParticipantsTab participants={participants} userMap={userMap} />
        </TabsContent>

        <TabsContent value="questions" className="outline-none mt-0">
          <QuestionAnalysisTab questionStats={question_stats} questionMap={questionMap} />
        </TabsContent>
      </Tabs>
    </div>
  );
}


