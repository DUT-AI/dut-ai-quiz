"use client";

import { MessageSquare, FileText, CheckCircle2, XCircle, AlertTriangle, Info } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { HomeworkSubmission } from "../types";
import { Card, CardContent } from "@/components/ui/card";

interface SubmissionFeedbackCardProps {
  submission: HomeworkSubmission;
}

interface FeedbackCriterion {
  status: string;
  name: string;
  details: string;
}

function parseFeedback(feedback: string) {
  const lines = feedback.split("\n").map(line => line.trim()).filter(Boolean);
  const criteria: FeedbackCriterion[] = [];
  let headerText = "";
  let footerText = "";

  for (const line of lines) {
    const colonIndex = line.indexOf(":");
    if (colonIndex === -1) {
      if (criteria.length === 0) {
        headerText = headerText ? `${headerText}\n${line}` : line;
      } else {
        footerText = footerText ? `${footerText}\n${line}` : line;
      }
      continue;
    }

    const left = line.slice(0, colonIndex).trim();
    const right = line.slice(colonIndex + 1).trim();

    // Check if this is the "Tổng điểm" or score summary line
    if (
      left.toLowerCase().includes("tổng điểm") ||
      left.toLowerCase().includes("score") ||
      left.toLowerCase().includes("grade")
    ) {
      footerText = footerText ? `${footerText}\n${line}` : line;
      continue;
    }

    const cleanLeft = left.replace(/^[\s\-\*•+]+/, "").trim();
    const statusMatch = cleanLeft.match(/^([^\w\s\d\(\)\[\]\{\}]+)\s*(.*)$/);

    if (statusMatch) {
      criteria.push({
        status: statusMatch[1].trim(),
        name: statusMatch[2].trim().replace(/^[\*_]+|[\*_]+$/g, ""),
        details: right,
      });
    } else {
      criteria.push({
        status: "",
        name: cleanLeft.replace(/^[\*_]+|[\*_]+$/g, ""),
        details: right,
      });
    }
  }

  return { headerText, criteria, footerText };
}

function StatusIcon({ status }: { status: string }) {
  switch (status) {
    case "✅":
    case "🟢":
      return <CheckCircle2 className="size-4 text-emerald-500 dark:text-emerald-400" />;
    case "❌":
    case "🔴":
      return <XCircle className="size-4 text-red-500 dark:text-red-400" />;
    case "⚠️":
    case "🟡":
      return <AlertTriangle className="size-4 text-amber-500 dark:text-amber-400" />;
    case "ℹ️":
    case "🔵":
      return <Info className="size-4 text-blue-500 dark:text-blue-400" />;
    default:
      if (status) {
        return <span className="text-sm font-sans">{status}</span>;
      }
      return null;
  }
}

export function SubmissionFeedbackCard({ submission }: SubmissionFeedbackCardProps) {
  const parsed = submission.feedback ? parseFeedback(submission.feedback) : null;
  const hasCriteria = parsed && parsed.criteria.length > 0;

  return (
    <Card className="border border-gray-150 bg-white/50 dark:border-white/10 dark:bg-zinc-900/40 backdrop-blur-sm shadow-none text-left">
      <CardContent className="p-6 space-y-4">
        {/* Title */}
        <div className="flex items-center gap-2 border-b border-gray-100 dark:border-white/5 pb-2">
          <MessageSquare className="size-4 text-primary" />
          <h3 className="text-sm font-black text-dark-blue dark:text-white uppercase tracking-wider">
            Nhận xét chi tiết từ hệ thống
          </h3>
        </div>

        {/* Feedback content */}
        {submission.feedback ? (
          hasCriteria ? (
            <div className="space-y-4 font-sans text-xs">
              {parsed.headerText && (
                <div className="prose prose-sm dark:prose-invert max-w-none text-xs text-slate-800 dark:text-light-blue/90 font-medium leading-relaxed font-sans">
                  <ReactMarkdown>{parsed.headerText}</ReactMarkdown>
                </div>
              )}

              <div className="overflow-x-auto rounded-xl border border-gray-150 dark:border-white/10 bg-white dark:bg-zinc-900/10">
                <table className="min-w-full divide-y divide-gray-150 dark:divide-white/10 text-xs">
                  <thead>
                    <tr className="bg-gray-50/70 dark:bg-zinc-900/50">
                      <th scope="col" className="w-12 px-4 py-3 text-center text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                        KQ
                      </th>
                      <th scope="col" className="w-1/4 px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                        Tiêu chí
                      </th>
                      <th scope="col" className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                        Đánh giá chi tiết
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-150 dark:divide-white/5 bg-transparent">
                    {parsed.criteria.map((criterion, idx) => (
                      <tr key={idx} className="hover:bg-gray-50/30 dark:hover:bg-white/5 transition-colors">
                        <td className="px-4 py-3 text-center align-top">
                          <div className="flex justify-center pt-0.5">
                            <StatusIcon status={criterion.status} />
                          </div>
                        </td>
                        <td className="px-4 py-3 font-semibold text-gray-900 dark:text-white align-top whitespace-nowrap">
                          {criterion.name}
                        </td>
                        <td className="px-4 py-3 text-slate-700 dark:text-light-blue/90 align-top break-words">
                          <ReactMarkdown
                            components={{
                              p: ({ children }) => <span className="block leading-relaxed">{children}</span>,
                              code: ({ children }) => (
                                <code className="bg-gray-100 dark:bg-white/10 px-1 py-0.5 rounded text-[10px] font-mono">
                                  {children}
                                </code>
                              ),
                            }}
                          >
                            {criterion.details}
                          </ReactMarkdown>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {parsed.footerText && (
                <div className="rounded-xl border border-primary/10 bg-primary/5 dark:border-primary/20 dark:bg-primary/5 p-3.5 text-xs font-semibold text-slate-800 dark:text-light-blue/90 leading-relaxed font-sans">
                  <ReactMarkdown
                    components={{
                      p: ({ children }) => <span className="block leading-relaxed">{children}</span>,
                    }}
                  >
                    {parsed.footerText}
                  </ReactMarkdown>
                </div>
              )}
            </div>
          ) : (
            <div className="prose prose-sm dark:prose-invert max-w-none text-xs leading-relaxed text-slate-800 dark:text-light-blue/90 break-words font-sans space-y-4">
              <ReactMarkdown>{submission.feedback}</ReactMarkdown>
            </div>
          )
        ) : (
          <div className="flex flex-col items-center justify-center py-10 text-center text-gray-navy/60 dark:text-light-blue/40 space-y-2">
            <FileText className="size-8 opacity-40" />
            <p className="text-xs font-bold">Không có nhận xét chi tiết</p>
            <p className="text-[10px] max-w-xs">
              Bài nộp này chưa được nhận xét chi tiết hoặc đang được xử lý trong hàng đợi chấm điểm.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

