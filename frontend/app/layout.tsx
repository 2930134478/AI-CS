import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import MatomoTracker from "@/components/MatomoTracker";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AI-CS 智能客服系统",
  description: "融合 AI 技术与人工客服，为企业提供高效、智能的客户服务解决方案",
};

// Matomo 容器 URL（格式：container_*.js）
const MATOMO_CONTAINER_URL = process.env.NEXT_PUBLIC_MATOMO_CONTAINER_URL || '';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        {MATOMO_CONTAINER_URL && <MatomoTracker containerUrl={MATOMO_CONTAINER_URL} />}
      </body>
    </html>
  );
}
