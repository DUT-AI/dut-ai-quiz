"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
    ArrowLeft,
    CheckCircle2,
    XCircle,
    AlertTriangle,
    BookOpen,
    Trophy,
    Loader2,
    ChevronRight,
    Info,
    Timer
} from "lucide-react";
import { useAttemptReview } from "@/lib/queries";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { motion } from "framer-motion";
import { renderMathInHTML } from "@/lib/render-math";

export default function ReviewPage() {
    const params = useParams();
    const attemptId = params.attemptId as string;
    const router = useRouter();
    const { data: reviewData, isLoading, error } = useAttemptReview(attemptId);

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen space-y-4">
                <Loader2 className="size-12 animate-spin text-primary" />
                <p className="text-gray-navy font-bold">Đang phân tích kết quả bài thi...</p>
            </div>
        );
    }

    if (error || !reviewData) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen space-y-4 p-6 text-center">
                <XCircle className="size-16 text-red opacity-20" />
                <h2 className="text-2xl font-black text-dark-blue">Không tìm thấy dữ liệu bài thi</h2>
                <button
                    onClick={() => router.push("/history")}
                    className="px-8 py-3 bg-primary text-white rounded-2xl font-black shadow-xl"
                >
                    QUAY LẠI LỊCH SỬ
                </button>
            </div>
        );
    }

    const { attempt, answers, questions } = reviewData;
    const scorePercentage = (attempt.score !== null ? (attempt.score / questions.length) * 100 : 0);

    return (
        <div className="max-w-4xl mx-auto px-6 py-12 space-y-12 pb-32">
            {/* Back Button */}
            <button
                onClick={() => router.push("/history")}
                className="group flex items-center gap-2 text-gray-navy hover:text-primary transition-all font-black text-sm uppercase tracking-tighter"
            >
                <ArrowLeft className="size-4 group-hover:-translate-x-1 transition-transform" />
                Quay lại Lịch sử
            </button>

            {/* Hero Result Header */}
            <div className="relative overflow-hidden rounded-[3rem] bg-gradient-to-br from-dark-blue to-navy-blue p-10 text-white shadow-2xl">
                <div className="absolute top-0 right-0 p-8 opacity-10">
                    <Trophy className="size-48" />
                </div>

                <div className="relative z-10 flex flex-col md:flex-row items-center gap-10">
                    {/* Score Radial */}
                    <div className="relative size-40 shrink-0">
                        <svg className="size-full -rotate-90">
                            <circle cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-white/10" />
                            <motion.circle
                                cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="8" fill="transparent"
                                strokeDasharray={440}
                                initial={{ strokeDashoffset: 440 }}
                                animate={{ strokeDashoffset: 440 - (440 * scorePercentage) / 100 }}
                                transition={{ duration: 1.5, ease: "easeOut" }}
                                className="text-primary"
                            />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-4xl font-black leading-none">{attempt.score}</span>
                            <span className="text-[10px] font-black opacity-60 uppercase tracking-widest mt-1">/ {questions.length} ĐIỂM</span>
                        </div>
                    </div>

                    <div className="space-y-4 text-center md:text-left flex-1">
                        <div className="space-y-1">
                            <h1 className="text-3xl font-black tracking-tighter leading-tight">Phân tích Chi tiết Kết quả</h1>
                            <p className="text-primary font-bold opacity-80">
                                {format(new Date(attempt.started_at), "HH:mm, dd/MM/yyyy", { locale: vi })}
                            </p>
                        </div>

                        <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                            <Badge icon={Clock} label="Hoàn thành" value={attempt.completed_at ? "Xong" : "N/A"} color="bg-green-500/20 text-green-300" />
                            <Badge icon={AlertTriangle} label="Vi phạm" value={`${attempt.tab_out_count} lần`} color="bg-red/20 text-red-300" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Question Review List */}
            <div className="space-y-8">
                <h2 className="text-2xl font-black text-dark-blue flex items-center gap-3">
                    <BookOpen className="size-6 text-primary" />
                    Chi tiết Đáp án
                </h2>

                <div className="space-y-6">
                    {questions.map((q, idx) => {
                        const answer = answers.find(a => String(a.question_id).toLowerCase() === String(q.id).toLowerCase());
                        const userChoiceId = answer?.selected_option_id;
                        const correctOption = q.options.find(o => o.is_correct === true || o.is_correct === "true" || o.is_correct === 1);

                        return (
                            <motion.div
                                key={q.id}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                className="bg-white dark:bg-navy-blue rounded-[2.5rem] border border-gray-navy/10 overflow-hidden shadow-sm hover:shadow-xl transition-all"
                            >
                                <div className="p-8 space-y-8">
                                    {/* Question Header */}
                                    <div className="flex items-start gap-4">
                                        <span className="shrink-0 size-8 rounded-full bg-gray-navy/10 flex items-center justify-center text-sm font-black text-gray-navy">
                                            {idx + 1}
                                        </span>
                                        <div
                                            className="text-lg font-bold text-dark-blue prose dark:prose-invert max-w-none"
                                            dangerouslySetInnerHTML={{ __html: renderMathInHTML(q.content) }}
                                        />
                                    </div>

                                    {/* Options */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {q.options.map((opt) => {
                                            const isUserChoice = userChoiceId && String(opt.id).toLowerCase() === String(userChoiceId).toLowerCase();
                                            const isCorrectOpt = opt.is_correct === true || opt.is_correct === "true" || opt.is_correct === 1;

                                            let borderColor = "#e2e8f0"; // gray-200
                                            let bgColor = "transparent";
                                            let textColor = "#1e293b"; // slate-800
                                            let icon = null;

                                            if (isCorrectOpt) {
                                                borderColor = "#22c55e"; // green-500
                                                bgColor = "rgba(34, 197, 94, 0.1)"; // green-500/10
                                                textColor = "#15803d"; // green-700
                                                icon = <CheckCircle2 size={24} color="#22c55e" strokeWidth={3} />;
                                            } else if (isUserChoice && !isCorrectOpt) {
                                                borderColor = "#ef4444"; // red-500
                                                bgColor = "rgba(239, 68, 68, 0.1)"; // red-500/10
                                                textColor = "#b91c1c"; // red-700
                                                icon = <XCircle size={24} color="#ef4444" strokeWidth={3} />;
                                            }

                                            return (
                                                <div
                                                    key={opt.id}
                                                    style={{
                                                        borderColor: borderColor,
                                                        backgroundColor: bgColor,
                                                        borderWidth: '2px',
                                                        borderStyle: 'solid'
                                                    }}
                                                    className={`relative p-6 rounded-[2rem] transition-all duration-300 ${isUserChoice ? 'ring-4 ring-primary/30' : ''}`}
                                                >
                                                    <div className="flex items-start gap-4">
                                                        <div
                                                            style={{ color: textColor }}
                                                            className="prose prose-sm font-bold flex-1 max-w-none"
                                                            dangerouslySetInnerHTML={{ __html: renderMathInHTML(opt.text) }}
                                                        />
                                                        <div className="shrink-0 mt-1">
                                                            {icon}
                                                        </div>
                                                    </div>
                                                    {isUserChoice && (
                                                        <div className="absolute -top-3 left-6 px-4 py-1.5 bg-primary text-white text-[10px] font-black rounded-full uppercase shadow-xl z-20">
                                                            ✨ Lựa chọn của bạn
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}

                                        {!userChoiceId && (
                                            <div className="mt-4 p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-center gap-3 text-amber-700 text-sm font-bold">
                                                <AlertTriangle className="size-5" />
                                                Bạn đã không trả lời câu hỏi này.
                                            </div>
                                        )}
                                    </div>

                                    {/* Solution / Explanation */}
                                    {q.solution && (
                                        <div className="p-6 rounded-3xl bg-primary/5 border border-primary/10 space-y-3">
                                            <div className="flex items-center gap-2 text-primary font-black text-xs uppercase tracking-widest">
                                                <Info className="size-4" />
                                                Lời giải chi tiết
                                            </div>
                                            <div
                                                className="text-sm text-gray-navy leading-relaxed prose prose-sm max-w-none"
                                                dangerouslySetInnerHTML={{ __html: renderMathInHTML(q.solution) }}
                                            />
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

function Badge({ icon: Icon, label, value, color }: any) {
    return (
        <div className={`flex items-center gap-2.5 px-4 py-2 rounded-xl border border-white/5 ${color}`}>
            <Icon className="size-4" />
            <div className="flex flex-col -space-y-1">
                <span className="text-[9px] font-black uppercase opacity-60 tracking-tighter">{label}</span>
                <span className="text-sm font-black">{value}</span>
            </div>
        </div>
    );
}

function Clock({ className }: any) {
    return <Timer className={className} />;
}
