"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMe } from "@/lib/queries";
import SwitchTheme from "./atoms/switch-theme";

const teacherLinks = [
  { href: "/teacher/lessons", label: "Bài học" },
  { href: "/teacher/questions", label: "Câu hỏi" },
  { href: "/teacher/exams", label: "Kỳ thi" },
];

const studentLinks = [
  { href: "/", label: "Thi" },
  { href: "/practice", label: "Luyện tập" },
  { href: "/history", label: "Lịch sử" },
];

export default function Navbar() {
  const { data: me } = useMe();
  const pathname = usePathname();

  const links = me?.quiz_role === "teacher" ? teacherLinks : studentLinks;

  return (
    <nav className="w-full flex items-center justify-between px-4 md:px-8 py-3 bg-white/80 dark:bg-dark-blue/80 backdrop-blur sticky top-0 z-40 border-b border-slate/10 dark:border-white/10">
      <div className="flex items-center gap-6">
        <Link
          href={me?.quiz_role === "teacher" ? "/teacher/questions" : "/"}
          className="font-bold text-dark-blue dark:text-white text-sm md:text-base whitespace-nowrap"
        >
          DUT AI Quiz
        </Link>
        <ul className="flex gap-1">
          {links.map((l) => {
            const active =
              l.href === "/"
                ? pathname === "/"
                : pathname.startsWith(l.href);
            return (
              <li key={l.href}>
                <Link
                  href={l.href}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    active
                      ? "bg-purple text-white"
                      : "text-gray-navy dark:text-light-blue hover:bg-slate/10 dark:hover:bg-white/10"
                  }`}
                >
                  {l.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
      <div className="flex items-center gap-3">
        {me && (
          <span className="hidden md:block text-xs text-gray-navy dark:text-light-blue">
            {me.quiz_role === "teacher" ? "👩‍🏫 GV" : "🎓 HS"}
            {me.name ? ` · ${me.name}` : ""}
          </span>
        )}
        <SwitchTheme />
      </div>
    </nav>
  );
}
