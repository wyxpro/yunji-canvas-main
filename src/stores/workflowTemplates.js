/**
 * Workflow Templates Store | 工作流模板（我的工作流）
 * Persist user-defined workflow graphs (nodes + edges) in localStorage.
 */

import { ref, computed, watch } from 'vue'
import { STORAGE_KEYS } from '@/utils'

const SCHEMA_VERSION = 1

const genId = () => `wf_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`

const readStoredJson = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    const parsed = JSON.parse(raw)
    return parsed ?? fallback
  } catch {
    return fallback
  }
}

const writeStoredJson = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // ignore
  }
}

const isPlainObject = (v) => !!v && typeof v === 'object' && !Array.isArray(v)

const pick = (obj, keys) => {
  const out = {}
  for (const k of keys) {
    if (typeof obj?.[k] !== 'undefined') out[k] = obj[k]
  }
  return out
}

const sanitizeNodeDataForTemplate = (type, data = {}) => {
  const d = isPlainObject(data) ? { ...data } : {}

  // Remove runtime / heavy fields shared across node types
  delete d.loading
  delete d.error
  delete d.executed
  delete d.outputNodeId
  delete d.autoExecute
  delete d.updatedAt
  delete d.createdAt
  delete d.progress

  // Remove large binary-ish fields (avoid localStorage quota)
  delete d.base64
  delete d.maskData

  if (type === 'image') {
    // Keep label/model/isCharacterRef, clear content
    d.url = ''
    delete d.fileName
    delete d.fileType
    delete d.hasInpaintMask
    return d
  }

  if (type === 'video') {
    d.url = ''
    d.duration = 0
    delete d.thumbnail
    delete d.fileName
    delete d.fileType
    return d
  }

  if (type === 'imageConfig' || type === 'videoConfig') {
    // Keep model params, drop execution state already removed above
    return d
  }

  // text/frame/others
  return d
}

const getAbsPos = (node, nodeById) => {
  const px = node?.position?.x ?? 0
  const py = node?.position?.y ?? 0
  if (node?.parentNode) {
    const parent = nodeById.get(node.parentNode)
    if (parent) {
      const ppx = parent?.position?.x ?? 0
      const ppy = parent?.position?.y ?? 0
      return { x: ppx + px, y: ppy + py }
    }
  }
  return { x: px, y: py }
}

const sanitizeTemplateItem = (item) => {
  if (!isPlainObject(item)) return null

  const id = String(item.id || '').trim() || genId()
  const name = String(item.name || '').trim() || '未命名工作流'
  const description = String(item.description || '').trim()

  const nodes = Array.isArray(item.nodes) ? item.nodes : []
  const edges = Array.isArray(item.edges) ? item.edges : []

  return {
    id,
    name,
    description,
    version: Number(item.version || SCHEMA_VERSION) || SCHEMA_VERSION,
    createdAt: Number(item.createdAt || Date.now()),
    updatedAt: Number(item.updatedAt || Date.now()),
    nodes: nodes.filter(Boolean).map(n => ({
      id: String(n.id || ''),
      type: String(n.type || ''),
      position: {
        x: Number(n.position?.x ?? 0),
        y: Number(n.position?.y ?? 0)
      },
      data: isPlainObject(n.data) ? n.data : {},
      // optional top-level props
      ...(n.parentNode ? { parentNode: String(n.parentNode) } : {}),
      ...(typeof n.extent !== 'undefined' ? { extent: n.extent } : {}),
      ...(typeof n.dragHandle === 'string' ? { dragHandle: n.dragHandle } : {})
    })),
    edges: edges.filter(Boolean).map(e => ({
      source: String(e.source || ''),
      target: String(e.target || ''),
      ...(e.sourceHandle ? { sourceHandle: String(e.sourceHandle) } : {}),
      ...(e.targetHandle ? { targetHandle: String(e.targetHandle) } : {}),
      ...(e.type ? { type: String(e.type) } : {}),
      ...(isPlainObject(e.data) ? { data: e.data } : {})
    }))
  }
}

const sanitizeTemplateList = (list) => {
  const arr = Array.isArray(list) ? list : []
  const out = []
  const seen = new Set()

  for (const raw of arr) {
    const item = sanitizeTemplateItem(raw)
    if (!item) continue
    if (seen.has(item.id)) continue
    seen.add(item.id)
    out.push(item)
  }

  return out
}

export const workflowTemplates = ref(
  sanitizeTemplateList(readStoredJson(STORAGE_KEYS.WORKFLOW_TEMPLATES, []))
)

watch(
  workflowTemplates,
  (val) => writeStoredJson(STORAGE_KEYS.WORKFLOW_TEMPLATES, sanitizeTemplateList(val)),
  { deep: true }
)

export const myWorkflowTemplates = computed(() => workflowTemplates.value)

export const getWorkflowTemplateById = (id) => {
  return workflowTemplates.value.find(t => t.id === id) || null
}

export const deleteWorkflowTemplate = (id) => {
  workflowTemplates.value = workflowTemplates.value.filter(t => t.id !== id)
}

export const upsertWorkflowTemplate = (tpl) => {
  const item = sanitizeTemplateItem(tpl)
  if (!item) return null

  const idx = workflowTemplates.value.findIndex(t => t.id === item.id)
  if (idx >= 0) {
    workflowTemplates.value[idx] = { ...workflowTemplates.value[idx], ...item, updatedAt: Date.now() }
    workflowTemplates.value = [...workflowTemplates.value]
    return item.id
  }

  workflowTemplates.value = [{ ...item, createdAt: Date.now(), updatedAt: Date.now() }, ...workflowTemplates.value]
  return item.id
}

/**
 * Create a workflow template from current canvas selection.
 * @param {object} params
 * @param {string} params.name
 * @param {string} [params.description]
 * @param {Array} params.nodes - current canvas nodes
 * @param {Array} params.edges - current canvas edges
 * @param {Array<string>} params.selectedNodeIds
 */
export const createWorkflowTemplateFromSelection = ({
  name,
  description = '',
  nodes,
  edges,
  selectedNodeIds
}) => {
  const selectedSet = new Set((selectedNodeIds || []).filter(Boolean))
  const allNodes = Array.isArray(nodes) ? nodes : []
  const allEdges = Array.isArray(edges) ? edges : []

  const nodeById = new Map(allNodes.map(n => [n.id, n]))

  const selectedNodesRaw = allNodes.filter(n => selectedSet.has(n.id))
  if (selectedNodesRaw.length === 0) {
    throw new Error('未选择任何节点')
  }

  // Detach nodes whose parent is not selected (make template self-contained)
  const detached = selectedNodesRaw.map(n => {
    if (n.parentNode && !selectedSet.has(n.parentNode)) {
      const abs = getAbsPos(n, nodeById)
      const { parentNode, extent, computedPosition, dimensions, selected, dragging, ...rest } = n
      return {
        ...rest,
        parentNode: undefined,
        extent: undefined,
        position: { x: abs.x, y: abs.y }
      }
    }
    return n
  })

  const detachedById = new Map(detached.map(n => [n.id, n]))

  // Keep only internal edges
  const selectedEdges = allEdges.filter(e => selectedSet.has(e.source) && selectedSet.has(e.target))

  // Compute bounds based on absolute positions (children use parent+relative)
  let minX = Infinity
  let minY = Infinity

  for (const n of detached) {
    const abs = getAbsPos(n, detachedById)
    minX = Math.min(minX, abs.x)
    minY = Math.min(minY, abs.y)
  }

  if (!Number.isFinite(minX) || !Number.isFinite(minY)) {
    minX = 0
    minY = 0
  }

  // Build template nodes (positions relative to bounds for root nodes)
  const templateNodes = detached.map(n => {
    const hasParent = !!(n.parentNode && selectedSet.has(n.parentNode))

    const base = {
      id: n.id,
      type: n.type,
      position: {
        x: Number(n.position?.x ?? 0),
        y: Number(n.position?.y ?? 0)
      },
      data: sanitizeNodeDataForTemplate(n.type, n.data)
    }

    if (!hasParent) {
      base.position.x = base.position.x - minX
      base.position.y = base.position.y - minY
    } else {
      base.parentNode = n.parentNode
      if (typeof n.extent !== 'undefined') base.extent = n.extent
      if (typeof n.dragHandle === 'string') base.dragHandle = n.dragHandle
    }

    return base
  })

  const templateEdges = selectedEdges.map(e => ({
    source: e.source,
    target: e.target,
    ...pick(e, ['sourceHandle', 'targetHandle', 'type', 'data'])
  }))

  const tpl = {
    id: genId(),
    name: String(name || '').trim() || '未命名工作流',
    description: String(description || '').trim(),
    version: SCHEMA_VERSION,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    nodes: templateNodes,
    edges: templateEdges
  }

  workflowTemplates.value = [tpl, ...workflowTemplates.value]
  return tpl
}

export const exportWorkflowTemplateJson = (tpl) => {
  const item = isPlainObject(tpl) ? sanitizeTemplateItem(tpl) : sanitizeTemplateItem(getWorkflowTemplateById(tpl))
  if (!item) throw new Error('未找到工作流')

  return JSON.stringify({
    type: 'ai-canvas-workflow',
    version: SCHEMA_VERSION,
    ...item
  }, null, 2)
}

export const exportAllWorkflowTemplatesJson = () => {
  const items = workflowTemplates.value.map(sanitizeTemplateItem).filter(Boolean)
  return JSON.stringify({
    type: 'ai-canvas-workflow-collection',
    version: SCHEMA_VERSION,
    items
  }, null, 2)
}

export const importWorkflowTemplatesFromJson = (jsonText) => {
  if (!jsonText) return 0

  let parsed = null
  try {
    parsed = JSON.parse(jsonText)
  } catch {
    throw new Error('JSON 解析失败')
  }

  const imported = []

  if (Array.isArray(parsed)) {
    imported.push(...parsed)
  } else if (isPlainObject(parsed) && Array.isArray(parsed.items)) {
    imported.push(...parsed.items)
  } else if (isPlainObject(parsed)) {
    imported.push(parsed)
  }

  let count = 0
  for (const raw of imported) {
    const base = sanitizeTemplateItem(raw)
    if (!base) continue

    // Always assign a new id to avoid collisions
    const next = {
      ...base,
      id: genId(),
      createdAt: Date.now(),
      updatedAt: Date.now()
    }

    workflowTemplates.value = [next, ...workflowTemplates.value]
    count++
  }

  return count
}
