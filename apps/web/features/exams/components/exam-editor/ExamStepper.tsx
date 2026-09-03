"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, ArrowLeft, CheckCircle2, Save, FileText, Users, ListChecks } from "lucide-react";
import { cn, formatToLocalDatetime } from "@/lib/utils";
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
    start_time: formatToLocalDatetime(initialData?.start_time),
    end_time: formatToLocalDatetime(initialData?.end_time),
    duration_minutes: initialData?.duration_minutes ?? 60,
    max_attempts: initialData?.max_attempts ?? 1,
    is_published: initialData?.is_published ?? false,
    show_answers: initialData?.show_answers ?? false,
  });
  const [participantIds, setParticipantIds] = useState<number[]>(initialData?.participant_ids ?? []);
  const [questionIds, setQuestionIds] = useState<string[]>(initialData?.questions?.map((q: any) => q.id) ?? []);
  const [isSaving, setIsSaving] = useState(false);

  const createExam = useCreateExam();
  const updateExam = useUpdateExam(initialData?.id ?? "");
  const setQuestions = useSetExamQuestions();

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep((curr) => curr + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep((curr) => curr - 1);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const payload = {
        ...formData,
        start_time: formData.start_time || null,
        end_time: formData.end_time || null,
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
          show_answers: payload.show_answers,
        });
      } else {
        const newExam = await createExam.mutateAsync(payload);
        examId = newExam.id;
      }

      if (questionIds.length > 0 && examId) {
        await setQuestions.mutateAsync({
          examId,
          questionIds: questionIds,
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
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* Top Navigation & Steps Indicator */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white dark:bg-navy-blue/80 p-3 rounded-[2.5rem] border border-gray-100 dark:border-white/10 shadow-sm">
        {/* Left: Back button & Stepper Pills */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
          {currentStep > 0 ? (
            <button
              type="button"
              onClick={handleBack}
              className="flex items-center gap-2 px-4 py-2.5 rounded-[2rem] font-bold text-xs text-gray-navy hover:bg-gray-100 dark:hover:bg-white/10 transition-all shrink-0"
            >
              <ArrowLeft className="size-4" />
              Quay lại
            </button>
          ) : <div />}

          <div className="flex items-center gap-1.5 p-1 rounded-[2rem] bg-gray-50 dark:bg-white/5 overflow-x-auto custom-scrollbar">
            {STEPS.map((step, idx) => {
              const Icon = step.icon;
              const isActive = currentStep === idx;
              const isDone = currentStep > idx;

              return (
                <button
                  key={step.id}
                  type="button"
                  onClick={() => setCurrentStep(idx)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-[1.8rem] transition-all text-xs font-bold whitespace-nowrap",
                    isActive
                      ? "bg-white dark:bg-navy-blue shadow-md text-primary scale-105"
                      : isDone
                      ? "text-green"
                      : "text-gray-navy opacity-50 hover:opacity-100"
                  )}
                >
                  <div
                    className={cn(
                      "size-6 rounded-lg flex items-center justify-center text-[10px]",
                      isActive
                        ? "bg-primary text-white"
                        : isDone
                        ? "bg-green text-white"
                        : "bg-gray-200 dark:bg-white/10"
                    )}
                  >
                    {isDone ? <CheckCircle2 className="size-3.5" /> : <Icon className="size-3" />}
                  </div>
                  <span className="uppercase tracking-wider">{step.title}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Actions (Next & Save) */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          {currentStep < STEPS.length - 1 && (
            <button
              type="button"
              onClick={handleNext}
              className="group px-5 py-3 rounded-[2rem] bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase tracking-widest text-xs flex items-center gap-2 shadow-lg shadow-indigo-500/20 hover:scale-105 active:scale-95 transition-all"
            >
              Tiếp theo
              <ArrowRight className="size-4 group-hover:translate-x-0.5 transition-transform" />
            </button>
          )}

          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving || !formData.title || questionIds.length === 0}
            className="px-7 py-3 rounded-[2rem] bg-gradient-to-br from-primary to-pink-500 text-white font-black uppercase tracking-widest text-xs flex items-center gap-2 shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:grayscale"
          >
            {isSaving ? "Đang lưu..." : "Lưu kỳ thi"}
            <Save className="size-4" />
          </button>
        </div>
      </div>

      {/* Step Content */}
      <div className="min-h-[500px]">
        {currentStep === 0 && (
          <StepInfo data={formData} onChange={(d) => setFormData((prev) => ({ ...prev, ...d }))} />
        )}
        {currentStep === 1 && (
          <StepParticipants selectedIds={participantIds} onChange={setParticipantIds} />
        )}
        {currentStep === 2 && (
          <StepQuestions selectedIds={questionIds} onChange={setQuestionIds} />
        )}
      </div>
    </div>
  );
}
