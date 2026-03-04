<template>
  <!-- Frame / Shot container node | 镜头/画框容器节点 -->
  <div
    class="frame-node relative rounded-[28px] border border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.02] shadow-[0_25px_80px_rgba(2,6,23,0.18)] dark:shadow-[0_25px_80px_rgba(0,0,0,0.45)]"
    :class="selected ? 'ring-1 ring-purple-500/40 border-purple-500/30' : ''"
    :style="{ width: `${w}px`, height: `${h}px` }"
  >
    <!-- Background glow | 背景光晕 -->
    <div class="absolute inset-0 rounded-[28px] pointer-events-none">
      <div class="absolute inset-0 rounded-[28px] bg-gradient-to-br from-purple-500/10 via-transparent to-blue-500/10"></div>
      <div class="absolute inset-0 rounded-[28px] ring-1 ring-black/5 dark:ring-white/5"></div>
    </div>

    <!-- Header (drag handle) | 头部（拖拽区域） -->
    <div
      class="frame-drag-handle relative z-10 h-10 px-3 flex items-center justify-between select-none"
    >
      <div class="flex items-center gap-2 min-w-0">
        <div class="w-2 h-2 rounded-full bg-purple-400/90 shadow-[0_0_18px_rgba(168,85,247,0.35)]"></div>
        <span class="text-[11px] font-extrabold tracking-[0.22em] text-gray-700 dark:text-gray-300 uppercase truncate">
          {{ data?.label || '镜头' }}
        </span>
      </div>

      <div class="flex items-center gap-1.5">
        <button
          @click.stop="handleDuplicate"
          class="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          title="复制画框"
        >
          <n-icon :size="14"><CopyOutline /></n-icon>
        </button>
        <button
          @click.stop="handleDelete"
          class="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
          title="删除画框"
        >
          <n-icon :size="14"><TrashOutline /></n-icon>
        </button>
      </div>
    </div>

    <!-- Footer note | 备注 -->
    <div class="absolute left-3 bottom-3 right-10 z-10">
      <div class="text-[10px] text-gray-500/90 leading-relaxed line-clamp-2">
        {{ data?.note || '用于分镜/镜头分组（可拖拽框选后成组）' }}
      </div>
    </div>

    <!-- Resizer handle | 缩放拖拽点 -->
    <div
      class="absolute right-3 bottom-3 z-20 w-6 h-6 rounded-xl bg-white/90 dark:bg-[#0a0f1c]/85 backdrop-blur border border-black/10 dark:border-white/10 hover:border-purple-500/50 shadow-lg flex items-center justify-center cursor-nwse-resize nodrag"
      @pointerdown.stop.prevent="onResizeStart"
      title="调整大小"
    >
      <div class="w-3 h-3 opacity-80 bg-[linear-gradient(135deg,transparent_0_45%,rgba(15,23,42,.45)_45%_55%,transparent_55%_100%)] dark:bg-[linear-gradient(135deg,transparent_0_45%,rgba(255,255,255,.55)_45%_55%,transparent_55%_100%)]"></div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useVueFlow } from '@vue-flow/core'
import { NIcon } from 'naive-ui'
import { TrashOutline, CopyOutline } from '@vicons/ionicons5'
import { updateNode, removeNode, duplicateNode } from '../../stores/canvas'

const props = defineProps({
  id: String,
  data: Object,
  selected: Boolean
})

const { updateNodeInternals } = useVueFlow()

const w = computed(() => Number(props.data?.w || 720))
const h = computed(() => Number(props.data?.h || 460))

// Duplicate | 复制
const handleDuplicate = () => {
  const newId = duplicateNode(props.id)
  if (newId) window.$message?.success('画框已复制')
}

// Delete | 删除
const handleDelete = () => {
  removeNode(props.id)
}

// Resize logic | 调整大小逻辑
const isResizing = ref(false)
const start = ref({ x: 0, y: 0, w: 0, h: 0 })

const onResizeStart = (e) => {
  isResizing.value = true
  start.value = { x: e.clientX, y: e.clientY, w: w.value, h: h.value }

  const onMove = (ev) => {
    if (!isResizing.value) return
    const dx = ev.clientX - start.value.x
    const dy = ev.clientY - start.value.y

    const nextW = Math.max(360, Math.round(start.value.w + dx))
    const nextH = Math.max(240, Math.round(start.value.h + dy))

    updateNode(props.id, { w: nextW, h: nextH })
    // keep internals in sync during resize
    updateNodeInternals(props.id)
  }

  const onUp = () => {
    isResizing.value = false
    window.removeEventListener('pointermove', onMove)
    window.removeEventListener('pointerup', onUp)
  }

  window.addEventListener('pointermove', onMove)
  window.addEventListener('pointerup', onUp)
}
</script>

<style scoped>
.frame-node {
  cursor: default;
}

.frame-drag-handle {
  cursor: grab;
}

.frame-node:active .frame-drag-handle {
  cursor: grabbing;
}
</style>
