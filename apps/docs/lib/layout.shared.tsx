import type { BaseLayoutProps } from "fumadocs-ui/layouts/shared";
import { BookOpen, Github, Send } from "lucide-react";

export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      title: (
        <span className="flex items-center gap-2 font-semibold">
          <BookOpen className="h-5 w-5 text-fd-primary" />
          girl-agent
          <span className="text-xs font-normal text-fd-muted-foreground">docs</span>
        </span>
      ),
      url: "/",
    },
    links: [
      {
        text: "Главная",
        url: "https://girl-agent.com",
        active: "none",
      },
      {
        text: "Telegram",
        url: "https://t.me/GirlAgentAI",
        icon: <Send className="h-4 w-4" />,
        active: "none",
      },
      {
        text: "GitHub",
        url: "https://github.com/TheSashaDev/girl-agent",
        icon: <Github className="h-4 w-4" />,
        active: "none",
      },
    ],
    githubUrl: "https://github.com/TheSashaDev/girl-agent",
  };
}
