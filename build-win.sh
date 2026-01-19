#!/bin/bash

# 整改对比助手 - Windows 版本构建脚本

echo "🔧 准备构建 Windows 版本..."
echo ""

# 检查是否安装了 Wine
if ! command -v wine &> /dev/null; then
    echo "⚠️  未检测到 Wine，首次构建 Windows 版本需要安装 Wine"
    echo ""
    echo "是否安装 Wine？(推荐使用 Homebrew)"
    echo "1) 使用 Homebrew 安装 (推荐)"
    echo "2) 跳过，让 electron-builder 自动处理"
    echo "3) 取消构建"
    read -p "请选择 [1-3]: " choice
    
    case $choice in
        1)
            echo "📦 正在安装 Wine..."
            if command -v brew &> /dev/null; then
                brew install --cask wine-stable
            else
                echo "❌ 未安装 Homebrew，请先安装："
                echo "https://brew.sh/zh-cn/"
                exit 1
            fi
            ;;
        2)
            echo "⏭️  跳过 Wine 安装，继续构建..."
            ;;
        3)
            echo "❌ 取消构建"
            exit 0
            ;;
        *)
            echo "❌ 无效选择"
            exit 1
            ;;
    esac
fi

echo ""
echo "🧹 清理旧的构建文件..."
rm -rf dist/win-*
rm -rf dist/*.exe

echo ""
echo "🔨 开始构建 Windows x64 版本..."
echo "⏰ 首次构建可能需要 5-10 分钟（需要下载依赖）"
echo ""

echo "🔌 步骤 1: 构建前端代码..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ 前端构建失败"
    exit 1
fi

echo ""
echo "🔌 步骤 2: 为 Windows 重新构建 canvas 模块..."
echo "💡 这一步很重要，确保 canvas 可以在 Windows 上运行"

# 重新构建原生模块
npx @electron/rebuild --platform=win32 --arch=x64 --module-dir=node_modules/canvas

if [ $? -ne 0 ]; then
    echo "⚠️  canvas 模块重新构建失败，尝试继续..."
fi

echo ""
echo "🔌 步骤 3: 打包 Windows 安装程序..."
electron-builder --win --x64

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Windows 版本构建成功！"
    echo ""
    
    # 查找生成的安装包
    SETUP_FILE=$(find dist -name "*-setup.exe" -type f | head -n 1)
    
    if [ -n "$SETUP_FILE" ]; then
        FILE_SIZE=$(du -h "$SETUP_FILE" | cut -f1)
        echo "📦 安装包信息："
        echo "   文件: $SETUP_FILE"
        echo "   大小: $FILE_SIZE"
        echo ""
        echo "🎉 可以将此文件发送给 Windows 用户安装使用！"
        echo ""
        
        # 询问是否打开 dist 目录
        read -p "是否在 Finder 中打开构建目录？(y/n) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            open dist
        fi
    else
        echo "⚠️  未找到安装包文件"
        echo "📂 请检查 dist 目录"
    fi
else
    echo ""
    echo "❌ 构建失败"
    echo ""
    echo "常见问题解决方法："
    echo "1. 确保已安装所有依赖: npm install"
    echo "2. 清理 node_modules 重新安装: rm -rf node_modules && npm install"
    echo "3. 检查是否有网络问题（需要下载 Windows 构建工具）"
    echo "4. 查看详细错误信息，根据提示操作"
    exit 1
fi
