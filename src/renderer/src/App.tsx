import { useState, useEffect } from 'react'
import './App.css'

interface ImagePair {
  id: string
  before: string | null
  after: string | null
}

interface Settings {
  beforeLabel: string
  afterLabel: string
  imageWidth: number
  imageHeight: number
  maintainAspectRatio: boolean
}

// 默认设置
const DEFAULT_SETTINGS: Settings = {
  beforeLabel: '整改前',
  afterLabel: '整改后',
  imageWidth: 400,
  imageHeight: 280,
  maintainAspectRatio: true
}

// localStorage 键名
const SETTINGS_STORAGE_KEY = 'image-compare-settings'

function App(): React.JSX.Element {
  const [imagePairs, setImagePairs] = useState<ImagePair[]>([])
  const [dragging, setDragging] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  
  // 从 localStorage 加载设置
  const [settings, setSettings] = useState<Settings>(() => {
    try {
      const savedSettings = localStorage.getItem(SETTINGS_STORAGE_KEY)
      if (savedSettings) {
        return JSON.parse(savedSettings)
      }
    } catch (error) {
      console.error('加载设置失败:', error)
    }
    return DEFAULT_SETTINGS
  })

  // 监听设置变化，自动保存到 localStorage
  useEffect(() => {
    try {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings))
    } catch (error) {
      console.error('保存设置失败:', error)
    }
  }, [settings])

  // 添加一组对比
  const addPair = (): void => {
    const newPair: ImagePair = {
      id: Date.now().toString(),
      before: null,
      after: null
    }
    setImagePairs([...imagePairs, newPair])
  }

  // 删除一组
  const deletePair = (id: string): void => {
    setImagePairs(imagePairs.filter((pair) => pair.id !== id))
  }

  // 上传图片
  const handleImageUpload = (pairId: string, type: 'before' | 'after', file: File): void => {
    const reader = new FileReader()
    reader.onload = (e): void => {
      const result = e.target?.result as string
      setImagePairs(
        imagePairs.map((pair) =>
          pair.id === pairId ? { ...pair, [type]: result } : pair
        )
      )
    }
    reader.readAsDataURL(file)
  }

  // 拖拽处理
  const handleDrop = (e: React.DragEvent, pairId: string, type: 'before' | 'after'): void => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file && file.type.startsWith('image/')) {
      handleImageUpload(pairId, type, file)
    }
  }

  // 点击上传
  const handleFileSelect = (pairId: string, type: 'before' | 'after'): void => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = (e): void => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        handleImageUpload(pairId, type, file)
      }
    }
    input.click()
  }

  // 合并图片
  const mergeImages = async (): Promise<void> => {
    const validPairs = imagePairs.filter(p => p.before && p.after)
    
    if (validPairs.length === 0) {
      alert('请至少完成一组对比图片的上传')
      return
    }

    // 调用主进程合并图片
    await window.electron.ipcRenderer.invoke('merge-images', {
      pairs: validPairs,
      settings: settings
    })
  }

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>整改前后对比图片管理系统</h1>
      </header>

      <div className="toolbar">
        <button className="btn btn-primary" onClick={addPair}>
          ➕ 添加对比组
        </button>
        <button
          className="btn btn-settings"
          onClick={() => setShowSettings(!showSettings)}
        >
          ⚙️ 设置
        </button>
        <button
          className="btn btn-success"
          onClick={mergeImages}
          disabled={imagePairs.length === 0}
        >
          🖼️ 合并生成对比图
        </button>
      </div>

      {/* 设置面板 */}
      {showSettings && (
        <div className="settings-panel">
          <h3>设置</h3>
          <div className="settings-content">
            <div className="setting-group">
              <label>左侧标签文案：</label>
              <input
                type="text"
                value={settings.beforeLabel}
                onChange={(e) => setSettings({ ...settings, beforeLabel: e.target.value })}
                placeholder="例如：整改前"
              />
            </div>
            <div className="setting-group">
              <label>右侧标签文案：</label>
              <input
                type="text"
                value={settings.afterLabel}
                onChange={(e) => setSettings({ ...settings, afterLabel: e.target.value })}
                placeholder="例如：整改后"
              />
            </div>
            <div className="setting-group">
              <label>图片宽度（像素）：</label>
              <input
                type="number"
                value={settings.imageWidth}
                onChange={(e) => setSettings({ ...settings, imageWidth: Number(e.target.value) })}
                min="200"
                max="2000"
              />
            </div>
            <div className="setting-group">
              <label>图片高度（像素）：</label>
              <input
                type="number"
                value={settings.imageHeight}
                onChange={(e) => setSettings({ ...settings, imageHeight: Number(e.target.value) })}
                min="200"
                max="2000"
              />
            </div>
            <div className="setting-group setting-checkbox">
              <label>
                <input
                  type="checkbox"
                  checked={settings.maintainAspectRatio}
                  onChange={(e) => setSettings({ ...settings, maintainAspectRatio: e.target.checked })}
                />
                <span>保持图片比例（推荐，避免变形）</span>
              </label>
              <p className="setting-hint">
                {settings.maintainAspectRatio 
                  ? '图片将按比例缩放并完全填满设定尺寸（超出部分会裁剪）' 
                  : '图片将强制拉伸填充设定尺寸（可能变形）'}
              </p>
            </div>
            <div className="setting-group">
              <button 
                className="btn btn-secondary" 
                onClick={() => {
                  setSettings(DEFAULT_SETTINGS)
                  localStorage.removeItem(SETTINGS_STORAGE_KEY)
                }}
                style={{ marginTop: '10px' }}
              >
                恢复默认设置
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="pairs-grid-container">
        {imagePairs.length === 0 ? (
          <div className="empty-state">
            <p>暂无对比组，请点击“添加对比组”开始</p>
          </div>
        ) : (
          imagePairs.map((pair, index) => (
            <div key={pair.id} className="pair-row">
              <div className="pair-header">
                <span className="pair-number">第 {index + 1} 组</span>
                <button className="btn-delete-small" onClick={() => deletePair(pair.id)}>
                  ✕
                </button>
              </div>
              <div className="pair-content">
                {/* 左侧图片 */}
                <div className="image-box">
                  <div className="image-label">{settings.beforeLabel}</div>
                  {pair.before ? (
                    <div className="image-preview" 
                         style={{
                           width: `${settings.imageWidth}px`,
                           height: `${settings.imageHeight}px`
                         }}>
                      <img 
                        src={pair.before} 
                        alt={settings.beforeLabel}
                        style={{
                          objectFit: settings.maintainAspectRatio ? 'cover' : 'fill'
                        }}
                      />
                      <button
                        className="btn-change"
                        onClick={() => handleFileSelect(pair.id, 'before')}
                      >
                        更换
                      </button>
                    </div>
                  ) : (
                    <div
                      className={`upload-area ${dragging ? 'dragging' : ''}`}
                      style={{
                        minHeight: `${settings.imageHeight}px`,
                        width: `${settings.imageWidth}px`
                      }}
                      onDrop={(e) => handleDrop(e, pair.id, 'before')}
                      onDragOver={(e) => {
                        e.preventDefault()
                        setDragging(true)
                      }}
                      onDragLeave={() => setDragging(false)}
                      onClick={() => handleFileSelect(pair.id, 'before')}
                    >
                      <div className="upload-placeholder">
                        <span className="upload-icon">📤</span>
                        <p>点击上传</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* 右侧图片 */}
                <div className="image-box">
                  <div className="image-label">{settings.afterLabel}</div>
                  {pair.after ? (
                    <div className="image-preview" 
                         style={{
                           width: `${settings.imageWidth}px`,
                           height: `${settings.imageHeight}px`
                         }}>
                      <img 
                        src={pair.after} 
                        alt={settings.afterLabel}
                        style={{
                          objectFit: settings.maintainAspectRatio ? 'cover' : 'fill'
                        }}
                      />
                      <button
                        className="btn-change"
                        onClick={() => handleFileSelect(pair.id, 'after')}
                      >
                        更换
                      </button>
                    </div>
                  ) : (
                    <div
                      className={`upload-area ${dragging ? 'dragging' : ''}`}
                      style={{
                        minHeight: `${settings.imageHeight}px`,
                        width: `${settings.imageWidth}px`
                      }}
                      onDrop={(e) => handleDrop(e, pair.id, 'after')}
                      onDragOver={(e) => {
                        e.preventDefault()
                        setDragging(true)
                      }}
                      onDragLeave={() => setDragging(false)}
                      onClick={() => handleFileSelect(pair.id, 'after')}
                    >
                      <div className="upload-placeholder">
                        <span className="upload-icon">📤</span>
                        <p>点击上传</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default App
