export interface AppSettings {
  conf: number
  iou: number
  maxSize: number
  arch: 'n' | 's' | 'm'
  device: 'cpu' | 'gpu'
  autoSave: boolean
  maxHistory: number
  theme: 'light' | 'dark'
  language: 'id' | 'en'
  notifDetect: boolean
  notifAlert: boolean
  alertThreshold: number
  modelPath: string
  confidenceFormat: 'percent' | 'decimal'
}

export const DEFAULT_SETTINGS: AppSettings = {
  conf: 0.25,
  iou: 0.45,
  maxSize: 10,
  arch: 'n',
  device: 'cpu',
  autoSave: true,
  maxHistory: 500,
  theme: 'light',
  language: 'id',
  notifDetect: true,
  notifAlert: false,
  alertThreshold: 0.5,
  modelPath: 'models/best.pt',
  confidenceFormat: 'percent',
}

const SETTINGS_KEY = 'carbfood_settings'

export function getSettings(): AppSettings {
  try {
    const stored = localStorage.getItem(SETTINGS_KEY)
    return stored ? { ...DEFAULT_SETTINGS, ...JSON.parse(stored) } : { ...DEFAULT_SETTINGS }
  } catch {
    return { ...DEFAULT_SETTINGS }
  }
}

export function saveSettings(settings: AppSettings): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
}
