import { API_BASE_URL, getAgentHeaders } from "@/lib/config";

// 知识库摘要信息
export interface KnowledgeBase {
  id: number;
  name: string;
  description: string;
  document_count: number;
  rag_enabled?: boolean; // 是否参与 RAG（对 AI 开放），默认 true
  created_at: string;
  updated_at: string;
}

// 创建知识库请求
export interface CreateKnowledgeBaseRequest {
  name: string;
  description?: string;
}

// 更新知识库请求
export interface UpdateKnowledgeBaseRequest {
  name?: string;
  description?: string;
  rag_enabled?: boolean;
}

// 获取知识库列表
export async function fetchKnowledgeBases(): Promise<KnowledgeBase[]> {
  const res = await fetch(`${API_BASE_URL}/knowledge-bases`, {
    cache: "no-store",
    headers: getAgentHeaders(),
  });

  if (!res.ok) {
    throw new Error("获取知识库列表失败");
  }

  const data = await res.json();
  return data.knowledge_bases || [];
}

// 获取知识库详情
export async function fetchKnowledgeBase(id: number): Promise<KnowledgeBase> {
  const res = await fetch(`${API_BASE_URL}/knowledge-bases/${id}`, {
    cache: "no-store",
    headers: getAgentHeaders(),
  });

  if (!res.ok) {
    if (res.status === 404) {
      throw new Error("知识库不存在");
    }
    throw new Error("获取知识库详情失败");
  }

  return res.json();
}

// 创建知识库
export async function createKnowledgeBase(data: CreateKnowledgeBaseRequest): Promise<KnowledgeBase> {
  const res = await fetch(`${API_BASE_URL}/knowledge-bases`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...getAgentHeaders() },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.error || "创建知识库失败");
  }

  return res.json();
}

// 更新知识库「参与 RAG」开关
export async function updateKnowledgeBaseRAGEnabled(
  id: number,
  ragEnabled: boolean
): Promise<KnowledgeBase> {
  const res = await fetch(`${API_BASE_URL}/knowledge-bases/${id}/rag-enabled`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...getAgentHeaders() },
    body: JSON.stringify({ rag_enabled: ragEnabled }),
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error((error as { error?: string }).error || "更新失败");
  }
  return res.json();
}

// 更新知识库
export async function updateKnowledgeBase(
  id: number,
  data: UpdateKnowledgeBaseRequest
): Promise<KnowledgeBase> {
  const res = await fetch(`${API_BASE_URL}/knowledge-bases/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...getAgentHeaders() },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    if (res.status === 404) {
      throw new Error("知识库不存在");
    }
    throw new Error(error.error || "更新知识库失败");
  }

  return res.json();
}

// 删除知识库
export async function deleteKnowledgeBase(id: number): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/knowledge-bases/${id}`, {
    method: "DELETE",
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    if (res.status === 404) {
      throw new Error("知识库不存在");
    }
    throw new Error(error.error || "删除知识库失败");
  }
}

// 获取知识库的文档列表
export async function fetchDocumentsByKnowledgeBase(
  knowledgeBaseId: number,
  page: number = 1,
  pageSize: number = 20,
  keyword?: string,
  status?: string
): Promise<any> {
  let url = `${API_BASE_URL}/documents?knowledge_base_id=${knowledgeBaseId}&page=${page}&page_size=${pageSize}`;
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
