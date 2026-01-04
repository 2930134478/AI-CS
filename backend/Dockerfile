# ============================================
# 多阶段构建：构建阶段
# ============================================
FROM golang:1.24-alpine AS builder

WORKDIR /app

# 安装必要的构建工具
RUN apk add --no-cache git ca-certificates tzdata

# 复制 go mod 文件
COPY go.mod go.sum ./

# 下载依赖
RUN go mod download

# 复制源代码
COPY . .

# 构建应用
# CGO_ENABLED=0: 禁用 CGO，生成纯 Go 二进制文件
# GOOS=linux: 目标操作系统
# GOARCH=amd64: 目标架构
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -a -installsuffix cgo -ldflags '-extldflags "-static"' -o backend main.go

# ============================================
# 运行阶段
# ============================================
FROM alpine:latest

WORKDIR /app

# 安装必要的运行时依赖
RUN apk --no-cache add ca-certificates tzdata

# 从构建阶段复制二进制文件
COPY --from=builder /app/backend .

# 从构建阶段复制时区数据（可选）
COPY --from=builder /usr/share/zoneinfo /usr/share/zoneinfo

# 设置时区（可选，默认 UTC）
ENV TZ=Asia/Shanghai

# 创建必要的目录
RUN mkdir -p uploads/avatars uploads/messages

# 暴露端口
EXPOSE 8080

# 启动应用
CMD ["./backend"]