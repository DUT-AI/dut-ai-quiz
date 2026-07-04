"use client";

import React, { useState } from "react";
import { type Hackathon } from "../types";
import { motion, AnimatePresence } from "framer-motion";
import { X, Calendar, Users, Award, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDateTime, getParticipationModeLabel } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useHackathonRegistrationStatus } from "../queries";
import { HackathonRegisterModal } from "./hackathon-register-modal";
import { HackathonTeamDetail } from "./hackathon-team-detail";

interface HackathonDetailModalProps {
  hackathon: Hackathon;
  onClose: () => void;
}

export function HackathonDetailModal({ hackathon, onClose }: HackathonDetailModalProps) {
  const isExpired = hackathon.end_time ? new Date(hackathon.end_time) < new Date() : false;
  const isStarted = hackathon.start_time ? new Date(hackathon.start_time) <= new Date() : false;
  const isOngoing = isStarted && !isExpired;

  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const { data: regStatus, refetch } = useHackathonRegistrationStatus(hackathon.id);
  const isRegistered = regStatus?.is_registered ?? false;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm"
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-white dark:bg-navy-blue w-full max-w-5xl rounded-[40px] shadow-2xl relative z-10 my-8 overflow-hidden border border-white/10"
      >
        {/* Header với icon Award lớn */}
        <div className="relative p-8 md:p-10 pb-0">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2 text-left">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">
                  GIẢI ĐẤU CÔNG NGHỆ
                </span>
                {isOngoing && (
                  <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/10">
                    Đang diễn ra
                  </span>
                )}
                {isExpired && (
                  <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-gray-navy/10 text-gray-navy/60 dark:text-light-blue/40 border border-gray-navy/10 dark:border-white/5">
                    Đã kết thúc
                  </span>
                )}
                {!isStarted && hackathon.start_time && (
                  <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/10">
                    Sắp diễn ra
                  </span>
                )}
              </div>
              <h2 className="text-2xl md:text-3xl font-black text-dark-blue dark:text-white leading-tight">
                {hackathon.name}
              </h2>
            </div>

            <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 transition-colors shrink-0">
              <X className="size-6 text-gray-navy" />
            </button>
          </div>
        </div>

        {/* Nội dung chi tiết */}
        <div className="p-8 md:p-10 pt-6 max-h-[70vh] overflow-y-auto custom-scrollbar space-y-6 text-left">

          {/* Mô tả ngắn */}
          {hackathon.description && (
            <div className="space-y-1.5">
              <h3 className="text-xs font-black text-gray-navy opacity-55 uppercase tracking-widest px-1">
                Giới thiệu
              </h3>
              <p className="text-base text-zinc-700 dark:text-zinc-200 font-medium leading-relaxed bg-slate-50/50 dark:bg-white/[0.02] p-5 rounded-2xl border border-gray-100 dark:border-white/5">
                {hackathon.description}
              </p>
            </div>
          )}

          {/* Metadata: Bắt đầu, Kết thúc, Hình thức */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Thời gian bắt đầu */}
            <div className="flex items-start gap-3 p-4 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5">
              <Calendar className="size-5 text-primary shrink-0 mt-0.5" />
              <div>
                <p className="text-[10px] font-black text-gray-navy opacity-55 uppercase tracking-wider">Bắt đầu</p>
                <p className="text-sm font-bold text-dark-blue dark:text-white mt-1.5">
                  {formatDateTime(hackathon.start_time)}
                </p>
              </div>
            </div>

            {/* Thời gian kết thúc */}
            <div className="flex items-start gap-3 p-4 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5">
              <Calendar className="size-5 text-red shrink-0 mt-0.5" />
              <div>
                <p className="text-[10px] font-black text-gray-navy opacity-55 uppercase tracking-wider">Kết thúc</p>
                <p className="text-sm font-bold text-dark-blue dark:text-white mt-1.5">
                  {formatDateTime(hackathon.end_time)}
                </p>
              </div>
            </div>

            {/* Hình thức */}
            <div className="flex items-start gap-3 p-4 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5">
              <Users className="size-5 text-primary shrink-0 mt-0.5" />
              <div>
                <p className="text-[10px] font-black text-gray-navy opacity-55 uppercase tracking-wider">Hình thức</p>
                <p className="text-sm font-bold text-dark-blue dark:text-white mt-1.5">
                  {getParticipationModeLabel(hackathon.participation_mode)}
                </p>
              </div>
            </div>
          </div>

          {/* Thông tin Đăng ký hiện tại (nếu có) */}
          {isRegistered && regStatus && (
            <div className="space-y-2.5">
              <div className="flex items-center gap-2 px-1">
                <Users className="size-4.5 text-primary" />
                <h3 className="text-xs font-black text-gray-navy opacity-55 uppercase tracking-widest">
                  Thông tin tham gia của bạn
                </h3>
              </div>
              <div className="w-full px-6 py-5 rounded-3xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 text-sm">
                <HackathonTeamDetail
                  hackathonId={hackathon.id}
                  registration={regStatus.registration!}
                  team={regStatus.team}
                  maxTeamMembers={hackathon.max_team_members}
                  onSuccess={refetch}
                />
              </div>
            </div>
          )}

          {/* Luật thi đấu (Markdown) */}
          <div className="space-y-2.5">
            <div className="flex items-center gap-2 px-1">
              <Award className="size-4.5 text-primary" />
              <h3 className="text-xs font-black text-gray-navy opacity-55 uppercase tracking-widest">
                Thể lệ & Luật thi đấu
              </h3>
            </div>
            <div className="w-full px-6 py-5 rounded-3xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 text-sm prose dark:prose-invert max-w-none text-left break-words">
              {hackathon.rules ? (
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {hackathon.rules}
                </ReactMarkdown>
              ) : (
                <div className="flex items-center gap-2 text-gray-navy opacity-50 italic py-4">
                  <ShieldAlert className="size-4" />
                  <span>Chưa cập nhật thể lệ thi đấu chính thức.</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-8 md:p-10 pt-4 bg-slate-50/50 dark:bg-white/[0.01] border-t border-gray-100 dark:border-white/5 flex gap-3 justify-end shrink-0">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            className="px-6 py-5 rounded-2xl font-bold"
          >
            Đóng
          </Button>
          {!isExpired && !isRegistered && (
            <Button
              type="button"
              className="px-8 py-5 rounded-2xl bg-primary text-white font-bold flex items-center gap-2 shadow-lg shadow-primary/20 hover:bg-primary/95 transition-all transform active:scale-95"
              onClick={() => setShowRegisterModal(true)}
            >
              Đăng ký tham gia
            </Button>
          )}
        </div>
      </motion.div>

      <AnimatePresence>
        {showRegisterModal && (
          <HackathonRegisterModal
            hackathon={hackathon}
            onClose={() => setShowRegisterModal(false)}
            onSuccess={refetch}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
