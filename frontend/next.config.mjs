/**
 * 生产用 Next 配置（纯 JS，运行时无需 TypeScript）
 * 与 next.config.ts 逻辑一致，供 Docker 生产镜像使用，避免 next start 触发 npm install
 */

// 开发时代理目标端口（统一从根目录 .env 读取 NEXT_PUBLIC_BACKEND_*）
const backendPort = process.env.NEXT_PUBLIC_BACKEND_PORT || "8080";
const backendHost = process.env.NEXT_PUBLIC_BACKEND_HOST || "localhost";

/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    if (process.env.NODE_ENV === "development") {
      return [
        // 形态2（同域 /api）在本地开发的兜底：把 /api/* 代理到后端 /api/*
        {
          source: "/api/:path*",
          destination: `http://${backendHost}:${backendPort}/api/:path*`,
        },
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
        {
          source: "/:path((?!_next|agent|chat|favicon.ico).*)",
          destination: `http://${backendHost}:${backendPort}/:path*`,
        },
      ];
    }
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
