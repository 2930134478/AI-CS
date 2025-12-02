# 前端配置说明

## 真实设备测试配置

### 步骤 1：创建 `.env.local` 文件

在 `frontend` 目录下创建 `.env.local` 文件（如果不存在）。

### 步骤 2：配置 IP 地址

在 `.env.local` 文件中添加以下内容：

```env
# 将 192.168.124.9 替换为你的电脑 IP 地址
# 获取 IP 地址：在 PowerShell 中运行 ipconfig
NEXT_PUBLIC_API_BASE_URL=http://192.168.124.9:8080
```

**你的 IP 地址**：根据 `ipconfig` 结果，你的 IP 地址是 **192.168.124.9**

### 步骤 3：重启前端服务

```bash
# 停止当前服务（Ctrl+C）
# 重新启动
npm run dev
```

### 步骤 4：在手机/平板上访问

1. 确保手机/平板连接**同一 WiFi**
2. 在手机浏览器输入：`http://192.168.124.9:3000`

---

## 本地开发配置（默认）

如果只想在本地开发，不需要配置 `.env.local` 文件，使用默认配置即可：

- 前端：`http://localhost:3000`
- 后端：`http://127.0.0.1:8080`

---

## 注意事项

1. ✅ **防火墙**：确保 Windows 防火墙允许端口 3000 和 8080
2. ✅ **同一网络**：手机和电脑必须在同一 WiFi 网络
3. ✅ **后端配置**：后端已配置为监听 `0.0.0.0:8080`，允许外部访问

---

## 快速配置

**Windows PowerShell**：

```powershell
# 在 frontend 目录下运行
@"
NEXT_PUBLIC_API_BASE_URL=http://192.168.124.9:8080
"@ | Out-File -FilePath ".env.local" -Encoding utf8
```

（记得将 `192.168.124.9` 替换为你的实际 IP 地址）

