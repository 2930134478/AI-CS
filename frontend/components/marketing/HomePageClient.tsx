"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Bot,
  BookOpen,
  Users,
  Wand2,
  LineChart,
  ScrollText,
  Globe,
  LayoutDashboard,
  FileText,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  Github,
  Mail,
} from "lucide-react";
import { ScreenshotDisplay } from "@/components/ScreenshotDisplay";
import { ChatWidget } from "@/components/visitor/ChatWidget";
import { FloatingButton } from "@/components/visitor/FloatingButton";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { FadeIn, FadeInStagger, FadeInItem } from "@/components/ui/fade-in";
import { websiteConfig } from "@/lib/website-config";
import { stats } from "@/lib/stats-config";

const capabilityCards = [
  {
    icon: Bot,
    title: "多模型 AI 客服",
    description:
      "支持配置多家大模型与绘画等能力，访客与后台可统一管理模型与使用方式，便于替换供应商、控制成本。",
  },
  {
    icon: BookOpen,
    title: "知识库与 RAG",
    description:
      "文档入库、向量检索，让回答贴近你的业务资料；回复可标记是否使用知识库、模型或联网，便于核对与优化。",
  },
  {
    icon: Wand2,
    title: "提示词工程",
    description:
      "配置系统中使用的提示词模板，用于不同领域 RAG、联网等不同的业务场景。",
  },
  {
    icon: Users,
    title: "人工客服与实时协作",
    description:
      "在线状态、会话实时推送（WebSocket），支持人工接管与日常协作；访客小窗可嵌入任意站点。",
  },
  {
    icon: LineChart,
    title: "可视化报表",
    description:
      "按日或自定义区间查看访客小窗打开、会话与消息、AI 回复与失败率、知识库命中率等指标，快速掌握运营态势。",
  },
  {
    icon: ScrollText,
    title: "日志中心",
    description:
      "结构化日志按分类与事件落库，支持 trace_id 与关键字筛选，关键链路与异常可追溯，便于排障与审计。",
  },
];

const steps = [
  {
    title: "克隆与配置",
    body: "复制 .env 模板，填好数据库与管理员等必填项。",
  },
  {
    title: "一键启动",
    body: "使用 Docker Compose 拉起前后端与依赖服务（详见 README）。",
  },
  {
    title: "嵌入访客端",
    body: "在站点中挂载聊天小窗，后台完成模型与知识库配置后即可对外服务。",
  },
];

const screenshotCards = [
  {
    key: "dashboard",
    title: "工作台",
    imageName: "dashboard.png",
    placeholderIcon: LayoutDashboard,
    placeholderText: "工作台界面",
    alt: "AI-CS 工作台界面",
  },
  {
    key: "visitor",
    title: "访客端",
    imageName: "visitor.png",
    placeholderIcon: Globe,
    placeholderText: "访客端界面",
    alt: "AI-CS 访客端界面",
  },
  {
    key: "ai-config",
    title: "AI配置",
    imageName: "ai-config.png",
    placeholderIcon: Bot,
    placeholderText: "AI配置界面",
    alt: "AI-CS AI配置界面",
  },
  {
    key: "users",
    title: "用户管理",
    imageName: "users.png",
    placeholderIcon: Users,
    placeholderText: "用户管理界面",
    alt: "AI-CS 用户管理界面",
  },
  {
    key: "faq",
    title: "FAQ管理",
    imageName: "faq.png",
    placeholderIcon: FileText,
    placeholderText: "FAQ管理界面",
    alt: "AI-CS FAQ管理界面",
  },
  {
    key: "knowledge",
    title: "知识库管理",
    imageName: "knowledge.png",
    placeholderIcon: BookOpen,
    placeholderText: "知识库管理界面",
    alt: "AI-CS 知识库管理界面",
  },
  {
    key: "conversations",
    title: "知识库测试",
    imageName: "conversations.png",
    placeholderIcon: MessageSquare,
    placeholderText: "知识库测试界面",
    alt: "AI-CS 知识库测试界面",
  },
  {
    key: "prompts",
    title: "提示词工程",
    imageName: "prompts.png",
    placeholderIcon: Wand2,
    placeholderText: "提示词工程界面",
    alt: "AI-CS 提示词工程界面",
  },
  {
    key: "logs",
    title: "日志中心",
    imageName: "logs.png",
    placeholderIcon: ScrollText,
    placeholderText: "日志中心界面",
    alt: "AI-CS 日志中心界面",
  },
  {
    key: "analytics",
    title: "可视化报表",
    imageName: "analytics.png",
    placeholderIcon: LineChart,
    placeholderText: "可视化报表界面",
    alt: "AI-CS 可视化报表界面",
  },
];

export function HomePageClient() {
  const [visitorId, setVisitorId] = useState<number | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [activeScreenshot, setActiveScreenshot] = useState(0);

  useEffect(() => {
    let stored = window.localStorage.getItem("visitor_id");
    if (!stored) {
      stored = `${Date.now()}${Math.floor(Math.random() * 100000)}`;
      window.localStorage.setItem("visitor_id", stored);
    }
    const parsed = Number.parseInt(stored, 10);
    setVisitorId(Number.isNaN(parsed) ? null : parsed);
  }, []);

  const handleToggleChat = () => setIsChatOpen((prev) => !prev);

  const handleOpenChat = () => {
    if (visitorId === null) {
      setTimeout(() => setIsChatOpen(true), 500);
    } else {
      setIsChatOpen(true);
    }
  };

  const totalScreenshots = screenshotCards.length;
  const prevScreenshotIndex =
    (activeScreenshot - 1 + totalScreenshots) % totalScreenshots;
  const nextScreenshotIndex = (activeScreenshot + 1) % totalScreenshots;

  const goPrevScreenshot = () => {
    setActiveScreenshot((prev) => (prev - 1 + totalScreenshots) % totalScreenshots);
  };

  const goNextScreenshot = () => {
    setActiveScreenshot((prev) => (prev + 1) % totalScreenshots);
  };

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveScreenshot((prev) => (prev + 1) % totalScreenshots);
    }, 4800);
    return () => window.clearInterval(timer);
  }, [totalScreenshots]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />

      {/* Hero（回归旧版文案气质，保留新版三按钮） */}
      <section className="relative overflow-hidden border-b border-border/40">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_80%_at_50%_-20%,rgba(37,99,235,0.14),transparent_55%)]"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-b from-blue-50/80 via-background to-background"
          aria-hidden
        />
        <div className="container relative mx-auto px-6 pb-32 pt-20 md:pb-40 md:pt-28 lg:pt-28 xl:max-w-[1280px]">
          <FadeIn>
            <div className="mx-auto max-w-4xl text-center">
              <p className="mb-4 text-sm font-medium text-muted-foreground tracking-wide uppercase">
                AI 智能客服
              </p>
              <h1 className="mb-6 text-balance text-4xl font-bold tracking-tight text-foreground sm:text-5xl md:text-6xl md:leading-[1.12]">
                让客户服务更简单、更高效
              </h1>
              <p className="mx-auto mb-10 max-w-3xl text-pretty text-lg sm:text-xl text-muted-foreground leading-relaxed">
                7×24 小时智能应答，AI 与人工无缝切换，释放团队时间专注更有价值的事
              </p>
              <div className="flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                <Button
                  size="lg"
                  className="rounded-xl bg-blue-600 px-8 py-6 text-[15px] shadow-sm transition-all hover:bg-blue-500 hover:shadow-md"
                  onClick={handleOpenChat}
                >
                  立即体验
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="rounded-xl border-border/80 px-8 py-6 text-[15px] bg-background/60 backdrop-blur-sm"
                  asChild
                >
                  <Link
                    href="/agent/login"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2"
                  >
                    客服登录
                  </Link>
                </Button>
              </div>
              <p className="mt-4 text-sm text-muted-foreground">无需等待，可立即使用</p>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* 数字条（沿用旧版） */}
      <section className="py-16 md:py-20 border-t border-border/50">
        <FadeIn>
          <div className="container mx-auto px-6">
            <p className="text-xs font-medium text-muted-foreground text-center mb-8 tracking-wide">
              深受企业信赖
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-10 max-w-6xl mx-auto">
              {stats.map((stat) => (
                <div key={stat.label} className="text-center">
                  <div className="text-3xl md:text-4xl font-semibold text-foreground">{stat.value}</div>
                  <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </FadeIn>
      </section>

      {/* 核心能力 */}
      <section id="features" className="relative scroll-mt-20">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-200/50 to-transparent" aria-hidden />
        <div className="container mx-auto px-6 py-20 md:py-28">
          <FadeIn>
            <div className="mb-14 text-center px-4">
              <h2 className="mb-3 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                核心能力
              </h2>
              <p className="mx-auto max-w-xl text-base text-muted-foreground">
                从模型、知识库、提示词到人工协作、报表与日志，一套系统串起来。
              </p>
            </div>
          </FadeIn>
          <FadeInStagger className="mx-auto grid max-w-6xl grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
            {capabilityCards.map((item) => {
              const Icon = item.icon;
              return (
                <FadeInItem key={item.title}>
                  <Card className="group h-full border border-border/60 bg-card/90 shadow-sm backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-blue-200/70 hover:shadow-md">
                    <CardHeader className="pb-3">
                      <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl border border-blue-100/80 bg-gradient-to-br from-blue-50 to-background text-blue-700 transition-transform duration-300 group-hover:scale-[1.03]">
                        <Icon className="h-5 w-5" />
                      </div>
                      <CardTitle className="text-lg font-semibold tracking-tight">
                        {item.title}
                      </CardTitle>
                      <CardDescription className="text-sm leading-relaxed text-muted-foreground">
                        {item.description}
                      </CardDescription>
                    </CardHeader>
                  </Card>
                </FadeInItem>
              );
            })}
          </FadeInStagger>
        </div>
      </section>

      {/* 界面展示 */}
      <FadeIn>
        <section
          id="screenshots"
          className="scroll-mt-20 border-t border-border/40 bg-muted/20 py-20 md:py-28"
        >
          <div className="container mx-auto px-6">
            <div className="mb-14 text-center px-4">
              <h2 className="mb-3 text-3xl font-semibold tracking-tight sm:text-4xl">
                界面展示
              </h2>
              <p className="mx-auto max-w-xl text-muted-foreground">
                精心设计的界面，让管理更轻松
              </p>
            </div>
            <div className="mx-auto max-w-6xl">
              <div className="mb-8 flex flex-wrap justify-center gap-2">
                {screenshotCards.map((item, idx) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setActiveScreenshot(idx)}
                    className={`rounded-full px-4 py-1.5 text-sm transition-all ${
                      idx === activeScreenshot
                        ? "bg-blue-600 text-white shadow-sm"
                        : "bg-background text-muted-foreground border border-border/70 hover:text-foreground hover:border-blue-200"
                    }`}
                  >
                    {item.title}
                  </button>
                ))}
              </div>

              <div className="relative mx-auto max-w-6xl px-4 md:px-8">
                <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(80%_60%_at_50%_40%,rgba(37,99,235,0.14),transparent_70%)]" />

                <div className="relative h-[290px] md:h-[420px] lg:h-[510px]">
                  <button
                    type="button"
                    onClick={goPrevScreenshot}
                    className="absolute left-0 top-1/2 z-40 -translate-y-1/2 rounded-full border border-border/70 bg-background/90 p-2.5 shadow-sm backdrop-blur transition hover:border-blue-200 hover:bg-background"
                    aria-label="查看上一张"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>

                  <button
                    type="button"
                    onClick={goNextScreenshot}
                    className="absolute right-0 top-1/2 z-40 -translate-y-1/2 rounded-full border border-border/70 bg-background/90 p-2.5 shadow-sm backdrop-blur transition hover:border-blue-200 hover:bg-background"
                    aria-label="查看下一张"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>

                  {/* 左侧半露卡片 */}
                  <div className="absolute left-6 right-[42%] top-7 z-10 hidden overflow-hidden rounded-2xl border border-border/60 bg-background/85 shadow-md md:block">
                    <div className="pointer-events-none absolute inset-0 z-10 bg-background/18" />
                    <ScreenshotDisplay
                      imageName={screenshotCards[prevScreenshotIndex].imageName}
                      placeholderIcon={screenshotCards[prevScreenshotIndex].placeholderIcon}
                      placeholderText={screenshotCards[prevScreenshotIndex].placeholderText}
                      alt={screenshotCards[prevScreenshotIndex].alt}
                    />
                  </div>

                  {/* 右侧半露卡片 */}
                  <div className="absolute left-[42%] right-6 top-7 z-10 hidden overflow-hidden rounded-2xl border border-border/60 bg-background/85 shadow-md md:block">
                    <div className="pointer-events-none absolute inset-0 z-10 bg-background/18" />
                    <ScreenshotDisplay
                      imageName={screenshotCards[nextScreenshotIndex].imageName}
                      placeholderIcon={screenshotCards[nextScreenshotIndex].placeholderIcon}
                      placeholderText={screenshotCards[nextScreenshotIndex].placeholderText}
                      alt={screenshotCards[nextScreenshotIndex].alt}
                    />
                  </div>

                  {/* 中间主卡片 */}
                  <div className="absolute inset-x-8 top-0 z-30 overflow-hidden rounded-2xl border border-border/70 bg-background shadow-xl ring-1 ring-blue-100/60 md:inset-x-16 lg:inset-x-24">
                    <ScreenshotDisplay
                      imageName={screenshotCards[activeScreenshot].imageName}
                      placeholderIcon={screenshotCards[activeScreenshot].placeholderIcon}
                      placeholderText={screenshotCards[activeScreenshot].placeholderText}
                      alt={screenshotCards[activeScreenshot].alt}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </FadeIn>

      {/* 快速接入 */}
      <section id="quick-start" className="relative scroll-mt-20 border-t border-border/40">
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-border to-transparent"
          aria-hidden
        />
        <div className="container mx-auto px-6 py-20 md:py-28">
          <FadeIn>
            <div className="mb-12 text-center px-4">
              <h2 className="mb-3 text-3xl font-semibold tracking-tight sm:text-4xl">
                快速接入
              </h2>
              <p className="text-muted-foreground">三步跑通，从仓库到访客小窗。</p>
            </div>
          </FadeIn>
          <FadeInStagger className="mx-auto grid max-w-4xl grid-cols-1 gap-8 md:grid-cols-3">
            {steps.map((step, i) => (
              <FadeInItem key={step.title}>
                <div className="relative rounded-2xl border border-border/60 bg-card/50 p-6 text-center md:text-left transition-all duration-300 hover:border-blue-200/70 hover:shadow-md hover:-translate-y-0.5">
                  <div className="mx-auto mb-4 flex h-10 w-10 items-center justify-center rounded-full border border-blue-200/80 bg-blue-50/80 text-sm font-semibold text-blue-800 md:mx-0">
                    {i + 1}
                  </div>
                  <h3 className="mb-2 font-semibold">{step.title}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">{step.body}</p>
                </div>
              </FadeInItem>
            ))}
          </FadeInStagger>
        </div>
      </section>

      {/* 收尾 CTA */}
      <section className="relative border-t border-border/40 overflow-hidden">
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-br from-blue-600/[0.07] via-transparent to-blue-400/[0.06]"
          aria-hidden
        />
        <div className="container relative mx-auto px-6 py-20 text-center md:py-28">
          <FadeIn>
            <h2 className="mb-4 text-3xl font-semibold tracking-tight sm:text-4xl">
              准备好把 AI-CS 接到你的产品里了吗？
            </h2>
            <p className="mx-auto mb-10 max-w-lg text-muted-foreground leading-relaxed">
              从开源仓库开始，或用在线 Demo 先看交互与能力边界。
            </p>
            <div className="flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:flex-wrap sm:justify-center">
              <Button size="lg" className="rounded-xl bg-blue-600 px-8 shadow-sm hover:bg-blue-500" asChild>
                <a
                  href={websiteConfig.github.repo}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2"
                >
                  <Github className="h-4 w-4" />
                  Star / Fork 仓库
                </a>
              </Button>
              <Button size="lg" variant="outline" className="rounded-xl border-border/80 px-8 bg-background/80" asChild>
                <a
                  // 点击后直接唤起邮箱客户端（可在客户端自动带上主题/正文）
                  href={`mailto:2930134478@qq.com?subject=${encodeURIComponent("AI-CS 建议反馈")}&body=${encodeURIComponent(
                    "你好，我想反馈：\n\n1）问题/建议：\n2）影响范围/环境：\n3）期望结果：\n\n---\n联系方式（可选）："
                  )}`}
                  className="inline-flex items-center justify-center gap-2"
                >
                  建议反馈
                  <Mail className="h-3.5 w-3.5" />
                </a>
              </Button>
            </div>
          </FadeIn>
        </div>
      </section>

      <Footer />

      {visitorId !== null && (
        <>
          <FloatingButton onClick={handleToggleChat} isOpen={isChatOpen} />
          {isChatOpen && (
            <ChatWidget visitorId={visitorId} isOpen={isChatOpen} onToggle={handleToggleChat} />
          )}
        </>
      )}
    </div>
  );
}
