import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const backgroundColors: { [key: string]: string } = {
  HTML: "#FFF1E9",
  CSS: "#E0FDEF",
  JavaScript: "#EBF0FF",
  Accessibility: "#F6E7FF",
};

const TINTS = ["#FFF1E9", "#E0FDEF", "#EBF0FF", "#F6E7FF"];

/** Màu nền ô icon cho tiêu đề bất kỳ (đề từ API). */
export function tintForTitle(title: string): string {
  let h = 0;
  for (let i = 0; i < title.length; i++) h = (h + title.charCodeAt(i) * (i + 1)) % 997;
  return TINTS[h % TINTS.length];
}

/** 
 * Chuyển chuỗi datetime "naive ICT" (từ backend) sang đối tượng Date 
 * bằng cách giả định nó luôn là UTC+7.
 */
export function parseICT(dateStr: string): Date {
  if (!dateStr) return new Date();
  // Nếu có Z hoặc offset rồi thì dùng mặc định
  if (dateStr.endsWith("Z") || dateStr.includes("+") || dateStr.match(/\d{2}:\d{2}:\d{2}\.\d+/)) {
      // Pydantic có thể serialize ISO thô mà không có Z nếu nó là naive.
      // Ta đính thêm +07:00 nếu nó thiếu.
      if (!dateStr.includes("+") && !dateStr.endsWith("Z")) {
          return new Date(dateStr + "+07:00");
      }
  }
  return new Date(dateStr);
}

/**
 * Định dạng Date hoặc string sang định dạng dùng cho input datetime-local (YYYY-MM-DDTHH:mm).
 * Sử dụng local time của trình duyệt để hiển thị đúng như người dùng mong đợi.
 */
export function formatToLocalDatetime(date: Date | string | null | undefined): string {
    if (!date) return "";
    const d = typeof date === "string" ? parseICT(date) : date;
    if (isNaN(d.getTime())) return "";
    
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    
    return `${year}-${month}-${day}T${hours}:${minutes}`;
}
