"use client";

import { motion, AnimatePresence } from "framer-motion";
import { 
  X, 
  Search, 
  Users, 
  CheckCircle2, 
  AlertCircle, 
  Inbox, 
  Send 
} from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import { createPortal } from "react-dom";

import { useExternalUsers } from "@/lib/queries";
import { SubmissionResult } from "./submission-result";
import { useHomeworkSubmissions } from "../queries";
import { Homework } from "../types";

interface SubmissionsPanelProps {
  homework: Homework | null;
  onClose: () => void;
}

export function SubmissionsPanel({ homework, onClose }: SubmissionsPanelProps) {
  const { data: submissionsData, isLoading: isLoadingSubmissions } = useHomeworkSubmissions(homework?.id ?? null);
  const { data: usersData } = useExternalUsers();
  
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<"submitted" | "unsubmitted">("submitted");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  const userById = useMemo(() => {
    return new Map((usersData?.data ?? []).map((user) => [user.id, user]));
  }, [usersData]);

  const submittedUserIds = useMemo(() => {
    return new Set(submissionsData?.data.map((s) => s.user_id) ?? []);
  }, [submissionsData]);

  // Filter unsubmitted users
  const unsubmitted = useMemo(() => {
    if (!homework) return [];
    return homework.assignee_ids
      .filter((userId) => !submittedUserIds.has(userId))
      .map((userId) => {
        const u = userById.get(userId);
        return {
          id: userId,
          name: u?.name || `Thành viên #${userId}`,
          email: u?.email || "",
          avatarUrl: u?.avatar_url || "",
        };
      })
      .filter((u) => u.name.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [homework, submittedUserIds, userById, searchQuery]);

  // Filter submitted submissions
  const filteredSubmissions = useMemo(() => {
    if (!submissionsData?.data) return [];
    return submissionsData.data
      .map((sub) => ({
        ...sub,
        owner_name: sub.owner_name || userById.get(sub.user_id)?.name || `Thành viên #${sub.user_id}`,
      }))
      .filter((sub) => sub.owner_name.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [submissionsData, userById, searchQuery]);

  if (!homework || !mounted) return null;

  return createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex justify-end">
        {/* Backdrop overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        />

        {/* Drawer content */}
        <motion.div
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ type: "spring", damping: 25, stiffness: 220 }}
          className="relative z-10 h-full w-full max-w-2xl border-l border-gray-200 bg-white p-6 shadow-2xl dark:border-white/5 dark:bg-navy-blue flex flex-col md:p-8"
        >
          {/* Header */}
          <div className="mb-6 flex items-start justify-between">
            <div className="space-y-1">
              <h2 className="text-2xl font-black text-dark-blue dark:text-white">
                Danh sách bài nộp
              </h2>
              <p className="text-sm text-gray-navy dark:text-light-blue/80 line-clamp-1">
                {homework.title}
              </p>
            </div>
            <button 
              onClick={onClose} 
              className="rounded-xl p-2 text-gray-400 hover:bg-gray-150 hover:text-dark-blue dark:hover:bg-white/5 dark:hover:text-white transition-colors"
            >
              <X className="size-5" />
            </button>
          </div>

          {/* Search bar */}
          <div className="relative mb-5">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder={activeTab === "submitted" ? "Tìm học viên đã nộp..." : "Tìm học viên chưa nộp..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 pl-9 pr-4 rounded-xl border border-gray-255 bg-white text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-white/10 dark:bg-zinc-950/40 dark:text-white"
            />
          </div>

          {/* Custom Tabs */}
          <div className="mb-6 flex border-b border-gray-150 dark:border-white/10">
            <button
              onClick={() => setActiveTab("submitted")}
              className={`relative pb-3 text-sm font-black transition-colors ${
                activeTab === "submitted"
                  ? "text-primary"
                  : "text-gray-navy dark:text-light-blue/70 hover:text-primary"
              }`}
            >
              Đã nộp ({submissionsData?.data?.length ?? 0})
              {activeTab === "submitted" && (
                <motion.div
                  layoutId="drawer-tab-underline"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
                />
              )}
            </button>
            <button
              onClick={() => setActiveTab("unsubmitted")}
              className={`relative ml-6 pb-3 text-sm font-black transition-colors ${
                activeTab === "unsubmitted"
                  ? "text-primary"
                  : "text-gray-navy dark:text-light-blue/70 hover:text-primary"
              }`}
            >
              Chưa nộp ({homework.assignee_ids.length - (submissionsData?.data?.length ?? 0)})
              {activeTab === "unsubmitted" && (
                <motion.div
                  layoutId="drawer-tab-underline"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
                />
              )}
            </button>
          </div>

          {/* Tab Panel contents - scrollable */}
          <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar">
            {isLoadingSubmissions ? (
              <div className="flex flex-col items-center justify-center py-20">
                <svg className="h-8 w-8 animate-spin text-primary" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <p className="mt-2 text-xs text-gray-navy animate-pulse">Đang tải...</p>
              </div>
            ) : activeTab === "submitted" ? (
              /* Tab: Submitted */
              filteredSubmissions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <Inbox className="size-10 text-gray-300 dark:text-gray-navy mb-3" />
                  <p className="font-bold text-dark-blue dark:text-white">Không có bài nộp nào</p>
                  <p className="text-xs text-gray-navy dark:text-light-blue/60">
                    {searchQuery ? "Không tìm thấy học viên tương ứng." : "Chưa có bài nộp nào cho bài tập này."}
                  </p>
                </div>
              ) : (
                <div className="space-y-5">
                  {filteredSubmissions.map((submission) => (
                    <div key={submission.id} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-black text-dark-blue dark:text-white">
                          {submission.owner_name}
                        </span>
                      </div>
                      <SubmissionResult submission={submission} />
                    </div>
                  ))}
                </div>
              )
            ) : (
              /* Tab: Unsubmitted */
              unsubmitted.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <CheckCircle2 className="size-10 text-green mb-3" />
                  <p className="font-bold text-dark-blue dark:text-white">Tuyệt vời!</p>
                  <p className="text-xs text-gray-navy dark:text-light-blue/60">
                    Tất cả học viên được giao bài đều đã hoàn thành.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100 dark:divide-white/5">
                  {unsubmitted.map((user) => (
                    <div key={user.id} className="flex items-center justify-between py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="flex size-9 items-center justify-center rounded-full bg-amber-500/10 text-xs font-black text-amber-600 dark:bg-amber-500/20 dark:text-amber-400">
                          {user.name.split(" ").pop()?.substring(0, 2).toUpperCase() || "?"}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-dark-blue dark:text-white">{user.name}</p>
                          <p className="text-xs text-gray-navy dark:text-light-blue/70">{user.email || "Chưa cập nhật email"}</p>
                        </div>
                      </div>
                      
                      <button
                        type="button"
                        onClick={() => alert(`Đã gửi nhắc nhở đến ${user.name}`)}
                        className="flex items-center gap-1.5 rounded-lg border border-amber-500/20 bg-amber-500/5 px-2.5 py-1.5 text-xs font-black text-amber-600 hover:bg-amber-500 hover:text-white transition-colors"
                      >
                        <Send className="size-3" /> Nhắc nhở
                      </button>
                    </div>
                  ))}
                </div>
              )
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
}
