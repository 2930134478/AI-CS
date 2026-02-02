// Favicon 工具函数

/** 使用 URL 更新 favicon（如恢复默认） */
export function updateFavicon(url: string) {
  const link = document.querySelector("link[rel*='icon']") as HTMLLinkElement;
  if (link) {
    link.href = url;
  } else {
    const newLink = document.createElement("link");
    newLink.rel = "icon";
    newLink.href = url;
    document.head.appendChild(newLink);
  }
}

/** 移除动态 favicon，恢复为默认（需页面存在 link[rel=icon] 指向默认图标） */
export function removeFavicon() {
  const link = document.querySelector("link[rel*='icon']") as HTMLLinkElement;
  if (link) {
    link.remove();
  }
}

const DEFAULT_FAVICON = "/favicon.ico";

/** 用 Canvas 绘制红底白字数字徽章，并设为 favicon（未读数 > 0 时使用） */
export function updateFaviconWithBadge(count: number) {
  if (count <= 0) {
    updateFavicon(DEFAULT_FAVICON);
    return;
  }
  const size = 64;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const text = count > 99 ? "99+" : String(count);
  const fontSize = text.length >= 2 ? 16 : 18;
  const radius = text.length >= 2 ? 14 : 12;
  const cx = size - radius - 4;
  const cy = radius + 4;

  ctx.clearRect(0, 0, size, size);
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.fillStyle = "#dc2626";
  ctx.fill();
  ctx.strokeStyle = "#fff";
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = "#fff";
  ctx.font = `bold ${fontSize}px system-ui, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, cx, cy);

  const dataUrl = canvas.toDataURL("image/png");
  updateFavicon(dataUrl);
}

export { DEFAULT_FAVICON };
