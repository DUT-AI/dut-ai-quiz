import type { Metadata } from "next";
import { ProtectedRoute } from "@/components/providers/protected-route";

export const metadata: Metadata = {
  title: "Quản trị – DUT AI Quiz",
};

export default function TeacherLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute
      allowedRoles={[
        "admin",
        "MENTOR",
        "EDUCATOR",
        "PROJECT_DEVELOPER",
        "SUB_ADMIN",
      ]}
    >
      <div className="w-full bg-slate-50 dark:bg-zinc-950">{children}</div>
    </ProtectedRoute>
  );
}
