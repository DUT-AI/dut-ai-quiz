"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useImportPDF, useLessons } from "@/lib/queries";
import { Card } from "@/components/ui/card";
import { Upload, AlertCircle, Loader2, X, FileText } from "lucide-react";
import { motion } from "framer-motion";

interface PdfImportProps {
  lessonId?: string;
  onSuccess: () => void;
  onClose?: () => void;
}

export function PdfImport({ lessonId: propLessonId, onSuccess, onClose }: PdfImportProps) {
  const [file, setFile] = useState<File | null>(null);
  const [lessonId, setLessonId] = useState(propLessonId || "");

  const { data: lessons = [] } = useLessons();
  const importMutation = useImportPDF();

  const handleImport = async () => {
    if (!file) {
      alert("Vui lòng chọn file PDF");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    if (lessonId) {
      formData.append("target_scope", lessonId);
    }

    try {
      await importMutation.mutateAsync(formData);
      alert("Đã gửi file PDF cho AI xử lý ngầm (Background Job). Vui lòng kiểm tra lại danh sách câu hỏi sau ít phút.");
      onSuccess();
      if (onClose) onClose();
    } catch (err: any) {
      alert(err.message || "Lỗi khi gửi PDF");
    }
  };

  const content = (
    <div className="space-y-8">
      {/* Rule Section */}
      <div className="bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800 rounded-3xl p-6">
        <h4 className="text-sm font-bold text-blue-700 dark:text-blue-400 mb-4 flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          Quy trình xử lý AI (Background Job)
        </h4>
        <div className="text-[13px] text-slate-600 dark:text-slate-400 space-y-2 leading-relaxed">
          <p>Hệ thống sử dụng luồng xử lý AI đa phương thức để tự động bóc tách câu hỏi, đáp án và hình ảnh.</p>
          <p className="font-semibold text-amber-600">Lưu ý: Quá trình này có thể mất từ 1 đến 5 phút tùy thuộc vào độ dài của file PDF và số lượng hình ảnh bên trong.</p>
          <p>Câu hỏi sau khi trích xuất sẽ được lưu thẳng vào cơ sở dữ liệu ở trạng thái <span className="font-bold text-indigo-500">DRAFT (Nháp)</span>. Bạn có thể kiểm duyệt và chỉnh sửa lại bằng AI trước khi công khai.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Upload className="w-5 h-5 text-blue-500" />
            1. Tải file PDF
          </h3>
          <div
            className={`border-2 border-dashed rounded-3xl p-12 text-center transition-all cursor-pointer h-64 flex flex-col items-center justify-center ${file ? "border-blue-500 bg-blue-50/10" : "border-slate-300 hover:border-blue-400 hover:bg-slate-50"
              }`}
            onClick={() => document.getElementById("pdf-upload")?.click()}
          >
            <input
              id="pdf-upload"
              type="file"
              accept=".pdf"
              className="hidden"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${file ? "bg-blue-100 text-blue-600" : "bg-slate-100 text-slate-400"}`}>
              <Upload className="w-8 h-8" />
            </div>
            {file ? (
              <div>
                <p className="font-bold text-slate-800 dark:text-white">{file.name}</p>
                <p className="text-xs text-slate-500">{(file.size / 1024).toFixed(1)} KB</p>
              </div>
            ) : (
              <>
                <p className="text-slate-600 dark:text-slate-400 font-medium">Nhấn để chọn hoặc kéo thả file vào đây</p>
                <p className="text-slate-400 text-xs mt-1">Chỉ chấp nhận định dạng .pdf</p>
              </>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-purple-500" />
            2. Cấu hình bài học (Tùy chọn)
          </h3>

          <div className="space-y-4 bg-slate-50/50 dark:bg-white/5 p-6 rounded-3xl border border-slate/10 shadow-inner h-64">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Gắn vào bài học (Target Scope)</label>
              <select
                value={lessonId}
                onChange={(e) => setLessonId(e.target.value)}
                className="w-full rounded border border-slate/30 dark:border-white/20 bg-white dark:bg-slate/30 px-3 py-3 text-sm outline-none focus:border-primary text-slate-700 dark:text-white"
              >
                <option value="">— Mặc định —</option>
                {lessons.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.order > 0 ? `${l.order}. ` : ""}{l.name}
                  </option>
                ))}
              </select>
              <p className="mt-3 text-xs text-slate-500 leading-relaxed">
                Lựa chọn bài học mà bạn muốn lưu trữ các câu hỏi này. Bạn cũng có thể để trống và thiết lập sau khi AI trích xuất xong.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-center">
        <Button
          onClick={handleImport}
          disabled={!file || importMutation.isPending}
          className="w-full md:w-80 h-14 text-lg rounded-2xl bg-gradient-to-r from-primary to-indigo-600 hover:opacity-90 shadow-xl shadow-primary/20 transition-all active:scale-[0.98]"
        >
          {importMutation.isPending ? (
            <>
              <Loader2 className="w-5 h-5 mr-3 animate-spin" />
              Đang đẩy vào hàng đợi...
            </>
          ) : (
            <>
              <Upload className="w-5 h-5 mr-3" />
              Bắt đầu AI Import
            </>
          )}
        </Button>
      </div>
    </div>
  );

  if (!onClose) {
    return <div className="space-y-8">{content}</div>;
  }

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/70 backdrop-blur-md"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 30 }}
        className="bg-white dark:bg-navy-blue w-full max-w-4xl rounded-[40px] shadow-2xl relative z-10 overflow-hidden border border-white/10"
      >
        <div className="p-8 border-b border-gray-100 dark:border-white/10 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            <div className="size-12 rounded-2xl bg-gradient-to-br from-rose-500 to-orange-500 flex items-center justify-center text-white shadow-lg">
              <FileText className="size-6" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-dark-blue dark:text-white uppercase tracking-tight">AI Import PDF</h2>
              <p className="text-sm text-gray-navy opacity-60">Xử lý tự động trong nền (Background Job)</p>
            </div>
          </div>
          <button onClick={onClose} className="p-3 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 transition-colors">
            <X className="size-6 text-gray-navy" />
          </button>
        </div>
        <div className="overflow-y-auto max-h-[75vh] p-8 custom-scrollbar">
          {content}
        </div>
      </motion.div>
    </div>
  );
}
