"use client";

import React, { useCallback, useMemo, useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

import { useCreateLesson, useUpdateLesson, useModules, useImportNotionLesson } from "@/lib/queries";
import { LessonEditorSchema, type Lesson, type LessonVideoInput, type LessonEditorInput } from "../types";
import { LessonVideoFormSection } from "./video/lesson-video-form-section";
import {
  LessonEditorHeader,
  LessonEditorStepper,
  LessonInfoStep,
  LessonContentStep,
  LessonPreviewPanel,
  LessonEditorFooter,
} from "./editor";
import { apiPut } from "@/lib/api";

interface LessonEditorPageProps {
  initialData?: Lesson;
  lessonId?: string;
}

export function LessonEditorPage({ initialData }: LessonEditorPageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultModuleId = searchParams.get("moduleId") || searchParams.get("module_id");
  const orderParam = searchParams.get("order");
  const defaultOrder = orderParam ? parseInt(orderParam, 10) : 1;

  const { data: modules = [] } = useModules();

  const isEdit = !!initialData;
  const createMut = useCreateLesson();
  const updateMut = useUpdateLesson(initialData?.id || "");
  const importNotionMut = useImportNotionLesson();

  const stepParam = searchParams.get("step");
  const parsedStep = stepParam === "2" ? 2 : stepParam === "3" ? 3 : 1;
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(parsedStep as 1 | 2 | 3);
  const [viewMode, setViewMode] = useState<"split" | "editor" | "preview">("split");
  const [editorWidth, setEditorWidth] = useState<number>(55); // percent
  const [isDragging, setIsDragging] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);

  // Stage 2: Separate state for YouTube reference videos
  const [videos, setVideos] = useState<LessonVideoInput[]>(
    initialData?.videos?.map((v, i) => ({
      id: v.id,
      title: v.title,
      url: v.url,
      description: v.description || "",
      order: v.order ?? i,
    })) || []
  );

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsDesktop(window.innerWidth >= 1024);
    const handleResize = () => setIsDesktop(window.innerWidth >= 1024);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const methods = useForm<LessonEditorInput>({
    resolver: zodResolver(LessonEditorSchema),
    defaultValues: {
      name: initialData?.name || "",
      description: initialData?.description || "",
      order: initialData?.order || defaultOrder || 1,
      slug: initialData?.slug || "",
      content_md: initialData?.content_md || "",
      module_id: initialData?.module_id || defaultModuleId || null,
      videos: initialData?.videos || [],
    },
  });

  // Sync videos & form state if initialData is loaded/updated
  useEffect(() => {
    if (initialData) {
      if (initialData.videos) {
        setVideos(
          initialData.videos.map((v, i) => ({
            id: v.id,
            title: v.title,
            url: v.url,
            description: v.description || "",
            order: v.order ?? i,
          }))
        );
      }
      methods.reset({
        name: initialData.name || "",
        description: initialData.description || "",
        order: initialData.order || defaultOrder || 1,
        slug: initialData.slug || "",
        content_md: initialData.content_md || "",
        module_id: initialData.module_id || defaultModuleId || null,
        videos: initialData.videos || [],
      });
    }
  }, [initialData, defaultOrder, defaultModuleId, methods]);

  const {
    handleSubmit,
    watch,
    setValue,
    getValues,
    trigger,
    formState: { isSubmitting },
  } = methods;

  const watchContent = watch("content_md") || "";
  const watchName = watch("name") || "";
  const watchDescription = watch("description") || "";
  const watchModuleId = watch("module_id");

  const handleNextStep = async () => {
    if (currentStep === 1) {
      const isValid = await trigger(["name", "slug", "order", "module_id"]);
      if (isValid) {
        setCurrentStep(2);
      }
    } else if (currentStep === 2) {
      setCurrentStep(3);
    }
  };

  const handlePrevStep = () => {
    setCurrentStep((prev) => (prev > 1 ? ((prev - 1) as 1 | 2 | 3) : 1));
  };

  const selectedModule = useMemo(
    () => modules.find((m) => m.id === watchModuleId),
    [modules, watchModuleId]
  );

  // Resize drag handle for split view
  const startResize = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  useEffect(() => {
    if (!isDragging) return;

    const handleMove = (clientX: number) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const relativeX = clientX - rect.left;
      const percentage = (relativeX / rect.width) * 100;
      const clamped = Math.max(25, Math.min(75, percentage));
      setEditorWidth(clamped);
    };

    const onMouseMove = (e: MouseEvent) => handleMove(e.clientX);
    const onTouchMove = (e: TouchEvent) => {
      if (e.touches[0]) handleMove(e.touches[0].clientX);
    };

    const stopResize = () => setIsDragging(false);

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", stopResize);
    document.addEventListener("touchmove", onTouchMove);
    document.addEventListener("touchend", stopResize);

    return () => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", stopResize);
      document.removeEventListener("touchmove", onTouchMove);
      document.removeEventListener("touchend", stopResize);
    };
  }, [isDragging]);

  const handleImportNotionZip = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    e.target.value = "";

    const formData = new FormData();
    formData.append("file", file);

    const currentModuleId = getValues("module_id");
    if (currentModuleId) {
      formData.append("module_id", currentModuleId);
    }

    if (isEdit && initialData?.id) {
      formData.append("lesson_id", initialData.id);
    }

    formData.append("name", "string");
    formData.append("description", "string");

    const loadingToast = toast.loading("Đang import bài giảng lý thuyết từ Notion...");
    try {
      const importedLesson = await importNotionMut.mutateAsync(formData);
      toast.dismiss(loadingToast);
      toast.success("Import bài học từ Notion thành công!");

      if (!isEdit) {
        router.push(`/teacher/lessons/${importedLesson.id}/edit?step=3`);
      } else {
        setValue("name", importedLesson.name, { shouldDirty: true, shouldValidate: true });
        setValue("description", importedLesson.description, { shouldDirty: true, shouldValidate: true });
        setValue("content_md", importedLesson.content_md || "", { shouldDirty: true, shouldValidate: true });
        if (importedLesson.slug) {
          setValue("slug", importedLesson.slug, { shouldDirty: true, shouldValidate: true });
        }
        if (importedLesson.module_id) {
          setValue("module_id", importedLesson.module_id, { shouldDirty: true, shouldValidate: true });
        }
        setCurrentStep(3);
      }
    } catch (err: any) {
      toast.dismiss(loadingToast);
      console.error("Failed to import Notion zip", err);
      toast.error("Lỗi khi import file Notion: " + (err.response?.data?.detail || err.message || "Không rõ lỗi"));
    }
  };

  const handleBack = () => {
    router.push("/teacher/lessons");
  };

  const onSubmit = async (values: LessonEditorInput) => {
    const payload = {
      name: values.name,
      description: values.description || "",
      content_md: values.content_md || "",
      order: values.order,
      slug: values.slug || "",
      module_id: values.module_id || null,
    };

    let savedLesson: any;
    if (isEdit) {
      savedLesson = await updateMut.mutateAsync(payload);
    } else {
      savedLesson = await createMut.mutateAsync(payload);
    }

    const targetId = savedLesson?.id || initialData?.id;
    if (targetId && (videos.length > 0 || (initialData?.videos && initialData.videos.length > 0))) {
      try {
        await apiPut(`/api/v1/lessons/${targetId}/videos`, { videos });
      } catch (err) {
        console.error("Failed to sync lesson videos", err);
      }
    }

    handleBack();
  };

  const isPending = isSubmitting || createMut.isPending || updateMut.isPending;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 15 }}
      className={`fixed inset-0 z-[100] bg-white dark:bg-navy-blue flex flex-col w-screen h-screen overflow-hidden text-left ${
        isDragging ? "select-none cursor-col-resize" : ""
      }`}
    >
      {/* Top Header */}
      <div className="px-6 md:px-10 pt-6">
        <LessonEditorHeader
          isEdit={isEdit}
          isPending={isPending}
          viewMode={viewMode}
          onChangeViewMode={setViewMode}
          onBack={handleBack}
        />
      </div>

      {/* Main Body */}
      <div ref={containerRef} className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
        {/* Editor Form Column */}
        <form
          id="lesson-editor-form"
          onSubmit={handleSubmit(onSubmit)}
          className={`flex-1 flex flex-col custom-scrollbar ${
            currentStep === 3 ? "overflow-hidden" : "overflow-y-auto"
          } ${viewMode === "preview" ? "hidden" : ""}`}
          style={
            viewMode === "split" && isDesktop
              ? { width: `${editorWidth}%`, flex: "none" }
              : undefined
          }
        >
          <div
            className={`flex-1 px-6 md:px-10 py-6 w-full flex flex-col ${
              currentStep === 3 ? "overflow-hidden space-y-4" : "space-y-6"
            }`}
          >
            {/* Stepper Header Tabs */}
            <LessonEditorStepper
              currentStep={currentStep}
              videoCount={videos.length}
              onSelectStep={async (targetStep) => {
                if (targetStep > 1) {
                  const isValid = await trigger(["name", "slug", "order", "module_id"]);
                  if (isValid) setCurrentStep(targetStep);
                } else {
                  setCurrentStep(1);
                }
              }}
            />

            {/* Step 1: General Info */}
            {currentStep === 1 && (
              <LessonInfoStep
                methods={methods}
                modules={modules}
                isPendingImport={importNotionMut.isPending}
                onImportNotionZip={handleImportNotionZip}
              />
            )}

            {/* Step 2: YouTube Reference Videos */}
            {currentStep === 2 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="bg-gray-50/50 dark:bg-white/5 p-6 md:p-8 rounded-3xl border border-gray-100 dark:border-white/5">
                  <LessonVideoFormSection videos={videos} onChange={setVideos} />
                </div>
              </div>
            )}

            {/* Step 3: Markdown Content Editor */}
            {currentStep === 3 && <LessonContentStep methods={methods} />}

            {/* Stepper Footer Controls */}
            <LessonEditorFooter
              currentStep={currentStep}
              videoCount={videos.length}
              isPending={isPending}
              isEdit={isEdit}
              onPrevStep={handlePrevStep}
              onNextStep={handleNextStep}
            />
          </div>
        </form>

        {/* Resizable Grabber Handle */}
        {viewMode === "split" && (
          <div
            onMouseDown={startResize}
            onTouchStart={startResize}
            className={`hidden lg:flex items-center justify-center w-1.5 hover:w-2 cursor-col-resize hover:bg-primary/30 transition-all select-none relative z-30 bg-gray-100/50 dark:bg-white/10 ${
              isDragging ? "bg-primary/50 w-2" : ""
            }`}
          >
            <div className="absolute top-1/2 -translate-y-1/2 w-5 h-12 bg-white dark:bg-navy-blue border border-gray-200 dark:border-white/10 rounded-full flex flex-col gap-0.5 items-center justify-center shadow-lg transition-transform hover:scale-110 active:scale-95 group z-40">
              <span className="w-1 h-3 bg-gray-400 dark:bg-white/30 rounded-full" />
              <span className="w-1 h-3 bg-gray-400 dark:bg-white/30 rounded-full" />
            </div>
          </div>
        )}

        {/* Live Preview Area */}
        <LessonPreviewPanel
          name={watchName}
          description={watchDescription}
          content={watchContent}
          selectedModule={selectedModule}
          viewMode={viewMode}
          editorWidth={editorWidth}
          isDesktop={isDesktop}
        />
      </div>
    </motion.div>
  );
}
