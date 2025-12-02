// 统一的 API 配置
// 读取 NEXT_PUBLIC_ 开头的环境变量（Next.js 会自动暴露到浏览器）
// 使用默认值方便本地开发
//
// 配置方式：
// 1. 创建 frontend/.env.local 文件（推荐）
// 2. 添加：NEXT_PUBLIC_API_BASE_URL=http://你的IP:8080
// 3. 重启前端服务
//
// 示例（局域网访问，允许手机/平板访问）：
// NEXT_PUBLIC_API_BASE_URL=http://192.168.124.9:8080
//
// 本地开发（仅本机访问）：
// NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8080
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8080";

