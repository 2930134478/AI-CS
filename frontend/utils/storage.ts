import { AgentUser } from "@/features/agent/types";

const AGENT_ID_KEY = "agent_user_id";
const AGENT_USERNAME_KEY = "agent_username";
const AGENT_ROLE_KEY = "agent_role";
const AGENT_WS_TOKEN_KEY = "agent_ws_token";
const AGENT_WS_TOKEN_EXP_KEY = "agent_ws_token_exp";

const isBrowser = () => typeof window !== "undefined";

export function getAgentUser(): AgentUser | null {
  if (!isBrowser()) {
    return null;
  }
  const id = window.localStorage.getItem(AGENT_ID_KEY);
  const username = window.localStorage.getItem(AGENT_USERNAME_KEY);
  const role = window.localStorage.getItem(AGENT_ROLE_KEY);
  const permissionsRaw = window.localStorage.getItem("agent_permissions");

  if (!id || !username) {
    return null;
  }

  const parsedId = Number.parseInt(id, 10);
  if (Number.isNaN(parsedId)) {
    return null;
  }

  return {
    id: parsedId,
    username,
    role: role ?? "",
    permissions: (() => {
      if (!permissionsRaw) return undefined;
      try {
        const parsed = JSON.parse(permissionsRaw);
        return Array.isArray(parsed) ? (parsed as string[]) : undefined;
      } catch {
        return undefined;
      }
    })(),
  };
}

export function setAgentUser(agent: AgentUser): void {
  if (!isBrowser()) {
    return;
  }
  window.localStorage.setItem(AGENT_ID_KEY, String(agent.id));
  window.localStorage.setItem(AGENT_USERNAME_KEY, agent.username);
  window.localStorage.setItem(AGENT_ROLE_KEY, agent.role ?? "");
  if (agent.permissions) {
    window.localStorage.setItem("agent_permissions", JSON.stringify(agent.permissions));
  } else {
    window.localStorage.removeItem("agent_permissions");
  }
}

export function clearAgentUser(): void {
  if (!isBrowser()) {
    return;
  }
  window.localStorage.removeItem(AGENT_ID_KEY);
  window.localStorage.removeItem(AGENT_USERNAME_KEY);
  window.localStorage.removeItem(AGENT_ROLE_KEY);
  window.localStorage.removeItem("agent_permissions");
  window.localStorage.removeItem(AGENT_WS_TOKEN_KEY);
  window.localStorage.removeItem(AGENT_WS_TOKEN_EXP_KEY);
}

export function getAgentWSToken(): string | null {
  if (!isBrowser()) return null;
  const token = window.localStorage.getItem(AGENT_WS_TOKEN_KEY);
  const expRaw = window.localStorage.getItem(AGENT_WS_TOKEN_EXP_KEY);
  if (!token || !expRaw) return null;
  const exp = Number.parseInt(expRaw, 10);
  if (Number.isNaN(exp)) return null;
  const nowSec = Math.floor(Date.now() / 1000);
  if (exp <= nowSec) return null;
  return token;
}

export function setAgentWSToken(token: string, expireAtUnix: number): void {
  if (!isBrowser()) return;
  window.localStorage.setItem(AGENT_WS_TOKEN_KEY, token);
  window.localStorage.setItem(AGENT_WS_TOKEN_EXP_KEY, String(expireAtUnix));
}

