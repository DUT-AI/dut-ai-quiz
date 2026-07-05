"use client";

import React, { useState } from "react";
import { useHackathons } from "@/lib/queries";
import { type Hackathon } from "../types";
import { HackathonRow } from "./hackathon-row";
import { HackathonFormModal } from "./hackathon-form-modal";
import { AnimatePresence } from "framer-motion";
import { Award, Plus } from "lucide-react";

export function HackathonList() {
  const { data: hackathons, isLoading, error } = useHackathons();
  const [showCreate, setShowCreate] = useState(false);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="text-left">
          <h1 className="text-3xl font-black text-dark-blue dark:text-white mb-2">
            Quản lý Hackathons
          </h1>
          <p className="text-sm text-gray-navy dark:text-light-blue opacity-70 font-medium">
            Tạo mới, chỉnh sửa thông tin và quản trị các giải đấu công nghệ.
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-5 py-3 bg-primary text-white rounded-2xl text-sm font-bold hover:bg-primary/90 transition shadow-lg shadow-primary/20 self-start sm:self-center cursor-pointer shrink-0"
        >
          <Plus className="size-4" />
          <span>Thêm Hackathon</span>
        </button>
      </div>

      {/* Form Modals */}
      <AnimatePresence>
        {showCreate && (
          <HackathonFormModal onClose={() => setShowCreate(false)} />
        )}
      </AnimatePresence>

      {/* Loading & Error States */}
      {isLoading && (
        <div className="flex items-center gap-3 text-sm text-gray-navy dark:text-light-blue py-10">
          <div className="size-5 border-2 border-primary border-t-transparent animate-spin rounded-full" />
          <span className="font-bold">Đang tải danh sách hackathon...</span>
        </div>
      )}
      {error && (
        <div className="p-4 rounded-2xl bg-red/10 text-red border border-red/10 text-sm font-bold text-left">
          {error instanceof Error ? error.message : "Đã xảy ra lỗi khi lấy danh sách."}
        </div>
      )}

      {/* Hackathons List */}
      <div className="space-y-4">
        {hackathons?.length === 0 && !showCreate && (
          <div className="rounded-[2rem] border border-dashed border-gray-200 dark:border-white/10 p-12 text-center bg-white/20 dark:bg-white/[0.01]">
            <Award className="size-12 text-gray-navy opacity-30 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-dark-blue dark:text-white mb-2">
              Chưa có Hackathon nào
            </h3>
            <p className="text-sm text-gray-navy dark:text-light-blue opacity-60 max-w-sm mx-auto mb-6">
              Bắt đầu tạo các sự kiện hackathon để thúc đẩy kỹ năng lập trình và thi đấu nhóm.
            </p>
            <button
              onClick={() => setShowCreate(true)}
              className="px-4 py-2 text-xs font-bold text-primary border border-primary/20 hover:border-primary hover:bg-primary/5 rounded-xl transition cursor-pointer"
            >
              Tạo giải đấu đầu tiên
            </button>
          </div>
        )}

        {hackathons?.map((h) => (
          <HackathonRow
            key={h.id}
            hackathon={h}
          />
        ))}
      </div>
    </div>
  );
}
