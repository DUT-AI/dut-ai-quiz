"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useBulkCreateQuestions } from "@/lib/queries";
import { Card } from "@/components/ui/card";
import { Trash2, Upload, FileJson, Save, Loader2, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface JsonImportProps {
  onSuccess: () => void;
}

export function JsonImport({ onSuccess }: JsonImportProps) {
  const [questions, setQuestions] = useState<any[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const bulkCreateMutation = useBulkCreateQuestions();

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (Array.isArray(json)) {
          setQuestions(json);
          setIsLoaded(true);
        } else {
          alert("JSON must be an array of questions");
        }
      } catch (err) {
        alert("Invalid JSON file");
      }
    };
    reader.readAsText(file);
  };

  const handleRemove = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const handleImport = async () => {
    if (questions.length === 0) return;
    
    try {
      await bulkCreateMutation.mutateAsync({
        questions: questions.map(q => ({
          question: q.question || q.content,
          options: q.options,
          solution: q.solution
        })),
        pool_type: "PRACTICE"
      });
      alert("Imported successfully!");
      onSuccess();
    } catch (err: any) {
      alert(err.message || "Failed to import");
    }
  };

  if (isLoaded) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between p-4 border rounded-2xl bg-slate-50 dark:bg-white/5 sticky top-0 z-10 backdrop-blur-md">
          <div>
            <h3 className="font-bold">JSON Preview</h3>
            <p className="text-sm text-slate-500">{questions.length} questions found</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsLoaded(false)}>Reset</Button>
            <Button 
                onClick={handleImport} 
                disabled={bulkCreateMutation.isPending}
                className="bg-primary text-white"
            >
              {bulkCreateMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Confirm Import
            </Button>
          </div>
        </div>

        <div className="grid gap-4 pb-20">
          <AnimatePresence>
            {questions.map((q, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card className="p-5 relative group border-2">
                  <button
                    className="absolute top-4 right-4 text-slate-300 hover:text-red-500 transition-colors"
                    onClick={() => handleRemove(i)}
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                  <p className="font-bold text-slate-800 dark:text-white mb-4 pr-8 leading-relaxed">
                    {q.question || q.content}
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {q.options?.map((opt: any, oi: number) => (
                      <div 
                        key={oi} 
                        className={`p-3 rounded-xl border text-sm flex items-center gap-2 ${
                            opt.is_correct 
                            ? "bg-green-50 border-green-200 text-green-700 dark:bg-green-900/10 dark:border-green-800 dark:text-green-400" 
                            : "bg-slate-50/50 border-slate-100 dark:bg-white/5 dark:border-white/10"
                        }`}
                      >
                        <div className={`w-2 h-2 rounded-full ${opt.is_correct ? "bg-green-500" : "bg-slate-300"}`} />
                        {opt.text}
                      </div>
                    ))}
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
    <div className="flex flex-col items-center justify-center p-16 border-2 border-dashed rounded-[40px] bg-slate-50/50 dark:bg-white/5 hover:bg-slate-50 transition-all group">
      <div className="w-24 h-24 rounded-full bg-yellow-100 dark:bg-yellow-900/20 text-yellow-600 flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-500">
        <FileJson className="w-12 h-12" />
      </div>
      <h3 className="text-2xl font-bold mb-3 text-slate-800 dark:text-white">Import from JSON</h3>
      <p className="text-slate-500 text-center max-w-sm mb-10 leading-relaxed">
        Upload a JSON file containing an array of question objects with options and correct flags.
      </p>
      
      <div className="bg-white dark:bg-slate p-6 rounded-3xl border shadow-sm mb-10 w-full max-w-md">
        <h4 className="text-xs font-bold uppercase text-slate-400 mb-4 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-blue-500" />
            Expected Schema
        </h4>
        <pre className="text-[11px] bg-slate-900 text-blue-300 p-5 rounded-2xl overflow-x-auto font-mono">
{`[
  {
    "question": "The question content here?",
    "options": [
      { "text": "Correct option", "is_correct": true },
      { "text": "Wrong option", "is_correct": false }
    ],
    "solution": "Optional explanation"
  }
]`}
        </pre>
      </div>

      <Button 
        size="lg" 
        className="px-16 h-14 rounded-2xl bg-slate-900 text-white hover:bg-slate-800 dark:bg-primary shadow-xl" 
        onClick={() => document.getElementById("json-upload")?.click()}
      >
        <Upload className="w-5 h-5 mr-3" />
        Choose JSON File
      </Button>
      <input
        id="json-upload"
        type="file"
        accept=".json"
        className="hidden"
        onChange={handleFileUpload}
      />
    </div>
  );
}
