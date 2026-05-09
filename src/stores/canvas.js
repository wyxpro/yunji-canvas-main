/**
 * Canvas store | 画布状态管理
 * Manages nodes, edges and canvas state
 */
import { ref } from 'vue'
import { updateProjectCanvas, getProjectCanvas } from './projects'
import {
  DEFAULT_IMAGE_MODEL,
  DEFAULT_VIDEO_MODEL,
  DEFAULT_IMAGE_SIZE,
  DEFAULT_VIDEO_RATIO,
  DEFAULT_VIDEO_DURATION
} from '@/config/models'

// Node ID counter | 节点ID计数器
let nodeId = 0
const getNodeId = () => `node_${nodeId++}`

// Current project ID | 当前项目ID
export const currentProjectId = ref(null)

// Nodes and edges | 节点和边
export const nodes = ref([])
export const edges = ref([])

const INPUT_EDGE_TYPES = {
  PROMPT_ORDER: 'promptOrder',
  IMAGE_ORDER: 'imageOrder',
  IMAGE_ROLE: 'imageRole'
}

const normalizeHandle = (handle, fallback) => handle || fallback

const getNodeById = (id) => nodes.value.find(node => node.id === id)

const getEdgeTypeForConnection = (sourceNode, targetNode) => {
  if (!sourceNode || !targetNode) return 'default'

  if (
    sourceNode.type === 'text' &&
    ['imageConfig', 'videoConfig', 'storyboardPlan'].includes(targetNode.type)
  ) {
    return INPUT_EDGE_TYPES.PROMPT_ORDER
  }

  if (sourceNode.type === 'image' && targetNode.type === 'imageConfig') {
    return INPUT_EDGE_TYPES.IMAGE_ORDER
  }

  if (sourceNode.type === 'image' && targetNode.type === 'videoConfig') {
    return INPUT_EDGE_TYPES.IMAGE_ROLE
  }

  return 'default'
}

const makeEdgeId = (edge) => {
  const sourceHandle = normalizeHandle(edge.sourceHandle, 'right')
  const targetHandle = normalizeHandle(edge.targetHandle, 'left')
  const type = edge.type || 'default'
  return `edge_${edge.source}_${sourceHandle}_${edge.target}_${targetHandle}_${type}`
}

const findDuplicateEdge = (nextEdge) => {
  const sourceHandle = normalizeHandle(nextEdge.sourceHandle, 'right')
  const targetHandle = normalizeHandle(nextEdge.targetHandle, 'left')

  return edges.value.find(edge =>
    edge.source === nextEdge.source &&
    edge.target === nextEdge.target &&
    normalizeHandle(edge.sourceHandle, 'right') === sourceHandle &&
    normalizeHandle(edge.targetHandle, 'left') === targetHandle
  )
}

const normalizeOrderedEdges = (targetId, type, orderKey) => {
  const orderedEdges = edges.value
    .filter(edge => edge.target === targetId && edge.type === type)
    .map((edge, index) => ({ edge, index }))
    .sort((a, b) => {
      const aOrder = Number(a.edge.data?.[orderKey] || 0)
      const bOrder = Number(b.edge.data?.[orderKey] || 0)
      if (aOrder !== bOrder) return aOrder - bOrder
      return a.index - b.index
    })

  if (!orderedEdges.length) return

  edges.value = edges.value.map(edge => {
    const orderedIndex = orderedEdges.findIndex(item => item.edge.id === edge.id)
    if (orderedIndex < 0) return edge

    const nextOrder = orderedIndex + 1
    if (edge.data?.[orderKey] === nextOrder) return edge

    return {
      ...edge,
      data: {
        ...(edge.data || {}),
        [orderKey]: nextOrder
      }
    }
  })
}

const normalizeImageRoleEdges = (targetId) => {
  const roleEdges = edges.value.filter(edge => edge.target === targetId && edge.type === INPUT_EDGE_TYPES.IMAGE_ROLE)
  if (!roleEdges.length) return

  let hasFirst = false
  let hasLast = false

  edges.value = edges.value.map(edge => {
    if (edge.target !== targetId || edge.type !== INPUT_EDGE_TYPES.IMAGE_ROLE) return edge

    let imageRole = edge.data?.imageRole || 'input_reference'
    if (imageRole === 'first_frame_image') {
      if (hasFirst) imageRole = !hasLast ? 'last_frame_image' : 'input_reference'
      hasFirst = hasFirst || imageRole === 'first_frame_image'
      hasLast = hasLast || imageRole === 'last_frame_image'
    } else if (imageRole === 'last_frame_image') {
      if (hasLast) imageRole = 'input_reference'
      hasLast = hasLast || imageRole === 'last_frame_image'
    }

    if (edge.data?.imageRole === imageRole) return edge
    return {
      ...edge,
      data: {
        ...(edge.data || {}),
        imageRole
      }
    }
  })
}

const normalizeTargetInputEdges = (targetId) => {
  normalizeOrderedEdges(targetId, INPUT_EDGE_TYPES.PROMPT_ORDER, 'promptOrder')
  normalizeOrderedEdges(targetId, INPUT_EDGE_TYPES.IMAGE_ORDER, 'imageOrder')
  normalizeImageRoleEdges(targetId)
}

const buildEdge = (params) => {
  const sourceNode = getNodeById(params.source)
  const targetNode = getNodeById(params.target)
  const type = params.type || getEdgeTypeForConnection(sourceNode, targetNode)
  const sourceHandle = normalizeHandle(params.sourceHandle, 'right')
  const targetHandle = normalizeHandle(params.targetHandle, 'left')
  const data = { ...(params.data || {}) }

  if (type === INPUT_EDGE_TYPES.PROMPT_ORDER && !data.promptOrder) {
    data.promptOrder = edges.value.filter(edge => edge.target === params.target && edge.type === type).length + 1
  }

  if (type === INPUT_EDGE_TYPES.IMAGE_ORDER && !data.imageOrder) {
    data.imageOrder = edges.value.filter(edge => edge.target === params.target && edge.type === type).length + 1
  }

  if (type === INPUT_EDGE_TYPES.IMAGE_ROLE && !data.imageRole) {
    const sameTargetRoleEdges = edges.value.filter(edge => edge.target === params.target && edge.type === type)
    const hasFirst = sameTargetRoleEdges.some(edge => edge.data?.imageRole === 'first_frame_image')
    const hasLast = sameTargetRoleEdges.some(edge => edge.data?.imageRole === 'last_frame_image')
    data.imageRole = !hasFirst ? 'first_frame_image' : (!hasLast ? 'last_frame_image' : 'input_reference')
  }

  const edge = {
    ...params,
    sourceHandle,
    targetHandle,
    type: type === 'default' ? undefined : type,
    data: Object.keys(data).length ? data : undefined
  }

  return {
    id: params.id || makeEdgeId(edge),
    ...edge
  }
}

// Viewport state | 视口状态
export const canvasViewport = ref({ x: 100, y: 50, zoom: 0.8 })

// Selected node | 选中的节点
export const selectedNode = ref(null)

// Auto-save flag | 自动保存标志
let autoSaveEnabled = false
let saveTimeout = null

// History for undo/redo | 撤销/重做历史
const history = ref([])
const historyIndex = ref(-1)
const MAX_HISTORY = 50
let isRestoring = false

/**
 * Save current state to history | 保存当前状态到历史
 */
const saveToHistory = () => {
  if (isRestoring) return
  
  const state = {
    nodes: JSON.parse(JSON.stringify(nodes.value)),
    edges: JSON.parse(JSON.stringify(edges.value))
  }
  
  // Remove future history if we're not at the end | 如果不在末尾，删除未来历史
  if (historyIndex.value < history.value.length - 1) {
    history.value = history.value.slice(0, historyIndex.value + 1)
  }
  
  // Add new state | 添加新状态
  history.value.push(state)
  
  // Limit history size | 限制历史大小
  if (history.value.length > MAX_HISTORY) {
    history.value.shift()
  } else {
    historyIndex.value++
  }
}

// Add a new node | 添加新节点
// nodeProps: top-level node properties (draggable, parentNode, extent, zIndex, etc.)
export const addNode = (type, position = { x: 100, y: 100 }, data = {}, nodeProps = {}) => {
  const id = getNodeId()
  const now = Date.now()
  const newNode = {
    id,
    type,
    position,
    ...nodeProps,
    data: {
      ...getDefaultNodeData(type),
      ...data,
      createdAt: data.createdAt || now,
      updatedAt: data.updatedAt || now
    }
  }
  nodes.value = [...nodes.value, newNode]
  saveToHistory() // Save after adding node | 添加节点后保存
  debouncedSave() // Auto-save project | 自动保存项目
  return id
}

// Get default data for node type | 获取节点类型的默认数据
const getDefaultNodeData = (type) => {
  switch (type) {
    case 'text':
      return {
        content: '',
        label: '文本输入'
      }
    case 'imageConfig':
      // Keep defaults aligned with ImageConfigNode expectations
      return {
        label: '文生图',
        model: DEFAULT_IMAGE_MODEL,
        size: DEFAULT_IMAGE_SIZE,
        quality: 'standard',
        style: 'vivid'
      }
    case 'videoConfig':
      // Keep defaults aligned with VideoConfigNode expectations
      return {
        label: '图生视频',
        model: DEFAULT_VIDEO_MODEL,
        ratio: DEFAULT_VIDEO_RATIO,
        dur: DEFAULT_VIDEO_DURATION
      }
    case 'video':
      return {
        url: '',
        duration: 0,
        label: '视频节点'
      }
    case 'image':
      return {
        url: '',
        label: '图片节点'
      }
    case 'frame':
      return {
        label: '镜头',
        w: 720,
        h: 460,
        note: ''
      }
    case 'storyboardPlan':
      return {
        label: '分镜计划',
        prompt: '',
        shotCount: 16,
        shots: [],
        status: 'idle',
        error: ''
      }
    default:
      return {}
  }
}

// Update node data | 更新节点数据 (data only)
export const updateNode = (id, data) => {
  nodes.value = nodes.value.map(node =>
    node.id === id ? { ...node, data: { ...node.data, ...data } } : node
  )
  debouncedSave() // Auto-save project | 自动保存项目
}

// Update node top-level props | 更新节点顶层属性（非 data）
// options.saveHistory: set false for batch ops (call manualSaveHistory once after)
export const updateNodeProps = (id, props, options = {}) => {
  const { saveHistory = true } = options
  const { data: _ignoreData, ...rest } = props || {}

  nodes.value = nodes.value.map(node =>
    node.id === id ? { ...node, ...rest } : node
  )

  if (saveHistory) {
    saveToHistory() // Save after structural changes | 顶层变更后保存
  }

  debouncedSave() // Auto-save project | 自动保存项目
}

// Remove node | 删除节点
export const removeNode = (id) => {
  nodes.value = nodes.value.filter(node => node.id !== id)
  edges.value = edges.value.filter(edge => edge.source !== id && edge.target !== id)
  saveToHistory() // Save after removing node | 删除节点后保存
  debouncedSave() // Auto-save project | 自动保存项目
}

// Duplicate node | 复制节点
export const duplicateNode = (id) => {
  const sourceNode = nodes.value.find(node => node.id === id)
  if (!sourceNode) return null
  
  const newId = getNodeId()
  
  // Calculate max z-index | 计算最大层级
  const maxZIndex = Math.max(0, ...nodes.value.map(n => n.zIndex || 0))
  
  const newNode = {
    id: newId,
    type: sourceNode.type,
    position: {
      x: sourceNode.position.x + 50,
      y: sourceNode.position.y + 50
    },
    data: { ...sourceNode.data },
    zIndex: maxZIndex + 1
  }
  nodes.value = [...nodes.value, newNode]
  saveToHistory() // Save after duplicating node | 复制节点后保存
  debouncedSave() // Auto-save project | 自动保存项目
  return newId
}

// Add edge | 添加边
export const addEdge = (params) => {
  if (!params?.source || !params?.target) return null

  if (params.source === params.target) {
    window.$message?.warning('不能连接节点自身')
    return null
  }

  const sourceNode = getNodeById(params.source)
  const targetNode = getNodeById(params.target)
  if (!sourceNode || !targetNode) return null

  const newEdge = buildEdge(params)
  const duplicate = findDuplicateEdge(newEdge)

  if (duplicate) {
    edges.value = edges.value.map(edge =>
      edge.id === duplicate.id
        ? {
            ...edge,
            type: newEdge.type,
            sourceHandle: newEdge.sourceHandle,
            targetHandle: newEdge.targetHandle,
            data: {
              ...(edge.data || {}),
              ...(newEdge.data || {})
            }
          }
        : edge
    )
    normalizeTargetInputEdges(newEdge.target)
    saveToHistory()
    debouncedSave()
    return duplicate.id
  }

  edges.value = [...edges.value, newEdge]
  normalizeTargetInputEdges(newEdge.target)
  saveToHistory() // Save after adding edge | 添加连线后保存
  debouncedSave() // Auto-save project | 自动保存项目
  return newEdge.id
}

// Update edge data | 更新边数据
export const updateEdge = (id, data) => {
  edges.value = edges.value.map(edge => 
    edge.id === id ? { ...edge, data: { ...edge.data, ...data } } : edge
  )
  saveToHistory() // Save after updating edge | 更新连线后保存
  debouncedSave() // Auto-save project | 自动保存项目
}

// Remove edge | 删除边
export const removeEdge = (id) => {
  const currentEdge = edges.value.find(edge => edge.id === id)
  edges.value = edges.value.filter(edge => edge.id !== id)
  if (currentEdge?.target) {
    normalizeTargetInputEdges(currentEdge.target)
  }
  saveToHistory() // Save after removing edge | 删除连线后保存
  debouncedSave() // Auto-save project | 自动保存项目
}

// Clear canvas | 清空画布
export const clearCanvas = () => {
  nodes.value = []
  edges.value = []
  nodeId = 0
}

// Initialize with sample data | 使用示例数据初始化
export const initSampleData = () => {
  clearCanvas()
  
  // Add text node | 添加文本节点
  addNode('text', { x: 150, y: 150 }, {
    content: '一只金毛寻回犬在草地上奔跑，摇着尾巴，脸上带着快乐的表情。它的毛发在阳光下闪耀，眼神充满了对自由的渴望，全身散发着阳光、友善的气息。',
    label: '文本输入'
  })
  
  // Add image config node | 添加文生图配置节点
  addNode('imageConfig', { x: 450, y: 150 }, {
    label: '文生图'
  })
  
  // Add edge between nodes | 添加节点之间的边
  addEdge({
    source: 'node_0',
    target: 'node_1',
    sourceHandle: 'right',
    targetHandle: 'left'
  })
}

/**
 * Load project data | 加载项目数据
 * @param {string} projectId - Project ID | 项目ID
 */
export const loadProject = (projectId) => {
  autoSaveEnabled = false
  isRestoring = true
  currentProjectId.value = projectId
  
  const canvasData = getProjectCanvas(projectId)
  
  if (canvasData) {
    // Restore nodes | 恢复节点
    nodes.value = canvasData.nodes || []
    edges.value = canvasData.edges || []
    canvasViewport.value = canvasData.viewport || { x: 100, y: 50, zoom: 0.8 }
    
    // Update node ID counter | 更新节点ID计数器
    const maxId = nodes.value.reduce((max, node) => {
      const match = node.id.match(/node_(\d+)/)
      if (match) {
        return Math.max(max, parseInt(match[1], 10))
      }
      return max
    }, -1)
    nodeId = maxId + 1
  } else {
    // Empty project | 空项目
    clearCanvas()
  }
  
  // Initialize history with current state | 用当前状态初始化历史
  history.value = [{
    nodes: JSON.parse(JSON.stringify(nodes.value)),
    edges: JSON.parse(JSON.stringify(edges.value))
  }]
  historyIndex.value = 0
  
  // Enable auto-save after loading | 加载后启用自动保存
  setTimeout(() => {
    autoSaveEnabled = true
    isRestoring = false
  }, 100)
}

/**
 * Save current project | 保存当前项目
 */
const serializeNodeForSave = (node) => {
  const out = {
    id: node.id,
    type: node.type,
    position: {
      x: node.position?.x ?? 0,
      y: node.position?.y ?? 0
    },
    data: node.data ?? {}
  }

  // Persist only the top-level props we actually use.
  if (node.parentNode) out.parentNode = node.parentNode
  if (typeof node.extent !== 'undefined') out.extent = node.extent
  if (typeof node.zIndex === 'number') out.zIndex = node.zIndex
  if (typeof node.draggable !== 'undefined') out.draggable = node.draggable
  if (typeof node.connectable !== 'undefined') out.connectable = node.connectable
  if (typeof node.selectable !== 'undefined') out.selectable = node.selectable
  if (typeof node.dragHandle === 'string') out.dragHandle = node.dragHandle
  if (typeof node.hidden !== 'undefined') out.hidden = node.hidden

  return out
}

const serializeEdgeForSave = (edge) => {
  const out = {
    id: edge.id,
    source: edge.source,
    target: edge.target
  }

  if (edge.sourceHandle) out.sourceHandle = edge.sourceHandle
  if (edge.targetHandle) out.targetHandle = edge.targetHandle
  if (edge.type) out.type = edge.type
  if (edge.data) out.data = edge.data

  return out
}

export const saveProject = () => {
  if (!currentProjectId.value) return

  // Avoid persisting Vue Flow runtime state (computedPosition/dimensions/selected/dragging...)
  const slimNodes = nodes.value.map(serializeNodeForSave)
  const slimEdges = edges.value.map(serializeEdgeForSave)

  updateProjectCanvas(currentProjectId.value, {
    nodes: slimNodes,
    edges: slimEdges,
    viewport: canvasViewport.value
  })
}

/**
 * Debounced auto-save | 防抖动自动保存
 */
const debouncedSave = () => {
  if (!autoSaveEnabled || !currentProjectId.value) return
  
  if (saveTimeout) {
    clearTimeout(saveTimeout)
  }
  
  saveTimeout = setTimeout(() => {
    saveProject()
  }, 500)
}

/**
 * Update viewport and save | 更新视口并保存
 */
export const updateViewport = (viewport) => {
  canvasViewport.value = viewport
  debouncedSave()
}

/**
 * Undo last action | 撤销上一步操作
 */
export const undo = () => {
  if (historyIndex.value <= 0) {
    window.$message?.info('没有可撤销的操作')
    return false
  }
  
  historyIndex.value--
  restoreState(history.value[historyIndex.value])
  debouncedSave() // Persist undo state | 保存撤销后的状态
  return true
}

/**
 * Redo last undone action | 重做上一步撤销的操作
 */
export const redo = () => {
  if (historyIndex.value >= history.value.length - 1) {
    window.$message?.info('没有可重做的操作')
    return false
  }
  
  historyIndex.value++
  restoreState(history.value[historyIndex.value])
  debouncedSave() // Persist redo state | 保存重做后的状态
  return true
}

/**
 * Restore state from history | 从历史恢复状态
 */
const restoreState = (state) => {
  isRestoring = true
  nodes.value = JSON.parse(JSON.stringify(state.nodes))
  edges.value = JSON.parse(JSON.stringify(state.edges))
  setTimeout(() => {
    isRestoring = false
  }, 100)
}

/**
 * Check if can undo | 检查是否可以撤销
 */
export const canUndo = () => historyIndex.value > 0

/**
 * Check if can redo | 检查是否可以重做
 */
export const canRedo = () => historyIndex.value < history.value.length - 1

/**
 * Manually save current state to history | 手动保存当前状态到历史
 * Used for edge deletions and other operations not covered by automatic saves
 */
export const requestAutoSave = () => {
  debouncedSave()
}

/**
 * Manually save current state to history | 手动保存当前状态到历史
 * Used for edge deletions and other operations not covered by automatic saves
 */
export const manualSaveHistory = () => {
  saveToHistory()
  debouncedSave() // Also persist to project | 同步保存项目
}
