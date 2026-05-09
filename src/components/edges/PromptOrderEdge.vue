<template>
  <!-- Custom edge with prompt order selector | 带提示词顺序选择器的自定义边 -->
  <BaseEdge :path="path" :style="edgeStyle" />
  
  <!-- Edge label with order selector | 带顺序选择器的边标签 -->
  <EdgeLabelRenderer>
    <div 
      :style="{ 
        position: 'absolute', 
        transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
        pointerEvents: 'all'
      }"
      class="nodrag nopan flex items-center gap-1"
      @mouseenter="showDelete = true"
      @mouseleave="showDelete = false"
    >
      <n-dropdown 
        :options="orderOptions" 
        @select="handleOrderSelect"
        size="small"
      >
        <button 
          class="flex items-center justify-center w-6 h-6 text-[10px] font-bold rounded-full bg-emerald-500 text-white border-2 border-[color:var(--bg-secondary)] shadow-sm transition-colors hover:bg-emerald-400"
        >
          {{ currentOrder }}
        </button>
      </n-dropdown>
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
import { NDropdown, NIcon } from 'naive-ui'
import { CloseOutline } from '@vicons/ionicons5'
import { edges, removeEdge, updateEdge } from '../../stores/canvas'

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

// Order labels | 顺序标签
const orderLabels = [
  { label: '① 第一个', key: 1 },
  { label: '② 第二个', key: 2 },
  { label: '③ 第三个', key: 3 },
  { label: '④ 第四个', key: 4 },
  { label: '⑤ 第五个', key: 5 }
]

// Dynamic order options based on connected edges count | 基于连接边数量的动态顺序选项
const orderOptions = computed(() => {
  // Get all promptOrder edges connected to the same target | 获取连接到同一目标的所有文本边
  const sameTargetTextEdges = edges.value.filter(edge => 
    edge.target === props.target && 
    edge.type === 'promptOrder'
  )
  const count = sameTargetTextEdges.length || 1
  return orderLabels.slice(0, count)
})

// Current order from edge data | 从边数据获取当前顺序
const currentOrder = computed(() => props.data?.promptOrder || 1)

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
  stroke: '#10b981',
  strokeWidth: 2,
  ...props.style
}))

// Handle order selection | 处理顺序选择
const handleOrderSelect = (newOrder) => {
  // Get all text edges connected to the same target | 获取连接到同一目标的所有文本边
  const sameTargetTextEdges = edges.value.filter(edge => 
    edge.target === props.target && 
    edge.type === 'promptOrder'
  )
  
  // Find edge currently using this order | 查找当前使用此顺序的边
  const edgeWithSameOrder = sameTargetTextEdges.find(edge => 
    edge.id !== props.id && 
    edge.data?.promptOrder === newOrder
  )
  
  // If another edge has this order, swap with current | 如果另一条边有此顺序，则交换
  if (edgeWithSameOrder) {
    updateEdge(edgeWithSameOrder.id, { promptOrder: currentOrder.value })
  }
  
  // Update current edge order | 更新当前边顺序
  updateEdge(props.id, { promptOrder: newOrder })
}

// Handle delete | 处理删除
const handleDelete = () => {
  removeEdge(props.id)
  window.$message?.success('连线已删除')
}
</script>
