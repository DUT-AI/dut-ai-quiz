"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  User,
  ShieldCheck,
  ShieldAlert,
  Clock,
  Check,
  XCircle,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useHackathonRegistrations, useReviewRegistration } from "../queries";
import { type Hackathon, type HackathonRegistration, type RegistrationStatus } from "../types";
import { formatDateTime } from "@/lib/utils";

interface HackathonRegistrationsTabProps {
  hackathon: Hackathon;
}

export function HackathonRegistrationsTab({ hackathon }: HackathonRegistrationsTabProps) {
  const { data: regs = [], isLoading } = useHackathonRegistrations(hackathon.id);
  const reviewMutation = useReviewRegistration(hackathon.id);

  // Chi tiết đăng ký được chọn
  const [selectedReg, setSelectedReg] = useState<HackathonRegistration | null>(null);
  const [detailRejecting, setDetailRejecting] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

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
      case "cancelled":
        return (
          <span className="flex items-center gap-1 text-gray-400 font-bold text-xs bg-gray-400/10 px-2.5 py-1 rounded-full border border-gray-400/20">
            Đã hủy
          </span>
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
    <div className="space-y-6">
      <div className="text-left">
        <h3 className="text-lg font-black text-navy-blue dark:text-white leading-tight">
          Danh sách Đăng ký tham gia
        </h3>
        <p className="text-xs text-gray-navy/70 dark:text-light-blue/60 mt-1">
          Tổng cộng: {regs.length} đơn đăng ký của thí sinh và đội thi. Click vào từng dòng để xem chi tiết và phê duyệt.
        </p>
      </div>

      {/* Bảng danh sách đơn đăng ký */}
      <div className="border border-gray-100 dark:border-white/5 rounded-3xl bg-white dark:bg-navy-blue overflow-hidden">
        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="flex items-center justify-center py-20 text-sm text-gray-navy/70"
            >
              <div className="size-5 border-2 border-primary border-t-transparent animate-spin rounded-full mr-2" />
              Đang tải danh sách đăng ký...
            </motion.div>
          ) : regs.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="flex flex-col items-center justify-center py-20 text-center text-gray-navy/60 dark:text-light-blue/50"
            >
              <Users className="size-12 mb-3 opacity-30" />
              <p className="font-bold text-sm">Chưa có ai đăng ký tham gia</p>
              <p className="text-xs mt-1">Đăng ký của sinh viên cá nhân hoặc đội thi sẽ hiển thị ở đây.</p>
            </motion.div>
          ) : (
            <motion.div
              key="table"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="w-full overflow-x-auto"
            >
              <table className="w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/2 text-[10px] font-black text-gray-navy/70 dark:text-light-blue/50 uppercase tracking-wider">
                    <th className="p-4 px-6">Hình thức</th>
                    <th className="p-4">Thông tin Thí sinh / Đội thi</th>
                    <th className="p-4">Trạng thái</th>
                    <th className="p-4 px-6 text-right">Chi tiết</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                  {regs.map((reg) => {
                    const isTeam = !!reg.team_id;
                    return (
                      <tr
                        key={reg.id}
                        onClick={() => setSelectedReg(reg)}
                        className="hover:bg-gray-50/50 dark:hover:bg-white/2 cursor-pointer transition-colors"
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
                            {isTeam ? reg.team?.name : (reg.user?.name || `Thành viên #${reg.user_id}`)}
                          </div>
                          <div className="text-xs text-gray-navy/70 dark:text-light-blue/60 mt-0.5">
                            {isTeam ? `Mã: ${reg.team?.code}` : reg.user?.email || `ID: ${reg.user_id}`}
                          </div>
                        </td>
                        <td className="p-4">
                          {renderStatus(reg.status, reg.rejection_reason)}
                        </td>
                        <td className="p-4 px-6 text-right text-xs text-primary font-bold">
                          Xem chi tiết &rarr;
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Selected Reg Detail Dialog (Animate Presence) */}
      <AnimatePresence>
        {selectedReg && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setSelectedReg(null);
                setDetailRejecting(false);
                setRejectionReason("");
              }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white dark:bg-navy-blue w-full max-w-lg rounded-[36px] shadow-2xl relative z-10 p-8 border border-white/10 text-left flex flex-col max-h-[90vh] overflow-y-auto"
            >
              <button
                onClick={() => {
                  setSelectedReg(null);
                  setDetailRejecting(false);
                  setRejectionReason("");
                }}
                className="absolute top-6 right-6 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 text-gray-navy/60 dark:text-light-blue/60 transition-colors"
              >
                <X className="size-5" />
              </button>

              <h4 className="text-lg font-black text-navy-blue dark:text-white flex items-center gap-2 mb-5">
                Chi tiết Đăng ký tham gia
              </h4>

              <div className="space-y-5 flex-1">
                {/* Hình thức */}
                <div>
                  <span className="text-[10px] font-black text-gray-navy/70 dark:text-light-blue/50 uppercase tracking-wider block mb-1">
                    Hình thức
                  </span>
                  {selectedReg.team_id ? (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-500 text-xs font-bold uppercase tracking-wider">
                      <Users className="size-3.5" /> Đội nhóm
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider">
                      <User className="size-3.5" /> Cá nhân
                    </span>
                  )}
                </div>

                {/* Thông tin chính */}
                <div>
                  <span className="text-[10px] font-black text-gray-navy/70 dark:text-light-blue/50 uppercase tracking-wider block mb-1.5">
                    {selectedReg.team_id ? "Thông tin Đội thi" : "Thông tin Thí sinh"}
                  </span>
                  <div className="p-4 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5">
                    {selectedReg.team_id ? (
                      <>
                        <div className="font-bold text-base text-navy-blue dark:text-white">
                          {selectedReg.team?.name}
                        </div>
                        <div className="text-sm text-gray-navy/70 dark:text-light-blue/60 mt-1">
                          Mã đội: <strong className="text-primary">{selectedReg.team?.code}</strong>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="font-bold text-base text-navy-blue dark:text-white">
                          {selectedReg.user?.name || `Thành viên #${selectedReg.user_id}`}
                        </div>
                        <div className="text-sm text-gray-navy/70 dark:text-light-blue/60 mt-1">
                          Email: {selectedReg.user?.email || "N/A"}
                        </div>
                        <div className="text-xs text-gray-navy/50 dark:text-light-blue/40 mt-1">
                          ID thí sinh: {selectedReg.user_id}
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Danh sách thành viên nếu là đội */}
                {selectedReg.team_id && selectedReg.team && (
                  <div>
                    <span className="text-[10px] font-black text-gray-navy/70 dark:text-light-blue/50 uppercase tracking-wider block mb-2">
                      Thành viên đội ({selectedReg.team.members?.length || selectedReg.team.member_ids.length} thành viên)
                    </span>
                    <div className="space-y-2 max-h-[180px] overflow-y-auto custom-scrollbar pr-1">
                      {(selectedReg.team.members && selectedReg.team.members.length > 0
                        ? selectedReg.team.members
                        : selectedReg.team.member_ids.map((id) => ({ id, name: `Thành viên #${id}`, email: `MSSV: ${id}` }))
                      ).map((member) => (
                        <div
                          key={member.id}
                          className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 text-sm"
                        >
                          <div className="flex flex-col text-left">
                            <span className="font-bold text-navy-blue dark:text-white">
                              {member.name}
                            </span>
                            <span className="text-xs text-gray-navy/60 dark:text-light-blue/60 mt-0.5">
                              {member.email}
                            </span>
                          </div>
                          {selectedReg.team?.leader_id === member.id && (
                            <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/10 text-amber-500 border border-amber-500/20 font-bold uppercase tracking-wider shrink-0">
                              Trưởng nhóm
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Ngày đăng ký */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-[10px] font-black text-gray-navy/70 dark:text-light-blue/50 uppercase tracking-wider block mb-1">
                      Ngày đăng ký
                    </span>
                    <span className="text-sm font-bold text-navy-blue dark:text-white">
                      {formatDateTime(selectedReg.registered_at)}
                    </span>
                  </div>

                  {/* Trạng thái */}
                  <div>
                    <span className="text-[10px] font-black text-gray-navy/70 dark:text-light-blue/50 uppercase tracking-wider block mb-1">
                      Trạng thái hiện tại
                    </span>
                    <div className="flex">{renderStatus(selectedReg.status, selectedReg.rejection_reason)}</div>
                  </div>
                </div>

                {/* Form từ chối nếu đang ở chế độ rejecting */}
                {detailRejecting && (
                  <div className="p-4 rounded-2xl bg-destructive/5 border border-destructive/10 space-y-3">
                    <label className="text-xs font-black text-destructive dark:text-red uppercase block">
                      Nhập lý do từ chối đăng ký
                    </label>
                    <textarea
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      placeholder="Ví dụ: Đội thi không đủ thành viên, thông tin không chính xác..."
                      rows={2}
                      className="w-full px-3 py-2 rounded-xl border border-destructive/20 focus:border-destructive bg-transparent text-sm focus:outline-none text-navy-blue dark:text-white"
                    />
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => setDetailRejecting(false)}
                        className="flex-1 rounded-xl text-xs font-bold"
                      >
                        Quay lại
                      </Button>
                      <Button
                        type="button"
                        onClick={async () => {
                          if (!rejectionReason.trim()) {
                            toast.error("Vui lòng nhập lý do từ chối");
                            return;
                          }
                          try {
                            await reviewMutation.mutateAsync({
                              registrationId: selectedReg.id,
                              body: { status: "rejected", rejection_reason: rejectionReason.trim() },
                            });
                            toast.success("Đã từ chối đơn đăng ký!");
                            setSelectedReg(null);
                            setDetailRejecting(false);
                            setRejectionReason("");
                          } catch {
                            // ignore
                          }
                        }}
                        disabled={reviewMutation.isPending}
                        className="flex-1 rounded-xl bg-destructive hover:bg-destructive/95 text-white text-xs font-bold"
                      >
                        {reviewMutation.isPending ? "Đang xử lý..." : "Xác nhận từ chối"}
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer Actions (nếu status = pending và không ở chế độ rejecting) */}
              {selectedReg.status === "pending" && !detailRejecting && (
                <div className="flex gap-3 mt-6 border-t border-gray-100 dark:border-white/5 pt-5 shrink-0">
                  <Button
                    type="button"
                    onClick={() => setDetailRejecting(true)}
                    variant="outline"
                    className="flex-1 rounded-2xl py-6 border-destructive/20 hover:border-destructive/35 text-destructive font-bold flex items-center justify-center gap-2"
                  >
                    <XCircle className="size-4" /> Từ chối
                  </Button>
                  <Button
                    type="button"
                    onClick={async () => {
                      try {
                        await reviewMutation.mutateAsync({
                          registrationId: selectedReg.id,
                          body: { status: "approved" },
                        });
                        toast.success("Đã phê duyệt đơn đăng ký tham gia!");
                        setSelectedReg(null);
                      } catch {
                        // ignore
                      }
                    }}
                    disabled={reviewMutation.isPending}
                    className="flex-1 rounded-2xl py-6 bg-emerald-500 hover:bg-emerald-600 text-white font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
                  >
                    <Check className="size-4" /> Duyệt đơn
                  </Button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
