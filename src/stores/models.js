/**
 * Model Store | 模型状态管理
 * Built-in models for open source version | 开源版内置模型
 */

import { ref, computed, watch } from 'vue'
import {
  IMAGE_MODELS,
  VIDEO_MODELS,
  CHAT_MODELS,
  SEEDREAM_SIZE_OPTIONS,
  SEEDREAM_4K_SIZE_OPTIONS,
  SEEDREAM_QUALITY_OPTIONS,
  VIDEO_RATIO_LIST,
  VIDEO_RATIO_OPTIONS,
  VIDEO_DURATION_OPTIONS,
  DEFAULT_IMAGE_MODEL,
  DEFAULT_VIDEO_MODEL,
  DEFAULT_CHAT_MODEL,
  DEFAULT_IMAGE_SIZE,
  DEFAULT_VIDEO_RATIO,
  DEFAULT_VIDEO_DURATION
} from '@/config/models'
import { STORAGE_KEYS } from '@/utils'

// Loading state (always false for built-in models) | 加载状态
const loading = ref(false)
const error = ref(null)

// ------------------------------
// Model templates (persisted) | 模型模板（持久化）
// ------------------------------
const DEFAULT_IMAGE_MODEL_TEMPLATES = IMAGE_MODELS.map(m => ({ label: m.label, key: m.key }))
const DEFAULT_VIDEO_MODEL_TEMPLATES = VIDEO_MODELS.map(m => ({ label: m.label, key: m.key }))
const DEFAULT_CHAT_MODEL_TEMPLATES = CHAT_MODELS.map(m => ({ label: m.label, key: m.key }))

const readStoredJson = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    const parsed = JSON.parse(raw)
    return parsed ?? fallback
  } catch {
    return fallback
  }
}

const writeStoredJson = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // ignore
  }
}

const sanitizeTemplates = (templates) => {
  const list = Array.isArray(templates) ? templates : []
  const out = []
  const seen = new Set()

  for (const item of list) {
    if (!item) continue
    const key = String(item.key || '').trim()
    if (!key) continue
    if (seen.has(key)) continue
    seen.add(key)

    const label = String(item.label || key).trim() || key
    out.push({ key, label })
  }

  return out
}

export const imageModelTemplates = ref(
  sanitizeTemplates(readStoredJson(STORAGE_KEYS.IMAGE_MODEL_TEMPLATES, DEFAULT_IMAGE_MODEL_TEMPLATES))
)

export const videoModelTemplates = ref(
  sanitizeTemplates(readStoredJson(STORAGE_KEYS.VIDEO_MODEL_TEMPLATES, DEFAULT_VIDEO_MODEL_TEMPLATES))
)

export const chatModelTemplates = ref(
  sanitizeTemplates(readStoredJson(STORAGE_KEYS.CHAT_MODEL_TEMPLATES, DEFAULT_CHAT_MODEL_TEMPLATES))
)

watch(
  imageModelTemplates,
  (val) => writeStoredJson(STORAGE_KEYS.IMAGE_MODEL_TEMPLATES, sanitizeTemplates(val)),
  { deep: true }
)

watch(
  videoModelTemplates,
  (val) => writeStoredJson(STORAGE_KEYS.VIDEO_MODEL_TEMPLATES, sanitizeTemplates(val)),
  { deep: true }
)

watch(
  chatModelTemplates,
  (val) => writeStoredJson(STORAGE_KEYS.CHAT_MODEL_TEMPLATES, sanitizeTemplates(val)),
  { deep: true }
)

const resolveModelsFromTemplates = (templates, baseModels) => {
  const baseMap = new Map((baseModels || []).map(m => [m.key, m]))
  const resolved = []

  for (const t of sanitizeTemplates(templates)) {
    const base = baseMap.get(t.key)
    if (base) {
      resolved.push({ ...base, label: t.label, key: t.key })
    } else {
      // Custom model (minimal config)
      resolved.push({ label: t.label, key: t.key })
    }
  }

  // If user accidentally clears the list, fallback to built-in defaults
  return resolved.length > 0 ? resolved : baseModels
}

const resolvedImageModels = computed(() => resolveModelsFromTemplates(imageModelTemplates.value, IMAGE_MODELS))
const resolvedVideoModels = computed(() => resolveModelsFromTemplates(videoModelTemplates.value, VIDEO_MODELS))
const resolvedChatModels = computed(() => resolveModelsFromTemplates(chatModelTemplates.value, CHAT_MODELS))

/**
 * Initialize models (no-op for built-in) | 初始化模型
 */
export const loadAllModels = async () => {
  // Built-in models + user templates (persisted)
  return [...resolvedImageModels.value, ...resolvedVideoModels.value, ...resolvedChatModels.value]
}

/**
 * Get model config by name | 根据名称获取模型配置
 */
export const getModelConfig = (modelKey) => {
  const allModels = [...resolvedImageModels.value, ...resolvedVideoModels.value, ...resolvedChatModels.value]
  return allModels.find(m => m.key === modelKey)
}

/**
 * Get size options for image model | 获取图片模型尺寸选项
 * Returns options based on model's sizes array and quality
 */
export const getModelSizeOptions = (modelKey, quality = 'standard') => {
  const model = resolvedImageModels.value.find(m => m.key === modelKey)

  // If model has getSizesByQuality function, use it | 如果模型有 getSizesByQuality 函数，使用它
  if (model?.getSizesByQuality) {
    return model.getSizesByQuality(quality)
  }

  if (!model?.sizes) return SEEDREAM_SIZE_OPTIONS

  // Convert sizes array to dropdown options | 转换 sizes 数组为下拉选项
  const sizeOptions = quality === '4k' ? SEEDREAM_4K_SIZE_OPTIONS : SEEDREAM_SIZE_OPTIONS
  return model.sizes.map(size => {
    const option = sizeOptions.find(o => o.key === size)
    return option || { label: size, key: size }
  })
}

/**
 * Get quality options for image model | 获取图片模型画质选项
 */
export const getModelQualityOptions = (modelKey) => {
  const model = resolvedImageModels.value.find(m => m.key === modelKey)
  return model?.qualities || []
}

/**
 * Get ratio options for video model | 获取视频模型比例选项
 * Returns options based on model's ratios array
 */
export const getModelRatioOptions = (modelKey) => {
  const model = resolvedVideoModels.value.find(m => m.key === modelKey)
  if (!model?.ratios) return VIDEO_RATIO_OPTIONS

  // Convert ratios array to dropdown options | 转换 ratios 数组为下拉选项
  return model.ratios.map(ratio => {
    const option = VIDEO_RATIO_LIST.find(o => o.key === ratio)
    return option || { label: ratio, key: ratio }
  })
}

/**
 * Get duration options for video model | 获取视频模型时长选项
 * Returns options based on model's durs array
 */
export const getModelDurationOptions = (modelKey) => {
  const model = resolvedVideoModels.value.find(m => m.key === modelKey)
  if (!model?.durs) return VIDEO_DURATION_OPTIONS

  // durs is already in { label, key } format | durs 已经是 { label, key } 格式
  return model.durs
}

// Dropdown options (already in label/key format) | 下拉选项
export const imageModelOptions = computed(() => resolvedImageModels.value)
export const videoModelOptions = computed(() => resolvedVideoModels.value)
export const chatModelOptions = computed(() => resolvedChatModels.value)

// Simple select options (for n-select) | 简单选择选项
export const imageModelSelectOptions = computed(() => 
  resolvedImageModels.value.map(m => ({ label: m.label, value: m.key }))
)

export const videoModelSelectOptions = computed(() => 
  resolvedVideoModels.value.map(m => ({ label: m.label, value: m.key }))
)

export const chatModelSelectOptions = computed(() => 
  resolvedChatModels.value.map(m => ({ label: m.label, value: m.key }))
)

// Export model arrays | 导出模型数组
export const imageModels = resolvedImageModels
export const videoModels = resolvedVideoModels
export const chatModels = computed(() => resolvedChatModels.value)

// Setters / reset | 设置/重置
export const setImageModelTemplates = (templates) => {
  imageModelTemplates.value = sanitizeTemplates(templates)
}

export const setVideoModelTemplates = (templates) => {
  videoModelTemplates.value = sanitizeTemplates(templates)
}

export const setChatModelTemplates = (templates) => {
  chatModelTemplates.value = sanitizeTemplates(templates)
}

export const resetImageModelTemplates = () => {
  imageModelTemplates.value = DEFAULT_IMAGE_MODEL_TEMPLATES
}

export const resetVideoModelTemplates = () => {
  videoModelTemplates.value = DEFAULT_VIDEO_MODEL_TEMPLATES
}

export const resetChatModelTemplates = () => {
  chatModelTemplates.value = DEFAULT_CHAT_MODEL_TEMPLATES
}

// Export defaults | 导出默认值
export {
  DEFAULT_IMAGE_MODEL,
  DEFAULT_VIDEO_MODEL,
  DEFAULT_CHAT_MODEL,
  DEFAULT_IMAGE_SIZE,
  DEFAULT_VIDEO_RATIO,
  DEFAULT_VIDEO_DURATION
}

// Export options | 导出选项
export { SEEDREAM_SIZE_OPTIONS, SEEDREAM_4K_SIZE_OPTIONS, SEEDREAM_QUALITY_OPTIONS, VIDEO_RATIO_OPTIONS, VIDEO_DURATION_OPTIONS }

// Export state | 导出状态
export { loading, error }
