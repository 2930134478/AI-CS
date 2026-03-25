import type { NextConfig } from "next";

// 开发时代理目标端口（统一从根目录 .env 读取 NEXT_PUBLIC_BACKEND_*）
const backendPort = process.env.NEXT_PUBLIC_BACKEND_PORT || "8080";
const backendHost = process.env.NEXT_PUBLIC_BACKEND_HOST || "localhost";

const nextConfig: NextConfig = {
  // 开发环境：代理 API 请求到后端
  // 生产环境：由 Nginx 处理，这个配置不会生效（因为生产环境是静态构建）
  async rewrites() {
    // 只在开发环境启用代理
    if (process.env.NODE_ENV === "development") {
      return [
        // 形态2（同域 /api）在本地开发的兜底：把 /api/* 代理到后端 /api/*
        // 避免 Next 把 /api 当成自己的 API 路由而导致 404
        {
          source: "/api/:path*",
          destination: `http://${backendHost}:${backendPort}/api/:path*`,
        },
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
          source: "/agent/prompts",
          destination: `http://${backendHost}:${backendPort}/agent/prompts`,
        },
        {
          source: "/agent/ai-config/:path*",
          destination: `http://${backendHost}:${backendPort}/agent/ai-config/:path*`,
        },
        {
          // 数据报表 API（后端 gin 路由在 /agent/analytics/summary）
          source: "/agent/analytics/summary",
          destination: `http://${backendHost}:${backendPort}/agent/analytics/summary`,
        },
        {
          source: "/agent/logs/api",
          destination: `http://${backendHost}:${backendPort}/agent/logs/api`,
        },
        {
          source: "/agent/logs/frontend",
          destination: `http://${backendHost}:${backendPort}/agent/logs/frontend`,
        },
        // 匹配其他 API 路径（不以 /_next、/agent、/api、/chat 开头的路径）
        // /api/agent/prompts 由 app/api/agent/prompts/route.ts 代理，不在此转发
        {
          source: "/:path((?!_next|agent|api|chat|favicon.ico).*)",
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
