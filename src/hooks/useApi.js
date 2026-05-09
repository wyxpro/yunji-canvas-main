/**
 * API Hooks | API Hooks
 * Simplified hooks for open source version | 开源版简化 hooks
 */

import { ref, reactive, onUnmounted } from 'vue'
import {
  generateImage,
  createVideoTask,
  getVideoTaskStatus,
  streamChatCompletions
} from '@/api'
import { getModelByName, DEFAULT_CHAT_MODEL } from '@/config/models'
import { useApiConfig } from './useApiConfig'
import { normalizeGeneratedImageUrl } from '@/utils/localDownload'

const getNestedValue = (obj, path) => {
  if (!obj || !path) return undefined
  return String(path).split('.').reduce((value, key) => value?.[key], obj)
}

const findUrlDeep = (value, depth = 0) => {
  if (!value || depth > 5) return ''

  if (typeof value === 'string') {
    return /^https?:\/\//i.test(value) || /^blob:/i.test(value) || /^data:video\//i.test(value)
      ? value
      : ''
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      const found = findUrlDeep(item, depth + 1)
      if (found) return found
    }
    return ''
  }

  if (typeof value === 'object') {
    const preferredKeys = [
      'url',
      'video_url',
      'videoUrl',
      'output_url',
      'outputUrl',
      'file_url',
      'fileUrl',
      'download_url',
      'downloadUrl'
    ]

    for (const key of preferredKeys) {
      const found = findUrlDeep(value[key], depth + 1)
      if (found) return found
    }

    for (const item of Object.values(value)) {
      const found = findUrlDeep(item, depth + 1)
      if (found) return found
    }
  }

  return ''
}

const normalizeTaskStatus = (result = {}) => {
  const rawStatus = result.status ||
    result.task_status ||
    result.taskStatus ||
    result.state ||
    result.data?.status ||
    result.data?.task_status ||
    result.data?.taskStatus ||
    result.data?.state

  return String(rawStatus || '').toLowerCase()
}

const extractTaskId = (task = {}) => {
  return task.id ||
    task.task_id ||
    task.taskId ||
    task.data?.id ||
    task.data?.task_id ||
    task.data?.taskId ||
    task.data?.data?.id ||
    task.data?.data?.task_id
}

const extractVideoUrl = (result = {}, modelConfig = null) => {
  const displayField = modelConfig?.outputSchema?.displayField || modelConfig?.outputField
  if (displayField) {
    const value = getNestedValue(result, displayField)
    const found = findUrlDeep(value)
    if (found) return found
  }

  return findUrlDeep(result)
}

const isVideoComplete = (result = {}, modelConfig = null) => {
  const status = normalizeTaskStatus(result)
  if (['completed', 'complete', 'succeeded', 'success', 'finished', 'done'].includes(status)) return true
  if (['failed', 'error', 'cancelled', 'canceled'].includes(status)) return false
  return Boolean(extractVideoUrl(result, modelConfig))
}

const normalizeImageInputForApi = (value) => {
  const input = String(
    typeof value === 'object'
      ? (value.base64 || value.url || value.sourceUrl || '')
      : value || ''
  ).trim()
  if (!input) return ''
  const dataUrlMatch = input.match(/^data:image\/[a-z0-9.+-]+;base64,(.+)$/i)
  if (dataUrlMatch) return dataUrlMatch[1]
  return input
}

const safeFileName = (name, fallback = 'reference.png') => {
  const value = String(name || fallback)
    .trim()
    .replace(/[\s]+/g, '_')
    .replace(/[\\/:*?"<>|]+/g, '-')
    .slice(0, 120)
  return value || fallback
}

const extFromMime = (mime) => {
  const value = String(mime || '').toLowerCase()
  if (value.includes('png')) return 'png'
  if (value.includes('webp')) return 'webp'
  if (value.includes('gif')) return 'gif'
  if (value.includes('jpeg') || value.includes('jpg')) return 'jpg'
  return 'png'
}

const blobFromRawBase64 = (base64, mimeType = 'image/png') => {
  const clean = String(base64 || '').replace(/\s/g, '')
  const binary = atob(clean)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i)
  }
  return new Blob([bytes], { type: mimeType })
}

const imageInputToFile = async (input, index = 0) => {
  const source = typeof input === 'object' && input !== null ? input : { url: input }
  const fileNameBase = safeFileName(source.fileName || source.nodeId || `reference_${index + 1}`)

  if (source.file instanceof File) return source.file
  if (source.blob instanceof Blob) {
    const ext = extFromMime(source.blob.type)
    return new File([source.blob], fileNameBase.includes('.') ? fileNameBase : `${fileNameBase}.${ext}`, {
      type: source.blob.type || 'image/png'
    })
  }

  const candidates = [source.base64, source.url, source.sourceUrl]
    .map(v => String(v || '').trim())
    .filter(Boolean)

  let lastError = null
  for (const candidate of candidates) {
    try {
      let blob = null
      let mimeType = 'image/png'
      const dataUrlMatch = candidate.match(/^data:(image\/[a-z0-9.+-]+);base64,(.+)$/i)

      if (dataUrlMatch) {
        mimeType = dataUrlMatch[1]
        blob = blobFromRawBase64(dataUrlMatch[2], mimeType)
      } else if (/^[A-Za-z0-9+/=\s]+$/.test(candidate) && candidate.length > 100) {
        blob = blobFromRawBase64(candidate, mimeType)
      } else {
        const response = await fetch(candidate)
        if (!response.ok) throw new Error(`图片读取失败 (${response.status})`)
        blob = await response.blob()
        mimeType = blob.type || mimeType
      }

      const ext = extFromMime(mimeType)
      const fileName = fileNameBase.includes('.') ? fileNameBase : `${fileNameBase}.${ext}`
      return new File([blob], fileName, { type: mimeType })
    } catch (err) {
      lastError = err
    }
  }

  throw lastError || new Error('无法读取参考图')
}

const appendVideoFormValue = (fd, key, value) => {
  if (value !== undefined && value !== null && value !== '') {
    fd.append(key, String(value))
  }
}

/**
 * Base API state hook | 基础 API 状态 Hook
 */
export const useApiState = () => {
  const loading = ref(false)
  const error = ref(null)
  const status = ref('idle')

  const reset = () => {
    loading.value = false
    error.value = null
    status.value = 'idle'
  }

  const setLoading = (isLoading) => {
    loading.value = isLoading
    status.value = isLoading ? 'running' : status.value
  }

  const setError = (err) => {
    error.value = err
    status.value = 'error'
    loading.value = false
  }

  const setSuccess = () => {
    status.value = 'success'
    loading.value = false
    error.value = null
  }

  return { loading, error, status, reset, setLoading, setError, setSuccess }
}

/**
 * Chat composable | 问答组合式函数
 */
export const useChat = (options = {}) => {
  const { loading, error, status, reset, setLoading, setError, setSuccess } = useApiState()
  const { chatModel } = useApiConfig()

  const messages = ref([])
  const currentResponse = ref('')
  let abortController = null

  const send = async (content, stream = true) => {
    setLoading(true)
    currentResponse.value = ''

    try {
      const msgList = [
        ...(options.systemPrompt ? [{ role: 'system', content: options.systemPrompt }] : []),
        ...messages.value,
        { role: 'user', content }
      ]

      if (stream) {
        status.value = 'streaming'
        abortController = new AbortController()
        let fullResponse = ''

        const resolvedModel = options.model || chatModel.value || DEFAULT_CHAT_MODEL

        for await (const chunk of streamChatCompletions(
          { model: resolvedModel, messages: msgList },
          abortController.signal
        )) {
          fullResponse += chunk
          currentResponse.value = fullResponse
        }

        messages.value.push({ role: 'user', content })
        messages.value.push({ role: 'assistant', content: fullResponse })
        setSuccess()
        return fullResponse
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        setError(err)
        throw err
      }
    }
  }

  const stop = () => {
    if (abortController) {
      abortController.abort()
      abortController = null
    }
  }

  const clear = () => {
    messages.value = []
    currentResponse.value = ''
    reset()
  }

  onUnmounted(() => stop())

  return { loading, error, status, messages, currentResponse, send, stop, clear, reset }
}

/**
 * Image generation composable | 图片生成组合式函数
 * Simplified for open source - fixed input/output format
 */
export const useImageGeneration = () => {
  const { loading, error, status, reset, setLoading, setError, setSuccess } = useApiState()

  const images = ref([])
  const currentImage = ref(null)

  /**
   * Generate image with fixed params | 固定参数生成图片
   * @param {Object} params - { model, prompt, size, n, image (optional ref image) }
   */
  const generate = async (params) => {
    setLoading(true)
    images.value = []
    currentImage.value = null

    try {
      const modelConfig = getModelByName(params.model)
      
      // Build request data | 构建请求数据
      const requestData = {
        model: params.model,
        prompt: params.prompt,
        size: params.size || modelConfig?.defaultParams?.size || '2048x2048',
        // n: params.n || 1
      }

      // Add reference image if provided | 添加参考图
      if (params.image) {
        requestData.image = params.image
      }

      // Call API | 调用 API
      const response = await generateImage(requestData, {
        requestType: 'json',
        endpoint: modelConfig?.endpoint || '/images/generations'
      })

      // Parse response (OpenAI format) | 解析响应
      const data = response.data || response
      if (data?.error) {
        throw new Error(data.error?.message || data.message || '图片生成失败')
      }

      const items = Array.isArray(data) ? data : (Array.isArray(data?.data) ? data.data : [data])
      const generatedImages = items
        .map(item => ({
          url: normalizeGeneratedImageUrl(item?.url || item?.b64_json || (typeof item === 'string' ? item : '')),
          revisedPrompt: item?.revised_prompt || ''
        }))
        .filter(item => item.url)

      if (!generatedImages.length) {
        throw new Error(data?.message || '图片生成失败：接口未返回图片地址')
      }

      images.value = generatedImages
      currentImage.value = generatedImages[0] || null
      setSuccess()
      return generatedImages
    } catch (err) {
      setError(err)
      throw err
    }
  }

  return { loading, error, status, images, currentImage, generate, reset }
}

/**
 * Video generation composable | 视频生成组合式函数
 * Simplified for open source - fixed input/output format with polling
 */
export const useVideoGeneration = () => {
  const { loading, error, status, reset, setLoading, setError, setSuccess } = useApiState()

  const video = ref(null)
  const taskId = ref(null)
  const progress = reactive({
    attempt: 0,
    maxAttempts: 120,
    percentage: 0
  })

  /**
   * Generate video with fixed params | 固定参数生成视频
   * @param {Object} params - { model, prompt, first_frame_image, last_frame_image, ratio, duration }
   */
  const generate = async (params) => {
    setLoading(true)
    video.value = null
    taskId.value = null
    progress.attempt = 0
    progress.percentage = 0

    try {
      const modelConfig = getModelByName(params.model)
      
      const requestData = new FormData()
      appendVideoFormValue(requestData, 'model', params.model)
      appendVideoFormValue(requestData, 'prompt', params.prompt || '')
      appendVideoFormValue(requestData, 'seconds', params.dur)
      appendVideoFormValue(requestData, 'size', params.ratio)

      const imageInputs = [
        params.first_frame_image,
        ...(Array.isArray(params.images) ? params.images : []),
        params.last_frame_image
      ].filter(Boolean)

      for (let i = 0; i < imageInputs.length; i += 1) {
        const file = await imageInputToFile(imageInputs[i], i)
        requestData.append('input_reference', file, file.name)
      }

      // Call API | 调用 API
      const task = await createVideoTask(requestData, {
        requestType: 'formdata',
        endpoint: modelConfig?.endpoint || '/videos'
      })

      // Check if async (need polling) | 检查是否异步
      const isAsync = modelConfig?.async !== false

      // If has video URL directly, return | 如果直接有视频 URL，返回
      const directVideoUrl = extractVideoUrl(task, modelConfig)
      if (!isAsync || directVideoUrl) {
        const videoUrl = directVideoUrl
        if (!videoUrl) throw new Error('视频任务已完成，但响应中没有视频地址')
        video.value = { url: videoUrl, ...task }
        setSuccess()
        return video.value
      }

      // Get task ID for polling | 获取任务 ID 用于轮询
      const id = extractTaskId(task)
      if (!id) {
        throw new Error('未获取到任务 ID')
      }

      taskId.value = id
      status.value = 'polling'

      // Poll for result | 轮询获取结果
      const maxAttempts = 120
      const interval = 5000

      for (let i = 0; i < maxAttempts; i++) {
        progress.attempt = i + 1
        progress.percentage = Math.min(Math.round((i / maxAttempts) * 100), 99)

        const result = await getVideoTaskStatus(id)

        // Check for completion | 检查是否完成
        if (isVideoComplete(result, modelConfig)) {
          progress.percentage = 100
          const videoUrl = extractVideoUrl(result, modelConfig)
          if (!videoUrl) {
            throw new Error('视频任务已完成，但响应中没有视频地址')
          }
          video.value = { url: videoUrl, ...result }
          setSuccess()
          return video.value
        }

        // Check for failure | 检查是否失败
        const resultStatus = normalizeTaskStatus(result)
        if (['failed', 'error', 'cancelled', 'canceled'].includes(resultStatus)) {
          throw new Error(result.error?.message || result.message || '视频生成失败')
        }

        // Wait before next poll | 等待下次轮询
        await new Promise(resolve => setTimeout(resolve, interval))
      }

      throw new Error('视频生成超时')
    } catch (err) {
      setError(err)
      throw err
    }
  }

  return { loading, error, status, video, taskId, progress, generate, reset }
}

/**
 * Combined API composable | 综合 API 组合式函数
 */
export const useApi = () => {
  const config = useApiConfig()
  const chat = useChat()
  const image = useImageGeneration()
  const videoGen = useVideoGeneration()

  return { config, chat, image, video: videoGen }
}
