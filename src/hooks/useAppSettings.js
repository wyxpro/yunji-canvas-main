/**
 * App Settings Hook | 应用设置 Hook
 * Stores small user preferences in localStorage.
 */

import { ref, watch } from 'vue'
import { STORAGE_KEYS } from '@/utils'

const getStoredBool = (key, defaultValue = false) => {
  try {
    const raw = localStorage.getItem(key)
    if (raw === null || raw === undefined || raw === '') return defaultValue
    return raw === '1' || raw === 'true'
  } catch {
    return defaultValue
  }
}

const setStoredBool = (key, value) => {
  try {
    localStorage.setItem(key, value ? '1' : '0')
  } catch {
    // Ignore storage errors
  }
}

// Shared state (singleton) | 共享状态（单例）
const aiWorkflowBuilderEnabled = ref(
  getStoredBool(STORAGE_KEYS.AI_WORKFLOW_BUILDER_ENABLED, false)
)

watch(
  aiWorkflowBuilderEnabled,
  (val) => setStoredBool(STORAGE_KEYS.AI_WORKFLOW_BUILDER_ENABLED, !!val),
  { immediate: true }
)

export const useAppSettings = () => {
  const setAiWorkflowBuilderEnabled = (val) => {
    aiWorkflowBuilderEnabled.value = !!val
    setStoredBool(STORAGE_KEYS.AI_WORKFLOW_BUILDER_ENABLED, aiWorkflowBuilderEnabled.value)
  }

  return {
    aiWorkflowBuilderEnabled,
    setAiWorkflowBuilderEnabled
  }
}
