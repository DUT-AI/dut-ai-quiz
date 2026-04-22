"use client";

import { useState } from "react";
import QuestionForm from "./question-form";
import { JsonImport } from "./json-import";
import { PdfImport } from "./pdf-import";
import { X } from "lucide-react";
import { useCreateQuestion } from "@/lib/queries";

interface ImportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ImportModal({ open, onOpenChange }: ImportModalProps) {
  const [activeTab, setActiveTab] = useState<"form" | "json" | "pdf">("form");
  const createMut = useCreateQuestion();

  const handleSingleSave = async (data: any) => {
    await createMut.mutateAsync(data);
    onOpenChange(false);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-dark-blue rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="p-6 border-b flex items-center justify-between bg-gradient-to-r from-slate-50 to-white dark:from-slate-900 dark:to-dark-blue">
          <div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Import Questions
            </h2>
            <p className="text-sm text-slate-500">Add questions to your pool using various methods</p>
          </div>
          <button 
            onClick={() => onOpenChange(false)}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-1 bg-slate-100/50 dark:bg-white/5 mx-6 mt-4 rounded-xl flex gap-1">
          {(["form", "json", "pdf"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
                activeTab === tab 
                ? "bg-white dark:bg-slate shadow-sm text-primary" 
                : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {tab === "form" ? "Manual Form" : tab === "json" ? "JSON File" : "PDF Document"}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === "form" && (
            <div className="space-y-4">
               <div className="p-6 border-2 border-dashed border-slate-200 rounded-2xl">
                 <h3 className="text-lg font-bold mb-6 text-slate-800 dark:text-white">Add Single Question</h3>
                 <QuestionForm onSave={handleSingleSave} onCancel={() => onOpenChange(false)} saving={createMut.isPending} />
               </div>
            </div>
          )}

          {activeTab === "json" && (
             <JsonImport onSuccess={() => onOpenChange(false)} />
          )}

          {activeTab === "pdf" && (
             <PdfImport onSuccess={() => onOpenChange(false)} />
          )}
        </div>
      </div>
    </div>
  );
}
