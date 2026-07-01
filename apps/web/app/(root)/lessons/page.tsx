"use client";

import { redirect } from "next/navigation";

export default function LessonsRedirectPage() {
  redirect("/lessons/content");
  return null;
}
