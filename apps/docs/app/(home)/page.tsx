import Link from "next/link";
import {
  ArrowRight,
  Bot,
  Code2,
  HeartHandshake,
  MessagesSquare,
  Moon,
  Puzzle,
  Sparkles,
  Terminal,
  Workflow,
} from "lucide-react";

export default function HomePage() {
  return (
    <main className="container mx-auto flex flex-col gap-16 px-4 py-16">
      <section className="flex flex-col items-center gap-6 text-center">
        <span className="rounded-full border border-fd-border bg-fd-secondary/40 px-4 py-1 text-xs font-medium text-fd-muted-foreground">
          docs · girl-agent
        </span>
        <h1 className="text-4xl font-bold tracking-tight md:text-6xl">
          ИИ-девушка в&nbsp;Telegram,
          <br />
          которая ведёт&nbsp;себя как&nbsp;человек
        </h1>
        <p className="max-w-2xl text-lg text-fd-muted-foreground">
          Пишет с маленькой буквы, иногда игнорит, спит, обижается, помнит вчерашнее. Без
          «конечно, я понимаю», без markdown, без AI-повадок. Полное руководство — от установки в
          одну команду до архитектуры движка.
        </p>
        <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/docs/users/quick-start"
            className="inline-flex items-center gap-2 rounded-md bg-fd-primary px-5 py-2.5 text-sm font-medium text-fd-primary-foreground transition hover:opacity-90"
          >
            Начать за&nbsp;5&nbsp;минут <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/docs/developers"
            className="inline-flex items-center gap-2 rounded-md border border-fd-border bg-fd-secondary px-5 py-2.5 text-sm font-medium transition hover:bg-fd-secondary/80"
          >
            Документация для разработчиков <Code2 className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        <TrackCard
          href="/docs/users"
          accent="from-pink-500/15 via-pink-500/5"
          icon={<Sparkles className="h-7 w-7" />}
          title="Для пользователей"
          subtitle="не близко к коду — нормально"
          description="Установка в одну команду, мастер настройки в WebUI, выбор LLM, профили общения, расписание и сон. Всё, чтобы запустить и не сломать."
          bullets={[
            "Установка: одна команда, без node на машине",
            "WebUI на http://localhost:3000",
            "Bot-режим и userbot (MTProto)",
            "Профили: милая, альтушка, болтушка и др.",
            "Стадии отношений и реализм-модули",
          ]}
        />
        <TrackCard
          href="/docs/developers"
          accent="from-violet-500/15 via-violet-500/5"
          icon={<Code2 className="h-7 w-7" />}
          title="Для разработчиков"
          subtitle="полная картина под капотом"
          description="Архитектура движка: presence, behavior-tick, memory-palace, agenda, conflict. REST API, WebSocket, формат аддонов .gaa, миграции, headless-режим."
          bullets={[
            "Архитектура слоёв и runtime.ts",
            "REST API + WebSocket логи",
            "Формат .gaa аддонов и манифест",
            "Headless JSON-events режим",
            "Миграции, presets, MCP",
          ]}
        />
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <Feature icon={<Bot />} title="Realism-движок" desc="Presence, sleep, busy schedule, daily-life — не одна большая модель, а слои состояния." />
        <Feature icon={<HeartHandshake />} title="Стадии отношений" desc="9 стадий от «дала тг» до «давно вместе». Каждая со своими счётчиками и поведением." />
        <Feature icon={<MessagesSquare />} title="Anti-AI prompt" desc="Запрет markdown, «конечно», эмодзи-рядов, вопросов в конце. Реальный тг-стиль." />
        <Feature icon={<Moon />} title="Спит ночью" desc="`:wake` чтобы разбудить, иначе шанс ответа низкий. Чёткий sleep window." />
        <Feature icon={<Puzzle />} title="Аддоны .gaa" desc="Zip-архив с manifest.json, файлами, патчем конфига, темой и install-скриптом." />
        <Feature icon={<Workflow />} title="Server / headless" desc="systemd, Docker, CI/CD — без TTY, через env-vars и --print-config." />
        <Feature icon={<Terminal />} title="CLI и WebUI" desc="React/Vite WebUI на 3000 порту, плюс быстрые команды через npx girl-agent." />
        <Feature icon={<Sparkles />} title="15+ LLM" desc="OpenAI, Anthropic, ClaudeHub, Groq, DeepSeek, Mistral, Gemini, xAI, Ollama и др." />
        <Feature icon={<Code2 />} title="Open-source" desc="TypeScript, Node 18.18+, ESM, React, Grammy, telegram (MTProto)." />
      </section>

      <section className="rounded-2xl border border-fd-border bg-fd-secondary/30 p-8">
        <h2 className="text-2xl font-semibold">Установка одной командой</h2>
        <p className="mt-2 text-fd-muted-foreground">
          Без Node на машине, без sudo, без конфликтов с системой.
        </p>
        <pre className="mt-4 overflow-x-auto rounded-md border border-fd-border bg-fd-card p-4 text-sm">
          <code>curl -fsSL https://raw.githubusercontent.com/TheSashaDev/girl-agent/master/scripts/install.sh | sh</code>
        </pre>
        <p className="mt-4 text-sm text-fd-muted-foreground">
          После установки запусти <code className="rounded bg-fd-secondary px-1 py-0.5">girl-agent</code> — откроется WebUI на{" "}
          <code className="rounded bg-fd-secondary px-1 py-0.5">http://localhost:3000</code>.
        </p>
      </section>
    </main>
  );
}

function Feature({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="rounded-xl border border-fd-border bg-fd-card p-5">
      <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-md bg-fd-primary/10 text-fd-primary">
        {icon}
      </div>
      <h3 className="text-base font-semibold">{title}</h3>
      <p className="mt-1 text-sm text-fd-muted-foreground">{desc}</p>
    </div>
  );
}

function TrackCard({
  href,
  accent,
  icon,
  title,
  subtitle,
  description,
  bullets,
}: {
  href: string;
  accent: string;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  description: string;
  bullets: string[];
}) {
  return (
    <Link
      href={href}
      className={`group relative overflow-hidden rounded-2xl border border-fd-border bg-gradient-to-br ${accent} to-transparent p-6 transition hover:border-fd-primary/40`}
    >
      <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-fd-card text-fd-primary">
        {icon}
      </div>
      <div className="mb-1 text-xs uppercase tracking-wider text-fd-muted-foreground">{subtitle}</div>
      <h2 className="text-2xl font-bold">{title}</h2>
      <p className="mt-2 text-sm text-fd-muted-foreground">{description}</p>
      <ul className="mt-4 space-y-1 text-sm">
        {bullets.map((b) => (
          <li key={b} className="flex gap-2">
            <span className="text-fd-primary">·</span>
            <span>{b}</span>
          </li>
        ))}
      </ul>
      <span className="mt-5 inline-flex items-center gap-1 text-sm font-medium text-fd-primary group-hover:gap-2 transition-all">
        Открыть <ArrowRight className="h-4 w-4" />
      </span>
    </Link>
  );
}
