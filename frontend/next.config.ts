import type { NextConfig } from "next";

// 从环境变量读取后端端口，默认 8080（与后端 main.go 保持一致）
// 如果设置了 NEXT_PUBLIC_BACKEND_PORT，优先使用（用于 Docker 部署等场景）
const backendPort = process.env.NEXT_PUBLIC_BACKEND_PORT || "8080";
const backendHost = process.env.NEXT_PUBLIC_BACKEND_HOST || "localhost";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true, // 临时禁用构建时的 ESLint 检查
  },
  // 开发环境：代理 API 请求到后端
  // 生产环境：由 Nginx 处理，这个配置不会生效（因为生产环境是静态构建）
  async rewrites() {
    // 只在开发环境启用代理
    if (process.env.NODE_ENV === "development") {
      return [
        // 优先匹配后端 API 路径（这些需要代理到后端）
        {
          source: "/agent/profile/:path*",
          destination: `http://${backendHost}:${backendPort}/agent/profile/:path*`,
        },
        {
          source: "/agent/avatar/:path*",
          destination: `http://${backendHost}:${backendPort}/agent/avatar/:path*`,
        },
        {
          source: "/agent/embedding-config",
          destination: `http://${backendHost}:${backendPort}/agent/embedding-config`,
        },
        {
          source: "/agent/ai-config/:path*",
          destination: `http://${backendHost}:${backendPort}/agent/ai-config/:path*`,
        },
        // 匹配其他 API 路径（不以 /_next、/agent、/chat 开头的路径）
        // 例如：/login, /conversations, /messages 等
        {
          source: "/:path((?!_next|agent|chat|favicon.ico).*)",
          destination: `http://${backendHost}:${backendPort}/:path*`,
        },
      ];
    }
    // 生产环境返回空数组，使用相对路径（由 Nginx 处理）
    return [];
  },
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "192.168.124.9",
        port: backendPort,
        pathname: "/uploads/**",
      },
      {
        protocol: "http",
        hostname: "localhost",
        port: backendPort,
        pathname: "/uploads/**",
      },
      {
        protocol: "http",
        hostname: "127.0.0.1",
        port: backendPort,
        pathname: "/uploads/**",
      },
    ],
  },
};

export default nextConfig;
