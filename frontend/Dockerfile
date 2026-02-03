# ============================================
# 多阶段构建：构建阶段
# ============================================
FROM node:18-alpine AS builder

WORKDIR /app

# 复制 package 文件
COPY package*.json ./

# 安装依赖（使用 npm ci 确保依赖版本一致）
RUN npm ci

# 复制源代码
COPY . .

# 构建参数（Next.js 环境变量必须在构建时传入）
ARG NEXT_PUBLIC_API_BASE_URL
ENV NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL

# 后端端口配置（用于图片加载等）
ARG NEXT_PUBLIC_BACKEND_PORT=18080
ENV NEXT_PUBLIC_BACKEND_PORT=$NEXT_PUBLIC_BACKEND_PORT

# 构建 Next.js 应用
RUN npm run build

# ============================================
# 运行阶段
# ============================================
FROM node:18-alpine

WORKDIR /app

# 设置生产环境
ENV NODE_ENV=production

# 复制 package 文件（用于安装生产依赖）
COPY package*.json ./

# 只安装生产依赖；并安装 TypeScript 供 next start 加载 next.config.ts（运行时不再尝试 npm install）
RUN npm ci --only=production && npm install typescript --no-save && npm cache clean --force

# 从构建阶段复制必要的文件
COPY --from=builder /app/next.config.ts ./
COPY --from=builder /app/tsconfig.json ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next

# 暴露端口
EXPOSE 3000

# 启动 Next.js 生产服务器
CMD ["npm", "start"]