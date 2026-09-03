"use client";

import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, Bold, Italic, Heading1, Heading2, Heading3,
  List, Link, Code, Table, Eye, FileText, Check
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Markdown } from "@/components/markdown";
import { cn } from "@/lib/utils";

interface DescriptionEditorModalProps {
  open: boolean;
  initialValue: string;
  onClose: () => void;
  onSave: (value: string) => void;
}

export function DescriptionEditorModal({ open, initialValue, onClose, onSave }: DescriptionEditorModalProps) {
  const [mounted, setMounted] = useState(false);
  const [value, setValue] = useState("");
  const [activeTabMobile, setActiveTabMobile] = useState<"edit" | "preview">("edit");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    if (open) {
      setValue(initialValue);
      setActiveTabMobile("edit");
    }
  }, [open, initialValue]);

  const handleToolbarInsert = (type: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selectedText = text.substring(start, end);

    let replacement = "";
    let selectionOffsetStart = 0;
    let selectionOffsetEnd = 0;

    switch (type) {
      case "bold":
        replacement = `**${selectedText || "văn bản đậm"}**`;
        if (!selectedText) {
          selectionOffsetStart = 2;
          selectionOffsetEnd = 13;
        }
        break;
      case "italic":
        replacement = `*${selectedText || "văn bản nghiêng"}*`;
        if (!selectedText) {
          selectionOffsetStart = 1;
          selectionOffsetEnd = 17;
        }
        break;
      case "h1":
        replacement = `\n# ${selectedText || "Tiêu đề 1"}\n`;
        if (!selectedText) {
          selectionOffsetStart = 3;
          selectionOffsetEnd = 12;
        }
        break;
      case "h2":
        replacement = `\n## ${selectedText || "Tiêu đề 2"}\n`;
        if (!selectedText) {
          selectionOffsetStart = 4;
          selectionOffsetEnd = 13;
        }
        break;
      case "h3":
        replacement = `\n### ${selectedText || "Tiêu đề 3"}\n`;
        if (!selectedText) {
          selectionOffsetStart = 5;
          selectionOffsetEnd = 14;
        }
        break;
      case "list":
        replacement = `\n- ${selectedText || "Mục danh sách"}\n`;
        if (!selectedText) {
          selectionOffsetStart = 3;
          selectionOffsetEnd = 16;
        }
        break;
      case "code":
        replacement = `\`\`\`javascript\n${selectedText || "// Viết code tại đây"}\n\`\`\``;
        if (!selectedText) {
          selectionOffsetStart = 14;
          selectionOffsetEnd = 35;
        }
        break;
      case "link":
        replacement = `[${selectedText || "Tên liên kết"}](https://example.com)`;
        if (!selectedText) {
          selectionOffsetStart = 1;
          selectionOffsetEnd = 13;
        }
        break;
      case "table":
        replacement = `\n| Cột 1 | Cột 2 |\n| ----- | ----- |\n| Ô 1   | Ô 2   |\n`;
        break;
      default:
        return;
    }

    const newValue = text.substring(0, start) + replacement + text.substring(end);
    setValue(newValue);

    setTimeout(() => {
      textarea.focus();
      if (selectionOffsetStart !== 0 || selectionOffsetEnd !== 0) {
        textarea.setSelectionRange(start + selectionOffsetStart, start + selectionOffsetEnd);
      } else {
        textarea.setSelectionRange(start + replacement.length, start + replacement.length);
      }
    }, 0);
  };

  const handleSave = () => {
    onSave(value);
    onClose();
  };

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
          {/* Backdrop Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Modal Content */}
          <motion.div
            initial={{ scale: 0.97, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.97, opacity: 0 }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="relative z-10 flex h-[92vh] w-full max-w-[95vw] flex-col rounded-2xl border border-gray-150 bg-white shadow-2xl dark:border-white/20 dark:bg-navy-blue"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-100 p-4 dark:border-white/5 md:px-6">
              <div className="flex items-center gap-2">
                <FileText className="size-5 text-primary" />
                <div>
                  <h3 className="text-lg font-black text-dark-blue dark:text-white">
                    Soạn thảo đề bài chi tiết
                  </h3>
                  <p className="text-xs text-gray-navy dark:text-light-blue/70 hidden sm:block">
                    Hỗ trợ định dạng Markdown tiêu chuẩn cùng trình xem trước trực tiếp.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl p-2 text-gray-400 hover:bg-gray-100 hover:text-dark-blue dark:hover:bg-white/5 dark:hover:text-white transition-colors"
              >
                <X className="size-5" />
              </button>
            </div>

            {/* Toolbar & Mobile View Switcher */}
            <div className="flex flex-col border-b border-gray-100 bg-gray-50/50 p-2 dark:border-white/5 dark:bg-zinc-950/20 sm:flex-row sm:items-center sm:justify-between sm:px-4">
              {/* Markdown insertion tools */}
              <div className="flex flex-wrap items-center gap-1">
                <button
                  type="button"
                  onClick={() => handleToolbarInsert("bold")}
                  title="In đậm (Bold)"
                  className="rounded p-2 text-gray-500 hover:bg-gray-200 hover:text-dark-blue dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-white transition-colors"
                >
                  <Bold className="size-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleToolbarInsert("italic")}
                  title="In nghiêng (Italic)"
                  className="rounded p-2 text-gray-500 hover:bg-gray-200 hover:text-dark-blue dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-white transition-colors"
                >
                  <Italic className="size-4" />
                </button>
                <div className="h-4 w-px bg-gray-200 dark:bg-white/10 mx-1" />
                <button
                  type="button"
                  onClick={() => handleToolbarInsert("h1")}
                  title="Tiêu đề 1"
                  className="rounded p-2 text-gray-500 hover:bg-gray-200 hover:text-dark-blue dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-white transition-colors text-xs font-bold"
                >
                  H1
                </button>
                <button
                  type="button"
                  onClick={() => handleToolbarInsert("h2")}
                  title="Tiêu đề 2"
                  className="rounded p-2 text-gray-500 hover:bg-gray-200 hover:text-dark-blue dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-white transition-colors text-xs font-bold"
                >
                  H2
                </button>
                <button
                  type="button"
                  onClick={() => handleToolbarInsert("h3")}
                  title="Tiêu đề 3"
                  className="rounded p-2 text-gray-500 hover:bg-gray-200 hover:text-dark-blue dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-white transition-colors text-xs font-bold"
                >
                  H3
                </button>
                <div className="h-4 w-px bg-gray-200 dark:bg-white/10 mx-1" />
                <button
                  type="button"
                  onClick={() => handleToolbarInsert("list")}
                  title="Danh sách (Bullet list)"
                  className="rounded p-2 text-gray-500 hover:bg-gray-200 hover:text-dark-blue dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-white transition-colors"
                >
                  <List className="size-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleToolbarInsert("code")}
                  title="Khối Code (Code block)"
                  className="rounded p-2 text-gray-500 hover:bg-gray-200 hover:text-dark-blue dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-white transition-colors"
                >
                  <Code className="size-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleToolbarInsert("link")}
                  title="Đường liên kết (Hyperlink)"
                  className="rounded p-2 text-gray-500 hover:bg-gray-200 hover:text-dark-blue dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-white transition-colors"
                >
                  <Link className="size-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleToolbarInsert("table")}
                  title="Bảng biểu (Table)"
                  className="rounded p-2 text-gray-500 hover:bg-gray-200 hover:text-dark-blue dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-white transition-colors"
                >
                  <Table className="size-4" />
                </button>
              </div>

              {/* Responsive layout tab switches for mobile screens */}
              <div className="mt-2 flex border-t border-gray-200 dark:border-white/5 pt-2 sm:mt-0 sm:border-0 sm:pt-0 md:hidden">
                <button
                  type="button"
                  onClick={() => setActiveTabMobile("edit")}
                  className={cn(
                    "flex-1 py-1.5 text-center text-xs font-bold rounded-lg transition-all",
                    activeTabMobile === "edit"
                      ? "bg-primary text-white"
                      : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5"
                  )}
                >
                  Soạn thảo
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTabMobile("preview")}
                  className={cn(
                    "flex-1 py-1.5 text-center text-xs font-bold rounded-lg transition-all",
                    activeTabMobile === "preview"
                      ? "bg-primary text-white"
                      : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5"
                  )}
                >
                  Xem trước
                </button>
              </div>
            </div>

            {/* Split Screen Workspace */}
            <div className="flex flex-1 min-h-0 overflow-hidden p-4 md:p-6 gap-6">
              {/* Left Column - Editor Pane */}
              <div
                className={cn(
                  "flex-1 flex flex-col min-w-0 h-full",
                  activeTabMobile === "edit" ? "flex" : "hidden md:flex"
                )}
              >
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-navy dark:text-light-blue/70 uppercase tracking-wider">
                    Nhập nội dung (Markdown)
                  </span>
                  <span className="text-[10px] text-gray-navy/60 dark:text-light-blue/40">
                    {value.length} ký tự
                  </span>
                </div>
                <textarea
                  ref={textareaRef}
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  placeholder="Nhập đề bài chi tiết hỗ trợ Markdown..."
                  className="w-full flex-1 rounded-xl border border-gray-250 bg-gray-50/50 p-4 text-base font-sans leading-relaxed tracking-wide text-dark-blue outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-white/10 dark:bg-zinc-950/40 dark:text-white dark:focus:border-primary resize-none custom-scrollbar"
                  autoFocus
                />
              </div>

              {/* Desktop Separator Line */}
              <div className="hidden md:block w-px bg-gray-100 dark:bg-white/5" />

              {/* Right Column - Preview Pane */}
              <div
                className={cn(
                  "flex-1 flex flex-col min-w-0 h-full",
                  activeTabMobile === "preview" ? "flex" : "hidden md:flex"
                )}
              >
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-navy dark:text-light-blue/70 uppercase tracking-wider flex items-center gap-1">
                    <Eye className="size-3.5 text-primary" /> Xem trước trực quan (Live)
                  </span>
                </div>
                <div className="w-full flex-1 rounded-xl border border-gray-250 bg-gray-50/50 dark:border-white/10 dark:bg-zinc-950/20 p-4 overflow-y-auto custom-scrollbar">
                  <div className="prose dark:prose-invert max-w-none break-words text-base font-sans leading-relaxed tracking-wide text-dark-blue dark:text-white">
                    {value ? (
                      <Markdown content={value} />
                    ) : (
                      <p className="text-gray-navy/40 dark:text-zinc-500 italic text-xs py-2 text-center">
                        Nội dung xem trước sẽ được hiển thị tại đây khi bạn nhập văn bản...
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="flex justify-end gap-3 border-t border-gray-100 p-4 dark:border-white/5 md:px-6">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="h-10 rounded-xl px-5 border-gray-250 text-gray-700 hover:bg-gray-100 dark:border-white/10 dark:text-light-blue dark:hover:bg-white/5"
              >
                Hủy bỏ
              </Button>
              <Button
                type="button"
                onClick={handleSave}
                className="h-10 rounded-xl px-5 flex items-center gap-2"
              >
                <Check className="size-4" /> Áp dụng đề bài
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
