/**
 * Migration 0112: убедиться что useWSS=true в конфиге (после перехода на WSS по умолчанию).
 *
 * В версиях до 0.1.10 поле telegram.useWSS могло отсутствовать или быть false.
 * Теперь WSS включён по умолчанию. Эта миграция явно ставит useWSS=true
 * в существующих конфигах, чтобы старые профили тоже работали через WebSocket.
 */

import type { Migration } from "./index.js";
import type { ProfileConfig } from "../types.js";

export const migration0112: Migration = {
  id: "0112-add-use-wss-default",
  description: "Включить WSS по умолчанию в существующих профилях",

  async migrate(_profilePath: string, config: ProfileConfig): Promise<ProfileConfig> {
    if (config.telegram.useWSS === undefined || config.telegram.useWSS === false) {
      config.telegram.useWSS = true;
    }
    return config;
  }
};
