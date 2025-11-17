import { ReactNode } from "react";

export function highlightText(text: string, keyword: string): ReactNode {
  if (!keyword.trim()) {
    return text;
  }
  const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`(${escaped})`, "gi");
  const parts = text.split(regex);
  return parts.map((part, index) =>
    regex.test(part) ? (
      <mark
        key={`${part}-${index}`}
        className="bg-yellow-300 text-gray-900 px-1 rounded"
      >
        {part}
      </mark>
    ) : (
      part
    )
  );
}

