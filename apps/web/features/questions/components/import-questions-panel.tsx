"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  ClipboardList,
  FileJson,
  FileText,
  Sparkles,
} from "lucide-react";
import QuestionEditorModal from "./question-editor-modal";
import { JsonImport } from "@/components/json-import";
import { PdfImport } from "@/components/pdf-import";

type Tab = "manual" | "json" | "pdf";

interface Props {
  /** When provided, new questions will be linked to this lesson */
  lessonId?: string;
  onSuccess?: () => void;
}

const TABS: { id: Tab; icon: React.ReactNode; label: string; sub: string }[] = [
  {
    id: "manual",
    icon: <ClipboardList className="size-5" />,
    label: "Manual Form",
    sub: "Thêm từng câu hỏi",
  },
  {
    id: "json",
    icon: <FileJson className="size-5" />,
    label: "JSON File",
    sub: "Import hàng loạt",
  },
  {
    id: "pdf",
    icon: <FileText className="size-5" />,
    label: "PDF Document",
    sub: "Trích xuất từ PDF",
  },
];

export function ImportQuestionsPanel({ lessonId, onSuccess }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>("manual");
  const [showManualModal, setShowManualModal] = useState(false);

  const handleSuccess = () => {
    onSuccess?.();
  };

  return (
    <div className="w-full space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="size-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-primary flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
          <Sparkles className="size-5" />
        </div>
        <div>
          <h2 className="text-2xl font-black text-dark-blue dark:text-white tracking-tight">
            Import Questions
          </h2>
          <p className="text-sm text-gray-navy opacity-60">
            Add questions to your pool using various methods
          </p>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="grid grid-cols-3 gap-3">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`relative flex flex-col items-center gap-2 p-5 rounded-3xl border-2 transition-all font-medium text-sm ${activeTab === tab.id
                ? "border-primary bg-primary/5 text-primary shadow-lg shadow-primary/10"
                : "border-gray-100 dark:border-white/10 bg-white dark:bg-white/5 text-gray-navy hover:border-primary/30 hover:bg-primary/5"
              }`}
          >
            {activeTab === tab.id && (
              <motion.div
                layoutId="tab-import-bg"
                className="absolute inset-0 rounded-3xl bg-primary/5 border-2 border-primary"
                transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
              />
            )}
            <span className="relative z-10">{tab.icon}</span>
            <span className="relative z-10 font-bold">{tab.label}</span>
            <span className="relative z-10 text-xs opacity-60">{tab.sub}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="bg-white dark:bg-navy-blue/40 border border-gray-100 dark:border-white/5 rounded-[2.5rem] p-8 shadow-xl">
        {activeTab === "manual" && (
          <div className="flex flex-col items-center justify-center gap-6 py-8 text-center">
            <div className="size-20 rounded-full bg-primary/10 flex items-center justify-center">
              <ClipboardList className="size-10 text-primary" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-black text-dark-blue dark:text-white">
                Thêm câu hỏi thủ công
              </h3>
              <p className="text-sm text-gray-navy opacity-60 max-w-sm">
                Soạn thảo câu hỏi với trình chỉnh sửa đầy đủ — hỗ trợ LaTeX, Markdown, và upload ảnh.
              </p>
            </div>
            <button
              onClick={() => setShowManualModal(true)}
              className="px-8 py-4 rounded-2xl bg-primary text-white font-bold text-sm hover:bg-primary/90 transition-all hover:scale-105 active:scale-95 shadow-lg shadow-primary/20"
            >
              + Thêm câu hỏi mới
            </button>
          </div>
        )}

        {activeTab === "json" && (
          <JsonImport onSuccess={handleSuccess} />
        )}

        {activeTab === "pdf" && (
          <PdfImport onSuccess={handleSuccess} />
        )}
      </div>

      {/* Manual editor modal */}
      {showManualModal && (
        <QuestionEditorModal
          lessonId={lessonId ?? ""}
          onClose={() => setShowManualModal(false)}
          onSuccess={() => {
            setShowManualModal(false);
            handleSuccess();
          }}
        />
      )}
    </div>
  );
}
