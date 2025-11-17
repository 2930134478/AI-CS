import { API_BASE_URL } from "@/lib/config";

export async function logout(): Promise<void> {
  await fetch(`${API_BASE_URL}/logout`, {
    method: "POST",
  });
}

