import { apiUrl, getAgentHeaders } from "@/lib/config";

// 文档分段
export interface DocumentChunk {
  id: number;
  document_id: number;
  knowledge_base_id: number;
  chunk_index: number;
  content: string;
  embedding_status: string;
  created_at: string;
  updated_at: string;
}

// 分段请求参数
export interface ChunkRequest {
  method: "char_count" | "separator";
  chunk_size?: number;
  separator?: string;
}

// 分段列表响应
export interface ChunkListResponse {
  chunks: DocumentChunk[];
  total: number;
  page: number;
  page_size: number;
  total_page: number;
}

// 分段执行响应
export interface ChunkExecuteResponse {
  message: string;
  chunk_count: number;
  chunks: DocumentChunk[];
}

// 执行分段
export async function executeChunking(
  documentId: number,
  req: ChunkRequest
): Promise<ChunkExecuteResponse> {
  const res = await fetch(apiUrl(`/documents/${documentId}/chunks`), {
    method: "POST",
    headers: { "Content-Type": "application/json", ...getAgentHeaders() },
    body: JSON.stringify(req),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.error || "执行分段失败");
  }

  return res.json();
}

// 获取分段列表
export async function fetchChunks(
  documentId: number,
  page: number = 1,
  pageSize: number = 10
): Promise<ChunkListResponse> {
  const params = new URLSearchParams({
    page: String(page),
    page_size: String(pageSize),
  });
  const res = await fetch(
    apiUrl(`/documents/${documentId}/chunks?${params}`),
    {
      cache: "no-store",
      headers: getAgentHeaders(),
    }
  );

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.error || "获取分段列表失败");
  }

  return res.json();
}

// 更新单个分段
export async function updateChunk(
  documentId: number,
  chunkId: number,
  content: string
): Promise<DocumentChunk> {
  const res = await fetch(
    apiUrl(`/documents/${documentId}/chunks/${chunkId}`),
    {
      method: "PUT",
      headers: { "Content-Type": "application/json", ...getAgentHeaders() },
      body: JSON.stringify({ content }),
    }
  );

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.error || "更新分段失败");
  }

  return res.json();
}

// 删除所有分段
export async function deleteChunks(documentId: number): Promise<void> {
  const res = await fetch(apiUrl(`/documents/${documentId}/chunks`), {
    method: "DELETE",
    headers: getAgentHeaders(),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.error || "删除分段失败");
  }
}
