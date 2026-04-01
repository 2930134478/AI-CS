import { NextRequest, NextResponse } from "next/server";

const BACKEND_HOST = process.env.NEXT_PUBLIC_BACKEND_HOST || "localhost";
const BACKEND_PORT = process.env.NEXT_PUBLIC_BACKEND_PORT || "8080";
const BACKEND_BASE = `http://${BACKEND_HOST}:${BACKEND_PORT}`;

/** 开发环境：将 /api/agent/prompts 代理到后端，避免 rewrites 在 Turbopack 下不稳定 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const backendUrl = `${BACKEND_BASE}/agent/prompts?${searchParams.toString()}`;
  const userID = request.headers.get("X-User-Id") || "";
  try {
    const res = await fetch(backendUrl, {
      cache: "no-store",
      headers: userID ? { "X-User-Id": userID } : {},
    });
    const body = await res.text();
    return new NextResponse(body, {
      status: res.status,
      headers: { "Content-Type": res.headers.get("content-type") || "application/json" },
    });
  } catch (e) {
    return NextResponse.json(
      { error: "无法连接后端，请确认后端已启动且端口一致（默认 8080）" },
      { status: 502 }
    );
  }
}

export async function PUT(request: NextRequest) {
  const backendUrl = `${BACKEND_BASE}/agent/prompts`;
  const userID = request.headers.get("X-User-Id") || "";
  try {
    const body = await request.text();
    const res = await fetch(backendUrl, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...(userID ? { "X-User-Id": userID } : {}),
      },
      body,
    });
    const resBody = await res.text();
    return new NextResponse(resBody, {
      status: res.status,
      headers: { "Content-Type": res.headers.get("content-type") || "application/json" },
    });
  } catch (e) {
    return NextResponse.json(
      { error: "无法连接后端，请确认后端已启动且端口一致（默认 8080）" },
      { status: 502 }
    );
  }
}
