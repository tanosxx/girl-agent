import { Router, HttpError } from "../http.js";
import { authStatus, clearSession, createSession, verifyPassword } from "../auth.js";

export function registerAuthRoutes(r: Router): void {
  r.get("/api/auth/status", () => authStatus());

  r.post("/api/auth/login", ({ body, res }) => {
    const { password } = (body as { password?: string }) ?? {};
    if (!verifyPassword(password ?? "")) throw new HttpError(401, "неверный пароль");
    createSession(res);
    return { ok: true };
  });

  r.post("/api/auth/logout", ({ req, res }) => {
    clearSession(req, res);
    return { ok: true };
  });
}
