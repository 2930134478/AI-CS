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
import type { I18nKey } from "@/lib/i18n/dict";
import { useI18n } from "@/lib/i18n/provider";
import type { LucideIcon } from "lucide-react";

const CAPABILITY_ITEMS: {
  icon: LucideIcon;
  titleKey: I18nKey;
  descKey: I18nKey;
}[] = [
  { icon: Bot, titleKey: "home.cap.multimodel.title", descKey: "home.cap.multimodel.desc" },
  { icon: BookOpen, titleKey: "home.cap.kb.title", descKey: "home.cap.kb.desc" },
  { icon: Wand2, titleKey: "home.cap.prompt.title", descKey: "home.cap.prompt.desc" },
  { icon: Users, titleKey: "home.cap.human.title", descKey: "home.cap.human.desc" },
  { icon: LineChart, titleKey: "home.cap.reports.title", descKey: "home.cap.reports.desc" },
  { icon: ScrollText, titleKey: "home.cap.logs.title", descKey: "home.cap.logs.desc" },
];

const QUICK_STEPS: { titleKey: I18nKey; bodyKey: I18nKey }[] = [
  { titleKey: "home.step1.title", bodyKey: "home.step1.body" },
  { titleKey: "home.step2.title", bodyKey: "home.step2.body" },
  { titleKey: "home.step3.title", bodyKey: "home.step3.body" },
];

const SCREENSHOT_ITEMS: {
  slug: string;
  imageName: string;
  placeholderIcon: LucideIcon;
  titleKey: I18nKey;
  placeholderKey: I18nKey;
  altKey: I18nKey;
}[] = [
  {
    slug: "dashboard",
    imageName: "dashboard.png",
    placeholderIcon: LayoutDashboard,
    titleKey: "home.ss.dashboard.title",
    placeholderKey: "home.ss.dashboard.placeholder",
    altKey: "home.ss.dashboard.alt",
  },
  {
    slug: "visitor",
    imageName: "visitor.png",
    placeholderIcon: Globe,
    titleKey: "home.ss.visitor.title",
    placeholderKey: "home.ss.visitor.placeholder",
    altKey: "home.ss.visitor.alt",
  },
  {
    slug: "ai-config",
    imageName: "ai-config.png",
    placeholderIcon: Bot,
    titleKey: "home.ss.aiconfig.title",
    placeholderKey: "home.ss.aiconfig.placeholder",
    altKey: "home.ss.aiconfig.alt",
  },
  {
    slug: "users",
    imageName: "users.png",
    placeholderIcon: Users,
    titleKey: "home.ss.users.title",
    placeholderKey: "home.ss.users.placeholder",
    altKey: "home.ss.users.alt",
  },
  {
    slug: "faq",
    imageName: "faq.png",
    placeholderIcon: FileText,
    titleKey: "home.ss.faq.title",
    placeholderKey: "home.ss.faq.placeholder",
    altKey: "home.ss.faq.alt",
  },
  {
    slug: "knowledge",
    imageName: "knowledge.png",
    placeholderIcon: BookOpen,
    titleKey: "home.ss.knowledge.title",
    placeholderKey: "home.ss.knowledge.placeholder",
    altKey: "home.ss.knowledge.alt",
  },
  {
    slug: "conversations",
    imageName: "conversations.png",
    placeholderIcon: MessageSquare,
    titleKey: "home.ss.kbtest.title",
    placeholderKey: "home.ss.kbtest.placeholder",
    altKey: "home.ss.kbtest.alt",
  },
  {
    slug: "prompts",
    imageName: "prompts.png",
    placeholderIcon: Wand2,
    titleKey: "home.ss.prompts.title",
    placeholderKey: "home.ss.prompts.placeholder",
    altKey: "home.ss.prompts.alt",
  },
  {
    slug: "logs",
    imageName: "logs.png",
    placeholderIcon: ScrollText,
    titleKey: "home.ss.logs.title",
    placeholderKey: "home.ss.logs.placeholder",
    altKey: "home.ss.logs.alt",
  },
  {
    slug: "analytics",
    imageName: "analytics.png",
    placeholderIcon: LineChart,
    titleKey: "home.ss.analytics.title",
    placeholderKey: "home.ss.analytics.placeholder",
    altKey: "home.ss.analytics.alt",
  },
];

export function HomePageClient() {
  const { t } = useI18n();
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

  const totalScreenshots = SCREENSHOT_ITEMS.length;
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
                {t("home.hero.tagline")}
              </p>
              <h1 className="mb-6 text-balance text-4xl font-bold tracking-tight text-foreground sm:text-5xl md:text-6xl md:leading-[1.12]">
                {t("home.hero.title")}
              </h1>
              <p className="mx-auto mb-10 max-w-3xl text-pretty text-lg sm:text-xl text-muted-foreground leading-relaxed">
                {t("home.hero.subtitle")}
              </p>
              <div className="flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                <Button
                  size="lg"
                  className="rounded-xl bg-blue-600 px-8 py-6 text-[15px] shadow-sm transition-all hover:bg-blue-500 hover:shadow-md"
                  onClick={handleOpenChat}
                >
                  {t("home.hero.cta.tryNow")}
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
                    {t("home.hero.cta.agentLogin")}
                  </Link>
                </Button>
              </div>
              <p className="mt-4 text-sm text-muted-foreground">{t("home.hero.hint")}</p>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* 数字条（沿用旧版） */}
      <section className="py-16 md:py-20 border-t border-border/50">
        <FadeIn>
          <div className="container mx-auto px-6">
            <p className="text-xs font-medium text-muted-foreground text-center mb-8 tracking-wide">
              {t("home.stats.trustedBy")}
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-10 max-w-6xl mx-auto">
              {stats.map((stat) => (
                <div key={stat.labelKey} className="text-center">
                  <div className="text-3xl md:text-4xl font-semibold text-foreground">
                    {t(stat.valueKey)}
                  </div>
                  <div className="mt-1 text-sm text-muted-foreground">{t(stat.labelKey)}</div>
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
                {t("home.features.title")}
              </h2>
              <p className="mx-auto max-w-xl text-base text-muted-foreground">
                {t("home.features.lead")}
              </p>
            </div>
          </FadeIn>
          <FadeInStagger className="mx-auto grid max-w-6xl grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
            {CAPABILITY_ITEMS.map((item) => {
              const Icon = item.icon;
              return (
                <FadeInItem key={item.titleKey}>
                  <Card className="group h-full border border-border/60 bg-card/90 shadow-sm backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-blue-200/70 hover:shadow-md">
                    <CardHeader className="pb-3">
                      <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl border border-blue-100/80 bg-gradient-to-br from-blue-50 to-background text-blue-700 transition-transform duration-300 group-hover:scale-[1.03]">
                        <Icon className="h-5 w-5" />
                      </div>
                      <CardTitle className="text-lg font-semibold tracking-tight">
                        {t(item.titleKey)}
                      </CardTitle>
                      <CardDescription className="text-sm leading-relaxed text-muted-foreground">
                        {t(item.descKey)}
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
                {t("home.screenshots.title")}
              </h2>
              <p className="mx-auto max-w-xl text-muted-foreground">
                {t("home.screenshots.lead")}
              </p>
            </div>
            <div className="mx-auto max-w-6xl">
              <div className="mb-8 flex flex-wrap justify-center gap-2">
                {SCREENSHOT_ITEMS.map((item, idx) => (
                  <button
                    key={item.slug}
                    type="button"
                    onClick={() => setActiveScreenshot(idx)}
                    className={`rounded-full px-4 py-1.5 text-sm transition-all ${
                      idx === activeScreenshot
                        ? "bg-blue-600 text-white shadow-sm"
                        : "bg-background text-muted-foreground border border-border/70 hover:text-foreground hover:border-blue-200"
                    }`}
                  >
                    {t(item.titleKey)}
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
                    aria-label={t("home.screenshots.prevAria")}
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>

                  <button
                    type="button"
                    onClick={goNextScreenshot}
                    className="absolute right-0 top-1/2 z-40 -translate-y-1/2 rounded-full border border-border/70 bg-background/90 p-2.5 shadow-sm backdrop-blur transition hover:border-blue-200 hover:bg-background"
                    aria-label={t("home.screenshots.nextAria")}
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>

                  {/* 左侧半露卡片 */}
                  <div className="absolute left-6 right-[42%] top-7 z-10 hidden overflow-hidden rounded-2xl border border-border/60 bg-background/85 shadow-md md:block">
                    <div className="pointer-events-none absolute inset-0 z-10 bg-background/18" />
                    <ScreenshotDisplay
                      imageName={SCREENSHOT_ITEMS[prevScreenshotIndex].imageName}
                      placeholderIcon={SCREENSHOT_ITEMS[prevScreenshotIndex].placeholderIcon}
                      placeholderText={t(SCREENSHOT_ITEMS[prevScreenshotIndex].placeholderKey)}
                      alt={t(SCREENSHOT_ITEMS[prevScreenshotIndex].altKey)}
                    />
                  </div>

                  {/* 右侧半露卡片 */}
                  <div className="absolute left-[42%] right-6 top-7 z-10 hidden overflow-hidden rounded-2xl border border-border/60 bg-background/85 shadow-md md:block">
                    <div className="pointer-events-none absolute inset-0 z-10 bg-background/18" />
                    <ScreenshotDisplay
                      imageName={SCREENSHOT_ITEMS[nextScreenshotIndex].imageName}
                      placeholderIcon={SCREENSHOT_ITEMS[nextScreenshotIndex].placeholderIcon}
                      placeholderText={t(SCREENSHOT_ITEMS[nextScreenshotIndex].placeholderKey)}
                      alt={t(SCREENSHOT_ITEMS[nextScreenshotIndex].altKey)}
                    />
                  </div>

                  {/* 中间主卡片 */}
                  <div className="absolute inset-x-8 top-0 z-30 overflow-hidden rounded-2xl border border-border/70 bg-background shadow-xl ring-1 ring-blue-100/60 md:inset-x-16 lg:inset-x-24">
                    <ScreenshotDisplay
                      imageName={SCREENSHOT_ITEMS[activeScreenshot].imageName}
                      placeholderIcon={SCREENSHOT_ITEMS[activeScreenshot].placeholderIcon}
                      placeholderText={t(SCREENSHOT_ITEMS[activeScreenshot].placeholderKey)}
                      alt={t(SCREENSHOT_ITEMS[activeScreenshot].altKey)}
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
                {t("home.quickStart.title")}
              </h2>
              <p className="text-muted-foreground">{t("home.quickStart.lead")}</p>
            </div>
          </FadeIn>
          <FadeInStagger className="mx-auto grid max-w-4xl grid-cols-1 gap-8 md:grid-cols-3">
            {QUICK_STEPS.map((step, i) => (
              <FadeInItem key={step.titleKey}>
                <div className="relative rounded-2xl border border-border/60 bg-card/50 p-6 text-center md:text-left transition-all duration-300 hover:border-blue-200/70 hover:shadow-md hover:-translate-y-0.5">
                  <div className="mx-auto mb-4 flex h-10 w-10 items-center justify-center rounded-full border border-blue-200/80 bg-blue-50/80 text-sm font-semibold text-blue-800 md:mx-0">
                    {i + 1}
                  </div>
                  <h3 className="mb-2 font-semibold">{t(step.titleKey)}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">{t(step.bodyKey)}</p>
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
              {t("home.cta.title")}
            </h2>
            <p className="mx-auto mb-10 max-w-lg text-muted-foreground leading-relaxed">
              {t("home.cta.subtitle")}
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
                  {t("home.cta.starRepo")}
                </a>
              </Button>
              <Button size="lg" variant="outline" className="rounded-xl border-border/80 px-8 bg-background/80" asChild>
                <a
                  href={`mailto:2930134478@qq.com?subject=${encodeURIComponent(t("home.cta.mailSubject"))}&body=${encodeURIComponent(t("home.cta.mailBody"))}`}
                  className="inline-flex items-center justify-center gap-2"
                >
                  {t("home.cta.feedback")}
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
