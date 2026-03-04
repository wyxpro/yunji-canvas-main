/**
 * API Config Hook | API 配置 Hook
 */

import { ref, computed, watch } from 'vue'
import { setBaseUrl as setRequestBaseUrl } from '@/utils'
import { DEFAULT_API_BASE_URL, STORAGE_KEYS } from '@/utils'
import { DEFAULT_CHAT_MODEL } from '@/config/models'

/**
 * Get stored value from localStorage | 从 localStorage 获取存储值
 */
const getStored = (key, defaultValue = '') => {
  try {
    return localStorage.getItem(key) || defaultValue
  } catch {
    return defaultValue
  }
}

/**
 * Set stored value to localStorage | 设置存储值到 localStorage
 */
const setStored = (key, value) => {
  try {
    if (value) {
      localStorage.setItem(key, value)
    } else {
      localStorage.removeItem(key)
    }
  } catch {
    // Ignore storage errors
  }
}

// Shared state (singleton) | 共享状态（单例）
const apiKey = ref(getStored(STORAGE_KEYS.API_KEY))
const baseUrl = ref(getStored(STORAGE_KEYS.BASE_URL, DEFAULT_API_BASE_URL))
const chatModel = ref(getStored(STORAGE_KEYS.CHAT_MODEL, DEFAULT_CHAT_MODEL))

const isConfigured = computed(() => !!apiKey.value)

// Watch and sync changes | 监听并同步变化
watch(apiKey, (newKey) => {
  setStored(STORAGE_KEYS.API_KEY, newKey)
})

watch(
  baseUrl,
  (newUrl) => {
    // Ensure request layer uses latest base URL
    setRequestBaseUrl(newUrl)
    setStored(STORAGE_KEYS.BASE_URL, newUrl)
  },
  { immediate: true }
)

watch(chatModel, (newModel) => {
  setStored(STORAGE_KEYS.CHAT_MODEL, newModel)
})

/**
 * API Configuration Hook | API 配置 Hook
 */
export const useApiConfig = () => {
  const setApiKey = (key) => {
    apiKey.value = key || ''
    setStored(STORAGE_KEYS.API_KEY, apiKey.value)
  }

  const setBaseUrl = (url) => {
    baseUrl.value = url || DEFAULT_API_BASE_URL
    setRequestBaseUrl(baseUrl.value)
    setStored(STORAGE_KEYS.BASE_URL, baseUrl.value)
  }

  const setChatModel = (model) => {
    chatModel.value = model || DEFAULT_CHAT_MODEL
    setStored(STORAGE_KEYS.CHAT_MODEL, chatModel.value)
  }

  const configure = (config = {}) => {
    if (typeof config.apiKey !== 'undefined') setApiKey(config.apiKey)
    if (typeof config.baseUrl !== 'undefined') setBaseUrl(config.baseUrl)
    if (typeof config.chatModel !== 'undefined') setChatModel(config.chatModel)
  }

  const clear = () => {
    setApiKey('')
    setBaseUrl(DEFAULT_API_BASE_URL)
    setChatModel(DEFAULT_CHAT_MODEL)
  }

  return {
    apiKey,
    baseUrl,
    chatModel,
    isConfigured,
    setApiKey,
    setBaseUrl,
    setChatModel,
    configure,
    clear
  }
}
