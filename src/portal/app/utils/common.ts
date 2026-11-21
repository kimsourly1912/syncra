import type { IRoute } from '@/constants/route'
import type { AcceptLiteral } from '@/types/common'
import type { CookieKey } from '@/constants/key'
import { useObjectUrl } from '@vueuse/core'

/**
 * input - ISO Date 2025-12-24T06:52:26.87Z
 * output -  Dec 24, 2025, 01:52 PM
 */
export const dateTimeFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

export const dateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: '2-digit',
  year: 'numeric',
})

/**
   * The option type
   *
   * @property value: The option value
   * @property label: The option label
   */
// type Option<K = string, M = string> = { value: K, label: M }

export const tw = String.raw
export const noop = () => { }
export const toRoute = (path: AcceptLiteral<IRoute>, suffix = '') => `${path}${suffix}`
export const cookieKey = (key: CookieKey) => key

export function resolveApiUrl(apiURL: string, path: string) {
  if (!path)
    return ''

  if (/^https?:\/\//i.test(path))
    return path

  if (!apiURL)
    return path

  // Handle relative base URLs (e.g., '/api/v1' from proxy setup)
  if (!(/^https?:\/\//i.test(apiURL))) {
    const base = apiURL.endsWith('/') ? apiURL : `${apiURL}/`
    const relativePath = path.startsWith('/') ? path.slice(1) : path
    return `${base}${relativePath}`
  }

  const base = apiURL.endsWith('/') ? apiURL : `${apiURL}/`
  const relativePath = path.startsWith('/') ? path.slice(1) : path
  return new URL(relativePath, base).toString()
}

export function isPlainObject(value: unknown): value is object {
  return typeof value === 'object'
    && value !== null
    && value.constructor === Object
}

export function openInPopup(
  route: string = window.location.href,
  size: { width?: number, height?: number } = {}) {
  const { height = 600, width = 960 } = size
  const top = (window.top?.outerHeight ?? 0) / 2 + (window.top?.screenY ?? 0) - height / 2
  const left = (window.top?.outerWidth ?? 0) / 2 + (window.top?.screenX ?? 0) - width / 2

  const ua = navigator.userAgent
  const platform = navigator.platform
  const maxTouch = navigator.maxTouchPoints || 0
  const isIPhoneIPod = /iP(hone|od)/.test(ua)
  const isIPad = /iPad/.test(ua) || (platform === 'MacIntel' && maxTouch > 1)
  const isMac = /Macintosh/.test(ua)
  const isMacSafari = isMac
    && ua.includes('Safari')
    && !ua.includes('Chrome')
    && !ua.includes('CriOS')
    && !ua.includes('Edg')
    && !ua.includes('FxiOS')
  const isIOS = isIPhoneIPod || isIPad || isMacSafari

  // iOS Safari → redirect (no real popups)

  if (isIOS) {
    console.log(isMac)
    window.location.href = route
    return null
  }
  else {
    return window.open(
      route,
      'window-popup',
      `width=${width}, height=${height}, top=${top}, left=${left}, toolbar=no, location=no,status=no, menubar=no, scrollbars=no, resizable=no`,
    )
  }
}

export function getFileInfo(file: File) {
  const { size, type, lastModified, name } = file

  // --- extension ---
  const extension = name.includes('.')
    ? name.substring(name.lastIndexOf('.') + 1).toLowerCase()
    : ''

  // --- readable size ---
  const parseFileSize = (bytes: number) => {
    const units = ['B', 'KB', 'MB', 'GB', 'TB']

    let value = bytes
    let unitIndex = 0

    while (value >= 1024 && unitIndex < units.length - 1) {
      value /= 1024
      unitIndex++
    }

    return {
      size: Number(value?.toFixed(2)),
      unit: units[unitIndex],
    }
  }

  return {
    // native file info
    name,
    size,
    extension,
    mimeType: type,
    lastModified,
    parsedSize: parseFileSize(size),
    lastModifiedDate: new Date(lastModified),

    // convenience flags
    isImage: type.startsWith('image/'),
    isVideo: type.startsWith('video/'),
    isAudio: type.startsWith('audio/'),
    isPdf: type === 'application/pdf',
  }
}

export function parseFileSize(bytes: number) {
  const units = ['B', 'KB', 'MB', 'GB', 'TB']

  let size = bytes
  let unitIndex = 0

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024
    unitIndex++
  }

  return {
    unit: units[unitIndex]!,
    size: Number(size?.toFixed(2)),
  }
}

export function humanFileSize(bytes: number): string {
  const { size, unit } = parseFileSize(bytes)
  return `${size} ${unit}`
}

// example: hasOwnProperty.call({ id: 1 }, 'id')
export const hasOwnProperty = Object.prototype.hasOwnProperty

export function downloadBlob(blob: Blob, filename: string) {
  const url = useObjectUrl(blob)
  if (!url.value) return

  const a = document.createElement('a')
  a.href = url.value
  a.download = filename

  document.body.appendChild(a)
  a.click()
  a.remove()
}

type TimeParts = {
  hours: number
  minutes: number
  seconds: number
  milliseconds: number
  totalSeconds: number
  totalMinutes: number
  totalHours: number
}

export function msToTimeParts(ms: number): TimeParts {
  const totalSeconds = Math.floor(ms / 1_000)
  const totalMinutes = ms / 60_000
  const totalHours = ms / 3_600_000

  const hours = Math.floor(ms / 3_600_000)
  ms %= 3_600_000

  const minutes = Math.floor(ms / 60_000)
  ms %= 60_000

  const seconds = Math.floor(ms / 1_000)
  const milliseconds = ms % 1_000

  return {
    hours,
    minutes,
    seconds,
    milliseconds,
    totalSeconds,
    totalMinutes,
    totalHours,
  }
}

export function formatTime({ hours, minutes, seconds }: TimeParts) {
  const pad = (n: number) => String(n).padStart(2, '0')
  const parts = hours > 0
    ? [hours, minutes, seconds]
    : (minutes > 0)
        ? [minutes, seconds]
        : [seconds]
  return parts.map(pad).join(':')
}

/**
 * Formats seconds into a human-readable string (e.g., "1h 2m 3s" or "5 min 30 sec")
 */
export function humanFormatSeconds(seconds: number, short = true): string {
  if (seconds < 0) return '0s'
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const remainingSeconds = Math.floor(seconds % 60)

  const parts = []
  if (hours > 0) parts.push(short ? `${hours}h` : `${hours} hour${hours > 1 ? 's' : ''}`)
  if (minutes > 0) parts.push(short ? `${minutes}m` : `${minutes} min`)
  if (remainingSeconds > 0 || parts.length === 0) parts.push(short ? `${remainingSeconds}s` : `${remainingSeconds} sec`)
  return parts.join(' ')
}

/**
 * Format a job's display PID with 5-digit zero padding.
 * Uses displayId when available, falls back to internal jobId.
 * @example formatPid(3)       => 'PID-00003'
 * @example formatPid(null, 42) => 'PID-00042'
 * @example formatPid(null, null) => 'PID'
 */
export function formatPid(displayId?: number | null): string {
  return displayId != null ? `PID-${String(displayId).padStart(5, '0')}` : 'PID'
}

/**
 * Capitalize the first letter and lowercase the rest
 * @example capitalizeFirst('HELLO WORLD') => 'Hello world'
 */
export function capitalizeFirst(str: string): string {
  if (!str) return ''
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}

export function formatDate(v: string) {
  const { format } = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
  })
  return format(new Date(v))
}

/**
 * Derives avatar fallback initials from a name/email, always 2 characters.
 * @example getInitials('Sopha') => 'SS'
 * @example getInitials('Nara Kim') => 'NK'
 */
export function getInitials(v: string) {
  const initials = v
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map(word => word.charAt(0))
    .join('')
    .substring(0, 2)
    .toUpperCase()
  return initials.length === 1 ? initials.repeat(2) : initials
}
