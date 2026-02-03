/**
 * 生产用 Next 配置（纯 JS，运行时无需 TypeScript）
 * 与 next.config.ts 逻辑一致，供 Docker 生产镜像使用
 */

const backendPort = process.env.NEXT_PUBLIC_BACKEND_PORT || "8080";
const backendHost = process.env.NEXT_PUBLIC_BACKEND_HOST || "localhost";

/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  async rewrites() {
    if (process.env.NODE_ENV === "development") {
      return [
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
