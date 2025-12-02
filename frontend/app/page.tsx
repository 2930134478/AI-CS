"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* 顶部导航栏 */}
      <Header />

      {/* Hero 区域 */}
      <section className="container mx-auto px-4 py-20 md:py-32">
        <div className="max-w-4xl mx-auto text-center">
          <Badge className="mb-4" variant="secondary">
            AI 驱动的智能客服解决方案
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            AI-CS 智能客服系统
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            融合 AI 技术与人工客服，为企业提供高效、智能的客户服务解决方案
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="text-lg px-8" onClick={handleOpenChat}>
              立即体验
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            <Button asChild size="lg" variant="outline" className="text-lg px-8">
              <Link href="/agent/login">
                客服登录
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* 核心功能 */}
      <section id="features" className="container mx-auto px-4 py-16 md:py-24">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">核心功能</h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            强大的功能组合，满足企业客户服务的各种需求
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          <Card className="border-2 hover:border-primary/50 transition-colors">
            <CardHeader>
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Bot className="w-6 h-6 text-primary" />
              </div>
              <CardTitle>AI 智能客服</CardTitle>
              <CardDescription>
                支持多种 AI 模型，7x24 小时自动回复客户咨询
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-primary" />
                  多厂商 AI 模型支持
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-primary" />
                  智能对话理解
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-primary" />
                  自动上下文记忆
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-2 hover:border-primary/50 transition-colors">
            <CardHeader>
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <CardTitle>人工客服协作</CardTitle>
              <CardDescription>
                无缝切换 AI 与人工模式，提供最佳服务体验
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-primary" />
                  实时消息同步
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-primary" />
                  在线状态显示
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-primary" />
                  多客服协作支持
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-2 hover:border-primary/50 transition-colors">
            <CardHeader>
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <MessageSquare className="w-6 h-6 text-primary" />
              </div>
              <CardTitle>实时通信</CardTitle>
              <CardDescription>
                WebSocket 实时消息推送，确保消息即时到达
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-primary" />
                  双向实时通信
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-primary" />
                  消息已读状态
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-primary" />
                  文件/图片传输
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-2 hover:border-primary/50 transition-colors">
            <CardHeader>
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Zap className="w-6 h-6 text-primary" />
              </div>
              <CardTitle>快速响应</CardTitle>
              <CardDescription>
                优化的系统架构，确保低延迟、高并发
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-primary" />
                  毫秒级响应
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-primary" />
                  高并发支持
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-primary" />
                  自动重连机制
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-2 hover:border-primary/50 transition-colors">
            <CardHeader>
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Shield className="w-6 h-6 text-primary" />
              </div>
              <CardTitle>安全可靠</CardTitle>
              <CardDescription>
                企业级安全保障，数据加密存储
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-primary" />
                  API 密钥加密
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-primary" />
                  权限管理
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-primary" />
                  数据备份
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-2 hover:border-primary/50 transition-colors">
            <CardHeader>
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <BarChart3 className="w-6 h-6 text-primary" />
              </div>
              <CardTitle>数据统计</CardTitle>
              <CardDescription>
                全面的数据分析和报表功能
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-primary" />
                  会话统计
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-primary" />
                  客服工作量
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-primary" />
                  响应时间分析
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* 界面展示 */}
      <section id="screenshots" className="container mx-auto px-4 py-16 md:py-24">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">界面展示</h2>
          <p className="text-muted-foreground text-lg">
            直观易用的界面设计，提升工作效率
          </p>
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

      {/* 常见问题 */}
      <section id="faq" className="container mx-auto px-4 py-16 md:py-24 bg-muted/30 rounded-3xl my-16">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">常见问题</h2>
            <p className="text-muted-foreground text-lg">
              快速了解 AI-CS 智能客服系统
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="cursor-pointer hover:border-primary/50 transition-colors">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <HelpCircle className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-2">AI-CS 支持哪些 AI 模型？</h3>
                    <p className="text-muted-foreground text-sm">
                      AI-CS 支持多种 AI 大模型，包括 OpenAI、DeepSeek、百智云等主流平台，支持自定义 API 配置。
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:border-primary/50 transition-colors">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <HelpCircle className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-2">如何实现 AI 和人工客服的切换？</h3>
                    <p className="text-muted-foreground text-sm">
                      访客可以在聊天界面一键切换 AI 客服和人工客服模式，系统会自动处理会话转移。
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:border-primary/50 transition-colors">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <HelpCircle className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-2">系统支持文件上传吗？</h3>
                    <p className="text-muted-foreground text-sm">
                      支持，访客和客服都可以上传图片和文件，支持图片预览和文件下载功能。
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:border-primary/50 transition-colors">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <HelpCircle className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-2">如何集成到现有网站？</h3>
                    <p className="text-muted-foreground text-sm">
                      提供网页挂件（Widget）功能，只需在网站中嵌入一段代码即可，支持自定义样式和位置。
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:border-primary/50 transition-colors">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <HelpCircle className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-2">系统支持多客服协作吗？</h3>
                    <p className="text-muted-foreground text-sm">
                      支持，多个客服可以同时在线，系统支持会话分配、转接和协作功能。
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:border-primary/50 transition-colors">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <HelpCircle className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-2">数据安全如何保障？</h3>
                    <p className="text-muted-foreground text-sm">
                      系统采用 API 密钥加密存储，支持权限管理，所有数据都经过安全加密处理。
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
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
