import type { Metadata } from "next";
import { ProtectedRoute } from "@/components/providers/protected-route";

export const metadata: Metadata = {
  title: "Quản lý Bài tập – DUT AI Quiz",
};

export default function TeacherHomeworksLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute
      allowedRoles={["ADMIN", "EDUCATOR"]}
      deniedTitle="Khu vực Quản lý Bài tập"
      deniedMessage="Chỉ Quản trị viên (Admin) và Giảng viên (Educator) mới có quyền quản lý bài tập và chấm bài."
    >
      {children}
    </ProtectedRoute>
  );
}
