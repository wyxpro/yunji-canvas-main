<template>
  <!-- Default edge with delete button | 带删除按钮的默认边 -->
  <BaseEdge :path="path" :style="edgeStyle" />
  
  <!-- Edge label with delete button | 带删除按钮的边标签 -->
  <EdgeLabelRenderer>
    <div 
      :style="{ 
        position: 'absolute', 
        transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
        pointerEvents: 'all'
      }"
      class="nodrag nopan w-5 h-5 flex items-center justify-center"
      @mouseenter="showDelete = true"
      @mouseleave="showDelete = false"
    >
      <!-- Delete button | 删除按钮 -->
      <button 
        v-show="showDelete"
        @click="handleDelete"
        class="w-5 h-5 flex items-center justify-center rounded-full bg-red-500/80 hover:bg-red-500 text-white transition-colors"
        title="删除连线"
      >
        <n-icon :size="10"><CloseOutline /></n-icon>
      </button>
    </div>
  </EdgeLabelRenderer>
</template>

<script setup>
import { ref, computed } from 'vue'
import { BaseEdge, EdgeLabelRenderer, getBezierPath } from '@vue-flow/core'
import { NIcon } from 'naive-ui'
import { CloseOutline } from '@vicons/ionicons5'
import { removeEdge } from '../../stores/canvas'

// Delete button visibility | 删除按钮可见性
const showDelete = ref(false)

const props = defineProps({
  id: String,
  source: String,
  target: String,
  sourceX: Number,
  sourceY: Number,
  targetX: Number,
  targetY: Number,
  sourcePosition: String,
  targetPosition: String,
  data: Object,
  markerEnd: String,
  style: Object
})

// Calculate bezier path | 计算贝塞尔路径
const path = computed(() => {
  const [edgePath] = getBezierPath({
    sourceX: props.sourceX,
    sourceY: props.sourceY,
    targetX: props.targetX,
    targetY: props.targetY,
    sourcePosition: props.sourcePosition,
    targetPosition: props.targetPosition
  })
  return edgePath
})

// Label position (center of edge) | 标签位置（边的中心）
const labelX = computed(() => (props.sourceX + props.targetX) / 2)
const labelY = computed(() => (props.sourceY + props.targetY) / 2)

// Edge style | 边样式
const edgeStyle = computed(() => ({
  stroke: '#6366f1',
  strokeWidth: 2,
  ...props.style
}))

// Handle delete | 处理删除
const handleDelete = () => {
  removeEdge(props.id)
  window.$message?.success('连线已删除')
}
</script>
