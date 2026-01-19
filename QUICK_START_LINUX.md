# Linux 快速开始指南

## 🚀 一键安装（推荐）

将项目文件上传到 Linux 服务器后，执行：

```bash
chmod +x setup-linux.sh
./setup-linux.sh
```

脚本会自动：
1. ✅ 检测系统类型
2. ✅ 配置 npm 淘宝镜像（提高下载速度）
3. ✅ 安装系统依赖（canvas 所需）
4. ✅ 配置 Electron 镜像
5. ✅ 安装所有 Node.js 依赖

---

## 📋 手动配置（如果脚本失败）

### 第 1 步：配置 npm 镜像（重要！）

```bash
# 设置 npm 淘宝镜像
npm config set registry https://registry.npmmirror.com

# 验证配置
npm config get registry
# 应显示: https://registry.npmmirror.com
```

### 第 2 步：确保项目有 .npmrc 文件

在项目根目录创建或更新 `.npmrc` 文件：

```bash
cat > .npmrc << 'EOF'
# Electron 镜像配置（使用淘宝镜像）
electron_mirror=https://npmmirror.com/mirrors/electron/
electron_builder_binaries_mirror=https://npmmirror.com/mirrors/electron-builder-binaries/

# Electron 自定义目录配置
electron_custom_dir={{ version }}

# Node-gyp 配置
node_gyp_mirror=https://npmmirror.com/mirrors/node/

# Canvas 预构建二进制文件镜像
canvas_binary_host_mirror=https://registry.npmmirror.com/-/binary/canvas
EOF
```

### 第 3 步：安装系统依赖

**Ubuntu / Debian:**
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

**CentOS / RHEL:**
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

### 第 4 步：安装 Node.js 依赖

```bash
# 清理旧的（如果有）
rm -rf node_modules package-lock.json

# 安装
npm install
```

**⏰ 首次安装预计时间：**
- 网络正常：5-10 分钟
- 需要下载约 300-500MB 文件

---

## ❓ 常见问题

### Q1: npm install 卡在下载 Electron？

**原因：** 未配置镜像，从 GitHub 下载很慢或失败

**解决：**
```bash
# 配置镜像后重试
npm config set registry https://registry.npmmirror.com
rm -rf node_modules package-lock.json
npm install
```

### Q2: canvas 模块编译失败？

**原因：** 缺少系统依赖

**解决：** 按照第 3 步安装系统依赖

### Q3: 提示 "The "paths[0]" argument must be of type string"？

**原因：** electron-builder 尝试自动 rebuild 但路径错误

**解决：** 已在 `electron-builder.yml` 中设置 `npmRebuild: false`
```bash
# 更新配置后重新安装
git pull  # 获取最新配置
npm install
```

### Q4: 下载速度还是很慢？

**检查镜像配置：**
```bash
# 检查 npm 镜像
npm config get registry

# 检查 Electron 镜像
cat .npmrc | grep electron_mirror
```

**应该看到：**
- npm registry: `https://registry.npmmirror.com`
- electron_mirror: `https://npmmirror.com/mirrors/electron/`

---

## 🎯 安装成功后

运行开发模式测试：
```bash
npm run dev
```

或构建 Linux 版本：
```bash
npm run build:linux
```

或构建 Windows 版本：
```bash
npm run build:win
```

---

## 📦 镜像源对比

| 资源 | 官方源 | 国内镜像 |
|------|--------|----------|
| npm 包 | registry.npmjs.org | registry.npmmirror.com |
| Electron | github.com | npmmirror.com |
| 下载速度 | ❌ 很慢/失败 | ✅ 快速 |

---

## 💡 提示

1. **首次安装一定要配置镜像**，否则可能需要数小时甚至失败
2. 如果公司有内网镜像，可以替换为公司镜像地址
3. 安装成功后，`.npmrc` 文件会被 Git 追踪，其他机器可直接使用

---

**遇到问题？** 查看完整文档：`LINUX_BUILD.md`
