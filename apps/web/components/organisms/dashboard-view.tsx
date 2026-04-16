"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  BookOpen,
  GraduationCap,
  History,
  Trophy,
  Target,
  Clock,
  ArrowRight,
  TrendingUp,
  FileText,
  Play
} from "lucide-react";
import { UserMe } from "@/lib/types";
import { cn, parseICT } from "@/lib/utils";
import { MotionDiv } from "@/components/animated/motion-div";
import Link from "next/link";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

interface DashboardViewProps {
  user: UserMe | null;
  activeTab: "lessons" | "exams";
  onTabChange: (tab: "lessons" | "exams") => void;
  exams: any[];
  lessons: any[];
  isLoadingExams: boolean;
  isLoadingLessons: boolean;
}

export const DashboardView = ({
  user,
  activeTab,
  onTabChange,
  exams,
  lessons,
  isLoadingExams,
  isLoadingLessons,
}: DashboardViewProps) => {
  return (
    <div className="w-full space-y-8 pb-10">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <MotionDiv
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <h1 className="text-4xl md:text-5xl font-bold text-dark-blue dark:text-white">
            Xin chào, <span className="text-purple">{user?.name || "Nguyễn"}</span> 👋
          </h1>
          <p className="text-gray-navy dark:text-light-blue mt-2">
            Hôm nay bạn muốn rèn luyện gì nào?
          </p>
        </MotionDiv>

        <div className="flex items-center gap-3">
          <Badge variant="outline" className="px-4 py-2 bg-white dark:bg-navy-blue shadow-sm rounded-xl border-gray-200 dark:border-white/10">
            <Clock className="size-4 mr-2 text-purple" />
            {new Date().toLocaleDateString('vi-VN', { day: 'numeric', month: 'long', year: 'numeric' })}
          </Badge>
        </div>
      </div>

      {/* Stats Cards Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="BÀI HỌC"
          value={lessons.length.toString()}
          icon={<BookOpen className="text-blue-500" />}
          delay={0.1}
        />
        <StatCard
          title="ĐỀ THI HIỆN CÓ"
          value={exams.length.toString()}
          icon={<GraduationCap className="text-purple" />}
          delay={0.2}
        />
        <StatCard
          title="ĐÃ HOÀN THÀNH"
          value="0"
          icon={<Target className="text-orange-500" />}
          delay={0.3}
        />
        <StatCard
          title="ĐIỂM TRUNG BÌNH"
          value="—"
          icon={<TrendingUp className="text-green" />}
          delay={0.4}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column (2/3) - Learning Content */}
        <div className="lg:col-span-2 space-y-8">
          <div className="flex p-1 bg-gray-100 dark:bg-navy-blue/30 rounded-2xl w-fit">
            <button
              onClick={() => onTabChange("lessons")}
              className={cn(
                "px-8 py-3 rounded-xl text-sm font-bold transition flex items-center gap-2",
                activeTab === "lessons"
                  ? "bg-white dark:bg-purple text-purple dark:text-white shadow-sm"
                  : "text-gray-navy dark:text-light-blue hover:text-dark-blue"
              )}
            >
              <BookOpen className="size-4" />
              Lộ trình bài học
            </button>
            <button
              onClick={() => onTabChange("exams")}
              className={cn(
                "px-8 py-3 rounded-xl text-sm font-bold transition flex items-center gap-2",
                activeTab === "exams"
                  ? "bg-white dark:bg-purple text-purple dark:text-white shadow-sm"
                  : "text-gray-navy dark:text-light-blue hover:text-dark-blue"
              )}
            >
              <Target className="size-4" />
              Đề thi đề xuất
            </button>
          </div>

          <Card className="border-none shadow-xl bg-white/50 backdrop-blur-sm dark:bg-navy-blue/20">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-xl flex items-center gap-3">
                {activeTab === "exams" ? (
                  <GraduationCap className="text-purple" />
                ) : (
                  <BookOpen className="text-purple" />
                )}
                {activeTab === "exams" ? "Đề thi mới nhất" : "Bài tập cần làm"}
              </CardTitle>
              <Button variant="ghost" className="text-purple font-bold text-xs" asChild>
                <a href={activeTab === "exams" ? "/exams" : "/lessons"}>Xem tất cả <ArrowRight className="size-3 ml-1" /></a>
              </Button>
            </CardHeader>
            <CardContent>
              {activeTab === "lessons" && (
                <div className="space-y-4">
                  {isLoadingLessons && <p className="text-center py-10 opacity-50">Đang tải học liệu...</p>}
                  {!isLoadingLessons && lessons.length === 0 && <EmptyState text="Chưa có bài học nào được giao" />}
                  {lessons.slice(0, 3).map((lesson) => (
                    <Link
                      key={lesson.id}
                      href={`/lessons/${lesson.id}`}
                      className="group flex items-center gap-4 p-4 rounded-3xl bg-white dark:bg-navy-blue/40 border border-transparent hover:border-purple/30 transition cursor-pointer shadow-sm"
                    >
                      <div className="size-14 rounded-2xl bg-purple/10 flex items-center justify-center text-purple font-black text-xl group-hover:bg-purple group-hover:text-white transition">
                        {lesson.order}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-dark-blue dark:text-white text-lg">{lesson.name}</h4>
                        <p className="text-sm text-gray-navy dark:text-light-blue opacity-70">Bài học tích hợp AI • 15 phút</p>
                      </div>
                      <div className="rounded-full bg-purple/10 text-purple group-hover:bg-purple group-hover:text-white transition-all size-10 flex items-center justify-center">
                        <Play className="size-4" />
                      </div>
                    </Link>
                  ))}
                </div>
              )}

              {activeTab === "exams" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {isLoadingExams && (
                    <div className="col-span-2 space-y-4">
                      {[1, 2].map(i => (
                        <div key={i} className="h-40 rounded-3xl bg-gray-100 dark:bg-white/5 animate-pulse" />
                      ))}
                    </div>
                  )}
                  {!isLoadingExams && exams.length === 0 && <div className="col-span-2"><EmptyState text="Hệ thống chưa đăng đề thi" /></div>}
                  {exams.slice(0, 4).map((exam, idx) => (
                    <ExamCard key={exam.id} exam={exam} delay={0.1 * idx} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column (1/3) - Activity & Stats */}
        <div className="space-y-6">
          {/* Recent Results */}
          <Card className="border-none shadow-xl bg-white/60 dark:bg-navy-blue/40 overflow-hidden">
            <CardHeader className="bg-gray-50/50 dark:bg-white/5 border-b border-gray-100 dark:border-white/5">
              <CardTitle className="text-sm font-bold flex items-center gap-2 uppercase tracking-tighter">
                <History className="size-4 text-purple" />
                Kết quả gần đây
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <ResultItem title="Kiểm tra hệ thống" score={0} date="Chưa có dữ liệu" />
              <EmptyState text="Chưa có lịch sử làm bài" className="py-6" />
            </CardContent>
          </Card>

          {/* Achievements */}
          <Card className="border-none shadow-xl bg-purple dark:bg-purple/80 text-white overflow-hidden relative">
            <div className="absolute -right-4 -bottom-4 opacity-20 transform rotate-12">
              <Trophy className="size-32" />
            </div>
            <CardContent className="p-6 relative z-10">
              <Trophy className="size-8 mb-4 text-amber-300" />
              <h4 className="text-xl font-bold mb-1">Thành tích</h4>
              <p className="text-xs opacity-70 mb-4">Hoàn thành bài học để thăng hạng</p>
              <Button size="sm" variant="secondary" className="bg-white/20 hover:bg-white/30 border-none text-white rounded-xl font-bold ">
                Xem bảng xếp hạng
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon, delay }: { title: string, value: string, icon: React.ReactNode, delay: number }) => (
  <MotionDiv
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
  >
    <Card className="border-none shadow-lg bg-white dark:bg-navy-blue group overflow-hidden">
      <CardContent className="p-6 flex items-center gap-6 relative">
        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition duration-500">
          {icon}
        </div>
        <div className="size-14 rounded-2xl bg-gray-50 dark:bg-white/5 flex items-center justify-center text-2xl shadow-inner group-hover:bg-purple/10 group-hover:text-purple transition duration-300">
          {icon}
        </div>
        <div>
          <p className="text-[10px] font-black text-gray-navy dark:text-light-blue opacity-40 tracking-widest uppercase">{title}</p>
          <p className="text-3xl font-bold text-dark-blue dark:text-white mt-1">{value}</p>
        </div>
      </CardContent>
    </Card>
  </MotionDiv>
);

const ResultItem = ({ title, score, date }: { title: string, score: number, date: string }) => (
  <div className="flex items-center justify-between p-3 rounded-2xl bg-white/50 dark:bg-white/5 border border-transparent hover:border-purple/20 transition group">
    <div className="flex items-center gap-3">
      <div className="size-10 rounded-xl bg-purple/10 flex items-center justify-center text-purple font-bold">
        {score}
      </div>
      <div>
        <h5 className="font-bold text-dark-blue dark:text-white text-xs">{title}</h5>
        <p className="text-[10px] text-gray-navy dark:text-light-blue opacity-50">{date}</p>
      </div>
    </div>
    <ArrowRight className="size-4 text-purple opacity-0 group-hover:opacity-100 transition translate-x-1 group-hover:translate-x-0" />
  </div>
);

const EmptyState = ({ text, className }: { text: string, className?: string }) => (
  <div className={cn("flex flex-col items-center justify-center py-10 opacity-20", className)}>
    <FileText className="size-10 mb-2" />
    <p className="text-xs font-medium">{text}</p>
  </div>
);

const ExamCard = ({ exam, delay }: { exam: any, delay: number }) => {
  const isExpired = exam.end_time && parseICT(exam.end_time) < new Date();
  const isStarted = !exam.start_time || parseICT(exam.start_time) <= new Date();
  
  return (
    <MotionDiv
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay }}
    >
      <Link 
        href={`/exams/${exam.id}`}
        className={cn(
          "relative flex flex-col h-full p-6 rounded-[2.5rem] bg-white dark:bg-navy-blue border-2 border-transparent hover:border-purple/40 transition-all duration-300 shadow-xl group overflow-hidden",
          isExpired && "grayscale opacity-80"
        )}
      >
         {/* Background pattern */}
         <div className="absolute -right-4 -top-4 size-32 bg-purple/5 rounded-full blur-3xl group-hover:bg-purple/10 transition-colors" />
         
         <div className="flex justify-between items-start mb-4">
            <div className="size-12 rounded-2xl bg-purple/10 flex items-center justify-center text-purple group-hover:bg-purple group-hover:text-white transition-all duration-300 shadow-inner">
               <GraduationCap className="size-6" />
            </div>
            <div className="flex flex-col items-end gap-1.5">
               {isExpired ? (
                 <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-500/20 text-[10px] font-bold py-0.5">Hết hạn</Badge>
               ) : !isStarted ? (
                 <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/20 text-[10px] font-bold py-0.5">Sắp diễn ra</Badge>
               ) : (
                 <Badge variant="outline" className="bg-green/10 text-green border-green/20 text-[10px] font-bold py-0.5">Đang mở</Badge>
               )}
            </div>
         </div>

         <div className="flex-1 space-y-4">
           <div>
             <h4 className="font-black text-dark-blue dark:text-white text-xl leading-snug group-hover:text-purple transition-colors line-clamp-2">
               {exam.title}
             </h4>
             <p className="text-sm text-gray-navy/60 dark:text-light-blue/40 font-medium mt-1 line-clamp-1">
               {exam.description || "Hệ thống luyện tập thông minh"}
             </p>
           </div>

           <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                 <p className="text-[10px] font-black uppercase text-gray-navy opacity-40">Thời lượng</p>
                 <div className="flex items-center gap-2 font-bold text-dark-blue dark:text-white">
                    <Clock className="size-4 text-purple" />
                    <span>{exam.duration_minutes ?? 0} phút</span>
                 </div>
              </div>
              <div className="space-y-1">
                 <p className="text-[10px] font-black uppercase text-gray-navy opacity-40">Lượt thi</p>
                 <div className="flex items-center gap-2 font-bold text-dark-blue dark:text-white">
                    <Target className="size-4 text-purple" />
                    <span>{exam.max_attempts || "—"} lần</span>
                 </div>
              </div>
           </div>

           <div className="pt-4 border-t border-gray-100 dark:border-white/5 space-y-2">
              <div className="flex justify-between text-[10px] items-center">
                 <span className="font-bold text-gray-navy/50 dark:text-light-blue/30 uppercase">Thời hạn</span>
                 <span className="font-black text-dark-blue dark:text-white">
                    {exam.end_time 
                      ? format(parseICT(exam.end_time), "dd/MM/yyyy", { locale: vi })
                      : "Vô thời hạn"
                    }
                 </span>
              </div>
           </div>
         </div>

         <div className="mt-6 flex items-center justify-center gap-2 w-full py-4 bg-purple text-white rounded-2xl font-black shadow-lg shadow-purple/30 group-hover:scale-[1.02] group-hover:shadow-purple/40 transition-all active:scale-95">
            BẮT ĐẦU THI
            <ArrowRight className="size-4 group-hover:translate-x-1 transition-transform" />
         </div>
      </Link>
    </MotionDiv>
  );
};
