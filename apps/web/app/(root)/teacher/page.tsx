"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";

export default function TeacherRoot() {
  const router = useRouter();
  const { isProjectDeveloper, canManageLessons } = useAuth();

  useEffect(() => {
    if (isProjectDeveloper && !canManageLessons) {
      router.replace("/teacher/hackathons");
    } else {
      router.replace("/teacher/lessons");
    }
  }, [isProjectDeveloper, canManageLessons, router]);

  return null;
}
