#!/usr/bin/env sh
# 下载 ip2region v4 xdb 到 backend/data/（本地开发用）
set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DEST="$ROOT/backend/data/ip2region_v4.xdb"
mkdir -p "$(dirname "$DEST")"
curl -fsSL -o "$DEST" \
  https://github.com/lionsoul2014/ip2region/raw/master/data/ip2region_v4.xdb
echo "OK: $DEST ($(wc -c < "$DEST" | tr -d ' ') bytes)"
