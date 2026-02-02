import { API_BASE_URL, getAgentHeaders } from "@/lib/config";

// 导入结果
export interface ImportResult {
  success_count: number;
  failed_count: number;
  failed_files: string[];
  errors: string[];
  message?: string;
}

// 导入文档（文件上传）
export async function importDocuments(
  knowledgeBaseId: number,
  files: File[]
): Promise<ImportResult> {
  const formData = new FormData();
  formData.append("knowledge_base_id", knowledgeBaseId.toString());
  for (const file of files) {
    formData.append("files", file);
  }

  const res = await fetch(`${API_BASE_URL}/import/documents`, {
    method: "POST",
    headers: getAgentHeaders(),
    body: formData,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error((error as { error?: string }).error || "导入文档失败");
  }

  const text = await res.text();
  if (!text || text.trim() === "") {
    throw new Error("服务器返回为空，请检查后端是否正常");
  }
  try {
    const data = JSON.parse(text) as ImportResult;
    return {
      success_count: data.success_count ?? 0,
      failed_count: data.failed_count ?? 0,
      failed_files: data.failed_files ?? [],
      errors: data.errors ?? [],
      message: data.message,
    };
  } catch {
    throw new Error("服务器返回格式错误，请检查后端接口");
  }
}

// 从 URL 导入文档
export interface ImportFromUrlsRequest {
  knowledge_base_id: number;
  urls: string[];
}

export async function importFromUrls(data: ImportFromUrlsRequest): Promise<ImportResult> {
  const res = await fetch(`${API_BASE_URL}/import/urls`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...getAgentHeaders() },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error((error as { error?: string }).error || "导入 URL 失败");
  }

  const text = await res.text();
  if (!text || text.trim() === "") {
    throw new Error("服务器返回为空，请检查后端是否正常");
  }
  try {
    const data = JSON.parse(text) as ImportResult;
    return {
      success_count: data.success_count ?? 0,
      failed_count: data.failed_count ?? 0,
      failed_files: data.failed_files ?? [],
      errors: data.errors ?? [],
      message: data.message,
    };
  } catch {
    throw new Error("服务器返回格式错误，请检查后端接口");
  }
}
