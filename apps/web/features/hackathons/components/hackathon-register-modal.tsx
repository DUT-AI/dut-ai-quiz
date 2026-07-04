"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { X, Users, User, ArrowRight, ShieldAlert, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  useRegisterIndividual,
  useCreateTeam,
  useJoinTeam,
} from "../queries";
import { type Hackathon } from "../types";

interface HackathonRegisterModalProps {
  hackathon: Hackathon;
  onClose: () => void;
  onSuccess: () => void;
}

export function HackathonRegisterModal({
  hackathon,
  onClose,
  onSuccess,
}: HackathonRegisterModalProps) {
  const [mode, setMode] = useState<"individual" | "team">(
    hackathon.participation_mode === "team" ? "team" : "individual"
  );
  const [teamTab, setTeamTab] = useState<"create" | "join">("create");
  const [teamName, setTeamName] = useState("");
  const [teamCode, setTeamCode] = useState("");

  const registerIndividualMutation = useRegisterIndividual(hackathon.id);
  const createTeamMutation = useCreateTeam(hackathon.id);
  const joinTeamMutation = useJoinTeam(hackathon.id);

  const handleRegisterIndividual = async () => {
    try {
      await registerIndividualMutation.mutateAsync();
      toast.success("Đăng ký cá nhân thành công! Vui lòng chờ Giảng viên phê duyệt.");
      onSuccess();
      onClose();
    } catch {
      // Bỏ qua vì global error handler đã hiển thị toast.error
    }
  };

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamName.trim()) {
      toast.error("Vui lòng nhập tên đội");
      return;
    }
    try {
      await createTeamMutation.mutateAsync({ name: teamName });
      toast.success("Tạo đội thi thành công! Chia sẻ mã đội cho các thành viên khác.");
      onSuccess();
      onClose();
    } catch {
      // Bỏ qua vì global error handler đã hiển thị toast.error
    }
  };

  const handleJoinTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamCode.trim()) {
      toast.error("Vui lòng nhập mã đội");
      return;
    }
    try {
      await joinTeamMutation.mutateAsync({ code: teamCode });
      toast.success("Gia nhập đội thi thành công!");
      onSuccess();
      onClose();
    } catch {
      // Bỏ qua vì global error handler đã hiển thị toast.error
    }
  };

  const isBoth = hackathon.participation_mode === "both";

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
        className="bg-white dark:bg-navy-blue w-full max-w-lg rounded-[36px] shadow-2xl relative z-10 overflow-hidden border border-white/10 p-8"
      >
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 text-gray-navy/60 dark:text-light-blue/60 transition-colors"
        >
          <X className="size-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 rounded-2xl bg-primary/10 text-primary">
            <Award className="size-6" />
          </div>
          <div className="text-left">
            <h3 className="text-xl font-black text-navy-blue dark:text-white leading-tight">
              Đăng ký tham gia
            </h3>
            <p className="text-xs text-gray-navy/70 dark:text-light-blue/60">
              {hackathon.name}
            </p>
          </div>
        </div>

        {/* Lựa chọn hình thức: Cá nhân hay Đội nhóm (Chỉ hiển thị nếu là 'both') */}
        {isBoth && (
          <div className="grid grid-cols-2 gap-2 p-1.5 rounded-[20px] bg-gray-100 dark:bg-white/5 mb-6">
            <button
              onClick={() => setMode("individual")}
              className={`flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-bold transition-all ${
                mode === "individual"
                  ? "bg-white dark:bg-white/15 text-primary shadow-sm"
                  : "text-gray-navy/60 dark:text-light-blue/50 hover:text-gray-navy dark:hover:text-white"
              }`}
            >
              <User className="size-4" />
              Cá nhân
            </button>
            <button
              onClick={() => setMode("team")}
              className={`flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-bold transition-all ${
                mode === "team"
                  ? "bg-white dark:bg-white/15 text-primary shadow-sm"
                  : "text-gray-navy/60 dark:text-light-blue/50 hover:text-gray-navy dark:hover:text-white"
              }`}
            >
              <Users className="size-4" />
              Đội nhóm
            </button>
          </div>
        )}

        {/* Nội dung theo hình thức đăng ký */}
        {mode === "individual" ? (
          <div className="space-y-6 text-left">
            <div className="p-5 rounded-3xl bg-primary/5 border border-primary/10">
              <p className="text-sm text-gray-navy dark:text-light-blue/80 leading-relaxed">
                Bạn đang thực hiện đăng ký tham gia thi đấu với tư cách **Cá nhân**. Khi giảng viên phê duyệt, bạn sẽ được cấp quyền tham gia làm bài thi của giải đấu.
              </p>
            </div>
            <Button
              onClick={handleRegisterIndividual}
              disabled={registerIndividualMutation.isPending}
              className="w-full py-6 rounded-2xl text-sm font-bold flex items-center justify-center gap-2"
            >
              {registerIndividualMutation.isPending ? "Đang xử lý..." : "Xác nhận Đăng ký Cá nhân"}
              <ArrowRight className="size-4" />
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Tab phụ: Tạo đội hoặc Gia nhập đội */}
            <div className="flex gap-4 border-b border-gray-100 dark:border-white/5">
              <button
                onClick={() => setTeamTab("create")}
                className={`pb-3 text-sm font-bold transition-all border-b-2 ${
                  teamTab === "create"
                    ? "border-primary text-primary"
                    : "border-transparent text-gray-navy/60 dark:text-light-blue/50 hover:text-gray-navy dark:hover:text-white"
                }`}
              >
                Tạo đội thi mới
              </button>
              <button
                onClick={() => setTeamTab("join")}
                className={`pb-3 text-sm font-bold transition-all border-b-2 ${
                  teamTab === "join"
                    ? "border-primary text-primary"
                    : "border-transparent text-gray-navy/60 dark:text-light-blue/50 hover:text-gray-navy dark:hover:text-white"
                }`}
              >
                Gia nhập đội có sẵn
              </button>
            </div>

            {teamTab === "create" ? (
              <form onSubmit={handleCreateTeam} className="space-y-5 text-left">
                <div className="space-y-2">
                  <label className="text-xs font-black text-gray-navy dark:text-light-blue/70 uppercase tracking-wider">
                    Tên đội thi
                  </label>
                  <input
                    type="text"
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    placeholder="Nhập tên đội của bạn..."
                    className="w-full px-5 py-3.5 rounded-2xl border border-gray-200 dark:border-white/10 bg-transparent text-sm focus:outline-none focus:border-primary text-navy-blue dark:text-white"
                  />
                </div>
                <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/10 flex gap-3 text-left">
                  <ShieldAlert className="size-5 text-amber-500 shrink-0" />
                  <p className="text-xs text-amber-600 dark:text-amber-400 leading-normal">
                    Sau khi tạo đội thành công, bạn sẽ là **Trưởng nhóm (Leader)**. Bạn sẽ nhận được mã mời để gửi cho các thành viên khác tham gia.
                  </p>
                </div>
                <Button
                  type="submit"
                  disabled={createTeamMutation.isPending}
                  className="w-full py-6 rounded-2xl text-sm font-bold flex items-center justify-center gap-2"
                >
                  {createTeamMutation.isPending ? "Đang tạo..." : "Tạo đội & Đăng ký"}
                  <ArrowRight className="size-4" />
                </Button>
              </form>
            ) : (
              <form onSubmit={handleJoinTeam} className="space-y-5 text-left">
                <div className="space-y-2">
                  <label className="text-xs font-black text-gray-navy dark:text-light-blue/70 uppercase tracking-wider">
                    Mã đội thi
                  </label>
                  <input
                    type="text"
                    value={teamCode}
                    onChange={(e) => setTeamCode(e.target.value)}
                    placeholder="Ví dụ: DUT-ABCD"
                    className="w-full px-5 py-3.5 rounded-2xl border border-gray-200 dark:border-white/10 bg-transparent text-sm focus:outline-none focus:border-primary text-navy-blue dark:text-white"
                  />
                </div>
                <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10 flex gap-3 text-left">
                  <Users className="size-5 text-primary shrink-0" />
                  <p className="text-xs text-gray-navy/80 dark:text-light-blue/80 leading-normal">
                    Hãy xin Trưởng nhóm của bạn **Mã mời đội thi** và nhập vào đây để tham gia đội thi.
                  </p>
                </div>
                <Button
                  type="submit"
                  disabled={joinTeamMutation.isPending}
                  className="w-full py-6 rounded-2xl text-sm font-bold flex items-center justify-center gap-2"
                >
                  {joinTeamMutation.isPending ? "Đang tham gia..." : "Gia nhập đội"}
                  <ArrowRight className="size-4" />
                </Button>
              </form>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
}
