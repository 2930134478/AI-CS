import type { NextConfig } from "next";

// 从环境变量读取后端端口，默认 18080（避免与常用端口冲突）
const backendPort = process.env.NEXT_PUBLIC_BACKEND_PORT || "18080";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true, // 临时禁用构建时的 ESLint 检查
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
