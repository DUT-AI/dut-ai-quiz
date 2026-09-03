import type { Metadata } from "next";
import { ProtectedRoute } from "@/components/providers/protected-route";

export const metadata: Metadata = {
  title: "Quản lý Hackathon – DUT AI Quiz",
};

export default function TeacherHackathonsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute
      allowedRoles={["ADMIN", "PROJECT_DEVELOPER"]}
      deniedTitle="Khu vực Quản lý Hackathon"
      deniedMessage="Chỉ Quản trị viên (Admin) và Lập trình viên dự án (Project Developer) mới có quyền quản lý giải đấu Hackathon."
    >
      {children}
    </ProtectedRoute>
  );
}
