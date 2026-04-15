import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Quản trị – DUT AI Quiz",
};

export default function TeacherLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate/30">
      <div className="max-w-7xl mx-auto px-4 py-6">{children}</div>
    </div>
  );
}
