import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { findMcp } from "../presets/mcp.js";
import type { ProfileConfig } from "../types.js";

export interface McpHandle {
  id: string;
  client: Client;
  tools: { name: string; description?: string }[];
  close: () => Promise<void>;
}

export async function startMcpServers(cfg: ProfileConfig): Promise<McpHandle[]> {
  const handles: McpHandle[] = [];
  for (const slot of cfg.mcp ?? []) {
    const preset = findMcp(slot.id);
    if (!preset?.ready || !preset.spawn) continue;
    try {
      const spec = preset.spawn(slot.secrets);
      const transport = new StdioClientTransport({
        command: spec.command,
        args: spec.args,
        env: { ...process.env, ...spec.env } as Record<string, string>
      });
      const client = new Client({ name: "girl-agent", version: "0.1.0" }, { capabilities: {} });
      await client.connect(transport);
      const list = await client.listTools();
      handles.push({
        id: preset.id,
        client,
        tools: list.tools.map(t => ({ name: t.name, description: t.description })),
        close: () => client.close().catch(() => {})
      });
    } catch (e) {
      console.error(`[mcp] failed to start ${slot.id}:`, (e as Error).message);
    }
  }
  return handles;
}
