import { API_BASE_URL } from "@/lib/config";

// FAQ 摘要信息
export interface FAQSummary {
  id: number;
  question: string;    // 问题
  answer: string;      // 答案
  keywords: string;    // 关键词（用于搜索）
  created_at: string;  // 创建时间
  updated_at: string;  // 更新时间
}

// 创建 FAQ 请求
export interface CreateFAQRequest {
  question: string;    // 问题（必需）
  answer: string;      // 答案（必需）
  keywords?: string;   // 关键词（可选）
}

// 更新 FAQ 请求
export interface UpdateFAQRequest {
  question?: string;   // 问题（可选）
  answer?: string;     // 答案（可选）
  keywords?: string;   // 关键词（可选）
}

// 获取 FAQ 列表（支持关键词搜索）
// query 格式：关键词之间用 % 分隔，例如 "openai%api%调用"
export async function fetchFAQs(query?: string): Promise<FAQSummary[]> {
  // 使用相对路径构建 URL，支持查询参数
  let url = `${API_BASE_URL}/faqs`;
  if (query) {
    url += `?query=${encodeURIComponent(query)}`;
  }

  const res = await fetch(url, {
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("获取 FAQ 列表失败");
  }

  const data = await res.json();
  return data.faqs || [];
}

// 获取 FAQ 详情
export async function fetchFAQ(id: number): Promise<FAQSummary> {
  const res = await fetch(`${API_BASE_URL}/faqs/${id}`, {
    cache: "no-store",
  });

  if (!res.ok) {
    if (res.status === 404) {
      throw new Error("FAQ 不存在");
    }
    throw new Error("获取 FAQ 详情失败");
  }

  return res.json();
}

// 创建 FAQ
export async function createFAQ(data: CreateFAQRequest): Promise<FAQSummary> {
  const res = await fetch(`${API_BASE_URL}/faqs`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.error || "创建 FAQ 失败");
  }

  return res.json();
}

// 更新 FAQ
export async function updateFAQ(
  id: number,
  data: UpdateFAQRequest
): Promise<FAQSummary> {
  const res = await fetch(`${API_BASE_URL}/faqs/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    if (res.status === 404) {
      throw new Error("FAQ 不存在");
    }
    throw new Error(error.error || "更新 FAQ 失败");
  }

  return res.json();
}

// 删除 FAQ
export async function deleteFAQ(id: number): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/faqs/${id}`, {
    method: "DELETE",
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    if (res.status === 404) {
      throw new Error("FAQ 不存在");
    }
    throw new Error(error.error || "删除 FAQ 失败");
  }
}

