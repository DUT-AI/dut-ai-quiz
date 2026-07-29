"use client";

import { Download, FileArchive, Upload } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  openHomeworkAttachment,
  useMyHomeworks,
  useSubmitHomework,
} from "../queries";
import { SubmissionResult } from "./submission-result";

const ALLOWED = [".zip", ".rar", ".7z", ".tar.gz", ".gz"];

export function HomeworkTab({ lessonId }: { lessonId: string }) {
  const { data, isLoading, error } = useMyHomeworks(lessonId || null);
  const submit = useSubmitHomework();
  const [files, setFiles] = useState<Record<string, File | null>>({});

  const handleSubmit = async (homeworkId: string) => {
    const file = files[homeworkId];
    if (!file) return toast.error("Vui lòng chọn file bài làm");
    if (!ALLOWED.some((suffix) => file.name.toLowerCase().endsWith(suffix))) {
      return toast.error("Chỉ chấp nhận file nén");
    }
    if (file.size > 10 * 1024 * 1024) {
      return toast.error("File không được vượt quá 10 MB");
    }
    try {
      await submit.mutateAsync({ homeworkId, file });
      setFiles((current) => ({ ...current, [homeworkId]: null }));
      toast.success("Nộp bài thành công");
    } catch (submissionError) {
      toast.error(
        submissionError instanceof Error
          ? submissionError.message
          : "Nộp bài thất bại",
      );
    }
  };

  if (isLoading) {
    return <p className="py-14 text-center opacity-50">Đang tải bài tập coding...</p>;
  }
  if (error) {
    return (
      <p className="py-14 text-center text-red">
        Không thể tải bài tập coding của bài học.
      </p>
    );
  }
  if (!data?.data.length) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-16 text-center text-gray-navy">
          Bài học này chưa có bài tập coding dành cho bạn.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-6">
      {data.data.map((homework) => {
        const overdue = new Date() > new Date(homework.deadline);
        const file = files[homework.id];
        return (
          <Card key={homework.id} className="overflow-hidden border-none shadow-xl">
            <CardHeader className="bg-gray-50/70 dark:bg-white/5">
              <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
                <div>
                  <CardTitle className="text-2xl">{homework.title}</CardTitle>
                  <p className="mt-2 whitespace-pre-wrap text-sm text-gray-navy dark:text-light-blue">
                    {homework.description}
                  </p>
                </div>
                <Badge variant={overdue ? "destructive" : "outline"}>
                  Hạn: {new Date(homework.deadline).toLocaleString("vi-VN")}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-5 pt-6">
              {homework.has_attachment && (
                <Button
                  variant="outline"
                  onClick={() => openHomeworkAttachment(homework.id)}
                >
                  <Download className="mr-2 size-4" /> Tải đề đính kèm
                </Button>
              )}

              {homework.current_submission && (
                <SubmissionResult submission={homework.current_submission} />
              )}

              <div className="rounded-3xl border border-dashed border-primary/30 bg-primary/5 p-5">
                <div className="flex flex-col items-stretch gap-4 md:flex-row md:items-center">
                  <label className="flex flex-1 cursor-pointer items-center gap-3 rounded-2xl bg-white px-4 py-3 text-sm font-bold shadow-sm dark:bg-navy-blue">
                    <FileArchive className="size-5 text-primary" />
                    <span className="truncate">
                      {file?.name ?? "Chọn file .zip, .rar, .7z, .tar.gz"}
                    </span>
                    <input
                      className="hidden"
                      type="file"
                      accept={ALLOWED.join(",")}
                      onChange={(event) =>
                        setFiles((current) => ({
                          ...current,
                          [homework.id]: event.target.files?.[0] ?? null,
                        }))
                      }
                    />
                  </label>
                  <Button
                    disabled={!file || submit.isPending}
                    onClick={() => handleSubmit(homework.id)}
                  >
                    <Upload className="mr-2 size-4" />
                    {homework.current_submission ? "Nộp lại" : "Nộp bài"}
                  </Button>
                </div>
                <p className="mt-2 text-xs text-gray-navy">
                  Tối đa 10 MB. Nộp sau deadline vẫn được ghi nhận và đánh dấu trễ.
                </p>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
