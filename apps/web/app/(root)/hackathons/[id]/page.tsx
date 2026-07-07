"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  useHackathon,
  useHackathonRegistrationStatus,
  useHackathonTasks,
} from "@/features/hackathons/queries";
import { HackathonTeamDetail, HackathonTaskSubmissions } from "@/features/hackathons/components";
import {
  ArrowLeft,
  Calendar,
  Users,
  FileCode,
  Award,
  BookOpen,
  ChevronDown,
  ChevronUp,
  ExternalLink,
} from "lucide-react";
import { cn, formatDateTime, getParticipationModeLabel } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

export default function StudentHackathonDetailPage() {
  const params = useParams();
  const router = useRouter();
  const hackathonId = params?.id as string;

  const { data: hackathon, isLoading: isHackathonLoading, error: hackathonError } = useHackathon(hackathonId);
  const { data: regStatus, isLoading: isRegLoading, refetch: refetchReg } = useHackathonRegistrationStatus(hackathonId);
  const { data: tasks = [], isLoading: isTasksLoading } = useHackathonTasks(hackathonId);

  const [activeTab, setActiveTab] = useState<"tasks" | "team" | "rules">("tasks");
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);

  const isApproved = regStatus?.registration?.status === "approved";
  const isLoading = isHackathonLoading || isRegLoading;

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-sm text-gray-navy/70 space-y-3">
        <div className="size-8 border-4 border-primary border-t-transparent animate-spin rounded-full" />
        <span className="font-bold">Đang tải thông tin giải đấu...</span>
      </div>
    );
  }

  if (hackathonError || !hackathon) {
    return (
      <div className="text-left py-10 space-y-4 max-w-xl mx-auto">
        <div className="p-5 rounded-3xl bg-red/10 border border-red/10 text-red font-bold text-sm">
          Không tìm thấy giải đấu này hoặc có lỗi xảy ra.
        </div>
        <button
          onClick={() => router.push("/hackathons")}
          className="px-5 py-3 bg-primary text-white rounded-2xl font-bold flex items-center gap-2"
        >
          <ArrowLeft className="size-4" />
          Quay lại danh sách
        </button>
      </div>
    );
  }

  // Nếu thí sinh chưa được approved, không cho phép xem trang chi tiết này
  if (!isApproved) {
    return (
      <div className="text-center py-16 space-y-5 max-w-md mx-auto">
        <Award className="size-16 text-gray-navy opacity-30 mx-auto" />
        <h3 className="text-xl font-bold text-dark-blue dark:text-white">
          Quyền truy cập bị giới hạn
        </h3>
        <p className="text-sm text-gray-navy dark:text-light-blue opacity-70 leading-relaxed">
          Bạn cần đăng ký tham gia và được Giảng viên phê duyệt trước khi truy cập vào không gian thi đấu của giải đấu này.
        </p>
        <button
          onClick={() => router.push("/hackathons")}
          className="px-5 py-3 bg-primary text-white rounded-2xl font-bold flex items-center gap-2 mx-auto cursor-pointer"
        >
          <ArrowLeft className="size-4" />
          Quay lại danh sách
        </button>
      </div>
    );
  }

  const getMetricLabel = (m: string) => {
    switch (m) {
      case "rmse":
        return "RMSE";
      case "f1_score":
        return "F1-Score";
      case "accuracy":
      default:
        return "Accuracy (Độ chính xác)";
    }
  };

  return (
    <div className="space-y-8 text-left max-w-7xl mx-auto px-4 py-6">
      {/* Back to list with entry animation */}
      <motion.div
        initial={{ opacity: 0, x: -12 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
      >
        <button
          onClick={() => router.push("/hackathons")}
          className="group flex items-center gap-2 text-xs font-black text-gray-navy hover:text-navy-blue dark:text-light-blue/70 dark:hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeft className="size-4 group-hover:-translate-x-0.5 transition-transform" />
          <span>Danh sách Hackathons</span>
        </button>
      </motion.div>

      {/* Main Banner with slide-down entry */}
      <motion.div
        initial={{ opacity: 0, y: -15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        className="rounded-[2.5rem] bg-white dark:bg-navy-blue border border-gray-100 dark:border-white/5 p-8 md:p-10 shadow-sm relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-6"
      >
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl md:text-3xl font-black text-dark-blue dark:text-white">
              {hackathon.name}
            </h1>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 text-xs font-bold border border-emerald-500/10">
              Đang tham gia
            </span>
          </div>

          <p className="text-sm text-gray-navy dark:text-light-blue opacity-75 max-w-3xl leading-relaxed">
            {hackathon.description || "Chào mừng bạn đến với phòng thi của giải đấu."}
          </p>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs font-bold text-gray-navy dark:text-light-blue opacity-60">
            <div className="flex items-center gap-1.5">
              <Calendar className="size-4 text-primary" />
              <span>
                {formatDateTime(hackathon.start_time)} - {formatDateTime(hackathon.end_time)}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Users className="size-4 text-primary" />
              <span>Hình thức: {getParticipationModeLabel(hackathon.participation_mode)}</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Tab Selector Navigation using Shadcn Tabs */}
      <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as any)} className="w-full">
        <TabsList>
          <TabsTrigger value="tasks">
            <FileCode className="size-4" />
            <span>Đề bài / Thử thách</span>
          </TabsTrigger>
          <TabsTrigger value="team">
            <Users className="size-4" />
            <span>Đội thi của tôi</span>
          </TabsTrigger>
          <TabsTrigger value="rules">
            <BookOpen className="size-4" />
            <span>Thể lệ cuộc thi</span>
          </TabsTrigger>
        </TabsList>

        {/* Tab Đề bài */}
        <TabsContent value="tasks" className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="space-y-6"
          >
            <div className="text-left mt-2">
              <h3 className="text-lg font-black text-navy-blue dark:text-white">
                Thử thách & Đề bài thi đấu
              </h3>
              <p className="text-xs text-gray-navy/70 dark:text-light-blue/60 mt-1">
                Xem yêu cầu, tải bộ test và nộp bài giải theo hướng dẫn chi tiết của từng đề.
              </p>
            </div>

            {isTasksLoading ? (
              <div className="flex items-center justify-center py-10 text-sm text-gray-navy/70">
                <div className="size-5 border-2 border-primary border-t-transparent animate-spin rounded-full mr-2" />
                Đang tải danh sách đề thi...
              </div>
            ) : tasks.length === 0 ? (
              <div className="rounded-[2rem] border border-dashed border-gray-200 dark:border-white/10 p-12 text-center bg-white/20 dark:bg-white/[0.01]">
                <FileCode className="size-12 text-gray-navy opacity-30 mx-auto mb-3" />
                <h4 className="font-bold text-navy-blue dark:text-white">Đề thi chưa được mở</h4>
                <p className="text-xs text-gray-navy/60 dark:text-light-blue/50 mt-1">
                  Giảng viên chưa công bố đề bài hoặc thử thách nào cho giải đấu này. Vui lòng quay lại sau.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {tasks.map((task) => {
                  const isExpanded = expandedTaskId === task.id;
                  return (
                    <div
                      key={task.id}
                      className="rounded-3xl border border-gray-100 dark:border-white/5 bg-white dark:bg-navy-blue overflow-hidden shadow-sm transition-all"
                    >
                      {/* Accordion Header */}
                      <div
                        onClick={() => setExpandedTaskId(isExpanded ? null : task.id)}
                        className="p-6 flex items-center justify-between cursor-pointer hover:bg-slate-50/50 dark:hover:bg-white/[0.01]"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-xl bg-primary/10 text-primary">
                            <FileCode className="size-5" />
                          </div>
                          <div>
                            <h4 className="font-bold text-navy-blue dark:text-white text-base">
                              {task.name}
                            </h4>
                            <p className="text-xs text-gray-navy/60 dark:text-light-blue/60 mt-0.5">
                              Metric đánh giá: <strong className="text-primary">{getMetricLabel(task.metric_type)}</strong> • Lượt nộp bài tối đa: {task.max_submissions} lượt
                            </p>
                          </div>
                        </div>
                        {isExpanded ? (
                          <ChevronUp className="size-5 text-gray-navy/60" />
                        ) : (
                          <ChevronDown className="size-5 text-gray-navy/60" />
                        )}
                      </div>

                      {/* Accordion Body with smooth height animation */}
                      <AnimatePresence initial={false}>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.25, ease: "easeInOut" }}
                            className="overflow-hidden"
                          >
                            <div className="p-6 border-t border-gray-150 dark:border-white/10 bg-slate-50/30 dark:bg-white/[0.005] space-y-6">
                              {/* Test URLs */}
                              {task.public_test_url && (
                                <div className="flex items-center gap-2 text-sm">
                                  <span className="font-bold text-gray-navy dark:text-light-blue/80">Bộ Test công khai (Public Test):</span>
                                  <a
                                    href={task.public_test_url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-1 text-primary hover:underline font-bold"
                                  >
                                    Tải xuống <ExternalLink className="size-3.5" />
                                  </a>
                                </div>
                              )}

                              {/* Markdown Problem Description */}
                              <div className="space-y-2">
                                <span className="text-[10px] font-black text-gray-navy/70 dark:text-light-blue/50 uppercase tracking-wider block">
                                  Yêu cầu đề thi
                                </span>
                                <div className="prose dark:prose-invert max-w-none text-left bg-white dark:bg-white/[0.01] p-6 rounded-2xl border border-gray-100 dark:border-white/5 overflow-x-auto">
                                  {task.problem_description_md ? (
                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                      {task.problem_description_md}
                                    </ReactMarkdown>
                                  ) : (
                                    <p className="text-gray-navy/40 dark:text-light-blue/30 italic">Chưa có mô tả chi tiết.</p>
                                  )}
                                </div>
                              </div>

                              {/* Submissions Section */}
                              <HackathonTaskSubmissions taskId={task.id} />
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>
        </TabsContent>

        {/* Tab Đội của tôi */}
        <TabsContent value="team" className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="space-y-6"
          >
            {regStatus && (
              <>
                <div className="text-left mt-2">
                  <h3 className="text-lg font-black text-navy-blue dark:text-white">
                    Đội thi & Đăng ký của bạn
                  </h3>
                  <p className="text-xs text-gray-navy/70 dark:text-light-blue/60 mt-1">
                    Xem thông tin các thành viên trong đội thi hoặc thực hiện các thiết lập nhóm.
                  </p>
                </div>

                <div className="w-full px-6 py-5 rounded-3xl bg-white dark:bg-navy-blue border border-gray-100 dark:border-white/5 text-sm">
                  <HackathonTeamDetail
                    hackathonId={hackathon.id}
                    registration={regStatus.registration!}
                    team={regStatus.team}
                    maxTeamMembers={hackathon.max_team_members}
                    onSuccess={refetchReg}
                  />
                </div>
              </>
            )}
          </motion.div>
        </TabsContent>

        {/* Tab Thể lệ */}
        <TabsContent value="rules" className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="space-y-6"
          >
            <div className="text-left mt-2">
              <h3 className="text-lg font-black text-navy-blue dark:text-white">
                Thể lệ & Luật thi đấu chính thức
              </h3>
              <p className="text-xs text-gray-navy/70 dark:text-light-blue/60 mt-1">
                Vui lòng tuân thủ nghiêm ngặt các quy định để có một giải đấu công bằng và ý nghĩa.
              </p>
            </div>

            <div className="p-8 rounded-3xl border border-gray-100 dark:border-white/5 bg-white dark:bg-navy-blue prose dark:prose-invert max-w-none text-left">
              {hackathon.rules ? (
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{hackathon.rules}</ReactMarkdown>
              ) : (
                <p className="text-gray-navy/50 dark:text-light-blue/40 italic">Giải đấu chưa công bố thể lệ chính thức.</p>
              )}
            </div>
          </motion.div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
