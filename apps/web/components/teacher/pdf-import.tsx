"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useParsePDF, useBulkCreateQuestions } from "@/lib/queries";
import { ParsedQuestionPreview } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { Check, Trash2, Upload, AlertCircle, Save, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface PdfImportProps {
  onSuccess: () => void;
}

export function PdfImport({ onSuccess }: PdfImportProps) {
  const [file, setFile] = useState<File | null>(null);
  const [delimiter, setDelimiter] = useState("Câu \\\\d+[:.]");
  const [prefixes, setPrefixes] = useState("A,B,C,D");
  const [marker, setMarker] = useState("");
  const [questions, setQuestions] = useState<ParsedQuestionPreview[]>([]);
  const [isPreviewing, setIsPreviewing] = useState(false);

  const parseMutation = useParsePDF();
  const bulkCreateMutation = useBulkCreateQuestions();

  const handleParse = async () => {
    if (!file) {
      alert("Please select a PDF file");
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
      alert(err.message || "Failed to parse PDF");
    }
  };

  const handleUpdateQuestion = (index: number, content: string) => {
    const newQs = [...questions];
    newQs[index].content = content;
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

    // Validate
    const invalid = questions.find(q => 
        !q.content.trim() || 
        q.options.length < 2 || 
        !q.options.some(o => o.is_correct)
    );
    if (invalid) {
        alert("Some questions are invalid (missing content, options or correct answer)");
        return;
    }

    try {
      await bulkCreateMutation.mutateAsync({
        questions: questions.map(q => ({
          question: q.content,
          options: q.options.map(o => ({ text: o.text, is_correct: o.is_correct })),
          solution: q.solution || undefined
        })),
        pool_type: "PRACTICE"
      });
      alert("Successfully imported all questions!");
      onSuccess();
    } catch (err: any) {
      alert(err.message || "Failed to import questions");
    }
  };

  if (isPreviewing) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between sticky top-0 bg-white/80 dark:bg-dark-blue/80 backdrop-blur-sm p-4 border rounded-xl z-10 shadow-sm">
          <div>
            <h3 className="text-lg font-bold">Preview Questions</h3>
            <p className="text-sm text-slate-500">
              Review and edit before saving
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsPreviewing(false)}>
              Back
            </Button>
            <Button 
                onClick={handleConfirmImport} 
                disabled={bulkCreateMutation.isPending}
                className="bg-green-600 hover:bg-green-700 text-white"
            >
              {bulkCreateMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Confirm & Import ({questions.length})
            </Button>
          </div>
        </div>

        <div className="space-y-4 pb-20">
          <AnimatePresence>
            {questions.map((q, qIdx) => (
              <motion.div
                key={qIdx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
              >
                <Card className="p-6 relative group border-2 hover:border-blue-200 dark:hover:border-blue-900 transition-all duration-300">
                  <button
                    className="absolute top-4 right-4 text-slate-300 hover:text-red-500 transition-colors"
                    onClick={() => handleRemoveQuestion(qIdx)}
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>

                  <div className="space-y-4">
                    <div>
                      <label className="text-[10px] font-bold uppercase text-slate-400 mb-1 block">
                        Question Content
                      </label>
                      <textarea
                        value={q.content}
                        onChange={(e) => handleUpdateQuestion(qIdx, e.target.value)}
                        className="w-full p-3 border rounded-lg bg-slate-50 dark:bg-slate/20 focus:ring-2 focus:ring-blue-500 transition-all min-h-[100px] text-sm outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {q.options.map((opt, oIdx) => (
                        <div
                          key={oIdx}
                          className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                            opt.is_correct 
                            ? "bg-green-50 border-green-200 dark:bg-green-900/10 dark:border-green-800" 
                            : "bg-white dark:bg-white/5 border-slate-200 dark:border-white/10"
                          }`}
                        >
                          <button
                            onClick={() => handleToggleCorrect(qIdx, oIdx)}
                            className={`w-5 h-5 rounded-full flex items-center justify-center border transition-all ${
                              opt.is_correct
                                ? "bg-green-500 border-green-500 text-white"
                                : "bg-white dark:bg-slate border-slate-300 text-transparent"
                            }`}
                          >
                            <Check className="w-3 h-3" />
                          </button>
                          <input
                            value={opt.text}
                            onChange={(e) => handleUpdateOption(qIdx, oIdx, e.target.value)}
                            className="flex-1 bg-transparent border-none focus:ring-0 text-sm outline-none"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Upload className="w-5 h-5 text-blue-500" />
            1. Upload PDF
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
            <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-4 ${file ? "bg-blue-100 text-blue-600" : "bg-slate-100 text-slate-400"}`}>
                <Upload className="w-10 h-10" />
            </div>
            {file ? (
                <div>
                    <p className="font-bold text-slate-800 dark:text-white">{file.name}</p>
                    <p className="text-xs text-slate-500">{(file.size / 1024).toFixed(1)} KB</p>
                </div>
            ) : (
                <>
                    <p className="text-slate-600 dark:text-slate-400 font-medium">Click to upload or drag & drop</p>
                    <p className="text-slate-400 text-xs mt-1">PDF document only</p>
                </>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-purple-500" />
            2. Parser Config
          </h3>
          
          <div className="space-y-5 bg-slate-50/50 dark:bg-white/5 p-6 rounded-3xl border">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase">Question Delimiter</label>
              <input
                value={delimiter}
                onChange={(e) => setDelimiter(e.target.value)}
                className="w-full p-2 bg-white dark:bg-slate border rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase">Option Prefixes</label>
              <input
                value={prefixes}
                onChange={(e) => setPrefixes(e.target.value)}
                className="w-full p-2 bg-white dark:bg-slate border rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase">Correct Marker</label>
              <input
                value={marker}
                onChange={(e) => setMarker(e.target.value)}
                className="w-full p-2 bg-white dark:bg-slate border rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. *"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-center">
        <Button
          onClick={handleParse}
          disabled={!file || parseMutation.isPending}
          className="w-full md:w-64 h-14 text-lg rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:opacity-90 shadow-xl shadow-blue-500/20"
        >
          {parseMutation.isPending ? (
            <>
              <Loader2 className="w-5 h-5 mr-3 animate-spin" />
              Parsing...
            </>
          ) : (
            "Start Parsing PDF"
          )}
        </Button>
      </div>
    </div>
  );
}
