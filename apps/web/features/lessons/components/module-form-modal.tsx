"use client";

import React from "react";
import { motion } from "framer-motion";
import { Plus, X, Folder } from "lucide-react";
import { useCreateModule, useUpdateModule } from "@/lib/queries";
import { type Module } from "../types";
import { ModuleForm, type ModuleFormInput } from "./module-form";

interface ModuleFormModalProps {
  onClose: () => void;
  initialData?: Module;
}

export function ModuleFormModal({ onClose, initialData }: ModuleFormModalProps) {
  const createMut = useCreateModule();
  const updateMut = useUpdateModule(initialData?.id || "");

  const isEdit = !!initialData;

  const onSubmit = async (data: ModuleFormInput) => {
    const payload = {
      name: data.name,
      description: data.description || "",
      order: data.order,
    };

    if (isEdit) {
      await updateMut.mutateAsync(payload);
    } else {
      await createMut.mutateAsync(payload);
    }
    onClose();
  };

  const isPending = createMut.isPending || updateMut.isPending;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-white dark:bg-navy-blue w-full max-w-lg max-h-[calc(100vh-2rem)] md:max-h-[85vh] rounded-[24px] md:rounded-[40px] shadow-2xl relative z-10 flex flex-col overflow-hidden border border-gray-100 dark:border-white/10 m-4"
      >
        {/* Header - Fixed */}
        <div className="p-6 pb-4 md:p-10 md:pb-6 flex items-center justify-between border-b border-gray-100 dark:border-white/5 shrink-0">
          <div className="flex items-center gap-3">
            <div className="size-8 md:size-10 rounded-xl md:rounded-2xl bg-indigo-500 flex items-center justify-center text-white shrink-0">
              <Folder className="size-4 md:size-5" />
            </div>
            <div>
              <h2 className="text-lg md:text-2xl font-black text-dark-blue dark:text-white">
                {isEdit ? "Sửa Chương" : "Tạo Chương Mới"}
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 md:p-3 hover:bg-gray-50 dark:hover:bg-white/5 rounded-xl md:rounded-2xl transition-colors text-gray-navy/50 dark:text-white/50 hover:text-gray-navy dark:hover:text-white shrink-0"
          >
            <X className="size-5 md:size-6" />
          </button>
        </div>

        {/* Form Body - Scrollable */}
        <div className="p-6 md:p-10 overflow-y-auto min-h-0 flex-1 custom-scrollbar">
          <ModuleForm
            initialData={initialData}
            onSubmit={onSubmit}
            onCancel={onClose}
            isPending={isPending}
          />
        </div>
      </motion.div>
    </div>
  );
}
