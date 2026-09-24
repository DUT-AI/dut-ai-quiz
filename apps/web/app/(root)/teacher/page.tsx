"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";

export default function TeacherRoot() {
  const router = useRouter();
  const { canManageLessons, canManageExams, canManageHackathons } = useAuth();

  useEffect(() => {
    if (canManageLessons) {
      router.replace("/teacher/lessons");
    } else if (canManageExams) {
      router.replace("/teacher/exams");
    } else if (canManageHackathons) {
      router.replace("/teacher/hackathons");
    } else {
      router.replace("/dashboard");
    }
  }, [canManageLessons, canManageExams, canManageHackathons, router]);

  return null;
}

