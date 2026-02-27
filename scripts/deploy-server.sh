#!/bin/bash
# AI-CS 服务器部署脚本
# 使用方法：在服务器上运行此脚本进行快速部署

set -e  # 遇到错误立即退出

echo "🚀 开始部署 AI-CS 系统..."

# 检查是否为 root 用户
if [ "$EUID" -ne 0 ]; then 
    echo "❌ 请使用 root 用户运行此脚本"
    exit 1
fi

# 1. 更新系统
echo "📦 更新系统软件包..."
apt update && apt upgrade -y

# 2. 安装基础工具
echo "📦 安装基础工具..."
apt install -y curl wget git vim

# 3. 安装 Node.js 20+（Next.js 16 要求 >= 20.9.0）
echo "📦 安装 Node.js..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt install -y nodejs
else
    echo "✅ Node.js 已安装: $(node -v)"
fi

# 4. 安装 Go 1.21+
echo "📦 安装 Go..."
if ! command -v go &> /dev/null; then
    GO_VERSION="1.21.6"
    wget https://go.dev/dl/go${GO_VERSION}.linux-amd64.tar.gz
    tar -C /usr/local -xzf go${GO_VERSION}.linux-amd64.tar.gz
    echo 'export PATH=$PATH:/usr/local/go/bin' >> ~/.bashrc
    export PATH=$PATH:/usr/local/go/bin
    rm go${GO_VERSION}.linux-amd64.tar.gz
else
    echo "✅ Go 已安装: $(go version)"
fi

# 5. 安装 MySQL
echo "📦 安装 MySQL..."
if ! command -v mysql &> /dev/null; then
    apt install -y mysql-server
    systemctl start mysql
    systemctl enable mysql
    echo "⚠️  请运行 'mysql_secure_installation' 配置 MySQL 安全设置"
else
    echo "✅ MySQL 已安装"
fi

# 6. 安装 Nginx
echo "📦 安装 Nginx..."
if ! command -v nginx &> /dev/null; then
    apt install -y nginx
    systemctl start nginx
    systemctl enable nginx
else
    echo "✅ Nginx 已安装"
fi

# 7. 安装 PM2
echo "📦 安装 PM2..."
if ! command -v pm2 &> /dev/null; then
    npm install -g pm2
    pm2 startup
else
    echo "✅ PM2 已安装"
fi

# 8. 创建项目目录
echo "📁 创建项目目录..."
mkdir -p /var/www
cd /var/www

# 9. 提示用户克隆项目
echo ""
echo "✅ 基础环境安装完成！"
echo ""
echo "📝 接下来的步骤："
echo "1. 克隆项目到 /var/www/AI-CS"
echo "   git clone https://github.com/your-username/AI-CS.git"
echo ""
echo "2. 配置后端环境变量："
echo "   cd /var/www/AI-CS/backend"
echo "   cp .env.example .env"
echo "   # 编辑 .env 文件，填入数据库配置"
echo ""
echo "3. 创建数据库："
echo "   mysql -u root -p"
echo "   CREATE DATABASE ai_cs CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
echo ""
echo "4. 编译后端："
echo "   cd /var/www/AI-CS/backend"
echo "   go mod tidy"
echo "   go build -o backend main.go"
echo ""
echo "5. 配置前端环境变量："
echo "   cd /var/www/AI-CS/frontend"
echo "   cp .env.example .env.production"
echo "   # 编辑 .env.production，设置 API 地址"
echo ""
echo "6. 构建前端："
echo "   npm install"
echo "   npm run build"
echo ""
echo "7. 配置 Nginx（参考部署文档）"
echo ""
echo "8. 配置 SSL 证书："
echo "   certbot --nginx -d yourdomain.com -d www.yourdomain.com -d api.yourdomain.com"
echo ""

