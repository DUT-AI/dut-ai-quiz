"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  User,
  Copy,
  Check,
  LogOut,
  Crown,
  ShieldCheck,
  ShieldAlert,
  Clock,
  Trash2,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useAuth } from "@/context/auth-context";
import { useLeaveTeam, useCancelRegistration, useRegisterIndividual } from "../queries";
import { type HackathonRegistration, type HackathonTeam } from "../types";

interface HackathonTeamDetailProps {
  hackathonId: string;
  registration: HackathonRegistration;
  team: HackathonTeam | null;
  maxTeamMembers?: number;
  onSuccess: () => void;
}

export function HackathonTeamDetail({
  hackathonId,
  registration,
  team,
  maxTeamMembers = 5,
  onSuccess,
}: HackathonTeamDetailProps) {
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [newLeaderId, setNewLeaderId] = useState<string>("");

  const leaveTeamMutation = useLeaveTeam(hackathonId);
  const cancelRegMutation = useCancelRegistration(hackathonId);
  const reRegisterMutation = useRegisterIndividual(hackathonId);

  const handleCopyCode = () => {
    if (!team) return;
    navigator.clipboard.writeText(team.code);
    setCopied(true);
    toast.success("Đã sao chép mã đội thi!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCancelRegistration = async () => {
    if (!window.confirm("Bạn có chắc chắn muốn hủy đăng ký tham gia hackathon này?")) return;
    try {
      await cancelRegMutation.mutateAsync();
      toast.success("Đã hủy đăng ký thành công!");
      onSuccess();
    } catch {
      // Bỏ qua vì global error handler đã hiển thị toast.error
    }
  };

  const handleReRegister = async () => {
    try {
      await reRegisterMutation.mutateAsync();
      toast.success("Đã gửi đăng ký lại! Đang chờ phê duyệt.");
      onSuccess();
    } catch {
      // Bỏ qua vì global error handler đã hiển thị toast.error
    }
  };

  const handleLeaveTeam = async () => {
    if (!team || !user) return;
    const isLeader = team.leader_id === user.id;
    const hasOtherMembers = team.member_ids.length > 1;

    if (isLeader && hasOtherMembers && !newLeaderId) {
      toast.error("Vui lòng chọn trưởng nhóm mới trước khi rời đội");
      return;
    }

    try {
      await leaveTeamMutation.mutateAsync({
        new_leader_id: newLeaderId ? Number(newLeaderId) : null,
      });
      toast.success(isLeader && !hasOtherMembers ? "Đã giải tán đội thi thành công!" : "Đã rời khỏi đội thi!");
      setShowLeaveConfirm(false);
      onSuccess();
    } catch {
      // Bỏ qua vì global error handler đã hiển thị toast.error
    }
  };

  // Trợ giúp render badge trạng thái phê duyệt
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return (
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-500 text-xs font-bold border border-emerald-500/10">
            <ShieldCheck className="size-3.5" />
            Đã duyệt tham gia
          </span>
        );
      case "rejected":
        return (
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-destructive/10 text-destructive text-xs font-bold border border-destructive/10">
            <ShieldAlert className="size-3.5" />
            Bị từ chối
          </span>
        );
      case "pending":
      default:
        return (
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-500 text-xs font-bold border border-amber-500/10">
            <Clock className="size-3.5" />
            Đang chờ duyệt
          </span>
        );
    }
  };

  const isLeader = team && user ? team.leader_id === user.id : false;
  const hasOtherMembers = team ? team.member_ids.length > 1 : false;

  return (
    <div className="space-y-6 text-left">
      {/* 1. Đăng ký cá nhân */}
      {!team && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 p-6 rounded-3xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <User className="size-5 text-primary" />
                <h4 className="font-bold text-navy-blue dark:text-white">
                  Đăng ký Cá nhân
                </h4>
              </div>
              <p className="text-xs text-gray-navy/70 dark:text-light-blue/60">
                Bạn đã đăng ký tham gia một mình
              </p>
            </div>
            {renderStatusBadge(registration.status)}
          </div>

          {registration.status === "rejected" && registration.rejection_reason && (
            <div className="p-5 rounded-3xl bg-destructive/5 border border-destructive/10">
              <span className="text-xs font-black text-destructive uppercase tracking-wider block mb-1">
                Lý do từ chối:
              </span>
              <p className="text-sm text-destructive dark:text-red-400">
                {registration.rejection_reason}
              </p>
            </div>
          )}

          {registration.status === "rejected" && (
            <Button
              onClick={handleReRegister}
              disabled={reRegisterMutation.isPending}
              className="w-full py-6 rounded-2xl bg-primary text-white font-bold flex items-center justify-center gap-2 shadow-md shadow-primary/20 hover:bg-primary/95"
            >
              <RefreshCw className={`size-4 ${reRegisterMutation.isPending ? "animate-spin" : ""}`} />
              Đăng ký lại
            </Button>
          )}

          {registration.status === "pending" && (
            <Button
              onClick={handleCancelRegistration}
              disabled={cancelRegMutation.isPending}
              variant="outline"
              className="w-full py-6 rounded-2xl border-destructive/20 hover:bg-destructive/5 text-destructive font-bold flex items-center justify-center gap-2 hover:border-destructive/30"
            >
              <Trash2 className="size-4" />
              Hủy Đăng ký tham gia
            </Button>
          )}
        </div>
      )}

      {/* 2. Đăng ký đội nhóm */}
      {team && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-start justify-between gap-4 p-6 rounded-3xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Users className="size-5 text-primary" />
                <h4 className="font-black text-lg text-navy-blue dark:text-white">
                  Đội: {team.name}
                </h4>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-gray-navy/60 dark:text-light-blue/50">
                  Mã đội:
                </span>
                <span className="px-3 py-1 rounded-xl bg-primary/10 text-primary text-xs font-black tracking-wider">
                  {team.code}
                </span>
                <button
                  onClick={handleCopyCode}
                  className="p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-white/10 text-gray-navy/60 dark:text-light-blue/60 transition-colors"
                  title="Sao chép mã đội"
                >
                  {copied ? <Check className="size-3.5 text-emerald-500" /> : <Copy className="size-3.5" />}
                </button>
              </div>
            </div>
            <div className="space-y-2 flex flex-col items-end">
              {renderStatusBadge(registration.status)}
              <span className="text-[10px] font-black text-gray-navy/60 dark:text-light-blue/40 uppercase">
                {team.member_ids.length}/{maxTeamMembers} Thành viên
              </span>
            </div>
          </div>

          {registration.status === "rejected" && registration.rejection_reason && (
            <div className="p-5 rounded-3xl bg-destructive/5 border border-destructive/10">
              <span className="text-xs font-black text-destructive uppercase tracking-wider block mb-1">
                Lý do từ chối:
              </span>
              <p className="text-sm text-destructive dark:text-red-400">
                {registration.rejection_reason}
              </p>
            </div>
          )}

          {/* Danh sách thành viên */}
          <div className="space-y-3">
            <h5 className="text-xs font-black text-gray-navy dark:text-light-blue/70 uppercase tracking-wider">
              Danh sách Thành viên ({team.member_ids.length})
            </h5>
            <div className="divide-y divide-gray-100 dark:divide-white/5 border border-gray-100 dark:border-white/5 rounded-3xl overflow-hidden bg-white dark:bg-navy-blue">
              {(team.members && team.members.length > 0
                ? team.members
                : team.member_ids.map((id) => ({ id, name: `Thành viên ${id}`, email: `MSSV: ${id}` }))
              ).map((member, idx) => {
                const isMemberLeader = team.leader_id === member.id;
                const isMe = user?.id === member.id;
                return (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-4 px-5 hover:bg-gray-50/50 dark:hover:bg-white/5 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="size-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                        {isMe ? "Tôi" : `#${idx + 1}`}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-navy-blue dark:text-white flex items-center gap-1.5">
                          {member.email}
                          {isMe && (
                            <span className="text-[10px] font-bold text-primary px-1.5 py-0.2 bg-primary/10 rounded-full">
                              Bạn
                            </span>
                          )}
                        </p>
                        {member.name && member.name !== member.email && (
                          <p className="text-xs text-gray-navy/60 dark:text-light-blue/50 mt-0.5">
                            {member.name}
                          </p>
                        )}
                      </div>
                    </div>
                    {isMemberLeader && (
                      <span className="flex items-center gap-1 text-xs text-amber-500 font-bold bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/10">
                        <Crown className="size-3 text-amber-500" />
                        Trưởng nhóm
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Nút rời nhóm */}
          <Button
            onClick={() => setShowLeaveConfirm(true)}
            variant="outline"
            className="w-full py-6 rounded-2xl border-destructive/20 hover:bg-destructive/5 text-destructive font-bold flex items-center justify-center gap-2 hover:border-destructive/30"
          >
            <LogOut className="size-4" />
            {isLeader && !hasOtherMembers ? "Giải tán Đội thi" : "Rời khỏi Đội"}
          </Button>
        </div>
      )}

      {/* Confirmation Leave Modal */}
      <AnimatePresence>
        {showLeaveConfirm && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowLeaveConfirm(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white dark:bg-navy-blue w-full max-w-md rounded-[32px] shadow-2xl relative z-10 p-7 border border-white/10 text-left"
            >
              <h4 className="text-lg font-black text-navy-blue dark:text-white mb-3">
                Xác nhận hành động
              </h4>
              
              {isLeader && hasOtherMembers ? (
                <div className="space-y-4">
                  <p className="text-sm text-gray-navy/90 dark:text-light-blue/80 leading-normal">
                    Bạn đang là **Trưởng nhóm**. Trước khi rời đội, bạn bắt buộc phải chỉ định một thành viên khác lên thay thế làm Trưởng nhóm mới:
                  </p>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-gray-navy dark:text-light-blue/70 uppercase">
                      Chọn Trưởng nhóm mới
                    </label>
                    <select
                      value={newLeaderId}
                      onChange={(e) => setNewLeaderId(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 bg-transparent text-sm focus:outline-none focus:border-primary text-navy-blue dark:text-white"
                    >
                      <option value="" className="dark:bg-navy-blue">-- Chọn thành viên --</option>
                      {(team?.members && team.members.length > 0
                        ? team.members.filter((m) => m.id !== user?.id)
                        : team?.member_ids.filter((id) => id !== user?.id).map((id) => ({ id, email: `MSSV: ${id}` })) || []
                      ).map((member) => (
                        <option key={member.id} value={member.id} className="dark:bg-navy-blue text-black dark:text-white">
                          {member.email}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-navy/90 dark:text-light-blue/80 leading-relaxed">
                  {isLeader && !hasOtherMembers
                    ? "Đội của bạn hiện tại không có thành viên nào khác. Rời đi đồng nghĩa với việc **giải tán đội thi** này hoàn toàn. Bạn chắc chắn chứ?"
                    : "Bạn chắc chắn muốn rời khỏi đội thi này? Bạn sẽ không còn quyền truy cập vào bảng làm bài thi của đội."}
                </p>
              )}

              <div className="flex gap-3 mt-6">
                <Button
                  onClick={() => setShowLeaveConfirm(false)}
                  variant="outline"
                  className="flex-1 rounded-xl py-5 font-bold"
                >
                  Hủy
                </Button>
                <Button
                  onClick={handleLeaveTeam}
                  disabled={leaveTeamMutation.isPending}
                  className="flex-1 rounded-xl py-5 bg-destructive hover:bg-destructive/90 text-white font-bold"
                >
                  {leaveTeamMutation.isPending ? "Đang xử lý..." : "Xác nhận rời"}
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
