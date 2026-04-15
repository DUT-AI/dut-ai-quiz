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