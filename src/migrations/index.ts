/**
 * Система миграций данных.
 *
 * Каждая миграция — объект с id (семантическая версия), description и функцией migrate().
 * migrate() получает путь к профилю и config, может модифицировать файлы на диске.
 *
 * Миграции выполняются в порядке возрастания id. Уже применённые миграции
 * пропускаются (трекаются через .migrations.json в DATA_ROOT).
 */

import { promises as fs } from "node:fs";
import path from "node:path";
import type { ProfileConfig } from "../types.js";
import { DATA_ROOT, listProfiles, readConfig, writeConfig, profileDir } from "../storage/md.js";

export interface Migration {
  id: string;
  description: string;
  migrate(profilePath: string, config: ProfileConfig): Promise<ProfileConfig>;
}

const MIGRATIONS_FILE = () => path.join(DATA_ROOT, ".migrations.json");

interface MigrationState {
  appliedMigrations: string[];
  lastRunVersion: string;
  lastRunAt: string;
}

async function readMigrationState(): Promise<MigrationState> {
  try {
    const raw = await fs.readFile(MIGRATIONS_FILE(), "utf8");
    return JSON.parse(raw) as MigrationState;
  } catch {
    return { appliedMigrations: [], lastRunVersion: "0.0.0", lastRunAt: "" };
  }
}

async function writeMigrationState(state: MigrationState): Promise<void> {
  await fs.mkdir(DATA_ROOT, { recursive: true });
  await fs.writeFile(MIGRATIONS_FILE(), JSON.stringify(state, null, 2), "utf8");
}

// --- Реестр миграций (добавлять новые сюда в порядке возрастания) ---
import { migration0112 } from "./0112-add-use-wss-default.js";

export const ALL_MIGRATIONS: Migration[] = [
  migration0112,
];

/**
 * Возвращает список миграций, которые ещё не были применены.
 */
export async function pendingMigrations(): Promise<Migration[]> {
  const state = await readMigrationState();
  return ALL_MIGRATIONS.filter(m => !state.appliedMigrations.includes(m.id));
}

export interface UpdateResult {
  profilesUpdated: number;
  migrationsApplied: string[];
  errors: { profile: string; migration: string; error: string }[];
}

/**
 * Запуск всех pending-миграций по всем профилям.
 */
export async function runMigrations(opts?: { verbose?: boolean }): Promise<UpdateResult> {
  const pending = await pendingMigrations();
  const log = opts?.verbose ? (msg: string) => process.stderr.write(msg + "\n") : () => {};

  if (pending.length === 0) {
    log("все миграции уже применены, данные актуальны.");
    return { profilesUpdated: 0, migrationsApplied: [], errors: [] };
  }

  const profiles = await listProfiles();
  const state = await readMigrationState();
  const result: UpdateResult = { profilesUpdated: 0, migrationsApplied: [], errors: [] };

  for (const migration of pending) {
    log(`\n[migration] ${migration.id}: ${migration.description}`);
    let profilesAffected = 0;

    for (const slug of profiles) {
      const cfg = await readConfig(slug);
      if (!cfg) {
        log(`  пропуск ${slug}: не удалось прочитать config.json`);
        continue;
      }

      try {
        const updated = await migration.migrate(profileDir(slug), cfg);
        await writeConfig(updated);
        profilesAffected++;
        log(`  ${slug}: ок`);
      } catch (e) {
        const errMsg = e instanceof Error ? e.message : String(e);
        log(`  ${slug}: ошибка — ${errMsg}`);
        result.errors.push({ profile: slug, migration: migration.id, error: errMsg });
      }
    }

    state.appliedMigrations.push(migration.id);
    result.migrationsApplied.push(migration.id);
    result.profilesUpdated = Math.max(result.profilesUpdated, profilesAffected);
    log(`  применено к ${profilesAffected} профилям`);
  }

  state.lastRunVersion = currentVersion();
  state.lastRunAt = new Date().toISOString();
  await writeMigrationState(state);

  return result;
}

/**
 * Проверяет, есть ли pending-миграции. Можно вызывать при старте runtime.
 */
export async function checkForPendingMigrations(): Promise<boolean> {
  const pending = await pendingMigrations();
  return pending.length > 0;
}

function currentVersion(): string {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    return "0.1.11"; // обновлять вместе с package.json
  } catch {
    return "unknown";
  }
}
