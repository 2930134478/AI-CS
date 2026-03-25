import { apiUrl } from "@/lib/config";

export async function logout(): Promise<void> {
  await fetch(apiUrl("/logout"), {
    method: "POST",
  });
}

