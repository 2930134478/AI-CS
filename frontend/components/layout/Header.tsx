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
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-md">
      <div className="container mx-auto px-4">
        <div className="flex h-14 md:h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-semibold text-sm">AI</span>
            </div>
            <span className="text-lg font-semibold text-foreground tracking-tight">AI-CS</span>
          </Link>

          <div className="flex items-center gap-6 md:gap-8">
            <nav className="hidden md:flex items-center gap-6">
              <Link
                href="#features"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                功能特性
              </Link>
              <Link
                href="#screenshots"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                界面展示
              </Link>
              <Link
                href="#faq"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                常见问题
              </Link>
              <Link
                href="/agent/login"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                客服登录
              </Link>
            </nav>

            <Button variant="ghost" size="sm" asChild className="hidden sm:flex text-muted-foreground hover:text-foreground">
              <a
                href={websiteConfig.github.repo}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2"
              >
                <Github className="w-4 h-4" />
                <span>GitHub</span>
              </a>
            </Button>
            <Button variant="ghost" size="icon" asChild className="sm:hidden text-muted-foreground hover:text-foreground">
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

