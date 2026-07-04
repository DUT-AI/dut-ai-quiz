"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Users,
  User,
  ShieldCheck,
  ShieldAlert,
  Clock,
  Check,
  XCircle,
  MessageSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useHackathonRegistrations, useReviewRegistration } from "../queries";
import { type Hackathon, type HackathonRegistration } from "../types";
import { formatDateTime } from "@/lib/utils";

interface HackathonRegistrationsModalProps {
  hackathon: Hackathon;
  onClose: () => void;
}

export function HackathonRegistrationsModal({
  hackathon,
  onClose,
}: HackathonRegistrationsModalProps) {
  const { data: regs = [], isLoading } = useHackathonRegistrations(hackathon.id);
  const reviewMutation = useReviewRegistration(hackathon.id);

  // Quản lý việc từ chối đơn đăng ký
  const [rejectingRegId, setRejectingRegId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  const handleApprove = async (regId: string) => {
    try {
      await reviewMutation.mutateAsync({
        registrationId: regId,
        body: { status: "approved" },
      });
      toast.success("Đã phê duyệt đơn đăng ký tham gia!");
    } catch {
      // Bỏ qua vì global error handler đã hiển thị toast.error
    }
  };

  const handleRejectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingRegId) return;
    if (!rejectionReason.trim()) {
      toast.error("Vui lòng nhập lý do từ chối");
      return;
    }

    try {
      await reviewMutation.mutateAsync({
        registrationId: rejectingRegId,
        body: { status: "rejected", rejection_reason: rejectionReason.trim() },
      });
      toast.success("Đã từ chối đơn đăng ký!");
      setRejectingRegId(null);
      setRejectionReason("");
    } catch {
      // Bỏ qua vì global error handler đã hiển thị toast.error
    }
  };

  const renderStatus = (status: string, reason?: string | null) => {
    switch (status) {
      case "approved":
        return (
          <span className="flex items-center gap-1 text-emerald-500 font-bold text-xs bg-emerald-500/10 px-2 py-1 rounded-full border border-emerald-500/10">
            <ShieldCheck className="size-3.5" />
            Đã duyệt
          </span>
        );
      case "rejected":
        return (
          <div className="flex flex-col items-start gap-1">
            <span className="flex items-center gap-1 text-destructive font-bold text-xs bg-destructive/10 px-2 py-1 rounded-full border border-destructive/10">
              <ShieldAlert className="size-3.5" />
              Từ chối
            </span>
            {reason && (
              <span className="text-[10px] text-destructive/80 italic max-w-[200px] truncate" title={reason}>
                Lý do: {reason}
              </span>
            )}
          </div>
        );
      case "pending":
      default:
        return (
          <span className="flex items-center gap-1 text-amber-500 font-bold text-xs bg-amber-500/10 px-2 py-1 rounded-full border border-amber-500/10">
            <Clock className="size-3.5" />
            Chờ duyệt
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 overflow-y-auto">
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
        className="bg-white dark:bg-navy-blue w-full max-w-4xl rounded-[40px] shadow-2xl relative z-10 overflow-hidden border border-white/10 p-8 flex flex-col max-h-[85vh]"
      >
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 text-gray-navy/60 dark:text-light-blue/60 transition-colors"
        >
          <X className="size-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 rounded-2xl bg-primary/10 text-primary">
            <Users className="size-6" />
          </div>
          <div className="text-left">
            <h3 className="text-xl font-black text-navy-blue dark:text-white leading-tight">
              Quản lý Đăng ký tham gia
            </h3>
            <p className="text-xs text-gray-navy/70 dark:text-light-blue/60">
              {hackathon.name} • {regs.length} đăng ký
            </p>
          </div>
        </div>

        {/* Bảng danh sách đơn đăng ký */}
        <div className="flex-1 overflow-y-auto min-h-[700px] border border-gray-100 dark:border-white/5 rounded-3xl bg-white dark:bg-navy-blue">
          {isLoading ? (
            <div className="flex items-center justify-center h-full py-12 text-sm text-gray-navy/70">
              Đang tải danh sách đăng ký...
            </div>
          ) : regs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-20 text-center text-gray-navy/60 dark:text-light-blue/50">
              <Users className="size-12 mb-3 opacity-30" />
              <p className="font-bold text-sm">Chưa có ai đăng ký tham gia</p>
              <p className="text-xs mt-1">Đăng ký của sinh viên cá nhân hoặc đội thi sẽ hiển thị ở đây.</p>
            </div>
          ) : (
            <div className="w-full overflow-x-auto">
              <table className="w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/2 text-[10px] font-black text-gray-navy/70 dark:text-light-blue/50 uppercase tracking-wider">
                    <th className="p-4 px-6">Hình thức</th>
                    <th className="p-4">Thông tin Thí sinh / Đội thi</th>
                    <th className="p-4">Thành viên (đối với Đội)</th>
                    <th className="p-4">Ngày đăng ký</th>
                    <th className="p-4">Trạng thái</th>
                    <th className="p-4 px-6 text-right">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                  {regs.map((reg) => {
                    const isTeam = !!reg.team_id;
                    return (
                      <tr
                        key={reg.id}
                        className="hover:bg-gray-50/50 dark:hover:bg-white/2 transition-colors"
                      >
                        <td className="p-4 px-6">
                          {isTeam ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 text-[10px] font-black uppercase tracking-wider">
                              <Users className="size-3" /> Đội nhóm
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-wider">
                              <User className="size-3" /> Cá nhân
                            </span>
                          )}
                        </td>
                        <td className="p-4">
                          <div className="font-bold text-navy-blue dark:text-white">
                            {isTeam ? reg.team?.name : reg.user_name}
                          </div>
                          <div className="text-xs text-gray-navy/70 dark:text-light-blue/60 mt-0.5">
                            {isTeam ? `Mã: ${reg.team?.code}` : reg.user_email || `MSSV: ${reg.user_id}`}
                          </div>
                        </td>
                        <td className="p-4">
                          {isTeam && reg.team ? (
                            <div className="flex flex-wrap gap-1.5 max-w-[220px]">
                              {(reg.team.members && reg.team.members.length > 0
                                ? reg.team.members
                                : reg.team.member_ids.map((id) => ({ id, name: `MSSV: ${id}`, email: `MSSV: ${id}` }))
                              ).map((member) => (
                                <span
                                  key={member.id}
                                  className={`text-[10px] px-2 py-0.5 rounded-md font-bold truncate max-w-[120px] ${reg.team?.leader_id === member.id
                                    ? "bg-amber-500/10 text-amber-500 border border-amber-500/10"
                                    : "bg-gray-100 dark:bg-white/10 text-gray-navy dark:text-light-blue/80"
                                    }`}
                                  title={`${member.email} ${reg.team?.leader_id === member.id ? "(Trưởng nhóm)" : ""}`}
                                >
                                  {member.email}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-gray-navy/40 dark:text-white/20">—</span>
                          )}
                        </td>
                        <td className="p-4 text-xs text-gray-navy/80 dark:text-light-blue/70">
                          {formatDateTime(reg.registered_at)}
                        </td>
                        <td className="p-4">
                          {renderStatus(reg.status, reg.rejection_reason)}
                        </td>
                        <td className="p-4 px-6 text-right">
                          {reg.status === "pending" && (
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleApprove(reg.id)}
                                className="p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 transition-colors"
                                title="Phê duyệt"
                              >
                                <Check className="size-4" />
                              </button>
                              <button
                                onClick={() => setRejectingRegId(reg.id)}
                                className="p-1.5 rounded-lg bg-destructive/10 hover:bg-destructive/20 text-destructive transition-colors"
                                title="Từ chối"
                              >
                                <XCircle className="size-4" />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Reject Dialog (Animate Presence) */}
        <AnimatePresence>
          {rejectingRegId && (
            <div className="fixed inset-0 z-[120] flex items-center justify-center p-6">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setRejectingRegId(null)}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="bg-white dark:bg-navy-blue w-full max-w-md rounded-[32px] shadow-2xl relative z-10 p-7 border border-white/10 text-left"
              >
                <h4 className="text-lg font-black text-navy-blue dark:text-white flex items-center gap-2 mb-3">
                  <MessageSquare className="size-5 text-destructive" />
                  Từ chối đơn đăng ký
                </h4>
                <form onSubmit={handleRejectSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-gray-navy dark:text-light-blue/70 uppercase">
                      Lý do từ chối đăng ký
                    </label>
                    <textarea
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      placeholder="Nhập lý do chi tiết từ chối..."
                      rows={3}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 bg-transparent text-sm focus:outline-none focus:border-primary text-navy-blue dark:text-white"
                    />
                  </div>
                  <div className="flex gap-3">
                    <Button
                      type="button"
                      onClick={() => setRejectingRegId(null)}
                      variant="outline"
                      className="flex-1 rounded-xl py-5 font-bold"
                    >
                      Hủy
                    </Button>
                    <Button
                      type="submit"
                      disabled={reviewMutation.isPending}
                      className="flex-1 rounded-xl py-5 bg-destructive hover:bg-destructive/90 text-white font-bold"
                    >
                      {reviewMutation.isPending ? "Đang xử lý..." : "Xác nhận từ chối"}
                    </Button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
