"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";
import { Github, Menu } from "lucide-react";
import { websiteConfig } from "@/lib/website-config";
import { LanguageSwitcher } from "@/components/i18n/LanguageSwitcher";
import { useI18n } from "@/lib/i18n/provider";

/**
 * 官网顶部导航栏
 * 包含 Logo、导航链接和 GitHub 链接
 */
export function Header() {
  const { t } = useI18n();
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-md">
      <div className="container mx-auto px-6">
        <div className="flex h-16 md:h-20 items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-semibold text-sm">AI</span>
            </div>
            <span className="text-[19px] font-semibold text-foreground tracking-tight">AI-CS</span>
          </Link>

          <div className="flex items-center gap-2 sm:gap-4 md:gap-8">
            <Sheet>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden"
                  aria-label={t("nav.menu")}
                >
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[min(100vw-2rem,20rem)]">
                <SheetHeader>
                  <SheetTitle className="text-left">{t("nav.menu")}</SheetTitle>
                </SheetHeader>
                <nav className="flex flex-col gap-1 mt-8">
                  <SheetClose asChild>
                    <Link
                      href="#features"
                      className="py-3 text-[15px] text-muted-foreground hover:text-foreground transition-colors border-b border-border/60"
                    >
                      {t("nav.features")}
                    </Link>
                  </SheetClose>
                  <SheetClose asChild>
                    <Link
                      href="#screenshots"
                      className="py-3 text-[15px] text-muted-foreground hover:text-foreground transition-colors border-b border-border/60"
                    >
                      {t("nav.screenshots")}
                    </Link>
                  </SheetClose>
                  <SheetClose asChild>
                    <Link
                      href="#quick-start"
                      className="py-3 text-[15px] text-muted-foreground hover:text-foreground transition-colors border-b border-border/60"
                    >
                      {t("nav.quickStart")}
                    </Link>
                  </SheetClose>
                  <SheetClose asChild>
                    <Link
                      href="/agent/login"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="py-3 text-[15px] text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {t("nav.agentLogin")}
                    </Link>
                  </SheetClose>
                </nav>
              </SheetContent>
            </Sheet>

            <nav className="hidden md:flex items-center gap-6">
              <Link
                href="#features"
                className="text-[15px] text-muted-foreground hover:text-foreground transition-colors"
              >
                {t("nav.features")}
              </Link>
              <Link
                href="#screenshots"
                className="text-[15px] text-muted-foreground hover:text-foreground transition-colors"
              >
                {t("nav.screenshots")}
              </Link>
              <Link
                href="#quick-start"
                className="text-[15px] text-muted-foreground hover:text-foreground transition-colors"
              >
                {t("nav.quickStart")}
              </Link>
              <Link
                href="/agent/login"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[15px] text-muted-foreground hover:text-foreground transition-colors"
              >
                {t("nav.agentLogin")}
              </Link>
            </nav>

            <LanguageSwitcher variant="ghost" size="sm" className="hidden sm:flex text-muted-foreground hover:text-foreground" />
            <Button variant="ghost" size="sm" asChild className="hidden sm:flex text-muted-foreground hover:text-foreground">
              <a
                href={websiteConfig.github.repo}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2"
              >
                <Github className="w-4 h-4" />
                <span>{t("common.github")}</span>
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
            <LanguageSwitcher variant="ghost" size="icon" className="sm:hidden text-muted-foreground hover:text-foreground" />
          </div>
        </div>
      </div>
    </header>
  );
}

