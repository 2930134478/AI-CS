// 统一的 API 配置
// 读取 NEXT_PUBLIC_ 开头的环境变量（Next.js 会自动暴露到浏览器）
// 使用默认值方便本地开发
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8080";

