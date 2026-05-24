import "./global.css";
import { RootProvider } from "fumadocs-ui/provider";
import { Inter } from "next/font/google";
import type { ReactNode } from "react";
import type { Metadata } from "next";

const inter = Inter({ subsets: ["latin", "cyrillic"] });

export const metadata: Metadata = {
  title: {
    template: "%s — girl-agent docs",
    default: "girl-agent — документация",
  },
  description:
    "girl-agent — ИИ-девушка в Telegram. Документация для пользователей и разработчиков: установка, настройка, WebUI, аддоны, архитектура.",
  metadataBase: new URL("https://docs.girl-agent.com"),
  openGraph: {
    type: "website",
    url: "https://docs.girl-agent.com",
    siteName: "girl-agent docs",
    images: ["https://girl-agent.com/og-image.png"],
  },
  twitter: {
    card: "summary_large_image",
    images: ["https://girl-agent.com/og-image.png"],
  },
};

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang="ru" className={inter.className} suppressHydrationWarning>
      <body className="flex flex-col min-h-screen">
        <RootProvider
          search={{
            options: {
              type: "static",
            },
          }}
        >
          {children}
        </RootProvider>
      </body>
    </html>
  );
}
