/**
 * Asset storage helpers | 素材存储工具
 *
 * Supports:
 * - Optional Aliyun OSS direct browser upload (POST policy)
 * - Fallback to existing behavior when OSS is not configured
 *
 * Security note:
 * - Storing AccessKeySecret in browser localStorage is NOT safe for public deployments.
 *   Prefer STS temporary credentials or a backend that signs uploads.
 */

import { STORAGE_KEYS } from './constants'

const safeJsonParse = (raw, fallback = null) => {
  try {
    return JSON.parse(raw)
  } catch {
    return fallback
  }
}

export const getAliyunOssConfig = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ALIYUN_OSS_CONFIG)
    const cfg = safeJsonParse(raw, null)
    return (cfg && typeof cfg === 'object') ? cfg : null
  } catch {
    return null
  }
}

export const setAliyunOssConfig = (config) => {
  try {
    const cfg = (config && typeof config === 'object') ? { ...config } : null

    // If basically empty, remove
    const hasAnyValue = !!(
      cfg &&
      [
        cfg.bucket,
        cfg.endpoint,
        cfg.accessKeyId,
        cfg.accessKeySecret,
        cfg.stsToken,
        cfg.dir,
        cfg.publicBaseUrl
      ].some(v => String(v || '').trim())
    )

    if (!hasAnyValue) {
      localStorage.removeItem(STORAGE_KEYS.ALIYUN_OSS_CONFIG)
      return
    }

    localStorage.setItem(STORAGE_KEYS.ALIYUN_OSS_CONFIG, JSON.stringify(cfg))
  } catch {
    // ignore
  }
}

const normalizeEndpoint = (endpoint) => {
  const e = String(endpoint || '').trim()
  if (!e) return ''
  return e.replace(/^https?:\/\//i, '').replace(/\/+$/g, '')
}

const normalizePrefix = (prefix) => {
  let p = String(prefix || '').trim()
  if (!p) return ''
  p = p.replace(/^\/+/, '')
  if (p && !p.endsWith('/')) p += '/'
  return p
}

const normalizeBaseUrl = (baseUrl) => {
  const u = String(baseUrl || '').trim()
  if (!u) return ''
  return u.replace(/\/+$/g, '')
}

export const isAliyunOssConfigured = (cfg) => {
  const c = cfg || getAliyunOssConfig()
  const bucket = String(c?.bucket || '').trim()
  const endpoint = String(c?.endpoint || '').trim()
  const accessKeyId = String(c?.accessKeyId || '').trim()
  const accessKeySecret = String(c?.accessKeySecret || '').trim()
  return !!(bucket && endpoint && accessKeyId && accessKeySecret)
}

const buildOssHost = (cfg) => {
  const bucket = String(cfg?.bucket || '').trim()
  const endpoint = normalizeEndpoint(cfg?.endpoint)
  if (!bucket || !endpoint) return ''
  return `https://${bucket}.${endpoint}`
}

const randomId = () => Math.random().toString(36).slice(2, 10)

const safeFileName = (name) => {
  const s = String(name || 'file').trim() || 'file'
  // Keep it simple: replace spaces and a few problematic chars
  return s
    .replace(/[\s]+/g, '_')
    .replace(/[\\/:*?"<>|]+/g, '-')
    .slice(0, 120)
}

const guessExtFromMime = (mime) => {
  const m = String(mime || '').toLowerCase()
  if (m.includes('png')) return 'png'
  if (m.includes('webp')) return 'webp'
  if (m.includes('jpeg') || m.includes('jpg')) return 'jpg'
  if (m.includes('gif')) return 'gif'
  if (m.includes('mp4')) return 'mp4'
  if (m.includes('quicktime')) return 'mov'
  if (m.includes('webm')) return 'webm'
  return ''
}

const base64FromBytes = (bytes) => {
  const u8 = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes)
  let binary = ''
  const chunk = 0x8000
  for (let i = 0; i < u8.length; i += chunk) {
    binary += String.fromCharCode(...u8.subarray(i, i + chunk))
  }
  return btoa(binary)
}

const hmacSha1Base64 = async (message, secret) => {
  if (!globalThis.crypto?.subtle) {
    throw new Error('当前环境不支持 WebCrypto（crypto.subtle），无法在浏览器端签名上传')
  }

  const enc = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(String(secret || '')),
    { name: 'HMAC', hash: 'SHA-1' },
    false,
    ['sign']
  )

  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(String(message || '')))
  return base64FromBytes(new Uint8Array(sig))
}

const buildPolicyBase64 = async ({ prefix, maxBytes = 1024 * 1024 * 200, stsToken = '' } = {}) => {
  const exp = new Date(Date.now() + 60 * 60 * 1000).toISOString()
  const conditions = [
    ['content-length-range', 0, Math.max(1, Number(maxBytes) || (1024 * 1024 * 200))]
  ]

  const p = normalizePrefix(prefix)
  if (p) {
    conditions.push(['starts-with', '$key', p])
  }

  const token = String(stsToken || '').trim()
  if (token) {
    conditions.push({ 'x-oss-security-token': token })
  }

  const policyObj = { expiration: exp, conditions }
  const policyJson = JSON.stringify(policyObj)
  const policyBytes = new TextEncoder().encode(policyJson)
  return base64FromBytes(policyBytes)
}

const uploadToAliyunOss = async (blob, { filename, key, contentType } = {}) => {
  const cfg = getAliyunOssConfig()
  if (!isAliyunOssConfigured(cfg)) return null

  const host = buildOssHost(cfg)
  const publicBaseUrl = normalizeBaseUrl(cfg?.publicBaseUrl) || host

  const accessKeyId = String(cfg.accessKeyId || '').trim()
  const accessKeySecret = String(cfg.accessKeySecret || '').trim()
  const stsToken = String(cfg.stsToken || '').trim()

  const objectKey = String(key || '').trim()
  if (!host || !accessKeyId || !accessKeySecret || !objectKey) {
    return null
  }

  const policyBase64 = await buildPolicyBase64({
    prefix: objectKey.split('/').slice(0, -1).join('/') + '/',
    stsToken
  })

  const signature = await hmacSha1Base64(policyBase64, accessKeySecret)

  const fd = new FormData()
  fd.append('key', objectKey)
  fd.append('policy', policyBase64)
  fd.append('OSSAccessKeyId', accessKeyId)
  fd.append('signature', signature)
  fd.append('success_action_status', '200')
  if (stsToken) fd.append('x-oss-security-token', stsToken)

  const name = safeFileName(filename || 'file')
  const fileBlob = (contentType && blob?.type !== contentType)
    ? blob.slice(0, blob.size, contentType)
    : blob

  fd.append('file', fileBlob, name)

  const resp = await fetch(host, {
    method: 'POST',
    body: fd
  })

  if (!(resp.ok || resp.status === 204)) {
    let text = ''
    try { text = await resp.text() } catch { /* ignore */ }
    throw new Error(`OSS 上传失败 (${resp.status}): ${text || resp.statusText || 'unknown'}`)
  }

  const url = `${publicBaseUrl}/${objectKey}`
  return { url, key: objectKey }
}

const buildObjectKey = ({
  projectId = 'default',
  kind = 'asset',
  originalName = 'file',
  mimeType = '',
  dir = ''
} = {}) => {
  const prefix = normalizePrefix(dir)
  const pid = safeFileName(projectId)
  const date = new Date()
  const yyyy = String(date.getFullYear())
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  const time = Date.now()

  const extFromMime = guessExtFromMime(mimeType)
  const safeName = safeFileName(originalName)
  const hasExt = /\.[a-z0-9]{1,8}$/i.test(safeName)
  const finalName = hasExt ? safeName : (extFromMime ? `${safeName}.${extFromMime}` : safeName)

  return `${prefix}${pid}/${kind}/${yyyy}${mm}${dd}/${time}_${randomId()}_${finalName}`
}

export const dataUrlToBlob = async (dataUrl) => {
  const url = String(dataUrl || '')
  if (!url.startsWith('data:')) throw new Error('Invalid data URL')

  const res = await fetch(url)
  const blob = await res.blob()
  return { blob, mimeType: blob.type || '' }
}

export const uploadFileToAliyunOssIfConfigured = async (file, { projectId = 'default', kind = 'asset' } = {}) => {
  const cfg = getAliyunOssConfig()
  if (!isAliyunOssConfigured(cfg)) return null

  const key = buildObjectKey({
    projectId,
    kind,
    originalName: file?.name || `${kind}`,
    mimeType: file?.type || '',
    dir: cfg?.dir
  })

  return uploadToAliyunOss(file, {
    filename: file?.name || `${kind}`,
    key,
    contentType: file?.type
  })
}

export const uploadDataUrlToAliyunOssIfConfigured = async (dataUrl, { projectId = 'default', kind = 'asset', filenameBase = 'asset' } = {}) => {
  const cfg = getAliyunOssConfig()
  if (!isAliyunOssConfigured(cfg)) return null

  const { blob, mimeType } = await dataUrlToBlob(dataUrl)
  const ext = guessExtFromMime(mimeType) || 'jpg'

  const key = buildObjectKey({
    projectId,
    kind,
    originalName: `${filenameBase}.${ext}`,
    mimeType,
    dir: cfg?.dir
  })

  return uploadToAliyunOss(blob, {
    filename: `${filenameBase}.${ext}`,
    key,
    contentType: mimeType
  })
}
