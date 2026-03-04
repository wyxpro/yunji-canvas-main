<template>
  <!-- Video node wrapper | 视频节点包裹层 -->
  <div class="video-node-wrapper relative">
    <!-- Video node | 视频节点 -->
    <div 
      class="video-node group bg-[var(--glass-bg)] backdrop-blur-xl rounded-2xl border border-[color:var(--glass-border)] w-[320px] relative transition-all duration-300 shadow-glass hover:shadow-neon hover:border-purple-500/30"
      :class="selected ? 'border-purple-500/50 shadow-neon' : ''"
    >
    <!-- Header | 头部 -->
    <div class="node-drag-handle px-4 py-3 border-b border-[color:var(--border-color)]">
      <div class="flex items-center justify-between gap-2">
        <span class="text-xs font-bold tracking-widest text-[var(--text-primary)] uppercase truncate">{{ data.label }}</span>
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
      <!-- Model name | 模型名称 -->
      <div v-if="data.model" class="mt-1 text-[10px] text-purple-600/80 dark:text-purple-400/70 font-mono truncate tracking-wider">
        {{ displayModelName }}
      </div>
    </div>
    
    <!-- Video preview area | 视频预览区域 -->
    <div class="p-4">
      <!-- Loading state | 加载状态 -->
      <div 
        v-if="data.loading"
        class="aspect-video rounded-xl bg-black/5 dark:bg-black/40 border border-black/10 dark:border-white/5 flex flex-col items-center justify-center gap-4 relative overflow-hidden"
      >
        <!-- Animated gradient overlay | 动画渐变遮罩 -->
        <div class="absolute inset-0 bg-gradient-to-tr from-purple-500/10 via-transparent to-blue-500/10 animate-pulse"></div>
        
        <div class="relative z-10 w-12 h-12">
           <div class="absolute inset-0 border-2 border-purple-500/30 rounded-full animate-ping"></div>
           <div class="absolute inset-2 border-2 border-purple-400 rounded-full animate-spin border-t-transparent"></div>
        </div>
        
        <span class="text-xs text-purple-600 dark:text-purple-300 font-medium relative z-10 tracking-widest animate-pulse">生成中 (~1分钟)</span>
      </div>
      <!-- Error state | 错误状态 -->
      <div 
        v-else-if="data.error"
        class="aspect-video rounded-xl bg-red-500/10 flex flex-col items-center justify-center gap-3 border border-red-500/20"
      >
        <n-icon :size="32" class="text-red-400"><CloseCircleOutline /></n-icon>
        <span class="text-xs text-red-600 dark:text-red-300 text-center px-4">{{ data.error }}</span>
      </div>
      <!-- Video preview | 视频预览 -->
      <div 
        v-else-if="data.url"
        class="aspect-video rounded-xl overflow-hidden bg-black relative"
      >
        <video 
          :src="data.url" 
          controls 
          class="w-full h-full object-contain"
          @loadedmetadata="handleLoadedMetadata"
        />

        <!-- Overlay actions (no flicker) | 悬浮操作（不闪烁） -->
        <div
          class="absolute top-2 right-2 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none group-hover:pointer-events-auto"
          @mousedown.stop
          @click.stop
        >
          <button
            @click="handleExtractTailFrame"
            :disabled="isExtractingFrame"
            class="w-9 h-9 flex items-center justify-center rounded-xl bg-white/90 dark:bg-[#0a0f1c]/85 backdrop-blur border border-black/10 dark:border-white/10 hover:border-purple-500/50 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white shadow-lg transition-all hover:scale-105 disabled:opacity-40 disabled:cursor-not-allowed"
            title="提取尾帧"
          >
            <n-icon :size="18"><ImageOutline /></n-icon>
          </button>
          <button
            @click="handlePreview"
            class="w-9 h-9 flex items-center justify-center rounded-xl bg-white/90 dark:bg-[#0a0f1c]/85 backdrop-blur border border-black/10 dark:border-white/10 hover:border-purple-500/50 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white shadow-lg transition-all hover:scale-105"
            title="预览"
          >
            <n-icon :size="18"><EyeOutline /></n-icon>
          </button>
          <button
            @click="handleDownload"
            class="w-9 h-9 flex items-center justify-center rounded-xl bg-white/90 dark:bg-[#0a0f1c]/85 backdrop-blur border border-black/10 dark:border-white/10 hover:border-purple-500/50 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white shadow-lg transition-all hover:scale-105"
            title="下载"
          >
            <n-icon :size="18"><DownloadOutline /></n-icon>
          </button>
        </div>
      </div>
      <!-- Empty state | 空状态 -->
      <div 
        v-else
        class="aspect-video rounded-xl bg-black/5 dark:bg-white/5 flex flex-col items-center justify-center gap-3 border border-dashed border-black/10 dark:border-white/10 hover:border-purple-500/50 hover:bg-black/10 dark:hover:bg-white/10 transition-all cursor-pointer relative group/upload"
      >
        <div class="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center group-hover/upload:scale-110 transition-transform">
           <n-icon :size="24" class="text-gray-500 group-hover/upload:text-purple-400 transition-colors">
            <VideocamOutline />
          </n-icon>
        </div>
        <span class="text-xs text-gray-600 dark:text-gray-500 group-hover/upload:text-gray-900 dark:group-hover/upload:text-gray-300 transition-colors">上传视频</span>
        <input 
          type="file" 
          accept="video/*" 
          class="absolute inset-0 opacity-0 cursor-pointer"
          @change="handleFileUpload"
        />
      </div>
      
      <!-- Duration info | 时长信息 -->
      <div v-if="data.duration" class="mt-3 flex items-center gap-2 text-[10px] text-gray-500 font-mono">
        <n-icon :size="12"><TimeOutline /></n-icon>
        时长: {{ formatDuration(data.duration) }}
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
 * Video node component | 视频节点组件
 * Displays and manages video content
 */
import { computed, ref } from 'vue'
import { Handle, Position, useVueFlow } from '@vue-flow/core'
import { NIcon } from 'naive-ui'
import { TrashOutline, VideocamOutline, CopyOutline, CloseCircleOutline, DownloadOutline, EyeOutline, TimeOutline, ImageOutline } from '@vicons/ionicons5'
import { addNode, updateNode, removeNode, duplicateNode, nodes, currentProjectId } from '../../stores/canvas'
import { videoModelOptions } from '../../stores/models'
import { extractVideoFrameFromUrl } from '../../utils/mediaFrames'
import { uploadFileToAliyunOssIfConfigured, uploadDataUrlToAliyunOssIfConfigured } from '../../utils/assetStorage'

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

// Frame extraction loading | 帧提取加载
const isExtractingFrame = ref(false)

// Model options | 模型选项
const modelOptions = videoModelOptions

// Friendly model display | 友好的模型名称显示
const displayModelName = computed(() => {
  const key = props.data?.model
  if (!key) return ''
  const model = modelOptions.value.find(m => m.key === key)
  return model?.label || key
})

// Handle file upload | 处理文件上传
const handleFileUpload = async (event) => {
  const file = event.target.files[0]
  if (!file) return

  try {
    // Prefer OSS when configured | 优先使用 OSS
    const uploaded = await uploadFileToAliyunOssIfConfigured(file, {
      projectId: currentProjectId.value || 'default',
      kind: 'video'
    })

    if (uploaded?.url) {
      updateNode(props.id, {
        url: uploaded.url,
        fileName: file.name,
        fileType: file.type,
        storage: 'aliyun',
        ossKey: uploaded.key,
        updatedAt: Date.now()
      })
      window.$message?.success('视频已上传到 OSS')
      return
    }

    // Fallback: local object URL | 回退：本地 objectURL
    const url = URL.createObjectURL(file)
    updateNode(props.id, {
      url,
      fileName: file.name,
      fileType: file.type,
      updatedAt: Date.now()
    })
  } catch (err) {
    console.error('Video upload error:', err)

    // Fallback: local object URL | 回退：本地 objectURL
    try {
      const url = URL.createObjectURL(file)
      updateNode(props.id, {
        url,
        fileName: file.name,
        fileType: file.type,
        updatedAt: Date.now()
      })
    } catch {
      // ignore
    }

    window.$message?.error(err?.message || '视频上传失败')
  }
}

// Format duration | 格式化时长
const formatDuration = (seconds) => {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

// Handle loaded metadata | 读取视频元信息
const handleLoadedMetadata = (e) => {
  const el = e?.target
  const dur = Number(el?.duration)
  if (Number.isFinite(dur) && dur > 0) {
    updateNode(props.id, { duration: dur })
  }
}

// Extract tail frame | 提取尾帧
const handleExtractTailFrame = async () => {
  const url = props.data?.url
  if (!url) return
  if (isExtractingFrame.value) return

  isExtractingFrame.value = true
  try {
    window.$message?.info('正在提取尾帧...')

    const frame = await extractVideoFrameFromUrl(url, {
      at: 'end',
      maxWidth: 768,
      maxHeight: 768,
      mimeType: 'image/jpeg',
      quality: 0.86,
      endOffset: 0.15
    })

    const currentNode = nodes.value.find(n => n.id === props.id)
    const nodeX = currentNode?.position?.x || 0
    const nodeY = currentNode?.position?.y || 0

    // Create placeholder node (avoid persisting huge dataUrl when OSS is enabled)
    const imageNodeId = addNode('image', { x: nodeX + 360, y: nodeY }, {
      url: '',
      loading: true,
      label: '尾帧上传中...',
      sourceVideoId: props.id,
      sourceVideoTime: frame.time,
      sourceVideoDuration: frame.duration
    })

    let finalUrl = frame.dataUrl
    let storage = 'data'
    let ossKey = ''

    try {
      const uploaded = await uploadDataUrlToAliyunOssIfConfigured(frame.dataUrl, {
        projectId: currentProjectId.value || 'default',
        kind: 'frame',
        filenameBase: 'tail_frame'
      })

      if (uploaded?.url) {
        finalUrl = uploaded.url
        storage = 'aliyun'
        ossKey = uploaded.key
      }
    } catch (e) {
      // OSS failed, fallback to data URL
      window.$message?.warning('OSS 上传失败，已使用本地尾帧')
    }

    // Update extracted frame node
    updateNode(imageNodeId, {
      url: finalUrl,
      loading: false,
      label: '尾帧',
      storage,
      ...(ossKey ? { ossKey } : {}),
      updatedAt: Date.now()
    })

    // Store a thumbnail on the video node for project previews
    updateNode(props.id, {
      thumbnail: finalUrl,
      duration: frame.duration || props.data?.duration || 0,
      ...(ossKey ? { thumbnailOssKey: ossKey } : {}),
      updatedAt: Date.now()
    })

    setTimeout(() => {
      updateNodeInternals(imageNodeId)
    }, 50)

    window.$message?.success('已提取尾帧')
  } catch (err) {
    window.$message?.error(err?.message || '提取尾帧失败')
  } finally {
    isExtractingFrame.value = false
  }
}

// Handle delete | 处理删除
const handleDelete = () => {
  removeNode(props.id)
}

// Handle preview | 处理预览
const handlePreview = () => {
  if (props.data.url) {
    window.open(props.data.url, '_blank')
  }
}

// Handle download | 处理下载
const handleDownload = () => {
  if (props.data.url) {
    const link = document.createElement('a')
    link.href = props.data.url
    link.download = props.data.fileName || `video_${Date.now()}.mp4`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.$message?.success('视频下载中...')
  }
}

// Handle duplicate | 处理复制
const handleDuplicate = () => {
  const newId = duplicateNode(props.id)
  if (newId) {
    window.$message?.success('节点已复制')
  }
}
</script>

<style scoped>
.video-node-wrapper {
  position: relative;
}

.video-node {
  cursor: default;
}
</style>
