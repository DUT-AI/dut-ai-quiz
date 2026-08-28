import type { Metadata } from "next";
import { ProtectedRoute } from "@/components/providers/protected-route";

export const metadata: Metadata = {
  title: "Quản lý Đề thi – DUT AI Quiz",
};

export default function TeacherExamsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute
      allowedRoles={["ADMIN", "SUB_ADMIN"]}
      deniedTitle="Khu vực Quản lý Kỳ thi"
      deniedMessage="Chỉ Quản trị viên (Admin) và Quản trị viên phụ (Sub-Admin) mới có quyền quản lý đề thi và kỳ thi."
    >
      {children}
    </ProtectedRoute>
  );
}
