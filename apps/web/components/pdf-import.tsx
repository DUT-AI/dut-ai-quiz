"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useImportPDF, useUploadPDF, useLessons } from "@/lib/queries";
import { Card } from "@/components/ui/card";
import { Upload, AlertCircle, Loader2, X, FileText, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";
import { PdfImportProcessing } from "./pdf-import/pdf-import-processing";
import { PdfImportReview } from "./pdf-import/pdf-import-review";
import { PdfImportPassword } from "./pdf-import/pdf-import-password";

interface PdfImportProps {
  lessonId?: string;
  onSuccess: () => void;
  onClose?: () => void;
}

export function PdfImport({ lessonId: propLessonId, onSuccess, onClose }: PdfImportProps) {
  const [step, setStep] = useState<"upload" | "password" | "processing" | "review">("upload");
  const [jobId, setJobId] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [file, setFile] = useState<File | null>(null);
  const [lessonId, setLessonId] = useState(propLessonId || "");
  const [method, setMethod] = useState<"ocr" | "gemini">("gemini");

  const { data: lessons = [] } = useLessons();
  const importMutation = useImportPDF();
  const uploadMutation = useUploadPDF();

  const isPending = importMutation.isPending || uploadMutation.isPending;

  const handleImport = async () => {
    if (!file) {
      alert("Vui lòng chọn file PDF");
      return;
    }

    setErrorMsg(null);
    const formData = new FormData();
    formData.append("file", file);
    if (lessonId) {
      formData.append("lesson_id", lessonId);
      formData.append("target_scope", "LESSON");
    }

    try {
      if (method === "ocr") {
        const res = await importMutation.mutateAsync(formData);
        if (res && res.job_id) {
          setJobId(res.job_id);
          setStep("processing");
        } else {
          throw new Error("Không nhận được Job ID từ server");
        }
      } else {
        const res = await uploadMutation.mutateAsync(formData);
        if (res && res.ok && res.job_id) {
          setJobId(res.job_id);
          setStep("processing");
        } else if (res && !res.ok && res.is_encrypted) {
          setErrorMsg(null);
          setStep("password");
        } else {
          throw new Error(res?.error || "Không nhận được Job ID từ server");
        }
      }
    } catch (err: any) {
      const errMsgStr = err.detail || err.message || "";
      if (errMsgStr.includes("PDF_LOCKED")) {
        setErrorMsg(null);
        setStep("password");
      } else {
        setErrorMsg(errMsgStr || "Lỗi khi tải lên file PDF");
      }
    }
  };

  const handlePasswordSubmit = async (password: string) => {
    if (!file) return;

    setErrorMsg(null);
    const formData = new FormData();
    formData.append("file", file);
    if (lessonId) {
      formData.append("lesson_id", lessonId);
      formData.append("target_scope", "LESSON");
    }
    formData.append("password", password);

    try {
      if (method === "ocr") {
        const res = await importMutation.mutateAsync(formData);
        if (res && res.job_id) {
          setJobId(res.job_id);
          setStep("processing");
        } else {
          throw new Error("Không nhận được Job ID từ server");
        }
      } else {
        const res = await uploadMutation.mutateAsync({ formData, hasPassword: true });
        if (res && res.ok && res.job_id) {
          setJobId(res.job_id);
          setStep("processing");
        } else {
          throw new Error(res?.error || "Mật khẩu PDF không đúng");
        }
      }
    } catch (err: any) {
      const errMsgStr = err.detail || err.message || "";
      setErrorMsg(errMsgStr || "Lỗi giải mã PDF");
    }
  };

  const uploadFormContent = (
    <div className="space-y-8 text-left">
      {/* Error Alert */}
      {errorMsg && (
        <div className="bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900 rounded-3xl p-4 flex gap-3 text-rose-700 dark:text-rose-400">
          <AlertTriangle className="size-5 shrink-0 mt-0.5" />
          <div className="text-xs">
            <p className="font-bold">Lỗi xử lý:</p>
            <p className="mt-0.5">{errorMsg}</p>
          </div>
        </div>
      )}

      {/* Rule Section */}
      <div className="bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800 rounded-3xl p-6">
        <h4 className="text-sm font-bold text-blue-700 dark:text-blue-400 mb-4 flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          Quy trình xử lý AI
        </h4>
        <div className="text-[13px] text-slate-600 dark:text-slate-400 space-y-2 leading-relaxed">
          <p>Hệ thống sử dụng luồng xử lý AI đa phương thức để tự động bóc tách câu hỏi, đáp án và hình ảnh.</p>
          <p className="font-semibold text-amber-600">Lưu ý: Quá trình này có thể mất từ 1 đến 5 phút tùy thuộc vào độ dài của file PDF và số lượng hình ảnh bên trong.</p>
          <p>Câu hỏi sau khi trích xuất sẽ được lưu vào cơ sở dữ liệu ở trạng thái <span className="font-bold text-indigo-500">DRAFT</span>. Bạn có thể soát lỗi và chỉnh sửa trực tiếp trước khi duyệt công khai.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Upload className="w-5 h-5 text-blue-500" />
            1. Tải file PDF
          </h3>
          <div
            className={`border-2 border-dashed rounded-3xl p-12 text-center transition-all cursor-pointer h-full min-h-[16rem] flex flex-col items-center justify-center ${file ? "border-blue-500 bg-blue-50/10" : "border-slate-300 hover:border-blue-400 hover:bg-slate-50"
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

          <div className="space-y-4 bg-slate-50/50 dark:bg-white/5 p-6 rounded-3xl border border-slate/10 shadow-inner h-full flex flex-col">
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
            <div className="mt-6 border-t border-slate/10 dark:border-white/10 pt-5">
              <label className="block text-xs font-bold text-slate-500 uppercase mb-3">Cơ chế bóc tách</label>
              <div className="grid grid-cols-1 gap-3">
                <div
                  onClick={() => setMethod("gemini")}
                  className={`cursor-pointer rounded-xl border p-3 flex flex-col gap-1 transition-all ${method === 'gemini' ? 'border-primary bg-primary/5 shadow-sm ring-1 ring-primary' : 'border-slate-200 dark:border-white/10 hover:border-primary/40 hover:bg-slate-50 dark:hover:bg-white/5'}`}
                >
                  <div className="flex items-center gap-2">
                    <div className={`shrink-0 size-4 rounded-full border flex items-center justify-center transition-colors ${method === 'gemini' ? 'border-primary' : 'border-slate-300 dark:border-slate-600'}`}>
                      {method === 'gemini' && <div className="size-2 rounded-full bg-primary" />}
                    </div>
                    <span className="text-sm font-bold text-slate-700 dark:text-white">1. Vision LLM OCR</span>
                  </div>
                  <span className="text-[13px] text-slate-500 ml-6">(Chuyển PDF -&gt; Ảnh -&gt; LLM)</span>
                </div>

                <div
                  onClick={() => setMethod("ocr")}
                  className={`cursor-pointer rounded-xl border p-3 flex flex-col gap-1 transition-all ${method === 'ocr' ? 'border-primary bg-primary/5 shadow-sm ring-1 ring-primary' : 'border-slate-200 dark:border-white/10 hover:border-primary/40 hover:bg-slate-50 dark:hover:bg-white/5'}`}
                >
                  <div className="flex items-center gap-2">
                    <div className={`shrink-0 size-4 rounded-full border flex items-center justify-center transition-colors ${method === 'ocr' ? 'border-primary' : 'border-slate-300 dark:border-slate-600'}`}>
                      {method === 'ocr' && <div className="size-2 rounded-full bg-primary" />}
                    </div>
                    <span className="text-sm font-bold text-slate-700 dark:text-white flex items-center flex-wrap gap-1">
                      2. Parser Chuyên sâu:
                      <code className="text-[12px] font-mono text-rose-600 bg-rose-50 dark:text-rose-400 dark:bg-rose-500/10 px-1.5 py-0.5 rounded">opendataloader-pdf</code>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-center">
        <Button
          onClick={handleImport}
          disabled={!file || isPending}
          className="w-full md:w-80 h-14 text-lg rounded-2xl bg-gradient-to-r from-primary to-indigo-600 hover:opacity-90 shadow-xl shadow-primary/20 transition-all active:scale-[0.98]"
        >
          {isPending ? (
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

  let modalContent = uploadFormContent;
  if (step === "password") {
    modalContent = (
      <PdfImportPassword
        fileName={file?.name || ""}
        onSubmit={handlePasswordSubmit}
        onCancel={() => {
          setErrorMsg(null);
          setStep("upload");
        }}
        isPending={isPending}
        errorMsg={errorMsg}
      />
    );
  } else if (step === "processing") {
    modalContent = (
      <PdfImportProcessing
        jobId={jobId}
        onCompleted={() => setStep("review")}
        onFailed={(err) => {
          setErrorMsg(err);
          setStep("upload");
        }}
      />
    );
  } else if (step === "review") {
    modalContent = (
      <PdfImportReview
        jobId={jobId}
        onSuccess={onSuccess}
        onClose={onClose}
      />
    );
  }

  if (!onClose) {
    return <div className="space-y-8">{modalContent}</div>;
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
              <p className="text-sm text-gray-navy opacity-60">Xử lý tự động trong nền</p>
            </div>
          </div>
          <button onClick={onClose} className="p-3 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 transition-colors">
            <X className="size-6 text-gray-navy" />
          </button>
        </div>
        <div className="overflow-y-auto max-h-[75vh] p-8 custom-scrollbar">
          {modalContent}
        </div>
      </motion.div>
    </div>
  );
}
