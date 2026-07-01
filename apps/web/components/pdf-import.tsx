"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useParsePDF, useBulkCreateQuestions, useLessons } from "@/lib/queries";
import { ParsedQuestionPreview } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { Check, Trash2, Upload, AlertCircle, Save, Loader2, X, FileText } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface PdfImportProps {
  onSuccess: () => void;
  onClose?: () => void;
}

export function PdfImport({ onSuccess, onClose }: PdfImportProps) {
  const [file, setFile] = useState<File | null>(null);
  const [delimiter, setDelimiter] = useState("Câu \\\\d+[:.]");
  const [prefixes, setPrefixes] = useState("A,B,C,D");
  const [marker, setMarker] = useState("");
  const [questions, setQuestions] = useState<ParsedQuestionPreview[]>([]);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [lessonId, setLessonId] = useState("");
  const [poolType, setPoolType] = useState<"PRACTICE" | "EXAM">("PRACTICE");

  const { data: lessons = [] } = useLessons();
  const parseMutation = useParsePDF();
  const bulkCreateMutation = useBulkCreateQuestions();

  const handleParse = async () => {
    if (!file) {
      alert("Vui lòng chọn file PDF");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("question_delimiter", delimiter);
    formData.append("option_prefixes", prefixes);
    formData.append("correct_answer_marker", marker);

    try {
      const data = await parseMutation.mutateAsync(formData);
      setQuestions(data.questions);
      setIsPreviewing(true);
    } catch (err: any) {
      alert(err.message || "Lỗi khi xử lý PDF");
    }
  };

  const handleUpdateQuestion = (index: number, content: string) => {
    const newQs = [...questions];
    newQs[index].content = content;
    setQuestions(newQs);
  };

  const handleUpdateSolution = (index: number, solution: string) => {
    const newQs = [...questions];
    newQs[index].solution = solution;
    setQuestions(newQs);
  };

  const handleUpdateOption = (qIndex: number, oIndex: number, text: string) => {
    const newQs = [...questions];
    newQs[qIndex].options[oIndex].text = text;
    setQuestions(newQs);
  };

  const handleToggleCorrect = (qIndex: number, oIndex: number) => {
    const newQs = [...questions];
    newQs[qIndex].options = newQs[qIndex].options.map((opt, i) => ({
      ...opt,
      is_correct: i === oIndex,
    }));
    setQuestions(newQs);
  };

  const handleRemoveQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const handleConfirmImport = async () => {
    if (questions.length === 0) return;

    const invalid = questions.find(q => 
        !q.content.trim() || 
        q.options.length < 2 || 
        !q.options.some(o => o.is_correct)
    );
    if (invalid) {
        alert("Một số câu hỏi không hợp lệ (thiếu nội dung, đáp án hoặc chưa chọn đáp án đúng)");
        return;
    }

    try {
      await bulkCreateMutation.mutateAsync({
        questions: questions.map(q => ({
          question: q.content,
          options: q.options.map(o => ({ 
            text: o.text, 
            is_correct: o.is_correct,
            fixed: o.fixed
          })),
          solution: q.solution || undefined
        })),
        pool_type: poolType,
        lesson_id: lessonId || undefined
      });
      alert("Đã nhập thành công tất cả câu hỏi!");
      onSuccess();
    } catch (err: any) {
      alert(err.message || "Lỗi khi lưu câu hỏi");
    }
  };

  const content = isPreviewing ? (
      <div className="space-y-6">
        <div className="flex items-center justify-between sticky top-0 bg-white/95 dark:bg-dark-blue/95 backdrop-blur-md p-4 border-b border-slate/10 dark:border-white/10 z-50 -mx-6 -mt-6 mb-6">
          <div>
            <h3 className="text-lg font-bold text-dark-blue dark:text-white">Kiểm tra nội dung ({questions.length} câu)</h3>
            <p className="text-xs text-gray-navy dark:text-light-blue">
              Vui lòng rà soát lại nội dung trước khi lưu vào hệ thống
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => setIsPreviewing(false)} className="text-gray-navy">
              Quay lại
            </Button>
            <Button 
                onClick={handleConfirmImport} 
                disabled={bulkCreateMutation.isPending}
                className="bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 px-6"
            >
              {bulkCreateMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Đang lưu...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Lưu tất cả ({questions.length})
                </>
              )}
            </Button>
          </div>
        </div>

        <div className="space-y-6 pb-20">
          <AnimatePresence>
            {questions.map((q, qIdx) => (
              <motion.div
                key={qIdx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
              >
                <Card className="p-6 relative group border border-slate/10 dark:border-white/10 bg-white dark:bg-slate/20 shadow-sm rounded-2xl">
                  <button
                    className="absolute top-4 right-4 text-slate-300 hover:text-red-500 transition-colors p-2"
                    onClick={() => handleRemoveQuestion(qIdx)}
                    title="Xoá câu này"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold mb-1 text-gray-navy dark:text-light-blue uppercase">
                        Nội dung câu hỏi
                      </label>
                      <textarea
                        value={q.content}
                        onChange={(e) => handleUpdateQuestion(qIdx, e.target.value)}
                        className="w-full rounded border border-slate/30 dark:border-white/20 bg-white dark:bg-slate/30 px-3 py-2 text-sm font-mono resize-y min-h-[80px] focus:border-primary outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold mb-2 text-gray-navy dark:text-light-blue uppercase">
                        Đáp án (chọn radio để đánh dấu đáp án đúng)
                      </label>
                      <div className="space-y-2">
                        {q.options.map((opt, oIdx) => (
                          <div key={oIdx} className="flex items-center gap-2 relative group/opt">
                            <input
                              type="radio"
                              name={`correct-${qIdx}`}
                              checked={opt.is_correct}
                              onChange={() => handleToggleCorrect(qIdx, oIdx)}
                              className="accent-primary w-4 h-4"
                            />
                            <input
                              type="text"
                              value={opt.text}
                              onChange={(e) => handleUpdateOption(qIdx, oIdx, e.target.value)}
                              placeholder={`Đáp án ${String.fromCharCode(65 + oIdx)}`}
                              className="flex-1 rounded border border-slate/30 dark:border-white/20 bg-white dark:bg-slate/30 px-2 py-1.5 text-sm focus:border-primary outline-none"
                            />
                            {opt.fixed && (
                              <span className="bg-amber-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-sm flex items-center">
                                FIXED
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold mb-1 text-gray-navy dark:text-light-blue uppercase">
                        Giải giải thích (tuỳ chọn)
                      </label>
                      <textarea
                        value={q.solution || ""}
                        onChange={(e) => handleUpdateSolution(qIdx, e.target.value)}
                        rows={2}
                        className="w-full rounded border border-slate/30 dark:border-white/20 bg-white dark:bg-slate/30 px-3 py-2 text-sm focus:border-primary outline-none"
                        placeholder="Nhập giải thích cho câu hỏi này..."
                      />
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
  ) : (
    <div className="space-y-8">
      {/* Rule Section */}
      <div className="bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800 rounded-3xl p-6">
        <h4 className="text-sm font-bold text-blue-700 dark:text-blue-400 mb-4 flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          Quy tắc chuẩn hóa đề thi (PDF/Text)
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3 text-[11px] text-slate-600 dark:text-slate-400">
          <div className="flex gap-2">
            <span className="text-blue-500 font-bold">•</span>
            <p>Câu hỏi bắt đầu bằng: <code className="bg-blue-100 dark:bg-blue-900/30 px-1 rounded text-blue-700">Câu 1.</code> hoặc <code className="bg-blue-100 dark:bg-blue-900/30 px-1 rounded text-blue-700">Question 1:</code></p>
          </div>
          <div className="flex gap-2">
            <span className="text-blue-500 font-bold">•</span>
            <p>Đáp án bắt đầu bằng: <code className="bg-blue-100 dark:bg-blue-900/30 px-1 rounded text-blue-700">A.</code>, <code className="bg-blue-100 dark:bg-blue-900/30 px-1 rounded text-blue-700">B.</code>, <code className="bg-blue-100 dark:bg-blue-900/30 px-1 rounded text-blue-700">C.</code>, <code className="bg-blue-100 dark:bg-blue-900/30 px-1 rounded text-blue-700">D.</code></p>
          </div>
          <div className="flex gap-2">
            <span className="text-blue-500 font-bold">•</span>
            <p>Đáp án cố định (không trộn): Thêm dấu <code className="bg-amber-100 dark:bg-amber-900/30 px-1 rounded text-amber-700">#</code> trước prefix (ví dụ: <code className="font-bold">#D.</code>)</p>
          </div>
          <div className="flex gap-2">
            <span className="text-blue-500 font-bold">•</span>
            <p>Nhận diện đáp án đúng: <span className="text-red-500 font-bold underline">Tô đỏ</span> hoặc <span className="font-bold underline">Gạch chân</span> ký tự prefix trong file.</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Upload className="w-5 h-5 text-blue-500" />
            1. Tải file PDF
          </h3>
          <div 
            className={`border-2 border-dashed rounded-3xl p-12 text-center transition-all cursor-pointer h-64 flex flex-col items-center justify-center ${
                file ? "border-blue-500 bg-blue-50/10" : "border-slate-300 hover:border-blue-400 hover:bg-slate-50"
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
            2. Cấu hình Import
          </h3>
          
          <div className="space-y-4 bg-slate-50/50 dark:bg-white/5 p-6 rounded-3xl border border-slate/10 shadow-inner">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Loại câu hỏi</label>
                <select
                  value={poolType}
                  onChange={(e) => setPoolType(e.target.value as any)}
                  className="w-full rounded border border-slate/30 dark:border-white/20 bg-white dark:bg-slate/30 px-2 py-2 text-xs outline-none focus:border-primary"
                >
                  <option value="PRACTICE">Luyện tập</option>
                  <option value="EXAM">Kiểm tra</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Lưu vào bài học</label>
                <select
                  value={lessonId}
                  onChange={(e) => setLessonId(e.target.value)}
                  className="w-full rounded border border-slate/30 dark:border-white/20 bg-white dark:bg-slate/30 px-2 py-2 text-xs outline-none focus:border-primary"
                >
                  <option value="">— Mặc định —</option>
                  {lessons.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.order > 0 ? `${l.order}. ` : ""}{l.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase">Dấu hiệu nhận biết câu mới (Regex)</label>
              <div className="flex flex-wrap gap-1.5 mb-1.5">
                {[
                  { label: "Câu 1.", value: "Câu \\\\d+\\\\." },
                  { label: "Câu 1:", value: "Câu \\\\d+:" },
                  { label: "1.", value: "\\\\d+\\\\." },
                ].map((preset) => (
                  <button
                    key={preset.value}
                    onClick={() => setDelimiter(preset.value)}
                    className={`px-2 py-1 text-[10px] rounded border transition-all ${
                      delimiter === preset.value 
                        ? "bg-primary text-white border-primary" 
                        : "bg-white dark:bg-slate border-slate-200"
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
              <input
                value={delimiter}
                onChange={(e) => setDelimiter(e.target.value)}
                className="w-full p-2 bg-white dark:bg-slate border rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-xs font-mono"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase">Prefix Đáp án</label>
                <input
                  value={prefixes}
                  onChange={(e) => setPrefixes(e.target.value)}
                  className="w-full p-2 bg-white dark:bg-slate border rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-xs"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase">Marker đúng (Tùy chọn)</label>
                <input
                  value={marker}
                  onChange={(e) => setMarker(e.target.value)}
                  className="w-full p-2 bg-white dark:bg-slate border rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-xs"
                  placeholder="e.g. *"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-center">
        <Button
          onClick={handleParse}
          disabled={!file || parseMutation.isPending}
          className="w-full md:w-80 h-14 text-lg rounded-2xl bg-gradient-to-r from-primary to-indigo-600 hover:opacity-90 shadow-xl shadow-primary/20 transition-all active:scale-[0.98]"
        >
          {parseMutation.isPending ? (
            <>
              <Loader2 className="w-5 h-5 mr-3 animate-spin" />
              Đang phân tích PDF...
            </>
          ) : (
            <>
              <Upload className="w-5 h-5 mr-3" />
              Bắt đầu phân tích PDF
            </>
          )}
        </Button>
      </div>
    </div>
  );

  if (!onClose) {
    // Inline usage (e.g. inside ImportQuestionsPanel)
    return <div className="space-y-8">{content}</div>;
  }

  // Self-contained modal
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
        {/* Header */}
        <div className="p-8 border-b border-gray-100 dark:border-white/10 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            <div className="size-12 rounded-2xl bg-gradient-to-br from-rose-500 to-orange-500 flex items-center justify-center text-white shadow-lg">
              <FileText className="size-6" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-dark-blue dark:text-white uppercase tracking-tight">Import PDF</h2>
              <p className="text-sm text-gray-navy opacity-60">Trích xuất câu hỏi tự động từ file PDF</p>
            </div>
          </div>
          <button onClick={onClose} className="p-3 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 transition-colors">
            <X className="size-6 text-gray-navy" />
          </button>
        </div>
        {/* Body */}
        <div className="overflow-y-auto max-h-[75vh] p-8 custom-scrollbar">
          {content}
        </div>
      </motion.div>
    </div>
  );
}
