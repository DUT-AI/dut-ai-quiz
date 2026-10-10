import { HomeworkSubmission } from "../../types";

export interface GroupedSubmission {
  userId: number;
  owner_name?: string | null;
  submissions: HomeworkSubmission[];
  latestSubmission: HomeworkSubmission;
}

export const getInitials = (name: string): string => {
  if (!name) return "?";
  return name
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .slice(-2)
    .join("")
    .toUpperCase();
};
