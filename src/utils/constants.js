/**
 * Constants | 常量配置
 */

// API Base URL | API 基础 URL
export const DEFAULT_API_BASE_URL = 'https://api.cutb.cn/v1'

// API Endpoints | API 端点
export const API_ENDPOINTS = {
  // Model | 模型
  MODEL_PAGE: '/model/page',
  MODEL_FULL_NAME: '/model/fullName',
  MODEL_TYPES: '/model/types',
  
  // Image | 图片
  IMAGE_GENERATIONS: '/images/generations',
  
  // Video | 视频
  VIDEO_GENERATIONS: '/videos',
  VIDEO_TASK: '/videos',
  
  // Chat | 对话
  CHAT_COMPLETIONS: '/chat/completions'
}

// Error Codes | 错误码
export const ERROR_CODES = {
  INVALID_API_KEY: 'INVALID_API_KEY',
  RATE_LIMIT: 'RATE_LIMIT',
  NETWORK_ERROR: 'NETWORK_ERROR',
  TIMEOUT: 'TIMEOUT',
  UNKNOWN: 'UNKNOWN'
}

// Video Poll Config | 视频轮询配置
export const VIDEO_POLL_CONFIG = {
  MAX_ATTEMPTS: 120,
  POLL_INTERVAL: 5000
}

// Default Chat Config | 默认问答配置
export const DEFAULT_CHAT_CONFIG = {
  supportImage: false,
  supportFile: false,
  supportWeb: false,
  supportDeepThink: false
}

// Local Storage Keys | 本地存储键
export const STORAGE_KEYS = {
  API_KEY: 'apiKey',
  BASE_URL: 'apiBaseUrl',
  CHAT_MODEL: 'chatModel',
  AI_WORKFLOW_BUILDER_ENABLED: 'aiWorkflowBuilderEnabled',

  // Model templates | 模型模板
  IMAGE_MODEL_TEMPLATES: 'imageModelTemplates',
  VIDEO_MODEL_TEMPLATES: 'videoModelTemplates',
  CHAT_MODEL_TEMPLATES: 'chatModelTemplates',

  // Workflow templates | 工作流模板
  WORKFLOW_TEMPLATES: 'workflowTemplates',

  // Optional asset storage (Aliyun OSS) | 可选素材存储（阿里云 OSS）
  ALIYUN_OSS_CONFIG: 'aliyunOssConfig'
}
