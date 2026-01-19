#!/bin/bash

echo "🔧 整改对比助手 - Linux 环境配置"
echo "===================================="
echo ""

# 检测系统类型
if [ -f /etc/os-release ]; then
    . /etc/os-release
    OS=$ID
else
    echo "❌ 无法检测系统类型"
    exit 1
fi

echo "📋 检测到系统: $PRETTY_NAME"
echo ""

# 检查是否有 sudo 权限
if ! sudo -n true 2>/dev/null; then
    echo "⚠️  此脚本需要 sudo 权限来安装系统依赖"
    echo "请输入密码："
fi

echo "📦 安装 canvas 所需的系统依赖..."
echo ""

case $OS in
    ubuntu|debian|linuxmint|pop)
        echo "使用 apt-get 安装依赖..."
        sudo apt-get update
        sudo apt-get install -y \
            build-essential \
            libcairo2-dev \
            libpango1.0-dev \
            libjpeg-dev \
            libgif-dev \
            librsvg2-dev \
            pkg-config
        ;;
    centos|rhel|fedora)
        echo "使用 yum 安装依赖..."
        sudo yum install -y \
            gcc-c++ \
            cairo-devel \
            pango-devel \
            libjpeg-turbo-devel \
            giflib-devel \
            librsvg2-devel \
            pkgconfig
        ;;
    arch|manjaro)
        echo "使用 pacman 安装依赖..."
        sudo pacman -S --needed \
            base-devel \
            cairo \
            pango \
            libjpeg-turbo \
            giflib \
            librsvg \
            pkg-config
        ;;
    *)
        echo "⚠️  未知系统: $OS ($PRETTY_NAME)"
        echo ""
        echo "请手动安装以下依赖包："
        echo "  - build-essential / gcc-c++"
        echo "  - cairo (libcairo2-dev / cairo-devel)"
        echo "  - pango (libpango1.0-dev / pango-devel)"
        echo "  - libjpeg (libjpeg-dev / libjpeg-turbo-devel)"
        echo "  - giflib (libgif-dev / giflib-devel)"
        echo "  - librsvg (librsvg2-dev / librsvg2-devel)"
        echo "  - pkg-config"
        echo ""
        read -p "依赖已手动安装？继续安装 Node.js 依赖 (y/n)? " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
        ;;
esac

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ 系统依赖安装完成"
else
    echo ""
    echo "❌ 系统依赖安装失败"
    exit 1
fi

echo ""
echo "🧹 清理旧的 Node.js 依赖..."
rm -rf node_modules package-lock.json

echo ""
echo "📦 安装 Node.js 依赖..."
npm install

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ 所有依赖安装完成！"
    echo ""
    echo "🚀 可用命令："
    echo "  npm run dev           # 开发模式（即时预览）"
    echo "  npm run build:linux   # 构建 Linux 版本"
    echo "  npm run build:win     # 构建 Windows 版本（需要 Wine）"
    echo ""
    echo "📖 更多信息请查看 LINUX_BUILD.md"
else
    echo ""
    echo "❌ Node.js 依赖安装失败"
    echo ""
    echo "可能的原因："
    echo "1. 系统依赖未正确安装"
    echo "2. Node.js 版本过低（需要 >= 16.x）"
    echo "3. 网络问题"
    echo ""
    echo "请检查错误信息后重试"
    exit 1
fi
