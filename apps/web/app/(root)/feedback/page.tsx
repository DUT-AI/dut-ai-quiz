"use client";

import React from "react";
import { MessageSquare, Heart, CheckCircle2, AlertTriangle, Lightbulb } from "lucide-react";
import { CommentList } from "@/features/comments/components/comment-list";

export default function FeedbackPage() {
  return (
    <div className="w-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20 text-left">
      {/* Header section */}
      <div className="flex flex-col gap-2 border-b border-gray-150 dark:border-white/10 pb-6">
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          Đóng góp ý kiến &amp; Phản hồi
        </h1>
        <p className="text-sm sm:text-base text-gray-navy/75 dark:text-light-blue/60 max-w-3xl leading-relaxed">
          Ý kiến đóng góp của bạn rất quan trọng để giúp đội ngũ phát triển cải tiến và hoàn thiện hệ thống **DUT AI Quiz Master** mỗi ngày.
        </p>
      </div>

      {/* Info grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="flex gap-4 p-5 rounded-[2rem] border border-emerald-500/10 bg-emerald-500/[0.02] dark:border-emerald-500/20 dark:bg-emerald-500/[0.04]">
          <div className="size-10 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
            <Lightbulb className="size-5" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-black text-slate-900 dark:text-white">Đề xuất tính năng</h3>
            <p className="text-xs text-gray-navy/70 dark:text-light-blue/60 leading-relaxed">
              Bạn muốn hệ thống có thêm tính năng gì mới? Hãy chia sẻ ý tưởng sáng tạo của bạn với chúng tôi.
            </p>
          </div>
        </div>

        <div className="flex gap-4 p-5 rounded-[2rem] border border-amber-500/10 bg-amber-500/[0.02] dark:border-amber-500/20 dark:bg-amber-500/[0.04]">
          <div className="size-10 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
            <AlertTriangle className="size-5" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-black text-slate-900 dark:text-white">Báo cáo lỗi</h3>
            <p className="text-xs text-gray-navy/70 dark:text-light-blue/60 leading-relaxed">
              Phát hiện lỗi hiển thị, lỗi logic hoặc bất kỳ điều gì bất thường? Hãy đăng bài mô tả chi tiết kèm ảnh chụp.
            </p>
          </div>
        </div>

        <div className="flex gap-4 p-5 rounded-[2rem] border border-blue-500/10 bg-blue-500/[0.02] dark:border-blue-500/20 dark:bg-blue-500/[0.04]">
          <div className="size-10 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
            <CheckCircle2 className="size-5" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-black text-slate-900 dark:text-white">Góp ý trải nghiệm</h3>
            <p className="text-xs text-gray-navy/70 dark:text-light-blue/60 leading-relaxed">
              Giao diện khó dùng, màu sắc chưa hài hòa hay thao tác rườm rà? Bất cứ điều gì khiến bạn chưa hài lòng.
            </p>
          </div>
        </div>
      </div>

      {/* Main Comment Module */}
      <div className="bg-white dark:bg-[#121E31]/90 border border-gray-200 dark:border-white/20 rounded-[2.5rem] shadow-xl pt-10 pb-10 px-6 md:pt-12 md:pb-12 md:px-12 transition-colors duration-300">
        <div className="max-w-5xl mx-auto space-y-8">
          <div className="flex items-center gap-3 border-b border-gray-150 dark:border-white/10 pb-4">
            <div className="size-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
              <MessageSquare className="size-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                Bảng góp ý từ người dùng
              </h2>
              <p className="text-xs sm:text-sm text-gray-navy/70 dark:text-light-blue/60 mt-0.5">
                Xem đóng góp của mọi người và cùng thảo luận, bình chọn cho ý tưởng tốt nhất.
              </p>
            </div>
          </div>

          <CommentList targetType="system_feedback" targetId={null} />
        </div>
      </div>

      {/* Footer gratitude card */}
      <div className="p-6 rounded-[2rem] border border-gray-250/60 dark:border-white/10 bg-gray-50/50 dark:bg-white/5 flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
        <div className="size-12 rounded-full bg-red/10 flex items-center justify-center text-red shrink-0">
          <Heart className="size-6 fill-red/20" />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-bold text-dark-blue dark:text-white">Cảm ơn sự đóng góp của bạn!</p>
          <p className="text-xs text-gray-navy/60 dark:text-light-blue/50">
            Tất cả phản hồi của bạn đều được đội ngũ kiểm duyệt xem xét và phản hồi sớm nhất có thể.
          </p>
        </div>
      </div>
    </div>
  );
}
