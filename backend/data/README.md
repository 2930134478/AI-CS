# ip2region 离线 IP 库

访客地理位置解析使用 [ip2region](https://github.com/lionsoul2014/ip2region) 的 `xdb` 文件。

## 获取数据文件

将 **`ip2region_v4.xdb`** 放到本目录（与本文档同级）：

```bash
# 在项目根目录执行（需 curl）
curl -L -o backend/data/ip2region_v4.xdb \
  https://github.com/lionsoul2014/ip2region/raw/master/data/ip2region_v4.xdb
```

可选 IPv6：下载 `ip2region_v6.xdb` 并设置环境变量 `IP2REGION_V6_XDB`。

## 环境变量

| 变量 | 说明 |
|------|------|
| `IP2REGION_DISABLED` | `true` 时关闭解析 |
| `IP2REGION_V4_XDB` | v4 库路径（默认自动查找 `backend/data/ip2region_v4.xdb`） |
| `IP2REGION_V6_XDB` | v6 库路径（可选） |

Docker 构建时会自动下载 v4 库到镜像内 `/app/data/`。
