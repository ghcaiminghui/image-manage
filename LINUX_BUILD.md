# Linux 环境构建指南

## 系统依赖安装

在 Linux 上构建此项目前，需要先安装 canvas 模块的系统依赖。

### Ubuntu / Debian 系统

```bash
sudo apt-get update
sudo apt-get install -y \
    build-essential \
    libcairo2-dev \
    libpango1.0-dev \
    libjpeg-dev \
    libgif-dev \
    librsvg2-dev \
    pkg-config
```

### CentOS / RHEL / Fedora 系统

```bash
sudo yum install -y \
    gcc-c++ \
    cairo-devel \
    pango-devel \
    libjpeg-turbo-devel \
    giflib-devel \
    librsvg2-devel \
    pkgconfig
```

### Arch Linux 系统

```bash
sudo pacman -S --needed \
    base-devel \
    cairo \
    pango \
    libjpeg-turbo \
    giflib \
    librsvg \
    pkg-config
```

## 安装项目依赖

安装完系统依赖后，再安装 Node.js 依赖：

```bash
# 清理旧的依赖（如果之前安装失败）
rm -rf node_modules package-lock.json

# 重新安装
npm install
```

## 构建应用

### 开发模式
```bash
npm run dev
```

### 构建 Linux 版本
```bash
npm run build:linux
```

### 构建 Windows 版本（在 Linux 上）
```bash
# 需要安装 Wine
sudo apt-get install wine64  # Ubuntu/Debian
# 或
sudo yum install wine         # CentOS/RHEL

# 然后构建
npm run build:win
```

## 常见问题

### Q1: npm install 失败，提示 canvas 相关错误？
**A:** 确保已安装上述系统依赖，然后：
```bash
rm -rf node_modules
npm cache clean --force
npm install
```

### Q2: 构建时提示 "node-gyp" 错误？
**A:** 安装 Python 和构建工具：
```bash
sudo apt-get install python3 python3-pip
```

### Q3: 如何只构建不重新编译原生模块？
**A:** 已在配置中设置 `npmRebuild: false`，无需额外操作。

### Q4: 构建的应用无法在其他 Linux 系统运行？
**A:** 推荐使用 AppImage 格式（已默认配置），具有更好的兼容性。

## 推荐的 CI/CD 构建环境

如果使用 Docker 构建，推荐使用以下基础镜像：

```dockerfile
FROM node:18-bullseye

# 安装系统依赖
RUN apt-get update && apt-get install -y \
    build-essential \
    libcairo2-dev \
    libpango1.0-dev \
    libjpeg-dev \
    libgif-dev \
    librsvg2-dev \
    pkg-config

# 复制项目文件
WORKDIR /app
COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build:linux
```

## 快速开始脚本

创建 `setup-linux.sh` 脚本：

```bash
#!/bin/bash

echo "🔧 检测 Linux 发行版..."

# 检测系统类型
if [ -f /etc/os-release ]; then
    . /etc/os-release
    OS=$ID
else
    echo "❌ 无法检测系统类型"
    exit 1
fi

echo "📦 安装系统依赖..."

case $OS in
    ubuntu|debian)
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
        sudo yum install -y \
            gcc-c++ \
            cairo-devel \
            pango-devel \
            libjpeg-turbo-devel \
            giflib-devel \
            librsvg2-devel \
            pkgconfig
        ;;
    arch)
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
        echo "⚠️  未知系统: $OS"
        echo "请手动安装 cairo, pango, libjpeg, giflib, librsvg 相关开发包"
        exit 1
        ;;
esac

echo "✅ 系统依赖安装完成"
echo ""
echo "📦 安装 Node.js 依赖..."
npm install

echo ""
echo "✅ 安装完成！"
echo ""
echo "现在可以运行："
echo "  npm run dev          # 开发模式"
echo "  npm run build:linux  # 构建 Linux 版本"
echo "  npm run build:win    # 构建 Windows 版本"
```

保存后执行：
```bash
chmod +x setup-linux.sh
./setup-linux.sh
```
