"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, ArrowLeft, CheckCircle2, Save, FileText, Users, ListChecks } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import StepInfo, { ExamInfoData } from "./StepInfo";
import StepParticipants from "./StepParticipants";
import StepQuestions from "./StepQuestions";
import { useCreateExam, useSetExamQuestions, useUpdateExam } from "@/lib/queries";

interface Props {
  initialData?: any; // For editing
}

const STEPS = [
  { id: "info", title: "Thông tin", icon: FileText },
  { id: "participants", title: "Thí sinh", icon: Users },
  { id: "questions", title: "Câu hỏi", icon: ListChecks },
];

export default function ExamStepper({ initialData }: Props) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<ExamInfoData>({
    title: initialData?.title ?? "",
    description: initialData?.description ?? "",
    start_time: initialData?.start_time ? new Date(initialData.start_time).toISOString().slice(0, 16) : "",
    end_time: initialData?.end_time ? new Date(initialData.end_time).toISOString().slice(0, 16) : "",
    duration_minutes: initialData?.duration_minutes ?? 60,
    max_attempts: initialData?.max_attempts ?? 1,
    is_published: initialData?.is_published ?? false,
  });
  const [participantIds, setParticipantIds] = useState<number[]>(initialData?.participant_ids ?? []);
  const [questionIds, setQuestionIds] = useState<string[]>(initialData?.questions?.map((q: any) => q.id) ?? []);
  const [isSaving, setIsSaving] = useState(false);

  const createExam = useCreateExam();
  const updateExam = useUpdateExam(initialData?.id ?? "");
  const setQuestions = useSetExamQuestions();

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(curr => curr + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(curr => curr - 1);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const payload = {
        ...formData,
        start_time: formData.start_time ? new Date(formData.start_time).toISOString() : null,
        end_time: formData.end_time ? new Date(formData.end_time).toISOString() : null,
        participant_ids: participantIds,
      } as any;

      let examId = initialData?.id;
      if (examId) {
        await updateExam.mutateAsync({
          title: payload.title,
          description: payload.description,
          start_time: payload.start_time,
          end_time: payload.end_time,
          duration_minutes: payload.duration_minutes,
          max_attempts: payload.max_attempts,
          is_published: payload.is_published,
          participant_ids: payload.participant_ids,
        });
      } else {
        const newExam = await createExam.mutateAsync(payload);
        examId = newExam.id;
      }
      
      if (questionIds.length > 0 && examId) {
        await setQuestions.mutateAsync({ 
          examId, 
          questionIds: questionIds 
        });
      }
      
      router.push("/teacher/exams");
    } catch (err) {
      console.error("Save failed", err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-8 pb-20">
      {/* Header & Steps Indicator */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-4 p-1.5 rounded-[2.5rem] bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5">
          {STEPS.map((step, idx) => {
            const Icon = step.icon;
            const isActive = currentStep === idx;
            const isDone = currentStep > idx;
            
            return (
              <div key={step.id} className="flex items-center">
                <button
                  onClick={() => idx < currentStep && setCurrentStep(idx)}
                  className={cn(
                    "flex items-center gap-3 px-6 py-3 rounded-[2rem] transition-all",
                    isActive ? "bg-white dark:bg-navy-blue shadow-lg text-purple scale-105" : 
                    isDone ? "text-green" : "text-gray-navy opacity-40"
                  )}
                >
                  <div className={cn(
                    "size-8 rounded-xl flex items-center justify-center transition-all",
                    isActive ? "bg-purple text-white shadow-lg shadow-purple/30" : 
                    isDone ? "bg-green text-white" : "bg-gray-200 dark:bg-white/10"
                  )}>
                    {isDone ? <CheckCircle2 className="size-5" /> : <Icon className="size-4" />}
                  </div>
                  <span className="text-xs font-black uppercase tracking-widest hidden sm:block">
                    {step.title}
                  </span>
                </button>
                {idx < STEPS.length - 1 && (
                  <div className="w-10 h-px bg-gray-200 dark:bg-white/10 mx-2 hidden md:block" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Step Content */}
      <div className="min-h-[500px]">
        {currentStep === 0 && (
          <StepInfo data={formData} onChange={d => setFormData(prev => ({ ...prev, ...d }))} />
        )}
        {currentStep === 1 && (
          <StepParticipants selectedIds={participantIds} onChange={setParticipantIds} />
        )}
        {currentStep === 2 && (
          <StepQuestions selectedIds={questionIds} onChange={setQuestionIds} />
        )}
      </div>

      {/* Navigation Footer */}
      <div className="fixed bottom-0 left-0 right-0 p-6 bg-white/80 dark:bg-navy-blue/80 backdrop-blur-xl border-t border-gray-100 dark:border-white/5 z-50">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <button
            onClick={handleBack}
            disabled={currentStep === 0}
            className="flex items-center gap-2 px-8 py-4 rounded-[2rem] font-bold text-gray-navy hover:bg-gray-100 dark:hover:bg-white/5 transition-all disabled:opacity-0"
          >
            <ArrowLeft className="size-5" />
            Quay lại
          </button>

          <div className="flex gap-4">
            {currentStep < STEPS.length - 1 ? (
              <button
                onClick={handleNext}
                className="group px-10 py-5 rounded-[2rem] bg-indigo-600 text-white font-black uppercase tracking-widest text-xs flex items-center gap-3 shadow-xl shadow-indigo-500/30 hover:scale-105 active:scale-95 transition-all"
              >
                Tiếp theo
                <ArrowRight className="size-5 group-hover:translate-x-1 transition-transform" />
              </button>
            ) : (
              <button
                onClick={handleSave}
                disabled={isSaving || !formData.title || questionIds.length === 0}
                className="px-10 py-5 rounded-[2rem] bg-gradient-to-br from-purple to-pink-500 text-white font-black uppercase tracking-widest text-xs flex items-center gap-3 shadow-xl shadow-purple/30 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:grayscale"
              >
                {isSaving ? "Đang lưu..." : "Lưu kỳ thi"}
                <Save className="size-5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
