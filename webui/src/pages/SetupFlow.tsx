import { useEffect, useMemo, useState } from "react";
import { useStore } from "../lib/store";
import { api, type LLMPreset, type StagePreset, type CommunicationPreset, type ProfileConfig } from "../lib/api";

interface DraftState {
  mode: "simple" | "advanced";
  step: number;
  // form
  name: string;
  age: number;
  nationality: "RU" | "UA";
  tz: string;
  tgMode: "bot" | "userbot";
  botToken: string;
  apiId: string;
  apiHash: string;
  phone: string;
  llmPresetId: string;
  llmModel: string;
  llmApiKey: string;
  llmBaseURL: string;
  stage: string;
  communicationId: string;
  ignoreTendency: number;
  ownerId: string;
  privacy: "owner-only" | "allow-strangers";
  personaNotes: string;
  generating: boolean;
  generated: boolean;
}

const defaultDraft = (): DraftState => ({
  mode: "simple",
  step: 0,
  name: "",
  age: 22,
  nationality: "RU",
  tz: "Europe/Moscow",
  tgMode: "bot",
  botToken: "",
  apiId: "",
  apiHash: "",
  phone: "",
  llmPresetId: "claudehub",
  llmModel: "claude-sonnet-4.6",
  llmApiKey: "",
  llmBaseURL: "",
  stage: "tg-given-cold",
  communicationId: "normal",
  ignoreTendency: 35,
  ownerId: "",
  privacy: "owner-only",
  personaNotes: "",
  generating: false,
  generated: false
});

const SIMPLE_STEPS = ["mode", "tg", "llm", "persona", "ready"] as const;
const ADV_STEPS = ["mode", "name", "tg", "llm", "stage", "comm", "sleep", "owner", "persona", "ready"] as const;

export function SetupFlow() {
  const showSetupFlow = useStore(s => s.showSetupFlow);
  const refreshProfiles = useStore(s => s.refreshProfiles);
  const selectProfile = useStore(s => s.selectProfile);
  const setTab = useStore(s => s.setTab);
  const toast = useStore(s => s.toast);

  const [d, setD] = useState<DraftState>(defaultDraft());
  const [llmPresets, setLLMPresets] = useState<LLMPreset[]>([]);
  const [stages, setStages] = useState<StagePreset[]>([]);
  const [comms, setComms] = useState<CommunicationPreset[]>([]);
  const [namePool, setNamePool] = useState<string[]>([]);
  const [savingProfile, setSavingProfile] = useState(false);

  useEffect(() => {
    void api.listLLMPresets().then(r => setLLMPresets(r.presets));
    void api.listStages().then(r => setStages(r.stages));
    void api.listCommunicationPresets().then(r => setComms(r.presets));
  }, []);

  useEffect(() => {
    void api.pickNames(d.nationality, 8).then(r => {
      setNamePool(r.names);
      if (!d.name && r.names.length) setD(s => ({ ...s, name: r.names[0] }));
    });
  }, [d.nationality]);

  const stepIds = (d.mode === "advanced" ? ADV_STEPS : SIMPLE_STEPS) as readonly string[];
  const totalSteps = stepIds.length;
  const currentStep = stepIds[d.step] ?? "ready";

  const canNext = useMemo(() => stepValid(currentStep, d), [currentStep, d]);

  function set<K extends keyof DraftState>(k: K, v: DraftState[K]) {
    setD(prev => ({ ...prev, [k]: v }));
  }

  async function createProfile(): Promise<ProfileConfig | null> {
    if (savingProfile) return null;
    setSavingProfile(true);
    try {
      const llmPreset = llmPresets.find(p => p.id === d.llmPresetId);
      const comm = comms.find(c => c.id === d.communicationId);
      const data: Partial<ProfileConfig> = {
        name: d.name,
        age: d.age,
        nationality: d.nationality,
        tz: d.tz,
        mode: d.tgMode,
        stage: d.stage,
        privacy: d.privacy,
        ownerId: d.ownerId ? Number(d.ownerId) : undefined,
        personaNotes: d.personaNotes || undefined,
        ignoreTendency: d.ignoreTendency,
        communication: comm?.profile,
        telegram: d.tgMode === "bot"
          ? { botToken: d.botToken, useWSS: true }
          : { apiId: Number(d.apiId), apiHash: d.apiHash, phone: d.phone, useWSS: true },
        llm: {
          presetId: d.llmPresetId,
          proto: llmPreset?.proto ?? "openai",
          baseURL: d.llmBaseURL || llmPreset?.baseURL,
          model: d.llmModel || llmPreset?.defaultModel || "",
          apiKey: d.llmApiKey
        }
      };
      const r = await api.createProfile(data);
      return r.config;
    } catch (e) {
      toast(`Не удалось создать: ${(e as Error)?.message}`, "error");
      return null;
    } finally {
      setSavingProfile(false);
    }
  }

  async function generatePersona(slug: string) {
    set("generating", true);
    try {
      await api.generatePersona(slug, { name: d.name, age: d.age, nationality: d.nationality, notes: d.personaNotes });
      set("generated", true);
      toast("Персона сгенерирована", "success");
    } catch (e) {
      toast(`Генерация не удалась: ${(e as Error)?.message}`, "error");
    } finally {
      set("generating", false);
    }
  }

  async function finish() {
    const cfg = await createProfile();
    if (!cfg) return;
    await refreshProfiles();
    await selectProfile(cfg.slug);
    if (d.mode === "simple" || d.personaNotes) {
      // try persona generation
      await generatePersona(cfg.slug);
    }
    showSetupFlow(false);
    setTab("logs");
    // start the runtime
    try { await api.applyProfile(cfg.slug); }
    catch (e) { toast(`Запуск не удался — проверь токены: ${(e as Error)?.message}`, "error"); }
  }

  function next() {
    if (d.step < totalSteps - 1) set("step", d.step + 1);
    else void finish();
  }

  function back() {
    if (d.step > 0) set("step", d.step - 1);
  }

  return (
    <div className="setup-shell">
      <div className="setup-card">
        <div className="setup-stepper">
          {Array.from({ length: totalSteps }, (_, i) => (
            <div key={i} className={`setup-step ${i < d.step ? "done" : ""} ${i === d.step ? "active" : ""}`} />
          ))}
        </div>

        {currentStep === "mode" && (
          <>
            <h1 className="setup-title">Привет 👋</h1>
            <p className="setup-subtitle">Создаём твой первый профиль. Выберите формат настройки.</p>
            <div className="grid cols-2" style={{ gap: 12 }}>
              <div className="card" style={{ cursor: "pointer", borderColor: d.mode === "simple" ? "var(--ga-accent)" : "var(--ga-border)", boxShadow: d.mode === "simple" ? "0 0 0 1px var(--ga-accent) inset" : "none" }} onClick={() => set("mode", "simple")}>
                <strong>Просто</strong>
                <div className="hint" style={{ marginTop: 6 }}>5 шагов. Имя/возраст/национальность подберём за вас. ~3 минуты.</div>
              </div>
              <div className="card" style={{ cursor: "pointer", borderColor: d.mode === "advanced" ? "var(--ga-accent)" : "var(--ga-border)", boxShadow: d.mode === "advanced" ? "0 0 0 1px var(--ga-accent) inset" : "none" }} onClick={() => set("mode", "advanced")}>
                <strong>Подробно</strong>
                <div className="hint" style={{ marginTop: 6 }}>10 шагов. Полный контроль над всеми параметрами. ~7 минут.</div>
              </div>
            </div>
          </>
        )}

        {currentStep === "name" && (
          <>
            <h1 className="setup-title">Имя и возраст</h1>
            <p className="setup-subtitle">Это девушка, которая будет тебе писать.</p>
            <div className="grid cols-2">
              <div className="form-row">
                <label>Национальность</label>
                <select className="select" value={d.nationality} onChange={e => set("nationality", e.target.value as "RU" | "UA")}>
                  <option value="RU">Россия</option>
                  <option value="UA">Україна</option>
                </select>
              </div>
              <div className="form-row">
                <label>Возраст</label>
                <input type="number" min={18} max={45} className="input" value={d.age} onChange={e => set("age", Number(e.target.value))} />
              </div>
            </div>
            <div className="form-row">
              <label>Имя</label>
              <input className="input" value={d.name} onChange={e => set("name", e.target.value)} placeholder="Алина" />
              {namePool.length > 0 && (
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 6 }}>
                  {namePool.map(n => (
                    <button key={n} className="btn tiny ghost" onClick={() => set("name", n)}>{n}</button>
                  ))}
                </div>
              )}
            </div>
            <div className="form-row">
              <label>Часовой пояс</label>
              <input className="input" value={d.tz} onChange={e => set("tz", e.target.value)} placeholder="Europe/Moscow" />
            </div>
          </>
        )}

        {currentStep === "tg" && (
          <>
            <h1 className="setup-title">Telegram</h1>
            <p className="setup-subtitle">Подключаем девушку к мессенджеру.</p>
            <div className="form-row">
              <label>Режим</label>
              <select className="select" value={d.tgMode} onChange={e => set("tgMode", e.target.value as "bot" | "userbot")}>
                <option value="bot">бот (рекомендуется) — нужен токен от @BotFather</option>
                <option value="userbot">userbot — заходит как обычный TG-аккаунт</option>
              </select>
            </div>
            {d.tgMode === "bot" ? (
              <div className="form-row">
                <label>Bot Token</label>
                <input className="input" type="password" value={d.botToken} onChange={e => set("botToken", e.target.value)} placeholder="123456789:AAFxxxxxxxxx" />
                <div className="hint">
                  1. Открой <a href="https://t.me/BotFather" target="_blank" rel="noopener">@BotFather</a><br />
                  2. Команда /newbot, придумай имя и username<br />
                  3. Скопируй токен сюда
                </div>
              </div>
            ) : (
              <>
                <div className="grid cols-2">
                  <div className="form-row"><label>API ID</label><input className="input" value={d.apiId} onChange={e => set("apiId", e.target.value)} /></div>
                  <div className="form-row"><label>API Hash</label><input className="input" type="password" value={d.apiHash} onChange={e => set("apiHash", e.target.value)} /></div>
                </div>
                <div className="form-row">
                  <label>Телефон</label>
                  <input className="input" value={d.phone} onChange={e => set("phone", e.target.value)} placeholder="+79..." />
                  <div className="hint">api_id и api_hash возьми на <a href="https://my.telegram.org/" target="_blank" rel="noopener">my.telegram.org</a> → API Development tools.</div>
                </div>
              </>
            )}
          </>
        )}

        {currentStep === "llm" && (
          <>
            <h1 className="setup-title">LLM-провайдер</h1>
            <p className="setup-subtitle">Это «мозги» девушки. Из РФ работают без VPN: ClaudeHub.</p>
            <div className="form-row">
              <label>Провайдер</label>
              <select className="select" value={d.llmPresetId} onChange={e => {
                const p = llmPresets.find(x => x.id === e.target.value);
                if (!p || p.disabled) return;
                set("llmPresetId", e.target.value);
                set("llmModel", p.defaultModel);
                set("llmBaseURL", p.baseURL ?? "");
              }}>
                {llmPresets.map(p => (
                  <option key={p.id} value={p.id} disabled={p.disabled}>
                    {p.name}{p.recommended ? " ★" : ""}{p.disabled ? ` — ${p.disabledReason ?? "недоступен"}` : ""}
                  </option>
                ))}
              </select>
              <div className="hint">{llmPresets.find(p => p.id === d.llmPresetId)?.hint}</div>
            </div>
            <div className="form-row">
              <label>Модель</label>
              {(() => {
                const p = llmPresets.find(x => x.id === d.llmPresetId);
                return p?.models?.length
                  ? <select className="select" value={d.llmModel} onChange={e => set("llmModel", e.target.value)}>{p.models.map(m => <option key={m} value={m}>{m}</option>)}</select>
                  : <input className="input" value={d.llmModel} onChange={e => set("llmModel", e.target.value)} />;
              })()}
            </div>
            {(llmPresets.find(p => p.id === d.llmPresetId)?.apiKeyRequired !== false) && (
              <div className="form-row">
                <label>API Key</label>
                <input className="input" type="password" value={d.llmApiKey} onChange={e => set("llmApiKey", e.target.value)} />
              </div>
            )}
            {(llmPresets.find(p => p.id === d.llmPresetId)?.custom) && (
              <div className="form-row">
                <label>Base URL</label>
                <input className="input" value={d.llmBaseURL} onChange={e => set("llmBaseURL", e.target.value)} placeholder="https://..." />
              </div>
            )}
          </>
        )}

        {currentStep === "stage" && (
          <>
            <h1 className="setup-title">Стадия отношений</h1>
            <p className="setup-subtitle">9 уровней — от «только что обменялись тг» до «давно вместе».</p>
            <div className="form-row">
              <select className="select" value={d.stage} onChange={e => set("stage", e.target.value)}>
                {stages.map(s => <option key={s.id} value={s.id}>{s.num}. {s.label}</option>)}
              </select>
              <div className="hint">{stages.find(s => s.id === d.stage)?.description}</div>
            </div>
          </>
        )}

        {currentStep === "comm" && (
          <>
            <h1 className="setup-title">Стиль общения</h1>
            <p className="setup-subtitle">Какой характер у девушки.</p>
            <div className="grid cols-2">
              {comms.map(c => (
                <div key={c.id} className="card" style={{ padding: 14, cursor: "pointer", borderColor: d.communicationId === c.id ? "var(--ga-accent)" : "var(--ga-border)", boxShadow: d.communicationId === c.id ? "0 0 0 1px var(--ga-accent) inset" : "none" }} onClick={() => set("communicationId", c.id)}>
                  <strong>{c.label}</strong>
                  <div className="hint" style={{ marginTop: 4 }}>{c.description}</div>
                </div>
              ))}
            </div>
            <div className="form-row" style={{ marginTop: 12 }}>
              <label>Тенденция игнора: {d.ignoreTendency}%</label>
              <input type="range" min={0} max={100} className="range" value={d.ignoreTendency} onChange={e => set("ignoreTendency", Number(e.target.value))} />
            </div>
          </>
        )}

        {currentStep === "sleep" && (
          <>
            <h1 className="setup-title">Расписание</h1>
            <p className="setup-subtitle">Когда она спит и не отвечает.</p>
            <div className="grid cols-2">
              <div className="form-row"><label>Засыпает в</label><input type="number" min={0} max={23} className="input" value={d.age} onChange={() => { /* placeholder */ }} disabled /></div>
              <div className="form-row"><label>Просыпается в</label><input type="number" min={0} max={23} className="input" value={8} disabled /></div>
            </div>
            <div className="hint">Расписание сна можно изменить позже в Конфигурации. По умолчанию: 23:00 → 8:00.</div>
          </>
        )}

        {currentStep === "owner" && (
          <>
            <h1 className="setup-title">Кому отвечать</h1>
            <p className="setup-subtitle">Чтобы бот не отвечал случайным людям.</p>
            <div className="form-row">
              <label>Privacy</label>
              <select className="select" value={d.privacy} onChange={e => set("privacy", e.target.value as "owner-only" | "allow-strangers")}>
                <option value="owner-only">только владельцу</option>
                <option value="allow-strangers">всем</option>
              </select>
            </div>
            <div className="form-row">
              <label>Owner Telegram ID</label>
              <input className="input" type="number" value={d.ownerId} onChange={e => set("ownerId", e.target.value)} placeholder="напиши боту /start чтобы узнать" />
              <div className="hint">Можно оставить пустым: при первой команде /start бот сам подскажет твой id.</div>
            </div>
          </>
        )}

        {currentStep === "persona" && (
          <>
            <h1 className="setup-title">Заметки для персоны</h1>
            <p className="setup-subtitle">Опиши кратко, какой её хочешь видеть. LLM использует это при генерации.</p>
            <div className="form-row">
              <textarea className="textarea" value={d.personaNotes} onChange={e => set("personaNotes", e.target.value)} placeholder="например: студентка дизайна, любит кошек, играет в visual novels, переехала из Питера в Москву..." style={{ minHeight: 140 }} />
            </div>
          </>
        )}

        {currentStep === "ready" && (
          <>
            <h1 className="setup-title">Всё готово 🎉</h1>
            <p className="setup-subtitle">Создаю профиль и запускаю рантайм. Если включена генерация персоны — это займёт около минуты.</p>
            <div className="form-row">
              <div><strong>{d.name}</strong>, {d.age}, {d.nationality}, {d.tz}</div>
              <div><strong>TG:</strong> {d.tgMode === "bot" ? `bot (token ${d.botToken ? "ok" : "missing"})` : `userbot (api_id ${d.apiId ? "ok" : "missing"})`}</div>
              <div><strong>LLM:</strong> {d.llmPresetId} / {d.llmModel}</div>
              <div><strong>Стадия:</strong> {stages.find(s => s.id === d.stage)?.label}</div>
            </div>
          </>
        )}

        <div style={{ display: "flex", gap: 8, marginTop: 24, justifyContent: "space-between" }}>
          <div>
            {d.step > 0 && <button className="btn ghost" onClick={back}>← Назад</button>}
            <button className="btn ghost" onClick={() => showSetupFlow(false)}>Закрыть</button>
          </div>
          <button className="btn primary" disabled={!canNext || savingProfile || d.generating} onClick={() => void next()}>
            {d.step === totalSteps - 1 ? (savingProfile ? "Создаю..." : d.generating ? "Генерирую персону..." : "Готово") : "Далее →"}
          </button>
        </div>
      </div>
    </div>
  );
}

function stepValid(step: string, d: DraftState): boolean {
  switch (step) {
    case "mode": return true;
    case "name": return !!d.name && d.age >= 18 && d.age <= 45;
    case "tg": return d.tgMode === "bot" ? !!d.botToken : !!d.apiId && !!d.apiHash;
    case "llm": return !!d.llmPresetId && !!d.llmModel;
    case "stage": return !!d.stage;
    case "comm": return !!d.communicationId;
    case "sleep": return true;
    case "owner": return true;
    case "persona": return true;
    case "ready": return true;
    default: return true;
  }
}
