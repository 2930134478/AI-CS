"use client";

import Link from "next/link";
import { Github, Mail, MessageSquare } from "lucide-react";
import { websiteConfig } from "@/lib/website-config";

/**
 * 官网底部页脚
 * 包含公司信息、友情链接、联系方式等
 */
export function Footer() {
  return (
    <footer className="border-t bg-muted/30">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* 关于产品 */}
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-lg">AI</span>
              </div>
              <span className="text-lg font-bold">AI-CS</span>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              AI-CS 是一款 AI 驱动的智能客服系统，融合 AI 技术与人工客服，为企业提供高效、智能的客户服务解决方案。
            </p>
            <div className="flex items-center space-x-4">
              <a
                href={websiteConfig.github.repo}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label="GitHub"
              >
                <Github className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* 产品链接 */}
          <div>
            <h3 className="font-semibold mb-4">产品</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="#features"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  功能特性
                </Link>
              </li>
              <li>
                <Link
                  href="#screenshots"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  界面展示
                </Link>
              </li>
              <li>
                <Link
                  href="#faq"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  常见问题
                </Link>
              </li>
              <li>
                <Link
                  href="/agent/login"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  客服登录
                </Link>
              </li>
            </ul>
          </div>

          {/* 友情链接 */}
          <div>
            <h3 className="font-semibold mb-4">友情链接</h3>
            <ul className="space-y-2 text-sm">
              {websiteConfig.friendLinks.length > 0 ? (
                websiteConfig.friendLinks.map((link, index) => (
                  <li key={index}>
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {link.name}
                    </a>
                  </li>
                ))
              ) : (
                <li className="text-muted-foreground text-xs">
                  暂无友情链接
                </li>
              )}
            </ul>
          </div>

          {/* 联系我们 */}
          <div>
            <h3 className="font-semibold mb-4">联系我们</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center space-x-2 text-muted-foreground">
                <Github className="w-4 h-4" />
                <a
                  href={websiteConfig.github.repo}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-foreground transition-colors"
                >
                  GitHub
                </a>
              </li>
              <li className="flex items-center space-x-2 text-muted-foreground">
                <MessageSquare className="w-4 h-4" />
                <Link
                  href="/chat"
                  className="hover:text-foreground transition-colors"
                >
                  在线客服
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* 版权信息 */}
        <div className="mt-8 pt-8 border-t text-center text-sm text-muted-foreground">
          <p className="mb-2">
            © {websiteConfig.copyright.year} {websiteConfig.copyright.company}. All rights reserved.
          </p>
          <p>
            Powered by Next.js & Go | 
            <a
              href={websiteConfig.github.repo}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-1 hover:text-foreground transition-colors"
            >
              开源协议
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}

