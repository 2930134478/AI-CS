import { apiUrl, getAgentHeaders } from "@/lib/config";

export interface EmailNotificationConfig {
  id?: number;
  enabled: boolean;
  smtp_host: string;
  smtp_port: number;
  smtp_user: string;
  smtp_password_masked?: string;
  from_email: string;
  from_name: string;
  offline_delay_seconds: number;
  effective_enabled: boolean;
  effective_delay_seconds: number;
  persisted_in_database: boolean;
  env_enabled: boolean;
  env_delay_seconds: number;
  updated_at?: string;
}

export interface UpdateEmailNotificationConfigRequest {
  enabled?: boolean;
  smtp_host?: string;
  smtp_port?: number;
  smtp_user?: string;
  smtp_password?: string;
  from_email?: string;
  from_name?: string;
  offline_delay_seconds?: number;
}

export async function fetchEmailNotificationConfig(
  userId: number
): Promise<EmailNotificationConfig> {
  const res = await fetch(
    `${apiUrl("/agent/email-notification-config")}?user_id=${userId}`,
    { cache: "no-store", headers: getAgentHeaders() }
  );
  if (!res.ok) {
    throw new Error("获取离线邮件配置失败");
  }
  return res.json();
}

export async function updateEmailNotificationConfig(
  userId: number,
  data: UpdateEmailNotificationConfigRequest
): Promise<EmailNotificationConfig> {
  const res = await fetch(apiUrl("/agent/email-notification-config"), {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...getAgentHeaders() },
    body: JSON.stringify({ user_id: userId, ...data }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "更新离线邮件配置失败");
  }
  return res.json();
}

export async function resetEmailNotificationConfig(
  userId: number
): Promise<EmailNotificationConfig> {
  const res = await fetch(
    `${apiUrl("/agent/email-notification-config")}?user_id=${userId}`,
    { method: "DELETE", headers: getAgentHeaders() }
  );
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "恢复离线邮件配置失败");
  }
  return res.json();
}

export async function sendEmailNotificationTest(
  userId: number,
  to: string
): Promise<void> {
  const res = await fetch(apiUrl("/agent/email-notification-config/test"), {
    method: "POST",
    headers: { "Content-Type": "application/json", ...getAgentHeaders() },
    body: JSON.stringify({ user_id: userId, to }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "发送测试邮件失败");
  }
}
