"use client";

import Link from "next/link";
import { Github, Mail, MessageSquare } from "lucide-react";
import { websiteConfig } from "@/lib/website-config";
import { useI18n } from "@/lib/i18n/provider";

/**
 * 官网底部页脚
 */
export function Footer() {
  const { t } = useI18n();

  return (
    <footer className="border-t bg-muted/30">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          <div>
            <div className="mb-4 flex items-center space-x-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <span className="text-lg font-bold text-primary-foreground">AI</span>
              </div>
              <span className="text-lg font-bold">AI-CS</span>
            </div>
            <p className="mb-4 text-sm text-muted-foreground">{t("footer.blurb")}</p>
            <div className="flex items-center space-x-4">
              <a
                href={websiteConfig.github.repo}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground transition-colors hover:text-foreground"
                aria-label="GitHub"
              >
                <Github className="h-5 w-5" />
              </a>
            </div>
          </div>

          <div>
            <h3 className="mb-4 font-semibold">{t("footer.column.product")}</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="#features"
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  {t("nav.features")}
                </Link>
              </li>
              <li>
                <Link
                  href="#screenshots"
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  {t("nav.screenshots")}
                </Link>
              </li>
              <li>
                <Link
                  href="#quick-start"
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  {t("nav.quickStart")}
                </Link>
              </li>
              <li>
                <Link
                  href="/agent/login"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  {t("nav.agentLogin")}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="mb-4 font-semibold">{t("footer.column.friendLinks")}</h3>
            <ul className="space-y-2 text-sm">
              {websiteConfig.friendLinks.length > 0 ? (
                websiteConfig.friendLinks.map((link, index) => (
                  <li key={index}>
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {link.name}
                    </a>
                  </li>
                ))
              ) : (
                <li className="text-xs text-muted-foreground">{t("footer.noFriendLinks")}</li>
              )}
            </ul>
          </div>

          <div>
            <h3 className="mb-4 font-semibold">{t("footer.column.contact")}</h3>
            <ul className="space-y-3 text-sm">
              {websiteConfig.contact.email ? (
                <li className="flex items-center space-x-2 text-muted-foreground">
                  <Mail className="h-4 w-4 shrink-0" />
                  <a
                    href={`mailto:${websiteConfig.contact.email}`}
                    aria-label={t("footer.emailLabel")}
                    className="break-all transition-colors hover:text-foreground"
                  >
                    {websiteConfig.contact.email}
                  </a>
                </li>
              ) : null}
              <li className="flex items-center space-x-2 text-muted-foreground">
                <Github className="h-4 w-4" />
                <a
                  href={websiteConfig.github.repo}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition-colors hover:text-foreground"
                >
                  GitHub
                </a>
              </li>
              <li className="flex items-center space-x-2 text-muted-foreground">
                <MessageSquare className="h-4 w-4" />
                <Link href="/chat" className="transition-colors hover:text-foreground">
                  {t("footer.onlineChat")}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t pt-8 text-center text-sm text-muted-foreground">
          <p className="mb-2">
            © {websiteConfig.copyright.year} {websiteConfig.copyright.company}.{" "}
            {t("footer.allRightsReserved")}
          </p>
          <p>
            {t("footer.poweredBy")}{" "}
            <a
              href={websiteConfig.github.repo}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground transition-colors"
            >
              {t("footer.openSourceLicense")}
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
