<template>
  <!-- Video config node wrapper | 视频配置节点包裹层 -->
  <div class="video-config-node-wrapper relative">
    <!-- Video config node | 视频配置节点 -->
    <div class="video-config-node bg-[var(--glass-bg)] backdrop-blur-xl rounded-2xl border border-[color:var(--glass-border)] min-w-[300px] transition-all duration-300 shadow-glass hover:shadow-neon hover:border-purple-500/30"
      :class="selected ? 'border-purple-500/50 shadow-neon' : ''">
      <!-- Header | 头部 -->
      <div class="node-drag-handle flex items-center justify-between px-4 py-3 border-b border-[color:var(--border-color)]">
        <span class="text-xs font-bold tracking-widest text-[var(--text-primary)] uppercase">{{ data.label || '视频生成' }}</span>
        <div class="flex items-center gap-1.5">
          <button @click="handleDuplicate" class="nodrag p-1.5 hover:bg-black/5 dark:hover:bg-white/10 rounded-lg transition-colors text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white" title="复制">
            <n-icon :size="14"><CopyOutline /></n-icon>
          </button>
          <button @click="handleDelete" class="nodrag p-1.5 hover:bg-black/5 dark:hover:bg-white/10 rounded-lg transition-colors text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400" title="删除">
            <n-icon :size="14"><TrashOutline /></n-icon>
          </button>
        </div>
      </div>

      <!-- Config options | 配置选项 -->
      <div class="p-4 space-y-4">
        <!-- Model selector | 模型选择 -->
        <div class="flex items-center justify-between">
          <span class="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">模型</span>
          <n-dropdown :options="modelOptions" @select="handleModelSelect">
            <button class="flex items-center gap-1.5 text-xs text-gray-700 dark:text-gray-300 hover:text-purple-700 dark:hover:text-purple-300 transition-colors bg-black/5 dark:bg-white/5 px-2 py-1 rounded-md border border-black/10 dark:border-white/5 hover:border-purple-500/30">
              {{ displayModelName }}
              <n-icon :size="10"><ChevronDownOutline /></n-icon>
            </button>
          </n-dropdown>
        </div>

        <!-- Aspect ratio selector | 宽高比选择 -->
        <div class="flex items-center justify-between">
          <span class="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">比例</span>
          <n-dropdown :options="ratioOptions" @select="handleRatioSelect">
            <button class="flex items-center gap-1.5 text-xs text-gray-700 dark:text-gray-300 hover:text-purple-700 dark:hover:text-purple-300 transition-colors bg-black/5 dark:bg-white/5 px-2 py-1 rounded-md border border-black/10 dark:border-white/5 hover:border-purple-500/30">
              {{ displayRatio }}
              <n-icon :size="10">
                <ChevronForwardOutline />
              </n-icon>
            </button>
          </n-dropdown>
        </div>

        <!-- Duration selector | 时长选择 -->
        <div class="flex items-center justify-between">
          <span class="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">时长</span>
          <n-dropdown :options="durationOptions" @select="handleDurationSelect">
            <button class="flex items-center gap-1.5 text-xs text-gray-700 dark:text-gray-300 hover:text-purple-700 dark:hover:text-purple-300 transition-colors bg-black/5 dark:bg-white/5 px-2 py-1 rounded-md border border-black/10 dark:border-white/5 hover:border-purple-500/30">
              {{ displayDuration }}
              <n-icon :size="10">
                <ChevronForwardOutline />
              </n-icon>
            </button>
          </n-dropdown>
        </div>

        <!-- Connected inputs indicator | 连接输入指示 -->
        <div class="flex items-center gap-3 text-[10px] text-gray-600 dark:text-gray-500 py-2 border-t border-black/5 dark:border-white/5">
          <span
            class="flex items-center gap-1.5 px-2 py-1 rounded-md border"
            :class="
              connectedPrompt
                ? 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20'
                : 'bg-black/5 dark:bg-white/5 text-gray-600 dark:text-gray-500 border-black/10 dark:border-white/5'
            ">
            <div
              class="w-1.5 h-1.5 rounded-full"
              :class="connectedPrompt ? 'bg-green-500' : 'bg-gray-400 dark:bg-gray-600'"
            ></div>
            提示词
          </span>
          <span
            class="flex items-center gap-1.5 px-2 py-1 rounded-md border"
            :class="
              imagesByRole.firstFrame
                ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20'
                : 'bg-black/5 dark:bg-white/5 text-gray-600 dark:text-gray-500 border-black/10 dark:border-white/5'
            ">
            <div
              class="w-1.5 h-1.5 rounded-full"
              :class="imagesByRole.firstFrame ? 'bg-purple-500' : 'bg-gray-400 dark:bg-gray-600'"
            ></div>
            首帧
          </span>
          <span
            class="flex items-center gap-1.5 px-2 py-1 rounded-md border"
            :class="
              imagesByRole.referenceImages.length > 0
                ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20'
                : 'bg-black/5 dark:bg-white/5 text-gray-600 dark:text-gray-500 border-black/10 dark:border-white/5'
            ">
            <div
              class="w-1.5 h-1.5 rounded-full"
              :class="imagesByRole.referenceImages.length > 0 ? 'bg-blue-500' : 'bg-gray-400 dark:bg-gray-600'"
            ></div>
            参考: {{ imagesByRole.referenceImages.length }}
          </span>
        </div>

        <!-- Generate button | 生成按钮 -->
        <button @click="handleGenerate" :disabled="loading || !isConfigured"
          class="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white text-xs font-bold tracking-widest transition-all shadow-lg shadow-orange-900/30 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none hover:translate-y-[-1px]">
          <n-spin v-if="loading" :size="14" stroke="white" />
          <template v-else>
            <n-icon :size="14">
              <VideocamOutline />
            </n-icon>
            生成视频
          </template>
        </button>

        <!-- Error message | 错误信息 -->
        <div v-if="error" class="text-xs text-red-400 mt-2 px-2 py-1 bg-red-500/10 border border-red-500/20 rounded-lg">
          {{ error.message || '生成失败' }}
        </div>
      </div>

      <!-- Handles | 连接点 -->
      <Handle type="target" :position="Position.Left" id="left" :connectable="connectable" class="!w-3 !h-3 !bg-orange-500 !border-2 !border-[color:var(--bg-secondary)]" />
      <Handle type="source" :position="Position.Right" id="right" :connectable="connectable" class="!w-3 !h-3 !bg-orange-500 !border-2 !border-[color:var(--bg-secondary)]" />
    </div>

  </div>
</template>

<script setup>
/**
 * Video config node component | 视频配置节点组件
 * Configuration panel for video generation with API integration
 */
import { ref, computed, watch, onMounted } from 'vue'
import { Handle, Position, useVueFlow } from '@vue-flow/core'
import { NIcon, NDropdown, NSpin } from 'naive-ui'
import { ChevronForwardOutline, ChevronDownOutline, TrashOutline, VideocamOutline, CopyOutline } from '@vicons/ionicons5'
import { useVideoGeneration, useApiConfig } from '../../hooks'
import { updateNode, removeNode, duplicateNode, addNode, addEdge, nodes, edges } from '../../stores/canvas'
import { videoModelOptions, getModelRatioOptions, getModelDurationOptions, getModelConfig, DEFAULT_VIDEO_MODEL, DEFAULT_VIDEO_RATIO, DEFAULT_VIDEO_DURATION } from '../../stores/models'

const props = defineProps({
  id: String,
  data: Object,
  selected: Boolean,
  connectable: {
    type: [Boolean, Function],
    default: true
  }
})

// Vue Flow instance | Vue Flow 实例
const { updateNodeInternals } = useVueFlow()

// API config hook | API 配置 hook
const { isConfigured } = useApiConfig()

// Video generation hook | 视频生成 hook
const { loading, error, status, video: generatedVideo, progress, generate } = useVideoGeneration()


// Local state | 本地状态
const localModel = ref(props.data?.model || DEFAULT_VIDEO_MODEL)
const localRatio = ref(props.data?.ratio || DEFAULT_VIDEO_RATIO)
const localDuration = ref(props.data?.dur || DEFAULT_VIDEO_DURATION)

// Normalize legacy stored values | 兼容旧的存储格式
const normalizeRatioKey = (ratio) => {
  if (!ratio) return ratio
  // Legacy used colon format: 16:9 → 16x9
  if (typeof ratio === 'string' && ratio.includes(':')) {
    return ratio.replace(':', 'x')
  }
  return ratio
}

const normalizeDurationValue = (dur) => {
  if (typeof dur === 'number') return dur
  const n = parseInt(String(dur || ''), 10)
  return Number.isFinite(n) ? n : DEFAULT_VIDEO_DURATION
}

// Get connected images with roles | 获取连接的图片及其角色
const connectedImages = computed(() => {
  const connectedEdges = edges.value.filter(e => e.target === props.id)
  const images = []

  for (const edge of connectedEdges) {
    const sourceNode = nodes.value.find(n => n.id === edge.source)
    if (sourceNode?.type === 'image' && sourceNode.data?.url) {
      images.push({
        nodeId: sourceNode.id,
        edgeId: edge.id,
        url: sourceNode.data.url,
        base64: sourceNode.data.base64,
        role: edge.data?.imageRole || 'first_frame_image' // Default to first frame | 默认首帧
      })
    }
  }

  return images
})

// Get images by role | 按角色获取图片
const imagesByRole = computed(() => {
  const firstFrame = connectedImages.value.find(img => img.role === 'first_frame_image')
  const lastFrame = connectedImages.value.find(img => img.role === 'last_frame_image')
  const referenceImages = connectedImages.value.filter(img => img.role === 'input_reference')

  return {
    firstFrame,
    lastFrame,
    referenceImages
  }
})

// Get current model config | 获取当前模型配置
const currentModelConfig = computed(() => getModelConfig(localModel.value))

// Model options from store | 从 store 获取模型选项
const modelOptions = videoModelOptions

// Ensure the current model exists in configured templates | 确保当前模型在配置的模板列表中
const ensureValidModel = () => {
  const opts = modelOptions.value || []
  if (opts.length === 0) return

  const exists = opts.some(m => m.key === localModel.value)
  if (!exists) {
    const next = opts[0].key
    localModel.value = next
    updateNode(props.id, { model: next })
  }
}

// Normalize legacy stored values & invalid selections | 兼容旧值并修正非法选项
const normalizeParams = () => {
  const modelKey = localModel.value || DEFAULT_VIDEO_MODEL
  const config = getModelConfig(modelKey)

  const rOpts = getModelRatioOptions(modelKey) || []
  const dOpts = getModelDurationOptions(modelKey) || []

  let ratio = normalizeRatioKey(localRatio.value) || config?.defaultParams?.ratio || DEFAULT_VIDEO_RATIO
  let dur = normalizeDurationValue(localDuration.value)

  // Validate ratio is supported by current model
  if (rOpts.length > 0 && !rOpts.some(o => o.key === ratio)) {
    ratio = config?.defaultParams?.ratio || rOpts[0].key
  }

  // Validate duration is supported by current model
  if (dOpts.length > 0 && !dOpts.some(o => o.key === dur)) {
    dur = config?.defaultParams?.duration || dOpts[0].key
  }

  const updates = {}

  if (ratio !== localRatio.value) {
    localRatio.value = ratio
    updates.ratio = ratio
  }

  if (dur !== localDuration.value) {
    localDuration.value = dur
    updates.dur = dur
  }

  if (Object.keys(updates).length > 0) {
    updateNode(props.id, updates)
  }
}

// Display model name | 显示模型名称
const displayModelName = computed(() => {
  const model = modelOptions.value.find(m => m.key === localModel.value)
  return model?.label || localModel.value || '选择模型'
})

// Ratio options based on model | 基于模型的比例选项
const ratioOptions = computed(() => {
  return getModelRatioOptions(localModel.value)
})

// Duration options based on model | 基于模型的时长选项
const durationOptions = computed(() => {
  return getModelDurationOptions(localModel.value)
})

// Display ratio/duration labels | 显示比例/时长标签
const displayRatio = computed(() => {
  const opt = ratioOptions.value.find(o => o.key === localRatio.value)
  return opt?.label || localRatio.value
})

const displayDuration = computed(() => {
  const opt = durationOptions.value.find(o => o.key === localDuration.value)
  return opt?.label || `${localDuration.value}s`
})

// Handle model selection | 处理模型选择
const handleModelSelect = (key) => {
  localModel.value = key
  // Update ratio and duration to model's default | 更新为模型默认比例和时长
  const config = getModelConfig(key)
  const updates = { model: key }
  if (config?.defaultParams?.ratio) {
    localRatio.value = config.defaultParams.ratio
    updates.ratio = config.defaultParams.ratio
  }
  if (config?.defaultParams?.duration) {
    localDuration.value = config.defaultParams.duration
    updates.dur = config.defaultParams.duration
  }
  updateNode(props.id, updates)
}

// Handle duplicate | 处理复制
const handleDuplicate = () => {
  const newNodeId = duplicateNode(props.id)
  window.$message?.success('节点已复制')
  if (newNodeId) {
    setTimeout(() => {
      updateNodeInternals(newNodeId)
    }, 50)
  }
}

// Handle ratio selection | 处理比例选择
const handleRatioSelect = (key) => {
  localRatio.value = key
  updateNode(props.id, { ratio: key })
}

// Handle duration selection | 处理时长选择
const handleDurationSelect = (key) => {
  localDuration.value = key
  updateNode(props.id, { dur: key })
}

// Get connected inputs by role | 根据角色获取连接的输入
const getConnectedInputs = () => {
  const connectedEdges = edges.value.filter(e => e.target === props.id)

  const prompts = [] // Array of { order, content } | 提示词数组
  let first_frame_image = ''
  let last_frame_image = ''
  const images = [] // input_reference images | 参考图

  for (const edge of connectedEdges) {
    const sourceNode = nodes.value.find(n => n.id === edge.source)
    if (!sourceNode) continue

    if (sourceNode.type === 'text') {
      const content = String(sourceNode.data?.content || '').trim()
      if (content) {
        const order = edge.data?.promptOrder || 1
        prompts.push({ order, content, nodeId: sourceNode.id })
      }
    } else if (sourceNode.type === 'image' && sourceNode.data?.url) {
      const imageData = sourceNode.data.base64 || sourceNode.data.url
      const role = edge.data?.imageRole || 'first_frame_image'

      if (role === 'first_frame_image') {
        first_frame_image = imageData
      } else if (role === 'last_frame_image') {
        last_frame_image = imageData
      } else if (role === 'input_reference') {
        images.push(imageData)
      }
    }
  }

  // Sort prompts by order and concatenate | 按顺序排序并拼接
  prompts.sort((a, b) => a.order - b.order)
  const prompt = prompts.map(p => p.content).join('\n\n')

  return { prompt, prompts, first_frame_image, last_frame_image, images }
}

// Computed connected prompt | 计算连接的提示词
const connectedPrompt = computed(() => {
  return getConnectedInputs().prompt
})

// If there is an explicit first-frame image edge, auto-execute should wait for it.
const needsFirstFrame = computed(() => {
  return edges.value.some(e => {
    if (e.target !== props.id) return false
    const sourceNode = nodes.value.find(n => n.id === e.source)
    if (sourceNode?.type !== 'image') return false
    const role = e.data?.imageRole || 'first_frame_image'
    return role === 'first_frame_image'
  })
})

const pendingAutoExecute = ref(false)

const canAutoExecuteNow = () => {
  const { prompt, first_frame_image, last_frame_image, images } = getConnectedInputs()
  if (needsFirstFrame.value && !first_frame_image) return false
  return Boolean(prompt || first_frame_image || last_frame_image || (images && images.length > 0))
}

const tryAutoExecute = () => {
  if (!pendingAutoExecute.value) return
  if (loading.value) return
  if (props.data?.executed) {
    pendingAutoExecute.value = false
    return
  }

  if (!canAutoExecuteNow()) return

  pendingAutoExecute.value = false
  handleGenerate()
}

// Created video node ID | 创建的视频节点 ID
const createdVideoNodeId = ref(null)

// Find connected output video node (placeholder) | 查找已连接的输出视频节点
const findConnectedOutputVideoNode = (onlyEmpty = true) => {
  const outputEdges = edges.value.filter(e => e.source === props.id)
  for (const edge of outputEdges) {
    const targetNode = nodes.value.find(n => n.id === edge.target)
    if (targetNode?.type === 'video') {
      if (onlyEmpty) {
        if (!targetNode.data?.url || targetNode.data.url === '') {
          return targetNode.id
        }
      } else {
        return targetNode.id
      }
    }
  }
  return null
}

// Handle generate action | 处理生成操作
const handleGenerate = async () => {
  const { prompt, first_frame_image, last_frame_image, images } = getConnectedInputs()

  const hasInput = prompt || first_frame_image || last_frame_image || images.length > 0
  if (!hasInput) {
    window.$message?.warning('请先连接文本节点或图片节点')
    return
  }

  if (!isConfigured.value) {
    window.$message?.warning('请先配置 API Key')
    return
  }

  // Reset executed state before generating (so workflow reruns are deterministic)
  updateNode(props.id, { executed: false, outputNodeId: null })

  // Reuse a connected placeholder if possible; otherwise create a new output
  let videoNodeId = findConnectedOutputVideoNode(true)

  if (!videoNodeId) {
    videoNodeId = findConnectedOutputVideoNode(false)
  }

  if (videoNodeId) {
    updateNode(videoNodeId, { url: '', loading: true, error: '', updatedAt: Date.now() })
  } else {
    // Get current node position | 获取当前节点位置
    const currentNode = nodes.value.find(n => n.id === props.id)
    const nodeX = currentNode?.position?.x || 0
    const nodeY = currentNode?.position?.y || 0

    // Create video node with loading state | 创建带加载状态的视频节点
    videoNodeId = addNode('video', { x: nodeX + 350, y: nodeY }, {
      url: '',
      loading: true,
      label: '视频生成中...'
    })

    // Auto-connect videoConfig → video | 自动连接 视频配置 → 视频
    addEdge({
      source: props.id,
      target: videoNodeId,
      sourceHandle: 'right',
      targetHandle: 'left'
    })
  }

  createdVideoNodeId.value = videoNodeId

  // Force Vue Flow to recalculate node dimensions | 强制 Vue Flow 重新计算节点尺寸
  setTimeout(() => {
    updateNodeInternals(videoNodeId)
  }, 50)

  try {
    // Build request params (raw form data) | 构建请求参数（原始表单数据）
    // These will be transformed by inputTransform | 这些会被 inputTransform 转换
    const params = {
      model: localModel.value
    }

    // Add prompt if provided | 如果有提示词则添加
    if (prompt) {
      params.prompt = prompt
    }

    // Add first frame image | 添加首帧图片
    if (first_frame_image) {
      params.first_frame_image = first_frame_image
    }

    // Add last frame image | 添加尾帧图片
    if (last_frame_image) {
      params.last_frame_image = last_frame_image
    }

    // Add reference images (input_reference) | 添加参考图
    if (images.length > 0) {
      params.images = images
    }

    // Add ratio/size | 添加比例参数
    if (localRatio.value) {
      params.ratio = localRatio.value
    }

    // Add duration | 添加时长
    if (localDuration.value) {
      params.dur = localDuration.value
    }

    const result = await generate(params)

    // Update video node with generated URL | 更新视频节点 URL
    if (result && result.url) {
      updateNode(videoNodeId, {
        url: result.url,
        loading: false,
        label: '视频生成',
        model: localModel.value,
        updatedAt: Date.now()
      })
      
      // Mark this config node as executed | 标记配置节点已执行
      updateNode(props.id, { executed: true, outputNodeId: videoNodeId })
    }
    window.$message?.success('视频生成成功')
  } catch (err) {
    // Update node to show error | 更新节点显示错误
    updateNode(videoNodeId, {
      loading: false,
      error: err.message || '生成失败',
      label: '生成失败',
      updatedAt: Date.now()
    })
    window.$message?.error(err.message || '视频生成失败')
  }
}

// Handle delete | 处理删除
const handleDelete = () => {
  removeNode(props.id)
}

// Initialize on mount | 挂载时初始化
onMounted(() => {
  if (!localModel.value) {
    localModel.value = DEFAULT_VIDEO_MODEL
    updateNode(props.id, { model: localModel.value })
  }

  ensureValidModel()
  normalizeParams()
})

// Re-validate when model/ratio/dur change (handles legacy stored projects)
watch([localModel, localRatio, localDuration], () => {
  normalizeParams()
})

// If the model template list changes, keep the node model valid
watch(
  () => modelOptions.value,
  () => {
    ensureValidModel()
    normalizeParams()
  },
  { deep: true }
)

// Watch for model changes from props | 监听 props 中模型变化
watch(() => props.data?.model, (newModel) => {
  if (newModel && newModel !== localModel.value) {
    localModel.value = newModel
  }
})

// Watch for auto-execute flag | 监听自动执行标志
watch(
  () => props.data?.autoExecute,
  (shouldExecute) => {
    if (shouldExecute && !loading.value) {
      // Clear the flag first to prevent re-triggering | 先清除标志防止重复触发
      updateNode(props.id, { autoExecute: false })
      pendingAutoExecute.value = true
      // Delay to ensure node connections are established | 延迟确保节点连接已建立
      setTimeout(() => {
        tryAutoExecute()
      }, 120)
    }
  },
  { immediate: true }
)

// When inputs become ready (e.g., first-frame image finished), start automatically.
watch(
  () => [
    pendingAutoExecute.value,
    needsFirstFrame.value,
    connectedPrompt.value,
    imagesByRole.value.firstFrame?.url || '',
    imagesByRole.value.lastFrame?.url || '',
    (imagesByRole.value.referenceImages || []).map(i => i.url).join('|')
  ],
  () => {
    tryAutoExecute()
  }
)
</script>

<style scoped>
.video-config-node-wrapper {
  position: relative;
}

.video-config-node {
  cursor: default;
  position: relative;
}
</style>
