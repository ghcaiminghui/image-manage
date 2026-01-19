import { ElectronAPI } from '@electron-toolkit/preload'

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

interface MergeImagesData {
  pairs: ImagePair[]
  settings: Settings
}

interface CustomElectronAPI extends ElectronAPI {
  ipcRenderer: ElectronAPI['ipcRenderer'] & {
    invoke(channel: 'merge-images', data: MergeImagesData): Promise<void>
  }
}

declare global {
  interface Window {
    electron: CustomElectronAPI
    api: unknown
  }
}
