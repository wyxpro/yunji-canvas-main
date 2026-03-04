/**
 * Media frame helpers | 媒体帧提取工具
 *
 * Notes
 * - Uses HTMLVideoElement + Canvas to capture a frame.
 * - For cross-origin URLs, the server must allow CORS; otherwise canvas export will fail.
 */

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

const once = (target, eventName, { timeoutMs = 15000 } = {}) => {
  return new Promise((resolve, reject) => {
    if (!target) {
      reject(new Error('Invalid media element'))
      return
    }

    let timer = null

    const cleanup = () => {
      if (timer) clearTimeout(timer)
      timer = null
      try {
        target.removeEventListener(eventName, onEvent)
        target.removeEventListener('error', onError)
      } catch {
        // ignore
      }
    }

    const onEvent = () => {
      cleanup()
      resolve(true)
    }

    const onError = () => {
      cleanup()
      reject(new Error('Failed to load media'))
    }

    target.addEventListener(eventName, onEvent, { once: true })
    target.addEventListener('error', onError, { once: true })

    if (timeoutMs > 0) {
      timer = setTimeout(() => {
        cleanup()
        reject(new Error(`Timed out waiting for ${eventName}`))
      }, timeoutMs)
    }
  })
}

const clamp = (n, min, max) => Math.max(min, Math.min(max, n))

const computeFitSize = (srcW, srcH, maxW, maxH) => {
  const w = Number(srcW) || 0
  const h = Number(srcH) || 0
  if (w <= 0 || h <= 0) return { w: 0, h: 0 }

  const mw = Number(maxW) || w
  const mh = Number(maxH) || h
  if (w <= mw && h <= mh) return { w, h }

  const scale = Math.min(mw / w, mh / h)
  return {
    w: Math.max(1, Math.round(w * scale)),
    h: Math.max(1, Math.round(h * scale))
  }
}

const waitForFrameReady = async (video) => {
  if (!video) return

  // Modern browsers
  if (typeof video.requestVideoFrameCallback === 'function') {
    await new Promise((resolve) => {
      video.requestVideoFrameCallback(() => resolve(true))
    })
    return
  }

  // Best-effort fallback
  await sleep(60)
}

/**
 * Extract a frame from a video URL.
 * @param {string} url
 * @param {object} options
 * @param {'start'|'middle'|'end'|number} options.at - frame position (seconds or keyword)
 * @param {number} options.maxWidth
 * @param {number} options.maxHeight
 * @param {string} options.mimeType - 'image/jpeg' recommended
 * @param {number} options.quality - 0..1 for jpeg/webp
 * @param {number} options.endOffset - seconds to subtract from duration when at='end'
 * @returns {Promise<{ dataUrl: string, time: number, duration: number, width: number, height: number }>} 
 */
export const extractVideoFrameFromUrl = async (
  url,
  {
    at = 'end',
    maxWidth = 768,
    maxHeight = 768,
    mimeType = 'image/jpeg',
    quality = 0.86,
    endOffset = 0.15
  } = {}
) => {
  const src = String(url || '').trim()
  if (!src) throw new Error('视频 URL 为空')

  const video = document.createElement('video')

  // Important: set crossOrigin BEFORE src for best chance.
  // If remote server doesn't allow CORS, canvas export may still fail.
  video.crossOrigin = 'anonymous'
  video.muted = true
  video.playsInline = true
  video.preload = 'auto'

  // iOS/Safari sometimes needs these attributes on element.
  video.setAttribute('playsinline', 'true')
  video.setAttribute('webkit-playsinline', 'true')

  // Do not attach to DOM; offscreen is fine.
  video.src = src
  video.load()

  // Wait metadata so duration & dimensions are known
  await once(video, 'loadedmetadata', { timeoutMs: 20000 })

  const duration = Number(video.duration) || 0
  const vw = Number(video.videoWidth) || 0
  const vh = Number(video.videoHeight) || 0

  if (!vw || !vh) {
    throw new Error('无法读取视频尺寸')
  }

  let t = 0
  if (typeof at === 'number' && Number.isFinite(at)) {
    t = clamp(at, 0, Math.max(0, duration || at))
  } else if (at === 'start') {
    t = 0
  } else if (at === 'middle') {
    t = duration ? duration / 2 : 0
  } else {
    // end
    const offset = Math.max(0.01, Number(endOffset) || 0.15)
    t = duration ? Math.max(0, duration - offset) : 0
  }

  // Seek
  try {
    video.currentTime = t
  } catch {
    // Some browsers may throw if not seekable; fall back to 0
    t = 0
    video.currentTime = 0
  }

  await once(video, 'seeked', { timeoutMs: 20000 })
  await waitForFrameReady(video)

  const { w, h } = computeFitSize(vw, vh, maxWidth, maxHeight)
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h

  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('无法创建 canvas')

  ctx.drawImage(video, 0, 0, w, h)

  // Cleanup element refs (best effort)
  try {
    video.pause()
    video.removeAttribute('src')
    video.load()
  } catch {
    // ignore
  }

  let dataUrl = ''
  try {
    dataUrl = canvas.toDataURL(mimeType, quality)
  } catch (err) {
    // Likely CORS / tainted canvas
    throw new Error('提取失败：视频跨域导致无法导出帧（需要视频源支持 CORS 或先下载/上传本地视频）')
  }

  if (!dataUrl || !dataUrl.startsWith('data:image/')) {
    throw new Error('提取失败：无法导出图片数据')
  }

  return { dataUrl, time: t, duration, width: w, height: h }
}
