"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Github } from "lucide-react";
import { websiteConfig } from "@/lib/website-config";

/**
 * 官网顶部导航栏
 * 包含 Logo、导航链接和 GitHub 链接
 */
export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo 和品牌名称 */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-lg">AI</span>
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                AI-CS
              </span>
            </div>
          </Link>

          {/* 右侧：导航链接和操作按钮 */}
          <div className="flex items-center space-x-6">
            {/* 导航链接 */}
            <nav className="hidden md:flex items-center space-x-6">
              <Link
                href="#features"
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                功能特性
              </Link>
              <Link
                href="#screenshots"
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                界面展示
              </Link>
              <Link
                href="#faq"
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                常见问题
              </Link>
              <Link
                href="/agent/login"
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                客服登录
              </Link>
            </nav>

            {/* GitHub 链接 */}
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="hidden sm:flex"
            >
              <a
                href={websiteConfig.github.repo}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-2"
              >
                <Github className="w-4 h-4" />
                <span>GitHub</span>
              </a>
            </Button>
            
            {/* 移动端 GitHub 图标按钮 */}
            <Button
              variant="ghost"
              size="icon"
              asChild
              className="sm:hidden"
            >
              <a
                href={websiteConfig.github.repo}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="GitHub"
              >
                <Github className="w-5 h-5" />
              </a>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}

