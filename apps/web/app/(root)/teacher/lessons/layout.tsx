import type { Metadata } from "next";
import { ProtectedRoute } from "@/components/providers/protected-route";

export const metadata: Metadata = {
  title: "Quản lý Bài học – DUT AI Quiz",
};

export default function TeacherLessonsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute
      allowedRoles={["ADMIN", "EDUCATOR"]}
      deniedTitle="Khu vực Quản lý Bài học"
      deniedMessage="Chỉ Quản trị viên (Admin) và Giảng viên (Educator) mới có quyền quản lý bài học và tài liệu."
    >
      {children}
    </ProtectedRoute>
  );
}
