import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * 合并 Tailwind CSS 类名的工具函数
 * 用于 Shadcn UI 组件
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

