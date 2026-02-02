"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  MessageSquare,
  Bot, 
  Users, 
  Zap, 
  Shield, 
  BarChart3,
  CheckCircle2,
  ArrowRight,
  Star,
  HelpCircle,
  LayoutDashboard,
  FileText,
  Globe
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";
import { ScreenshotDisplay } from "@/components/ScreenshotDisplay";
import { ChatWidget } from "@/components/visitor/ChatWidget";
import { FloatingButton } from "@/components/visitor/FloatingButton";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { FadeIn, FadeInStagger, FadeInItem } from "@/components/ui/fade-in";
import { stats, testimonials, partnerLogos } from "@/lib/stats-config";

/**
 * AI-CS 智能客服系统 - 产品官网首页
 * 
 * 包含：
 * - Hero 区域（主标题、副标题、CTA按钮）
 * - 核心功能介绍
 * - 产品特性
 * - 案例研究/客户评价
 * - 底部 CTA
 */
export default function HomePage() {
  const [visitorId, setVisitorId] = useState<number | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);

  // 初始化访客 ID（使用 localStorage 保持连续性）
  useEffect(() => {
    let stored = window.localStorage.getItem("visitor_id");
    if (!stored) {
      stored = `${Date.now()}${Math.floor(Math.random() * 100000)}`;
      window.localStorage.setItem("visitor_id", stored);
    }
    const parsed = Number.parseInt(stored, 10);
    setVisitorId(Number.isNaN(parsed) ? null : parsed);
  }, []);

  const handleToggleChat = () => {
    setIsChatOpen((prev) => !prev);
  };

  const handleOpenChat = () => {
    // 如果访客ID还没初始化，等待一下
    if (visitorId === null) {
      // 等待访客ID初始化后再打开
      setTimeout(() => {
        setIsChatOpen(true);
      }, 500);
    } else {
      // 直接打开聊天窗口
      setIsChatOpen(true);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero - Chatbase 风格：简洁、留白、一句主标题 + 副标题 + CTA */}
      <section className="container mx-auto px-4 pt-20 pb-28 md:pt-28 md:pb-36 lg:pt-36 lg:pb-44 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-muted/30 to-transparent pointer-events-none" />
        <div className="max-w-3xl mx-auto text-center relative z-10">
          <p className="text-sm font-medium text-muted-foreground tracking-wide uppercase mb-4">
            AI 智能客服
          </p>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-foreground tracking-tight mb-6 leading-[1.15]">
            让客户服务更简单、更高效
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground mb-10 max-w-xl mx-auto leading-relaxed">
            7×24 小时智能应答，AI 与人工无缝切换，释放团队时间专注更有价值的事
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button
              size="lg"
              className="w-full sm:w-auto text-base px-8 py-6 rounded-xl shadow-sm hover:shadow transition-shadow"
              onClick={handleOpenChat}
            >
              免费试用
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="w-full sm:w-auto text-base px-8 py-6 rounded-xl border border-border hover:bg-muted/50"
            >
              <Link href="/agent/login">客服登录</Link>
            </Button>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">无需信用卡，立即可用</p>
        </div>
      </section>

      {/* 信任数据 - 轻量展示 */}
      <section className="py-12 md:py-16 border-t border-border/50">
        <FadeIn>
          <div className="container mx-auto px-4">
            <p className="text-xs font-medium text-muted-foreground text-center mb-8 tracking-wide">
              深受企业信赖
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
              {stats.map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="text-2xl md:text-3xl font-semibold text-foreground">{stat.value}</div>
                  <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </FadeIn>
      </section>

      {/* Logo 墙 - 有数据时展示 */}
      {partnerLogos.length > 0 && (
        <section className="py-12 md:py-16 border-t border-border/50">
          <FadeIn>
            <div className="container mx-auto px-4">
              <div className="flex flex-wrap items-center justify-center gap-10 md:gap-14 opacity-50">
                {partnerLogos.map((partner, index) => (
                  <div
                    key={index}
                    className="text-sm text-muted-foreground font-medium hover:opacity-100 transition-opacity"
                  >
                    {partner.name}
                  </div>
                ))}
              </div>
            </div>
          </FadeIn>
        </section>
      )}

      {/* 核心功能 */}
      <section id="features" className="container mx-auto px-4 py-20 md:py-28">
        <FadeIn>
          <div className="text-center mb-14 px-4">
            <h2 className="text-2xl sm:text-3xl font-semibold text-foreground tracking-tight mb-3">
              功能特性
            </h2>
            <p className="text-muted-foreground text-base max-w-xl mx-auto">
              专业、及时的服务体验，让每个客户都感受到高效与可靠
            </p>
          </div>
        </FadeIn>
        <FadeInStagger className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 max-w-6xl mx-auto px-4">
          <FadeInItem>
          <Card className="border border-border bg-card hover:border-primary/30 hover:shadow-md shadow-sm transition-all duration-200 group">
            <CardHeader>
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors duration-300">
                <Bot className="w-6 h-6 text-primary group-hover:scale-110 transition-transform duration-300" />
              </div>
              <CardTitle>7×24 小时智能应答</CardTitle>
              <CardDescription>
                让 AI 帮你处理常见问题，释放团队时间，专注于更有价值的工作
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-primary" />
                  支持多种 AI 模型，选择最适合你的
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-primary" />
                  智能理解客户意图，准确回答
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-primary" />
                  记住对话上下文，体验更自然
                </li>
              </ul>
            </CardContent>
          </Card>
          </FadeInItem>

          <FadeInItem>
          <Card className="border border-border bg-card hover:border-primary/30 hover:shadow-md shadow-sm transition-all duration-200 group">
            <CardHeader>
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors duration-300">
                <Users className="w-6 h-6 text-primary group-hover:scale-110 transition-transform duration-300" />
              </div>
              <CardTitle>无缝切换 AI 与人工</CardTitle>
              <CardDescription>
                复杂问题一键转人工，让客户随时得到最合适的帮助
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-primary" />
                  消息实时同步，无缝衔接
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-primary" />
                  清晰显示在线状态，客户一目了然
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-primary" />
                  多客服协作，高效处理复杂问题
                </li>
              </ul>
            </CardContent>
          </Card>
          </FadeInItem>

          <FadeInItem>
          <Card className="border border-border bg-card hover:border-primary/30 hover:shadow-md shadow-sm transition-all duration-200 group">
            <CardHeader>
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors duration-300">
                <MessageSquare className="w-6 h-6 text-primary group-hover:scale-110 transition-transform duration-300" />
              </div>
              <CardTitle>消息即时到达</CardTitle>
              <CardDescription>
                毫秒级响应，让客户感受到专业、及时的服务体验
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-primary" />
                  双向实时通信，就像面对面交流
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-primary" />
                  消息已读状态，沟通更透明
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-primary" />
                  支持文件图片，沟通更便捷
                </li>
              </ul>
            </CardContent>
          </Card>
          </FadeInItem>

          <FadeInItem>
          <Card className="border border-border bg-card hover:border-primary/30 hover:shadow-md shadow-sm transition-all duration-200 group">
            <CardHeader>
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors duration-300">
                <Zap className="w-6 h-6 text-primary group-hover:scale-110 transition-transform duration-300" />
              </div>
              <CardTitle>极速响应，稳定可靠</CardTitle>
              <CardDescription>
                毫秒级响应速度，轻松应对高并发，让服务永不中断
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-primary" />
                  毫秒级响应，客户无需等待
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-primary" />
                  高并发支持，业务增长无压力
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-primary" />
                  自动重连，服务永不中断
                </li>
              </ul>
            </CardContent>
          </Card>
          </FadeInItem>

          <FadeInItem>
          <Card className="border border-border bg-card hover:border-primary/30 hover:shadow-md shadow-sm transition-all duration-200 group">
            <CardHeader>
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors duration-300">
                <Shield className="w-6 h-6 text-primary group-hover:scale-110 transition-transform duration-300" />
              </div>
              <CardTitle>企业级安全保障</CardTitle>
              <CardDescription>
                数据加密存储，权限精细管理，让您的业务数据安全无忧
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-primary" />
                  API 密钥加密，安全可靠
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-primary" />
                  精细权限管理，灵活可控
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-primary" />
                  自动数据备份，万无一失
                </li>
              </ul>
            </CardContent>
          </Card>
          </FadeInItem>

          <FadeInItem>
          <Card className="border border-border bg-card hover:border-primary/30 hover:shadow-md shadow-sm transition-all duration-200 group">
            <CardHeader>
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors duration-300">
                <BarChart3 className="w-6 h-6 text-primary group-hover:scale-110 transition-transform duration-300" />
              </div>
              <CardTitle>数据驱动决策</CardTitle>
              <CardDescription>
                全面的数据分析，帮助您了解客户需求，优化服务质量
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-primary" />
                  会话统计分析，洞察客户需求
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-primary" />
                  客服工作量统计，合理分配资源
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-primary" />
                  响应时间分析，持续优化服务
                </li>
              </ul>
            </CardContent>
          </Card>
          </FadeInItem>
        </FadeInStagger>
      </section>

      {/* 界面展示 */}
      <FadeIn>
      <section id="screenshots" className="container mx-auto px-4 py-20 md:py-28 border-t border-border/50">
        <div className="text-center mb-14 px-4">
          <h2 className="text-2xl sm:text-3xl font-semibold text-foreground tracking-tight mb-3">界面展示</h2>
          <p className="text-muted-foreground text-base max-w-xl mx-auto">精心设计的界面，让管理更轻松</p>
        </div>
        <div className="max-w-6xl mx-auto">
          <Tabs defaultValue="dashboard" className="w-full">
            <TabsList className="grid w-full grid-cols-3 md:grid-cols-5 mb-8">
              <TabsTrigger value="dashboard">工作台</TabsTrigger>
              <TabsTrigger value="visitor">访客端</TabsTrigger>
              <TabsTrigger value="ai-config">AI配置</TabsTrigger>
              <TabsTrigger value="users">用户管理</TabsTrigger>
              <TabsTrigger value="faq">FAQ管理</TabsTrigger>
            </TabsList>
            <TabsContent value="dashboard" className="mt-0">
              <div className="border rounded-lg overflow-hidden">
                <ScreenshotDisplay
                  imageName="dashboard.png"
                  placeholderIcon={LayoutDashboard}
                  placeholderText="工作台界面"
                  alt="AI-CS 工作台界面"
                />
              </div>
            </TabsContent>
            <TabsContent value="visitor" className="mt-0">
              <div className="border rounded-lg overflow-hidden">
                <ScreenshotDisplay
                  imageName="visitor.png"
                  placeholderIcon={Globe}
                  placeholderText="访客端界面"
                  alt="AI-CS 访客端界面"
                />
              </div>
            </TabsContent>
            <TabsContent value="ai-config" className="mt-0">
              <div className="border rounded-lg overflow-hidden">
                <ScreenshotDisplay
                  imageName="ai-config.png"
                  placeholderIcon={Bot}
                  placeholderText="AI配置界面"
                  alt="AI-CS AI配置界面"
                />
              </div>
            </TabsContent>
            <TabsContent value="users" className="mt-0">
              <div className="border rounded-lg overflow-hidden">
                <ScreenshotDisplay
                  imageName="users.png"
                  placeholderIcon={Users}
                  placeholderText="用户管理界面"
                  alt="AI-CS 用户管理界面"
                />
              </div>
            </TabsContent>
            <TabsContent value="faq" className="mt-0">
              <div className="border rounded-lg overflow-hidden">
                <ScreenshotDisplay
                  imageName="faq.png"
                  placeholderIcon={FileText}
                  placeholderText="FAQ管理界面"
                  alt="AI-CS FAQ管理界面"
                />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </section>
      </FadeIn>

      {/* 客户评价 */}
      <section id="testimonials" className="container mx-auto px-4 py-12 md:py-16 lg:py-24">
        <FadeIn>
            <div className="text-center mb-8 md:mb-12 px-4">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 md:mb-4">客户评价</h2>
              <p className="text-muted-foreground text-base sm:text-lg max-w-2xl mx-auto">
                已有众多企业选择我们，让客户服务变得更简单
              </p>
            </div>
        </FadeIn>
        <FadeInStagger className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 max-w-6xl mx-auto px-4">
          {testimonials.map((testimonial, index) => (
            <FadeInItem key={index}>
              <Card className="border-2 hover:border-primary/50 hover:scale-[1.02] hover:shadow-xl shadow-lg transition-all duration-300 h-full flex flex-col">
                <CardContent className="p-6 flex flex-col flex-1">
                  <div className="flex items-center gap-1 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className="w-4 h-4 fill-yellow-400 text-yellow-400"
                      />
                    ))}
                  </div>
                  <p className="text-muted-foreground mb-6 flex-1 leading-relaxed">
                    "{testimonial.content}"
                  </p>
                  <div className="flex items-center gap-3 pt-4 border-t">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Users className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <div className="font-semibold text-sm">{testimonial.name}</div>
                      <div className="text-xs text-muted-foreground">{testimonial.company}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </FadeInItem>
          ))}
        </FadeInStagger>
      </section>

      {/* 常见问题 */}
      <section id="faq" className="container mx-auto px-4 py-20 md:py-28 border-t border-border/50">
        <div className="max-w-4xl mx-auto">
          <FadeIn>
            <div className="text-center mb-14 px-4">
              <h2 className="text-2xl sm:text-3xl font-semibold text-foreground tracking-tight mb-3">常见问题</h2>
              <p className="text-muted-foreground text-base max-w-xl mx-auto">快速了解 AI-CS，解答您的疑问</p>
            </div>
          </FadeIn>
          <FadeInStagger className="grid grid-cols-1 md:grid-cols-2 gap-4 px-4">
            <FadeInItem>
            <Card className="border border-border bg-card hover:border-primary/30 hover:shadow-md shadow-sm transition-all duration-200 group">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors duration-300">
                    <HelpCircle className="w-5 h-5 text-primary group-hover:scale-110 transition-transform duration-300" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-2">AI-CS 支持哪些 AI 模型？</h3>
                    <p className="text-muted-foreground text-sm">
                      支持 OpenAI、DeepSeek、百智云等主流 AI 平台，您可以选择最适合的模型，也可以自定义 API 配置，灵活便捷。
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            </FadeInItem>

            <FadeInItem>
            <Card className="border border-border bg-card hover:border-primary/30 hover:shadow-md shadow-sm transition-all duration-200 group">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors duration-300">
                    <HelpCircle className="w-5 h-5 text-primary group-hover:scale-110 transition-transform duration-300" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-2">如何实现 AI 和人工客服的切换？</h3>
                    <p className="text-muted-foreground text-sm">
                      访客只需一键即可切换，复杂问题转人工，简单问题 AI 处理，系统会自动无缝衔接，让客户体验更流畅。
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            </FadeInItem>

            <FadeInItem>
            <Card className="border border-border bg-card hover:border-primary/30 hover:shadow-md shadow-sm transition-all duration-200 group">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors duration-300">
                    <HelpCircle className="w-5 h-5 text-primary group-hover:scale-110 transition-transform duration-300" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-2">系统支持文件上传吗？</h3>
                    <p className="text-muted-foreground text-sm">
                      完全支持！访客和客服都可以上传图片和文件，支持图片预览和文件下载，让沟通更直观、更高效。
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            </FadeInItem>

            <FadeInItem>
            <Card className="border border-border bg-card hover:border-primary/30 hover:shadow-md shadow-sm transition-all duration-200 group">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors duration-300">
                    <HelpCircle className="w-5 h-5 text-primary group-hover:scale-110 transition-transform duration-300" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-2">如何集成到现有网站？</h3>
                    <p className="text-muted-foreground text-sm">
                      只需在网站中嵌入一段代码即可，支持自定义样式和位置，几分钟就能完成集成，无需复杂配置。
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            </FadeInItem>

            <FadeInItem>
            <Card className="border border-border bg-card hover:border-primary/30 hover:shadow-md shadow-sm transition-all duration-200 group">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors duration-300">
                    <HelpCircle className="w-5 h-5 text-primary group-hover:scale-110 transition-transform duration-300" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-2">系统支持多客服协作吗？</h3>
                    <p className="text-muted-foreground text-sm">
                      完全支持！多个客服可以同时在线，支持会话智能分配、一键转接和团队协作，让服务更高效。
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            </FadeInItem>

            <FadeInItem>
            <Card className="border border-border bg-card hover:border-primary/30 hover:shadow-md shadow-sm transition-all duration-200 group">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors duration-300">
                    <HelpCircle className="w-5 h-5 text-primary group-hover:scale-110 transition-transform duration-300" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-2">数据安全如何保障？</h3>
                    <p className="text-muted-foreground text-sm">
                      企业级安全保障，API 密钥加密存储，精细权限管理，所有数据都经过安全加密处理，让您放心使用。
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            </FadeInItem>
          </FadeInStagger>
        </div>
      </section>

      {/* 底部 CTA - Chatbase 风格 */}
      <section className="border-t border-border/50 py-20 md:py-28">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl sm:text-3xl font-semibold text-foreground tracking-tight mb-3">
            让客户体验成为你的竞争力
          </h2>
          <p className="text-muted-foreground text-base mb-8 max-w-lg mx-auto">
            用 AI-CS 提供更专业、更高效的客户服务，拉开与竞品的差距
          </p>
          <Button
            size="lg"
            className="rounded-xl px-8 py-6 shadow-sm hover:shadow transition-shadow"
            onClick={handleOpenChat}
          >
            免费试用
            <ArrowRight className="ml-2 w-4 h-4" />
          </Button>
          <p className="mt-4 text-sm text-muted-foreground">无需信用卡，立即可用</p>
        </div>
      </section>

      {/* 页脚 */}
      <Footer />

      {/* 客服插件 */}
      {visitorId !== null && (
        <>
          {/* 浮动按钮 */}
          <FloatingButton onClick={handleToggleChat} isOpen={isChatOpen} />
          {/* 聊天小窗 */}
          {isChatOpen && (
            <ChatWidget
              visitorId={visitorId}
              isOpen={isChatOpen}
              onToggle={handleToggleChat}
            />
          )}
        </>
      )}
    </div>
  );
}
