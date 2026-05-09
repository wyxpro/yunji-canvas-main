<template>
  <!-- Image node wrapper | 图片节点包裹层 -->
  <div class="image-node-wrapper">
    <!-- Image node | 图片节点 -->
    <div
      class="image-node group bg-[var(--glass-bg)] backdrop-blur-xl rounded-2xl border border-[color:var(--glass-border)] w-[280px] relative transition-all duration-300 shadow-glass hover:shadow-neon hover:border-purple-500/30"
      :class="selected ? 'border-purple-500/50 shadow-neon' : ''">
      <!-- Header | 头部 -->
      <div class="node-drag-handle px-4 py-3 border-b border-[color:var(--border-color)]">
        <div class="flex items-center justify-between gap-2">
          <span class="text-xs font-bold tracking-widest text-[var(--text-primary)] uppercase truncate">{{ data.label || '生成图像' }}</span>
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

      <!-- Image preview area | 图片预览区域 -->
      <div class="p-4">
        <!-- Loading state | 加载状态 -->
        <div v-if="data.loading"
          class="aspect-square rounded-xl bg-black/5 dark:bg-black/40 border border-black/10 dark:border-white/5 flex flex-col items-center justify-center gap-4 relative overflow-hidden">
          <!-- Animated gradient overlay | 动画渐变遮罩 -->
          <div
            class="absolute inset-0 bg-gradient-to-tr from-purple-500/10 via-transparent to-blue-500/10 animate-pulse">
          </div>
          
          <div class="relative z-10 w-12 h-12">
             <div class="absolute inset-0 border-2 border-purple-500/30 rounded-full animate-ping"></div>
             <div class="absolute inset-2 border-2 border-purple-400 rounded-full animate-spin border-t-transparent"></div>
          </div>

          <span class="text-xs text-purple-600 dark:text-purple-300 font-medium relative z-10 tracking-widest animate-pulse">生成中</span>
        </div>

        <!-- Error state | 错误状态 -->
        <div v-else-if="data.error"
          class="aspect-square rounded-xl bg-red-50 dark:bg-red-900/20 flex flex-col items-center justify-center gap-2 border border-red-200 dark:border-red-800">
          <n-icon :size="32" class="text-red-500">
            <CloseCircleOutline />
          </n-icon>
          <span class="text-sm text-red-600 dark:text-red-400 text-center px-2">{{ data.error }}</span>
        </div>

        <!-- Image display | 图片显示 -->
        <div 
          v-else-if="data.url" 
          class="rounded-xl overflow-hidden relative" 
          ref="imageContainerRef"
        >
          <img 
            :src="data.url" 
            :alt="data.label" 
            class="w-full h-auto object-cover"
            :class="{ 'pointer-events-none': isInpaintMode }"
          />

          <!-- Overlay actions (no flicker) | 悬浮操作（不闪烁） -->
          <div
            v-if="!isInpaintMode"
            class="absolute top-2 right-2 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none group-hover:pointer-events-auto"
            @mousedown.stop
            @click.stop
          >
            <button
              @click="handleImageGen"
              class="w-9 h-9 flex items-center justify-center rounded-xl bg-white/90 dark:bg-[#0a0f1c]/85 backdrop-blur border border-black/10 dark:border-white/10 hover:border-purple-500/50 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white shadow-lg transition-all hover:scale-105"
              title="图生图"
            >
              <n-icon :size="18"><ImageOutline /></n-icon>
            </button>
            <button
              @click="handleVideoGen"
              class="w-9 h-9 flex items-center justify-center rounded-xl bg-white/90 dark:bg-[#0a0f1c]/85 backdrop-blur border border-black/10 dark:border-white/10 hover:border-purple-500/50 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white shadow-lg transition-all hover:scale-105"
              title="图生视频"
            >
              <n-icon :size="18"><VideocamOutline /></n-icon>
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
          
          <!-- Inpaint canvas with events | 涂抹画布（带事件） -->
          <canvas 
            v-if="isInpaintMode"
            ref="canvasRef"
            class="absolute inset-0 w-full h-full cursor-none z-10"
            @mousedown.stop.prevent="onCanvasPaint"
            @mousemove.stop="onCanvasMove"
            @mouseup.stop="onPaintEnd"
            @mouseleave="onPaintEnd"
          />
          
          <!-- Brush cursor | 画笔光标 -->
          <div 
            v-show="brushCursor.visible && isInpaintMode"
            class="absolute pointer-events-none border-2 border-purple-500 rounded-full bg-purple-400/30 transition-none"
            :style="{
              width: brushSize * 2 + 'px',
              height: brushSize * 2 + 'px',
              left: brushCursor.x - brushSize + 'px',
              top: brushCursor.y - brushSize + 'px'
            }"
          />
          
          <!-- Inpaint toolbar | 涂抹工具栏 -->
          <div 
            v-show="isInpaintMode"
            class="absolute top-1.5 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-2 py-1 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm rounded-full shadow-md border border-gray-200/80 dark:border-gray-700 z-[9999]"
            @mousedown.stop
            @click.stop
          >
            <!-- Mode indicator | 模式指示 -->
            <div class="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 pr-1.5 border-r border-gray-200 dark:border-gray-600">
              <n-icon :size="12"><BrushOutline /></n-icon>
              <span>擦除</span>
            </div>
            
            <!-- Size slider | 大小滑块 -->
            <div class="flex items-center gap-1 w-16">
              <div class="w-1.5 h-1.5 rounded-full bg-purple-400"></div>
              <input 
                type="range" 
                v-model="brushSize" 
                min="10" 
                max="80" 
                class="w-full h-0.5 bg-gray-200 rounded-lg appearance-none cursor-pointer slider-purple"
              />
              <div class="w-2.5 h-2.5 rounded-full bg-purple-400"></div>
            </div>
            
            <!-- Reset button | 重置按钮 -->
            <button 
              @click="clearMask"
              class="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
              title="清除"
            >
              <n-icon :size="12" class="text-gray-400"><RefreshOutline /></n-icon>
            </button>
            
            <!-- Apply button | 应用按钮 -->
            <button 
              @click="applyInpaint"
              class="px-2 py-0.5 bg-purple-500 hover:bg-purple-600 text-white text-xs rounded transition-colors"
            >
              应用
            </button>
          </div>
        </div>

        <!-- Upload placeholder | 上传占位 -->
        <div v-else
          class="aspect-square rounded-xl bg-black/5 dark:bg-white/5 flex flex-col items-center justify-center gap-3 border border-dashed border-black/10 dark:border-white/10 hover:border-purple-500/50 hover:bg-black/10 dark:hover:bg-white/10 transition-all cursor-pointer relative group/upload">
          <div class="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center group-hover/upload:scale-110 transition-transform">
             <n-icon :size="24" class="text-gray-500 group-hover/upload:text-purple-400 transition-colors">
              <ImageOutline />
            </n-icon>
          </div>
          <span class="text-xs text-gray-600 dark:text-gray-500 group-hover/upload:text-gray-900 dark:group-hover/upload:text-gray-300 transition-colors">上传图片</span>
          <input type="file" accept="image/*" class="absolute inset-0 opacity-0 cursor-pointer"
            @change="handleFileUpload" />
        </div>
      </div>

      <!-- Handles | 连接点 -->
      <Handle type="source" :position="Position.Right" id="right" :connectable="connectable" class="!w-3 !h-3 !bg-purple-500 !border-2 !border-[color:var(--bg-secondary)]" />
      <Handle type="target" :position="Position.Left" id="left" :connectable="connectable" class="!w-3 !h-3 !bg-purple-500 !border-2 !border-[color:var(--bg-secondary)]" />
    </div>

    <Teleport to="body">
      <div
        v-if="showPreview && data.url"
        class="fixed inset-0 z-[10000] bg-black/85 flex items-center justify-center p-6"
        @click="closePreview"
      >
        <button
          class="absolute right-5 top-5 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
          title="关闭"
          @click.stop="closePreview"
        >
          <n-icon :size="22"><CloseCircleOutline /></n-icon>
        </button>
        <img
          :src="data.url"
          :alt="data.label || '图片预览'"
          class="max-w-full max-h-full object-contain rounded-xl shadow-2xl"
          @click.stop
        />
      </div>
    </Teleport>

  </div>
</template>

<script setup>
/**
 * Image node component | 图片节点组件
 * Displays and manages image content with loading state
 */
import { ref, nextTick, computed } from 'vue'
import { Handle, Position, useVueFlow } from '@vue-flow/core'
import { NIcon } from 'naive-ui'
import { TrashOutline, ImageOutline, CloseCircleOutline, CopyOutline, VideocamOutline, DownloadOutline, EyeOutline, BrushOutline, RefreshOutline } from '@vicons/ionicons5'
import { updateNode, removeNode, duplicateNode, addNode, addEdge, nodes, currentProjectId } from '../../stores/canvas'
import { imageModelOptions } from '../../stores/models'
import { uploadFileToAliyunOssIfConfigured } from '../../utils/assetStorage'
import { downloadImageForCanvas } from '../../utils/localDownload'

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

// Model options | 模型选项
const modelOptions = imageModelOptions

// Friendly model display | 友好的模型名称显示
const displayModelName = computed(() => {
  const key = props.data?.model
  if (!key) return ''
  const model = modelOptions.value.find(m => m.key === key)
  return model?.label || key
})

// Inpainting state | 涂抹重绘状态
const isInpaintMode = ref(false)
const brushSize = ref(40)
const isDrawing = ref(false)
const canvasRef = ref(null)
const imageContainerRef = ref(null)
const brushCursor = ref({ x: 0, y: 0, visible: false })
const maskData = ref(null)
const showPreview = ref(false)

// Toggle inpaint mode | 切换涂抹模式
const toggleInpaintMode = () => {
  isInpaintMode.value = !isInpaintMode.value
  if (isInpaintMode.value) {
    nextTick(() => initCanvas())
  } else {
    clearMask()
  }
}

// Initialize canvas | 初始化画布
const initCanvas = () => {
  setTimeout(() => {
    const canvas = canvasRef.value
    if (!canvas) return
    
    // Set canvas internal size to match its CSS rendered size | 设置画布内部尺寸匹配 CSS 渲染尺寸
    // clientWidth/clientHeight give the CSS box size
    canvas.width = canvas.clientWidth
    canvas.height = canvas.clientHeight
    
    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, canvas.width, canvas.height)
  }, 100)
}

// Ensure canvas size matches display | 确保画布尺寸匹配显示
const syncCanvasSize = () => {
  const canvas = canvasRef.value
  if (!canvas) return
  if (canvas.width !== canvas.clientWidth || canvas.height !== canvas.clientHeight) {
    canvas.width = canvas.clientWidth
    canvas.height = canvas.clientHeight
  }
}

// Canvas paint handlers | 画布绘制处理器
const onCanvasPaint = (e) => {
  syncCanvasSize()
  isDrawing.value = true
  paintAt(e.offsetX, e.offsetY)
  brushCursor.value = { x: e.offsetX, y: e.offsetY, visible: true }
}

const onCanvasMove = (e) => {
  brushCursor.value = { x: e.offsetX, y: e.offsetY, visible: true }
  if (isDrawing.value) {
    paintAt(e.offsetX, e.offsetY)
  }
}

const onPaintEnd = () => {
  isDrawing.value = false
  brushCursor.value.visible = false
}

// Paint at coordinates | 在坐标绘制
const paintAt = (x, y) => {
  const canvas = canvasRef.value
  if (!canvas) return
  
  const ctx = canvas.getContext('2d')
  ctx.beginPath()
  ctx.arc(x, y, brushSize.value, 0, Math.PI * 2)
  ctx.fillStyle = 'rgba(139, 92, 246, 0.5)'
  ctx.fill()
}

// Hide brush cursor | 隐藏画笔光标
const hideBrushCursor = () => {
  brushCursor.value.visible = false
}

// Clear mask | 清除蒙版
const clearMask = () => {
  const canvas = canvasRef.value
  if (!canvas) return
  
  const ctx = canvas.getContext('2d')
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  maskData.value = null
}

// Apply inpaint and create workflow | 应用重绘并创建工作流
const applyInpaint = () => {
  const canvas = canvasRef.value
  if (!canvas || canvas.width === 0 || canvas.height === 0) {
    window.$message?.error('画布未初始化')
    return
  }
  
  // Get the original image and resize mask to match | 获取原图并调整蒙版大小匹配
  const container = imageContainerRef.value
  const img = container?.querySelector('img')
  if (!img) {
    window.$message?.error('未找到图片')
    return
  }
  
  // Create mask at original image resolution | 创建原图分辨率的蒙版
  const maskCanvas = document.createElement('canvas')
  const imgWidth = img.naturalWidth || img.width
  const imgHeight = img.naturalHeight || img.height
  maskCanvas.width = imgWidth
  maskCanvas.height = imgHeight
  const maskCtx = maskCanvas.getContext('2d')
  
  // Fill black background | 填充黑色背景
  maskCtx.fillStyle = '#000000'
  maskCtx.fillRect(0, 0, maskCanvas.width, maskCanvas.height)
  
  // Scale factor from display to original | 从显示尺寸到原图的缩放因子
  const scaleX = imgWidth / canvas.width
  const scaleY = imgHeight / canvas.height
  
  // Get painted areas and scale to original resolution | 获取绑制区域并缩放到原图分辨率
  const originalData = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height)
  
  // Draw scaled white areas on mask | 在蒙版上绘制缩放后的白色区域
  maskCtx.fillStyle = '#FFFFFF'
  for (let y = 0; y < canvas.height; y++) {
    for (let x = 0; x < canvas.width; x++) {
      const i = (y * canvas.width + x) * 4
      if (originalData.data[i + 3] > 0) {
        // Scale and draw | 缩放并绘制
        maskCtx.fillRect(
          Math.floor(x * scaleX),
          Math.floor(y * scaleY),
          Math.ceil(scaleX),
          Math.ceil(scaleY)
        )
      }
    }
  }
  
  // Convert to base64 (remove data URL prefix for API) | 转换为 base64（移除前缀用于 API）
  const dataUrl = maskCanvas.toDataURL('image/png')
  const base64Data = dataUrl.replace(/^data:image\/\w+;base64,/, '')
  maskData.value = base64Data
  
  // Create inpaint workflow | 创建重绘工作流
  createInpaintWorkflow()
}

// Create inpaint workflow | 创建重绘工作流
const createInpaintWorkflow = () => {
  const currentNode = nodes.value.find(n => n.id === props.id)
  const nodeX = currentNode?.position?.x || 0
  const nodeY = currentNode?.position?.y || 0
  
  // Create text node for prompt | 创建文本节点用于提示词
  const textNodeId = addNode('text', { x: nodeX + 300, y: nodeY - 100 }, {
    content: '请输入重绘提示词...',
    label: '重绘提示词'
  })
  
  // Create imageConfig node for inpainting | 创建图生图配置节点
  const inpaintConfigData = {
    label: '局部重绘',
    inpaintMode: true
  }

  // If the source image node has a model set, reuse it by default (not hardcoded)
  if (props.data?.model) {
    inpaintConfigData.model = props.data.model
  }

  const configNodeId = addNode('imageConfig', { x: nodeX + 600, y: nodeY }, inpaintConfigData)
  
  // Update current node with mask data | 更新当前节点的蒙版数据
  updateNode(props.id, {
    maskData: maskData.value,
    hasInpaintMask: true
  })
  
  // Connect image node to config node | 连接图片节点到配置节点
  addEdge({
    source: props.id,
    target: configNodeId,
    sourceHandle: 'right',
    targetHandle: 'left'
  })
  
  // Connect text node to config node | 连接文本节点到配置节点
  addEdge({
    source: textNodeId,
    target: configNodeId,
    sourceHandle: 'right',
    targetHandle: 'left'
  })
  
  // Exit inpaint mode | 退出涂抹模式
  isInpaintMode.value = false
  
  // Force Vue Flow to recalculate | 强制重新计算
  setTimeout(() => {
    updateNodeInternals([textNodeId, configNodeId])
  }, 50)
  
  window.$message?.success('已创建局部重绘工作流')
}

// Convert file to base64 | 将文件转换为 base64
const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

// Handle file upload | 处理文件上传
const handleFileUpload = async (event) => {
  const file = event.target.files[0]
  if (file) {
    try {
      let uploaded = null
      try {
        // Prefer OSS when configured | 优先使用 OSS
        uploaded = await uploadFileToAliyunOssIfConfigured(file, {
          projectId: currentProjectId.value || 'default',
          kind: 'image'
        })
      } catch (e) {
        console.warn('OSS upload failed, fallback to data URL:', e)
        window.$message?.warning('OSS 上传失败，已使用本地图片')
      }

      if (uploaded?.url) {
        updateNode(props.id, {
          url: uploaded.url,
          fileName: file.name,
          fileType: file.type,
          label: '参考图',
          storage: 'aliyun',
          ossKey: uploaded.key,
          updatedAt: Date.now()
        })
        return
      }

      // Fallback: store as data URL (base64) | 回退：使用 dataURL（base64）存储
      // NOTE: do not duplicate into another `base64` field, it explodes localStorage size.
      const base64 = await fileToBase64(file)
      updateNode(props.id, {
        url: base64,
        fileName: file.name,
        fileType: file.type,
        label: '参考图',
        updatedAt: Date.now()
      })
    } catch (err) {
      console.error('File upload error:', err)
      window.$message?.error(err?.message || '图片上传失败')
    }
  }
}

// Handle delete | 处理删除
const handleDelete = () => {
  removeNode(props.id)
}

// Handle duplicate | 处理复制
const handleDuplicate = () => {
  const newId = duplicateNode(props.id)
  if (newId) {
    window.$message?.success('节点已复制')
    setTimeout(() => {
      updateNodeInternals(newId)
    }, 50)
  }
}

// Handle image generation | 处理图片生图
const handleImageGen = () => {
  const currentNode = nodes.value.find(n => n.id === props.id)
  const nodeX = currentNode?.position?.x || 0
  const nodeY = currentNode?.position?.y || 0

  // Create text node for prompt | 创建文本节点用于提示词
  const textNodeId = addNode('text', { x: nodeX + 300, y: nodeY - 100 }, {
    content: '',
    label: '提示词'
  })

  // Create imageConfig node | 创建文生图配置节点
  const imageGenConfigData = {
    label: '图生图'
  }

  // If the source image node has a model set, reuse it by default (not hardcoded)
  if (props.data?.model) {
    imageGenConfigData.model = props.data.model
  }

  const configNodeId = addNode('imageConfig', { x: nodeX + 600, y: nodeY }, imageGenConfigData)

  // Connect image node to config node | 连接图片节点到配置节点
  addEdge({
    source: props.id,
    target: configNodeId,
    sourceHandle: 'right',
    targetHandle: 'left'
  })

  // Connect text node to config node | 连接文本节点到配置节点
  addEdge({
    source: textNodeId,
    target: configNodeId,
    sourceHandle: 'right',
    targetHandle: 'left'
  })

  // Force Vue Flow to recalculate node dimensions | 强制 Vue Flow 重新计算节点尺寸
  setTimeout(() => {
    updateNodeInternals([textNodeId, configNodeId])
  }, 50)
}

// Handle preview | 处理预览
const handlePreview = () => {
  if (props.data.url) {
    showPreview.value = true
  }
}

const closePreview = () => {
  showPreview.value = false
}

// Handle download | 处理下载
const handleDownload = () => {
  if (props.data.url) {
    downloadImageForCanvas(props.data.sourceUrl || props.data.url, {
      fileNameBase: props.data.fileName || `image_${Date.now()}`
    })
      .then((downloadedImage) => {
        updateNode(props.id, {
          url: downloadedImage.url,
          sourceUrl: downloadedImage.sourceUrl,
          fileName: downloadedImage.fileName,
          localFileName: downloadedImage.fileName,
          downloadStatus: downloadedImage.downloadStatus,
          downloadError: downloadedImage.downloadError || '',
          downloadedAt: downloadedImage.downloadedAt,
          updatedAt: Date.now()
        })
        window.$message?.success('图片下载中...')
      })
      .catch((err) => {
        window.$message?.error(err?.message || '图片下载失败')
      })
  }
}

// Handle video generation | 处理视频生成
const handleVideoGen = () => {
  const currentNode = nodes.value.find(n => n.id === props.id)
  const nodeX = currentNode?.position?.x || 0
  const nodeY = currentNode?.position?.y || 0

  // Create text node for prompt | 创建文本节点用于提示词
  const textNodeId = addNode('text', { x: nodeX + 300, y: nodeY - 100 }, {
    content: '',
    label: '提示词'
  })

  // Create videoConfig node | 创建视频配置节点
  const configNodeId = addNode('videoConfig', { x: nodeX + 600, y: nodeY }, {
    label: '视频生成'
  })

  // Connect image node to config node with role | 连接图片节点到配置节点并设置角色
  addEdge({
    source: props.id,
    target: configNodeId,
    sourceHandle: 'right',
    targetHandle: 'left',
    type: 'imageRole',
    data: { imageRole: 'first_frame_image' } // Default to first frame | 默认首帧
  })

  // Connect text node to config node | 连接文本节点到配置节点
  addEdge({
    source: textNodeId,
    target: configNodeId,
    sourceHandle: 'right',
    targetHandle: 'left'
  })

  // Force Vue Flow to recalculate node dimensions | 强制 Vue Flow 重新计算节点尺寸
  setTimeout(() => {
    updateNodeInternals([textNodeId, configNodeId])
  }, 50)
}
</script>

<style scoped>
.image-node-wrapper {
  position: relative;
}

.image-node {
  cursor: default;
  position: relative;
}

/* Slider styling | 滑块样式 */
.slider-purple::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #8b5cf6;
  cursor: pointer;
  border: 2px solid white;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}

.slider-purple::-moz-range-thumb {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #8b5cf6;
  cursor: pointer;
  border: 2px solid white;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}

/* Inpaint mode cursor | 涂抹模式光标 */
.cursor-none {
  cursor: none;
}
</style>
