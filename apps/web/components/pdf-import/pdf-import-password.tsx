"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Lock, Eye, EyeOff, Key, Loader2, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";

interface PdfImportPasswordProps {
  fileName: string;
  onSubmit: (password: string) => void;
  onCancel: () => void;
  isPending: boolean;
  errorMsg: string | null;
}

export function PdfImportPassword({
  fileName,
  onSubmit,
  onCancel,
  isPending,
  errorMsg,
}: PdfImportPasswordProps) {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) return;
    onSubmit(password);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 15 }}
      className="max-w-md mx-auto w-full"
    >
      <div className="bg-slate-50/50 dark:bg-white/5 border border-slate-200/60 dark:border-white/10 rounded-[32px] p-8 shadow-xl backdrop-blur-md">
        <div className="flex flex-col items-center text-center mb-8">
          <div className="size-16 rounded-2xl bg-gradient-to-br from-amber-500 to-rose-500 flex items-center justify-center text-white shadow-lg mb-4">
            <Lock className="size-8 animate-pulse" />
          </div>
          <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight">
            Yêu cầu mật khẩu
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed max-w-sm">
            Tài liệu <span className="font-bold text-slate-700 dark:text-slate-300">{fileName}</span> đã được mã hóa. Vui lòng cung cấp mật khẩu để AI có thể bóc tách nội dung.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Mật khẩu PDF
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Nhập mật khẩu truy cập..."
                disabled={isPending}
                className="w-full rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/50 pl-4 pr-12 py-3.5 text-sm outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all text-slate-800 dark:text-white disabled:opacity-50"
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isPending}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
              >
                {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
              </button>
            </div>
          </div>

          {errorMsg && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/50 rounded-2xl p-4 flex gap-3 text-rose-700 dark:text-rose-400"
            >
              <AlertCircle className="size-5 shrink-0" />
              <div className="text-xs">
                <p className="font-bold">Nhập mật khẩu thất bại:</p>
                <p className="mt-0.5">
                  {errorMsg === "INVALID_PASSWORD" || errorMsg.includes("Mật khẩu PDF không đúng")
                    ? "Mật khẩu không chính xác. Vui lòng thử lại."
                    : errorMsg}
                </p>
              </div>
            </motion.div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isPending}
              className="w-full sm:w-1/3 h-12 rounded-xl border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 font-semibold text-sm transition-all"
            >
              Quay lại
            </Button>
            <Button
              type="submit"
              disabled={isPending || !password.trim()}
              className="w-full sm:w-2/3 h-12 rounded-xl bg-gradient-to-r from-amber-500 to-rose-500 hover:opacity-95 text-white font-semibold text-sm shadow-lg shadow-amber-500/10 hover:shadow-amber-500/20 transition-all active:scale-[0.98]"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Đang mở khóa...
                </>
              ) : (
                <>
                  <Key className="w-4 h-4 mr-2" />
                  Mở khóa & Import
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </motion.div>
  );
}
