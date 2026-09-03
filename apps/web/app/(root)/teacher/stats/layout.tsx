import type { Metadata } from "next";
import { ProtectedRoute } from "@/components/providers/protected-route";

export const metadata: Metadata = {
  title: "Thống kê kết quả – DUT AI Quiz",
};

export default function TeacherStatsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute
      allowedRoles={["ADMIN", "SUB_ADMIN", "EDUCATOR"]}
      deniedTitle="Khu vực Thống kê & Báo cáo"
      deniedMessage="Chỉ Quản trị viên (Admin), Quản trị viên phụ (Sub-Admin) và Giảng viên (Educator) mới có quyền xem thống kê kết quả học tập và thi cử."
    >
      {children}
    </ProtectedRoute>
  );
}
