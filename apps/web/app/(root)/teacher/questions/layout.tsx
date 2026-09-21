import type { Metadata } from "next";
import { ProtectedRoute } from "@/components/providers/protected-route";

export const metadata: Metadata = {
  title: "Duyệt câu hỏi – DUT AI Quiz",
};

export default function TeacherQuestionsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute
      allowedRoles={["ADMIN", "EDUCATOR"]}
      deniedTitle="Khu vực Duyệt Câu hỏi"
      deniedMessage="Chỉ Quản trị viên (Admin) và Giảng viên (Educator) mới có quyền duyệt và quản lý ngân hàng câu hỏi."
    >
      {children}
    </ProtectedRoute>
  );
}
