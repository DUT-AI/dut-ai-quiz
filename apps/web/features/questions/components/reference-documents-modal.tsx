"use client";

import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { BookOpen, ChevronLeft, X } from "lucide-react";
import { z } from "zod";

import { Markdown } from "@/components/markdown";
import { apiGet } from "@/lib/api";
import {
  RelativeDocumentSchema,
  type RelativeDocument,
} from "@/lib/types";

interface ReferenceDocumentsModalProps {
  questionId: string;
  onClose: () => void;
}

export function ReferenceDocumentsModal({
  questionId,
  onClose,
}: ReferenceDocumentsModalProps) {
  const [documents, setDocuments] = useState<RelativeDocument[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [retry, setRetry] = useState(0);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(false);
    apiGet<RelativeDocument[]>(
      "/api/v1/questions/" + questionId + "/relative-documents?limit=3",
      z.array(RelativeDocumentSchema)
    )
      .then((items) => {
        if (!cancelled) setDocuments(items);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [questionId, retry]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  useEffect(() => {
    if (selectedIndex === null) return;
    const frame = requestAnimationFrame(() => {
      contentRef.current
        ?.querySelector("[data-reference-highlight]")
        ?.scrollIntoView({ block: "center" });
    });
    return () => cancelAnimationFrame(frame);
  }, [selectedIndex, documents]);

  const selectedDocument =
    selectedIndex === null ? null : documents[selectedIndex];

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Tài liệu tham khảo"
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-8"
    >
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative z-10 flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl border border-white/10 bg-white shadow-2xl dark:bg-navy-blue">
        <div className="flex shrink-0 items-center gap-3 border-b border-gray-100 p-5 dark:border-white/10">
          {selectedDocument && (
            <button
              type="button"
              onClick={() => setSelectedIndex(null)}
              aria-label="Quay lại danh sách tài liệu"
              className="rounded-xl p-2 hover:bg-gray-100 dark:hover:bg-white/10"
            >
              <ChevronLeft className="size-5" />
            </button>
          )}
          <BookOpen className="size-5 shrink-0 text-primary" />
          <h2 className="min-w-0 flex-1 truncate text-lg font-bold text-dark-blue dark:text-white">
            {selectedDocument?.document_title || "Tài liệu tham khảo"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng tài liệu tham khảo"
            className="rounded-xl p-2 hover:bg-gray-100 dark:hover:bg-white/10"
          >
            <X className="size-5" />
          </button>
        </div>

        <div ref={contentRef} className="min-h-0 flex-1 overflow-y-auto p-5 sm:p-8">
          {loading ? (
            <p className="text-sm text-gray-navy dark:text-light-blue">
              Đang tải tài liệu...
            </p>
          ) : error ? (
            <div className="space-y-3">
              <p className="text-sm text-red-600">Không tải được tài liệu tham khảo.</p>
              <button
                type="button"
                onClick={() => setRetry((value) => value + 1)}
                className="rounded-xl bg-primary px-4 py-2 text-sm font-bold text-white"
              >
                Thử lại
              </button>
            </div>
          ) : selectedDocument ? (
            <div className="mx-auto max-w-4xl text-dark-blue dark:text-white">
              <p className="mb-5 text-sm text-gray-navy dark:text-light-blue">
                Các đoạn nền vàng liên quan đến câu hỏi vừa trả lời.
              </p>
              <Markdown
                content={selectedDocument.full_md}
                highlightChunks={selectedDocument.relative_chunk}
              />
            </div>
          ) : documents.length ? (
            <div className="space-y-3">
              {documents.map((item, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => setSelectedIndex(index)}
                  className="flex w-full items-center justify-between rounded-2xl border border-gray-100 bg-gray-50 p-5 text-left text-dark-blue transition-colors hover:border-primary/40 hover:bg-primary/5 dark:border-white/10 dark:bg-white/5 dark:text-white"
                >
                  <span className="font-bold">{item.document_title}</span>
                  <span className="ml-3 shrink-0 text-xs text-gray-navy dark:text-light-blue">
                    {item.relative_chunk.length} đoạn liên quan
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-navy dark:text-light-blue">
              Chưa tìm thấy tài liệu liên quan đến câu hỏi này.
            </p>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
