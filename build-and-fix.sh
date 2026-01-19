#!/bin/bash

# 整改对比助手 - 打包并移除隔离属性脚本

echo "🚀 开始构建应用..."
npm run build:mac

if [ $? -eq 0 ]; then
    echo "✅ 构建成功！"
    
    # 查找生成的 .app 文件
    APP_PATH=$(find dist -name "*.app" -type d | head -n 1)
    
    if [ -n "$APP_PATH" ]; then
        echo "📦 找到应用: $APP_PATH"
        echo "🔓 移除隔离属性..."
        xattr -cr "$APP_PATH"
        
        if [ $? -eq 0 ]; then
            echo "✅ 应用已准备就绪！"
            echo "📂 位置: $APP_PATH"
            echo ""
            echo "现在可以直接双击打开应用了！"
            
            # 询问是否立即打开
            read -p "是否立即打开应用？(y/n) " -n 1 -r
            echo
            if [[ $REPLY =~ ^[Yy]$ ]]; then
                open "$APP_PATH"
            fi
        else
            echo "⚠️  移除隔离属性失败，请手动执行："
            echo "xattr -cr \"$APP_PATH\""
        fi
    else
        echo "⚠️  未找到生成的应用文件"
    fi
else
    echo "❌ 构建失败"
    exit 1
fi
