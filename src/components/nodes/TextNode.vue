<template>
  <!-- Text node wrapper | 文本节点包裹层 -->
  <div class="text-node-wrapper">
    <!-- Text node | 文本节点 -->
    <div
      class="text-node bg-[var(--glass-bg)] backdrop-blur-xl rounded-2xl border border-[color:var(--glass-border)] w-[320px] relative transition-all duration-300 shadow-glass hover:shadow-neon hover:border-purple-500/30"
      :class="selected ? 'border-purple-500/50 shadow-neon' : ''"
    >
      <!-- Header | 头部 -->
      <div class="node-drag-handle flex items-center justify-between px-4 py-3 border-b border-[color:var(--border-color)]">
        <div class="flex items-center gap-2 min-w-0">
          <div class="w-2 h-2 rounded-full bg-sky-400/90 shadow-[0_0_14px_rgba(56,189,248,0.35)]"></div>
          <span class="text-xs font-bold tracking-widest text-[var(--text-primary)] uppercase truncate">{{ data.label || '提示词' }}</span>
        </div>
        <div class="flex items-center gap-1.5">
          <button
            @click="handleDuplicate"
            class="nodrag p-1.5 hover:bg-black/5 dark:hover:bg-white/10 rounded-lg transition-colors text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            title="复制"
          >
            <n-icon :size="14"><CopyOutline /></n-icon>
          </button>
          <button
            @click="handleDelete"
            class="nodrag p-1.5 hover:bg-black/5 dark:hover:bg-white/10 rounded-lg transition-colors text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400"
            title="删除"
          >
            <n-icon :size="14"><TrashOutline /></n-icon>
          </button>
        </div>
      </div>

      <!-- Content | 内容 -->
      <div class="p-4">
        <textarea
          v-model="content"
          @blur="updateContent"
          @wheel.stop
          @mousedown.stop
          @click.stop
          @keydown.stop
          class="nodrag nopan w-full bg-black/5 dark:bg-white/5 resize-none outline-none text-sm text-gray-900 dark:text-gray-200 placeholder:text-gray-400 dark:placeholder:text-gray-600 min-h-[110px] leading-relaxed font-light rounded-xl border border-black/10 dark:border-white/10 px-3 py-3 focus:border-purple-500/50 focus:bg-black/[0.03] dark:focus:bg-white/[0.07] transition-colors"
          placeholder="输入图片/视频提示词..."
        />

        <!-- Footer actions | 底部操作 -->
        <div class="mt-3 flex items-center justify-between gap-2">
          <div class="flex items-center gap-2">
            <button
              @click="handleImageGen"
              class="px-3 py-1.5 text-xs font-semibold rounded-full bg-black/5 dark:bg-white/5 hover:bg-purple-500/15 dark:hover:bg-purple-500/20 hover:text-purple-700 dark:hover:text-purple-200 border border-black/10 dark:border-white/10 hover:border-purple-500/30 transition-all flex items-center gap-1.5"
              title="文生图"
            >
              <n-icon :size="12"><ImageOutline /></n-icon>
              文生图
            </button>
            <button
              @click="handleVideoGen"
              class="px-3 py-1.5 text-xs font-semibold rounded-full bg-black/5 dark:bg-white/5 hover:bg-orange-500/15 hover:text-orange-700 dark:hover:text-orange-200 border border-black/10 dark:border-white/10 hover:border-orange-500/30 transition-all flex items-center gap-1.5"
              title="文生视频"
            >
              <n-icon :size="12"><VideocamOutline /></n-icon>
              文生视频
            </button>
          </div>

          <button
            @click="handlePolish"
            :disabled="isPolishing || !content.trim()"
            class="px-3 py-1.5 text-xs font-semibold rounded-full bg-gradient-to-r from-purple-600/90 to-indigo-600/90 hover:from-purple-500 hover:to-indigo-500 text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 shadow-lg shadow-purple-900/20"
          >
            <n-spin v-if="isPolishing" :size="12" stroke="white" />
            <n-icon v-else :size="12"><SparklesOutline /></n-icon>
            AI 润色
          </button>
        </div>
      </div>

      <!-- Handles | 连接点 -->
      <Handle type="source" :position="Position.Right" id="right" :connectable="connectable" class="!w-3 !h-3 !bg-purple-500 !border-2 !border-[color:var(--bg-secondary)]" />
      <Handle type="target" :position="Position.Left" id="left" :connectable="connectable" class="!w-3 !h-3 !bg-purple-500 !border-2 !border-[color:var(--bg-secondary)]" />
    </div>
  </div>
</template>

<script setup>
/**
 * Text node component | 文本节点组件
 * Allows user to input and edit text content
 */
import { ref, watch } from 'vue'
import { Handle, Position, useVueFlow } from '@vue-flow/core'
import { NIcon, NSpin } from 'naive-ui'
import { TrashOutline, CopyOutline, ImageOutline, VideocamOutline, SparklesOutline } from '@vicons/ionicons5'
import { updateNode, removeNode, duplicateNode, addNode, addEdge, nodes } from '../../stores/canvas'
import { useChat, useApiConfig } from '../../hooks'

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
const { isConfigured: isApiConfigured } = useApiConfig()

// Chat hook for polish | 润色用的 Chat hook
const { send: sendChat } = useChat({
  systemPrompt: '你是一个专业的AI绘画提示词专家。将用户输入的内容美化成高质量的生图提示词，包含风格、光线、構图、细节等要素。直接返回提示词，不要其他解释。',
  model: 'gpt-4o-mini'
})

// Local content state | 本地内容状态
const content = ref(props.data?.content || '')


// Polish loading state | 润色加载状态
const isPolishing = ref(false)

// Watch for external data changes | 监听外部数据变化
watch(() => props.data?.content, (newVal) => {
  if (newVal !== content.value) {
    content.value = newVal
  }
})

// Update content in store | 更新存储中的内容
const updateContent = () => {
  updateNode(props.id, { content: content.value })
}

// Handle AI polish | 处理 AI 润色
const handlePolish = async () => {
  const input = content.value.trim()
  if (!input) return
  
  // Check API configuration | 检查 API 配置
  if (!isApiConfigured.value) {
    window.$message?.warning('请先配置 API Key')
    return
  }

  isPolishing.value = true
  const originalContent = content.value

  try {
    // Call chat API to polish the prompt | 调用 AI 润色提示词
    const result = await sendChat(input, true)
    
    if (result) {
      content.value = result
      updateNode(props.id, { content: result })
      window.$message?.success('提示词已润色')
    }
  } catch (err) {
    content.value = originalContent
    window.$message?.error(err.message || '润色失败')
  } finally {
    isPolishing.value = false
  }
}

// Handle delete | 处理删除
const handleDelete = () => {
  removeNode(props.id)
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

// Handle image generation | 处理图片生成
const handleImageGen = () => {
  const currentNode = nodes.value.find(n => n.id === props.id)
  const nodeX = currentNode?.position?.x || 0
  const nodeY = currentNode?.position?.y || 0

  // Create imageConfig node | 创建text生图配置节点
  const configNodeId = addNode('imageConfig', { x: nodeX + 400, y: nodeY }, {
    label: '文生图'
  })

  // Auto connect | 自动连接
  addEdge({
    source: props.id,
    target: configNodeId,
    sourceHandle: 'right',
    targetHandle: 'left',
    type: 'promptOrder',
    data: { promptOrder: 1 }
  })

  // Force Vue Flow to recalculate node dimensions | 强制 Vue Flow 重新计算节点尺寸
  setTimeout(() => {
    updateNodeInternals(configNodeId)
  }, 50)
}

// Handle video generation | 处理视频生成
const handleVideoGen = () => {
  const currentNode = nodes.value.find(n => n.id === props.id)
  const nodeX = currentNode?.position?.x || 0
  const nodeY = currentNode?.position?.y || 0

  // Create videoConfig node | 创建视频配置节点
  const configNodeId = addNode('videoConfig', { x: nodeX + 400, y: nodeY }, {
    label: '视频生成'
  })

  // Auto connect | 自动连接
  addEdge({
    source: props.id,
    target: configNodeId,
    sourceHandle: 'right',
    targetHandle: 'left',
    type: 'promptOrder',
    data: { promptOrder: 1 }
  })

  // Force Vue Flow to recalculate node dimensions | 强制 Vue Flow 重新计算节点尺寸
  setTimeout(() => {
    updateNodeInternals(configNodeId)
  }, 50)
}
</script>

<style scoped>
.text-node-wrapper {
  position: relative;
}

.text-node {
  cursor: default;
  position: relative;
}

.text-node textarea {
  cursor: text;
}
</style>
