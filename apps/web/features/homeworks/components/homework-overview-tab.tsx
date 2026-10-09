"use client";

import { motion } from "framer-motion";
import { Homework, HomeworkSubmission } from "../types";
import { HomeworkQuickStats } from "./homework-quick-stats";
import { HomeworkDescriptionCard } from "./homework-description-card";
import { HomeworkAttachmentCard } from "./homework-attachment-card";
import { HomeworkRubricCard } from "./homework-rubric-card";
import { HomeworkGradingStatusCard } from "./homework-grading-status-card";
import { HomeworkInfoCard } from "./homework-info-card";

interface HomeworkOverviewTabProps {
  homework: Homework;
  submissions: HomeworkSubmission[];
  lessonName?: string;
  onEdit: () => void;
  onRetryRubric: () => void;
  isRetryingRubric: boolean;
}

export function HomeworkOverviewTab({
  homework,
  submissions,
  lessonName,
  onEdit,
  onRetryRubric,
  isRetryingRubric,
}: HomeworkOverviewTabProps) {
  return (
    <motion.div
      key="tab-overview"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="space-y-6"
    >
      {/* 3 Quick KPI Cards */}
      <HomeworkQuickStats submissions={submissions} />

      {/* Detailed Content Grid: 2 Columns on large screens */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Description, Attachment & Rubric */}
        <div className="lg:col-span-2 space-y-6">
          <HomeworkDescriptionCard
            description={homework.description}
            onEdit={onEdit}
          />

          <HomeworkAttachmentCard
            homeworkId={homework.id}
            hasAttachment={homework.has_attachment}
            onAddAttachment={onEdit}
          />

          {homework.grading_rubric && (
            <HomeworkRubricCard
              rubric={homework.grading_rubric}
              onRetry={onRetryRubric}
              isRetrying={isRetryingRubric}
              isProcessing={homework.grading_status === "PROCESSING"}
            />
          )}
        </div>

        {/* Right Column: AI Grading Status & Assignment Info */}
        <div className="space-y-6">
          <HomeworkGradingStatusCard
            status={homework.grading_status}
            error={homework.grading_error}
            onRetry={onRetryRubric}
            onEdit={onEdit}
            isRetrying={isRetryingRubric}
          />

          <HomeworkInfoCard
            homeworkId={homework.id}
            lessonName={lessonName}
            submissionsCount={submissions.length}
          />
        </div>
      </div>
    </motion.div>
  );
}
