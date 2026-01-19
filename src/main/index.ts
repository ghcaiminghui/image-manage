import { app, shell, BrowserWindow, ipcMain, dialog } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { createCanvas, loadImage, Image } from 'canvas'
import * as fs from 'fs'

function createWindow(): void {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // IPC test
  ipcMain.on('ping', () => console.log('pong'))

  // 图片合并处理
  ipcMain.handle('merge-images', async (_, data) => {
    try {
      const { pairs: imagePairs, settings } = data
      
      // 过滤出有效的图片对
      const validPairs = imagePairs.filter((pair) => pair.before && pair.after)
      if (validPairs.length === 0) {
        throw new Error('没有有效的图片对')
      }

      // 加载所有图片
      const images = await Promise.all(
        validPairs.map(async (pair) => {
          const beforeImg = await loadImage(pair.before)
          const afterImg = await loadImage(pair.after)
          return { before: beforeImg, after: afterImg }
        })
      )

      // 使用用户设置的尺寸
      const padding = 20
      const labelHeight = 40
      const labelGap = 10 // 标签和图片之间的间隙
      const imgWidth = settings.imageWidth
      const imgHeight = settings.imageHeight

      const pairWidth = imgWidth * 2 + padding * 3
      // 第一行有标签，后面的行没有标签
      const firstPairHeight = imgHeight + labelHeight + labelGap + padding * 2
      const normalPairHeight = imgHeight + padding
      const totalHeight = firstPairHeight + normalPairHeight * (images.length - 1) + padding

      // 创建画布
      const canvas = createCanvas(pairWidth, totalHeight)
      const ctx = canvas.getContext('2d')

      // 设置背景色
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, pairWidth, totalHeight)

      // 保持比例的绘制函数（cover模式：完全填满区域，可能裁剪）
      const drawImageWithAspectRatio = (img: Image, x: number, y: number, maxWidth: number, maxHeight: number): void => {
        const imgRatio = img.width / img.height
        const containerRatio = maxWidth / maxHeight
        let drawWidth = maxWidth
        let drawHeight = maxHeight
        let offsetX = 0
        let offsetY = 0

        if (settings.maintainAspectRatio) {
          // cover模式：图片完全填满容器，可能会裁剪超出部分
          if (imgRatio > containerRatio) {
            // 图片更宽 - 以高度为准，宽度裁剪
            drawWidth = maxHeight * imgRatio
            offsetX = -(drawWidth - maxWidth) / 2
          } else {
            // 图片更高 - 以宽度为准，高度裁剪
            drawHeight = maxWidth / imgRatio
            offsetY = -(drawHeight - maxHeight) / 2
          }
        }

        // 使用裁剪确保不超出边界
        ctx.save()
        ctx.beginPath()
        ctx.rect(x, y, maxWidth, maxHeight)
        ctx.clip()
        ctx.drawImage(img, x + offsetX, y + offsetY, drawWidth, drawHeight)
        ctx.restore()
      }

      // 绘制每一对图片
      images.forEach((imgPair, index) => {
        let y = padding
        
        if (index === 0) {
          // 第一行：绘制标签
          y = padding

          // 绘制标签背景
          ctx.fillStyle = '#f5f5f5'
          ctx.fillRect(padding, y, imgWidth, labelHeight)
          ctx.fillRect(imgWidth + padding * 2, y, imgWidth, labelHeight)

          // 绘制标签文字（使用自定义文案）
          ctx.fillStyle = '#333333'
          ctx.font = 'bold 24px Arial'
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          ctx.fillText(settings.beforeLabel, padding + imgWidth / 2, y + labelHeight / 2)
          ctx.fillText(
            settings.afterLabel,
            imgWidth + padding * 2 + imgWidth / 2,
            y + labelHeight / 2
          )

          // 绘制第一对图片（标签下方留间隙）
          const imgY = y + labelHeight + labelGap
          
          // 绘制图片（完全填满设置的尺寸）
          if (settings.maintainAspectRatio) {
            drawImageWithAspectRatio(imgPair.before, padding, imgY, imgWidth, imgHeight)
            drawImageWithAspectRatio(imgPair.after, imgWidth + padding * 2, imgY, imgWidth, imgHeight)
          } else {
            // 不保持比例，强制拉伸到设置尺寸
            ctx.drawImage(imgPair.before, padding, imgY, imgWidth, imgHeight)
            ctx.drawImage(imgPair.after, imgWidth + padding * 2, imgY, imgWidth, imgHeight)
          }
        } else {
          // 后续行：直接绘制图片，不要标签
          y = firstPairHeight + (index - 1) * normalPairHeight
          
          // 绘制图片（完全填满设置的尺寸）
          if (settings.maintainAspectRatio) {
            drawImageWithAspectRatio(imgPair.before, padding, y, imgWidth, imgHeight)
            drawImageWithAspectRatio(imgPair.after, imgWidth + padding * 2, y, imgWidth, imgHeight)
          } else {
            // 不保持比例，强制拉伸到设置尺寸
            ctx.drawImage(imgPair.before, padding, y, imgWidth, imgHeight)
            ctx.drawImage(imgPair.after, imgWidth + padding * 2, y, imgWidth, imgHeight)
          }
        }
      })

      // 保存文件
      const result = await dialog.showSaveDialog({
        title: '保存对比图',
        defaultPath: `整改对比_${new Date().toISOString().split('T')[0]}.png`,
        filters: [{ name: 'PNG图片', extensions: ['png'] }]
      })

      if (!result.canceled && result.filePath) {
        const buffer = canvas.toBuffer('image/png')
        fs.writeFileSync(result.filePath, buffer)
        dialog.showMessageBox({
          type: 'info',
          title: '成功',
          message: '图片合并成功！',
          detail: `已保存到：${result.filePath}`
        })
      }
    } catch (error) {
      console.error('合并图片失败:', error)
      const errorMessage = error instanceof Error ? error.message : '未知错误'
      dialog.showErrorBox('错误', `合并图片失败：${errorMessage}`)
    }
  })

  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
