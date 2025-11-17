import { AgentUser } from "@/features/agent/types";

const AGENT_ID_KEY = "agent_user_id";
const AGENT_USERNAME_KEY = "agent_username";
const AGENT_ROLE_KEY = "agent_role";

const isBrowser = () => typeof window !== "undefined";

export function getAgentUser(): AgentUser | null {
  if (!isBrowser()) {
    return null;
  }
  const id = window.localStorage.getItem(AGENT_ID_KEY);
  const username = window.localStorage.getItem(AGENT_USERNAME_KEY);
  const role = window.localStorage.getItem(AGENT_ROLE_KEY);

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
  };
}

export function setAgentUser(agent: AgentUser): void {
  if (!isBrowser()) {
    return;
  }
  window.localStorage.setItem(AGENT_ID_KEY, String(agent.id));
  window.localStorage.setItem(AGENT_USERNAME_KEY, agent.username);
  window.localStorage.setItem(AGENT_ROLE_KEY, agent.role ?? "");
}

export function clearAgentUser(): void {
  if (!isBrowser()) {
    return;
  }
  window.localStorage.removeItem(AGENT_ID_KEY);
  window.localStorage.removeItem(AGENT_USERNAME_KEY);
  window.localStorage.removeItem(AGENT_ROLE_KEY);
}

