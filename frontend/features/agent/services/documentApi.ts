import { API_BASE_URL, getAgentHeaders } from "@/lib/config";

// 文档摘要信息
export interface Document {
  id: number;
  knowledge_base_id: number;
  title: string;
  content: string;
  summary: string;
  type: string;
  status: string;
  embedding_status: string;
  created_at: string;
  updated_at: string;
}

// 创建文档请求
export interface CreateDocumentRequest {
  knowledge_base_id: number;
  title: string;
  content: string;
  summary?: string;
  type?: string;
  status?: string;
}

// 更新文档请求
export interface UpdateDocumentRequest {
  title?: string;
  content?: string;
  summary?: string;
  type?: string;
  status?: string;
}

// 文档列表结果
export interface DocumentListResult {
  documents: Document[];
  total: number;
  page: number;
  page_size: number;
  total_page: number;
}

// 获取文档列表
export async function fetchDocuments(
  knowledgeBaseId?: number,
  page: number = 1,
  pageSize: number = 20,
  keyword?: string,
  status?: string
): Promise<DocumentListResult> {
  let url = `${API_BASE_URL}/documents?page=${page}&page_size=${pageSize}`;
  if (knowledgeBaseId) {
    url += `&knowledge_base_id=${knowledgeBaseId}`;
  }
  if (keyword) {
    url += `&keyword=${encodeURIComponent(keyword)}`;
  }
  if (status) {
    url += `&status=${encodeURIComponent(status)}`;
  }

  const res = await fetch(url, {
    cache: "no-store",
    headers: getAgentHeaders(),
  });

  if (!res.ok) {
    throw new Error("获取文档列表失败");
  }

  return res.json();
}

// 获取文档详情
export async function fetchDocument(id: number): Promise<Document> {
  const res = await fetch(`${API_BASE_URL}/documents/${id}`, {
    cache: "no-store",
    headers: getAgentHeaders(),
  });

  if (!res.ok) {
    if (res.status === 404) {
      throw new Error("文档不存在");
    }
    throw new Error("获取文档详情失败");
  }

  return res.json();
}

// 创建文档
export async function createDocument(data: CreateDocumentRequest): Promise<Document> {
  const res = await fetch(`${API_BASE_URL}/documents`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.error || "创建文档失败");
  }

  return res.json();
}

// 更新文档
export async function updateDocument(
  id: number,
  data: UpdateDocumentRequest
): Promise<Document> {
  const res = await fetch(`${API_BASE_URL}/documents/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...getAgentHeaders() },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    if (res.status === 404) {
      throw new Error("文档不存在");
    }
    throw new Error(error.error || "更新文档失败");
  }

  return res.json();
}

// 删除文档
export async function deleteDocument(id: number): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/documents/${id}`, {
    method: "DELETE",
    headers: getAgentHeaders(),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    if (res.status === 404) {
      throw new Error("文档不存在");
    }
    throw new Error(error.error || "删除文档失败");
  }
}

// 更新文档状态
export async function updateDocumentStatus(id: number, status: string): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/documents/${id}/status`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...getAgentHeaders() },
    body: JSON.stringify({ status }),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.error || "更新文档状态失败");
  }
}

// 发布文档
export async function publishDocument(id: number): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/documents/${id}/publish`, {
    method: "POST",
    headers: getAgentHeaders(),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.error || "发布文档失败");
  }
}

// 取消发布文档
export async function unpublishDocument(id: number): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/documents/${id}/unpublish`, {
    method: "POST",
    headers: getAgentHeaders(),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.error || "取消发布文档失败");
  }
}

// 搜索文档（向量检索）
export async function searchDocuments(
  query: string,
  topK: number = 5,
  knowledgeBaseId?: number
): Promise<Document[]> {
  let url = `${API_BASE_URL}/documents/search?query=${encodeURIComponent(query)}&top_k=${topK}`;
  if (knowledgeBaseId) {
    url += `&knowledge_base_id=${knowledgeBaseId}`;
  }

  const res = await fetch(url, {
    cache: "no-store",
    headers: getAgentHeaders(),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.error || "搜索文档失败");
  }

  const data = await res.json();
  return data.documents || [];
}
