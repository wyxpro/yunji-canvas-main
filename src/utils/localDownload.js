const safeFileName = (name) => {
  const fallback = `image_${Date.now()}`
  return String(name || fallback)
    .trim()
    .replace(/[\s]+/g, '_')
    .replace(/[\\/:*?"<>|]+/g, '-')
    .slice(0, 120) || fallback
}

const extFromMime = (mime) => {
  const m = String(mime || '').toLowerCase()
  if (m.includes('png')) return 'png'
  if (m.includes('webp')) return 'webp'
  if (m.includes('gif')) return 'gif'
  if (m.includes('jpeg') || m.includes('jpg')) return 'jpg'
  return ''
}

const extFromUrl = (url) => {
  const clean = String(url || '').split('?')[0].split('#')[0]
  const match = clean.match(/\.([a-z0-9]{2,8})$/i)
  return match?.[1]?.toLowerCase() || ''
}

const withExt = (name, ext) => {
  const safe = safeFileName(name)
  if (/\.[a-z0-9]{2,8}$/i.test(safe)) return safe
  return ext ? `${safe}.${ext}` : `${safe}.png`
}

const isLikelyRawBase64 = (value) => {
  const text = String(value || '').trim()
  return text.length > 100 && /^[A-Za-z0-9+/=\s]+$/.test(text)
}

const rawBase64ToBlob = (base64, mime = 'image/png') => {
  const clean = String(base64 || '').replace(/\s/g, '')
  const binary = atob(clean)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i)
  }
  return new Blob([bytes], { type: mime })
}

const imageSourceToBlob = async (source) => {
  const value = String(source || '').trim()
  if (!value) throw new Error('图片地址为空')

  if (isLikelyRawBase64(value)) {
    return rawBase64ToBlob(value)
  }

  const response = await fetch(value)
  if (!response.ok) {
    throw new Error(`图片下载失败 (${response.status})`)
  }

  return response.blob()
}

const clickDownload = (href, fileName) => {
  const link = document.createElement('a')
  link.href = href
  link.download = fileName
  link.rel = 'noopener'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

export const normalizeGeneratedImageUrl = (source) => {
  const value = String(source || '').trim()
  if (!value) return ''
  if (value.startsWith('data:') || value.startsWith('blob:') || value.startsWith('http')) return value
  if (isLikelyRawBase64(value)) return `data:image/png;base64,${value.replace(/\s/g, '')}`
  return value
}

export const downloadImageForCanvas = async (source, { fileNameBase = 'image' } = {}) => {
  const normalizedSource = normalizeGeneratedImageUrl(source)
  const fallbackExt = extFromUrl(normalizedSource) || 'png'

  try {
    const blob = await imageSourceToBlob(normalizedSource)
    const ext = extFromMime(blob.type) || fallbackExt
    const fileName = withExt(fileNameBase, ext)
    const objectUrl = URL.createObjectURL(blob)

    clickDownload(objectUrl, fileName)

    return {
      url: objectUrl,
      sourceUrl: normalizedSource,
      fileName,
      downloadedAt: Date.now(),
      downloadStatus: 'downloaded'
    }
  } catch (err) {
    const fileName = withExt(fileNameBase, fallbackExt)
    clickDownload(normalizedSource, fileName)

    return {
      url: normalizedSource,
      sourceUrl: normalizedSource,
      fileName,
      downloadedAt: Date.now(),
      downloadStatus: 'fallback',
      downloadError: err?.message || '无法读取图片数据，已尝试直接下载原始地址'
    }
  }
}

export const cacheImageForCanvas = async (source, { fileNameBase = 'image' } = {}) => {
  const normalizedSource = normalizeGeneratedImageUrl(source)
  const fallbackExt = extFromUrl(normalizedSource) || 'png'

  try {
    const blob = await imageSourceToBlob(normalizedSource)
    const ext = extFromMime(blob.type) || fallbackExt
    const fileName = withExt(fileNameBase, ext)
    const objectUrl = URL.createObjectURL(blob)

    return {
      url: objectUrl,
      sourceUrl: normalizedSource,
      fileName,
      cachedAt: Date.now(),
      downloadStatus: 'cached'
    }
  } catch (err) {
    return {
      url: normalizedSource,
      sourceUrl: normalizedSource,
      fileName: withExt(fileNameBase, fallbackExt),
      cachedAt: Date.now(),
      downloadStatus: 'remote',
      downloadError: err?.message || '无法缓存图片，已使用原始地址'
    }
  }
}
