import { useEffect, useState } from "react";
import { api } from "../lib/api";

interface AuthGateProps {
  children: React.ReactNode;
}

export function AuthGate({ children }: AuthGateProps) {
  const [checking, setChecking] = useState(true);
  const [enabled, setEnabled] = useState(false);
  const [authorized, setAuthorized] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    api.authStatus()
      .then(r => {
        setEnabled(r.enabled);
        setAuthorized(!r.enabled);
      })
      .catch(() => setEnabled(true))
      .finally(() => setChecking(false));
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    try {
      await api.login(password);
      setAuthorized(true);
      setPassword("");
    } catch (err) {
      setError((err as Error)?.message ?? "Не удалось войти");
    }
  }

  if (checking) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh" }}>
        <div className="spinner" />
      </div>
    );
  }

  if (enabled && !authorized) {
    return (
      <div className="auth-shell">
        <form className="auth-card" onSubmit={submit}>
          <h1 className="setup-title">Вход в WebUI</h1>
          <p className="setup-subtitle">Введите пароль из GIRL_AGENT_WEBUI_PASSWORD.</p>
          <div className="form-row">
            <label>Пароль</label>
            <input className="input" type="password" autoFocus value={password} onChange={e => setPassword(e.target.value)} />
          </div>
          {error && <div className="hint" style={{ color: "var(--accent)" }}>{error}</div>}
          <button className="btn primary" type="submit" disabled={!password}>Войти</button>
        </form>
      </div>
    );
  }

  return <>{children}</>;
}
