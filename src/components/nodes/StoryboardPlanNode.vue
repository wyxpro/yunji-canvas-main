<template>
  <!-- Storyboard plan node | 分镜计划节点 -->
  <div class="storyboard-plan-node-wrapper">
    <div
      class="storyboard-plan-node bg-[var(--glass-bg)] backdrop-blur-xl rounded-2xl border border-[color:var(--glass-border)] w-[420px] relative transition-all duration-300 shadow-glass hover:shadow-neon hover:border-purple-500/30"
      :class="selected ? 'border-purple-500/50 shadow-neon' : ''"
    >
      <!-- Header | 头部 -->
      <div class="node-drag-handle flex items-center justify-between px-4 py-3 border-b border-[color:var(--border-color)]">
        <div class="flex items-center gap-2 min-w-0">
          <div class="w-2 h-2 rounded-full bg-pink-400/90 shadow-[0_0_14px_rgba(236,72,153,0.35)]"></div>
          <span class="text-xs font-bold tracking-widest text-[var(--text-primary)] uppercase truncate">
            {{ data?.label || '分镜计划' }}
          </span>
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
      <div class="p-4 space-y-3">
        <!-- Prompt input -->
        <textarea
          v-model="localPrompt"
          @blur="commitPrompt"
          @wheel.stop
          @mousedown.stop
          class="nodrag w-full bg-black/5 dark:bg-white/5 resize-none outline-none text-sm text-gray-900 dark:text-gray-200 placeholder:text-gray-400 dark:placeholder:text-gray-600 min-h-[88px] leading-relaxed font-light rounded-xl border border-black/10 dark:border-white/10 px-3 py-3 focus:border-purple-500/50 focus:bg-black/[0.03] dark:focus:bg-white/[0.07] transition-colors"
          placeholder="输入剧情/分镜要求…（例如：女主在雨夜追逐，最后停在霓虹灯下回头微笑）"
        />

        <!-- Shot count -->
        <div class="flex items-center justify-between gap-2">
          <span class="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">{{ data?.autoShotCount ? '镜头上限' : '镜头数量' }}</span>
          <input
            v-model.number="localShotCount"
            @blur="commitShotCount"
            type="number"
            min="4"
            max="30"
            class="nodrag w-24 bg-black/5 dark:bg-white/5 text-gray-900 dark:text-gray-200 text-xs rounded-lg border border-black/10 dark:border-white/10 px-2 py-1 outline-none focus:border-purple-500/50"
          />
        </div>

        <!-- Actions -->
        <div class="flex gap-2">
          <button
            @click="handleGenerate"
            :disabled="isGenerating || !isApiConfigured || !localPrompt.trim()"
            class="flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white text-xs font-bold tracking-wide transition-all shadow-lg shadow-purple-900/20 disabled:opacity-40 disabled:cursor-not-allowed"
            title="生成分镜"
          >
            <n-spin v-if="isGenerating" :size="14" stroke="white" />
            <template v-else>
              <n-icon :size="14"><SparklesOutline /></n-icon>
              生成分镜
            </template>
          </button>

          <button
            @click="handleExpand(10)"
            :disabled="isGenerating || shots.length === 0"
            class="flex-shrink-0 px-3 py-2.5 rounded-xl border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-black/10 dark:hover:bg-white/10 text-xs font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            title="展开前 10 个"
          >
            展开10
          </button>

          <button
            @click="handleExpand('all')"
            :disabled="isGenerating || shots.length === 0"
            class="flex-shrink-0 px-3 py-2.5 rounded-xl border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-black/10 dark:hover:bg-white/10 text-xs font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            title="展开全部"
          >
            全部
          </button>
        </div>

        <div v-if="!isApiConfigured" class="text-[11px] text-gray-500">
          未配置 API Key，无法生成分镜（可在右上角设置里配置）。
        </div>

        <!-- Error -->
        <div
          v-if="localError"
          class="text-xs text-red-400 mt-1 px-2 py-1 bg-red-500/10 border border-red-500/20 rounded-lg"
        >
          {{ localError }}
        </div>

        <!-- Shots list -->
        <div v-if="shots.length > 0" class="pt-3 border-t border-black/5 dark:border-white/5">
          <div class="flex items-center justify-between">
            <div class="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">
              分镜列表 ({{ shots.length }})
            </div>
            <button
              class="nodrag text-[11px] text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              @click="handleAddShot"
              title="添加镜头"
            >
              + 添加
            </button>
          </div>

          <div class="mt-2 max-h-[340px] overflow-auto pr-1 space-y-2">
            <div
              v-for="(shot, idx) in shots"
              :key="idx"
              class="rounded-xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 p-2"
            >
              <div class="flex items-center gap-2">
                <input
                  v-model="shot.title"
                  @blur="commitShots"
                  class="nodrag flex-1 bg-transparent text-xs text-gray-900 dark:text-gray-200 outline-none border border-black/10 dark:border-white/10 rounded-lg px-2 py-1 focus:border-purple-500/50"
                  placeholder="镜头标题"
                />

                <div class="flex items-center gap-1">
                  <button
                    class="nodrag w-7 h-7 rounded-lg bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 border border-black/10 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                    title="上移"
                    :disabled="idx === 0"
                    @click="moveShot(idx, -1)"
                  >
                    <n-icon :size="12"><ChevronUpOutline /></n-icon>
                  </button>
                  <button
                    class="nodrag w-7 h-7 rounded-lg bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 border border-black/10 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                    title="下移"
                    :disabled="idx === shots.length - 1"
                    @click="moveShot(idx, 1)"
                  >
                    <n-icon :size="12"><ChevronDownOutline /></n-icon>
                  </button>
                  <button
                    class="nodrag w-7 h-7 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-300 hover:text-red-200"
                    title="删除"
                    @click="removeShot(idx)"
                  >
                    <n-icon :size="12"><CloseOutline /></n-icon>
                  </button>
                </div>
              </div>

              <textarea
                v-model="shot.prompt"
                @blur="commitShots"
                class="nodrag mt-2 w-full bg-transparent resize-none outline-none text-[12px] text-gray-900 dark:text-gray-200 placeholder:text-gray-400 dark:placeholder:text-gray-600 leading-relaxed font-light rounded-lg border border-black/10 dark:border-white/10 px-2 py-2 focus:border-purple-500/50"
                rows="3"
                placeholder="镜头提示词（包含景别/机位/动作/光影/氛围…）"
              />
            </div>
          </div>

          <div class="mt-2 text-[11px] text-gray-500 leading-relaxed">
            提示：先在这里审稿/微调，再「展开」成 text → imageConfig → image。
          </div>
        </div>
      </div>

      <!-- Handles | 连接点 -->
      <Handle
        type="target"
        :position="Position.Left"
        id="left"
        :connectable="connectable"
        class="!w-3 !h-3 !bg-pink-500 !border-2 !border-[color:var(--bg-secondary)]"
      />
      <Handle
        type="source"
        :position="Position.Right"
        id="right"
        :connectable="connectable"
        class="!w-3 !h-3 !bg-pink-500 !border-2 !border-[color:var(--bg-secondary)]"
      />
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch, nextTick } from 'vue'
import { Handle, Position, useVueFlow } from '@vue-flow/core'
import { NIcon, NSpin } from 'naive-ui'
import {
  CopyOutline,
  TrashOutline,
  SparklesOutline,
  ChevronUpOutline,
  ChevronDownOutline,
  CloseOutline
} from '@vicons/ionicons5'
import { streamChatCompletions } from '@/api'
import { useApiConfig } from '@/hooks'
import {
  addNode,
  addEdge,
  updateNode,
  removeNode,
  duplicateNode,
  manualSaveHistory,
  nodes,
  edges
} from '@/stores/canvas'
import { DEFAULT_CHAT_MODEL } from '@/config/models'

const props = defineProps({
  id: String,
  data: Object,
  selected: Boolean,
  connectable: {
    type: [Boolean, Function],
    default: true
  }
})

const { updateNodeInternals } = useVueFlow()
const { isConfigured: isApiConfigured, chatModel } = useApiConfig()

const clampInt = (n, min, max, fallback) => {
  const v = parseInt(String(n ?? ''), 10)
  if (!Number.isFinite(v)) return fallback
  return Math.max(min, Math.min(max, v))
}

const localPrompt = ref(String(props.data?.prompt || ''))
const localShotCount = ref(clampInt(props.data?.shotCount ?? 16, 4, 30, 16))
const shots = ref(Array.isArray(props.data?.shots) ? props.data.shots.map(s => ({
  title: String(s?.title || ''),
  prompt: String(s?.prompt || '')
})) : [])
const localError = ref(String(props.data?.error || ''))
const isGenerating = ref(false)

const rolePriority = (role = '') => {
  const r = String(role || '').trim().toLowerCase()
  if (r === 'script') return 0
  if (r === 'character') return 10
  if (r === 'style') return 20
  if (r === 'camera') return 30
  if (r === 'motion' || r === 'video_motion') return 40
  if (r === 'negative') return 90
  if (r === 'instructions') return 100
  return 50
}

const isVideoOnlyRole = (role = '') => {
  const r = String(role || '').trim().toLowerCase()
  return r === 'motion' || r === 'video_motion'
}

const roleToTitle = (role, fallbackLabel = '') => {
  const r = String(role || '').trim().toLowerCase()
  if (r === 'character') return '角色设定'
  if (r === 'style') return '全局风格'
  if (r === 'camera') return '镜头规则'
  if (r === 'motion' || r === 'video_motion') return '视频运动'
  if (r === 'negative') return '负面约束'
  if (r === 'script') return '剧本'
  return fallbackLabel || '约束'
}

const getIncomingTextInputs = () => {
  const incomingEdges = edges.value.filter(e => e.target === props.id)
  const list = []

  for (const edge of incomingEdges) {
    const src = nodes.value.find(n => n.id === edge.source)
    if (src?.type !== 'text') continue

    list.push({
      nodeId: src.id,
      label: String(src.data?.label || '').trim(),
      content: String(src.data?.content || '').trim(),
      workflowRole: String(src.data?.workflowRole || '').trim(),
      order: edge.data?.promptOrder || 1
    })
  }

  list.sort((a, b) => (a.order || 1) - (b.order || 1))
  return list
}

const resolveScriptInput = () => {
  const explicitId = props.data?.scriptNodeId
  if (explicitId) {
    const n = nodes.value.find(nn => nn.id === explicitId && nn.type === 'text')
    if (n) {
      return {
        nodeId: n.id,
        label: String(n.data?.label || '').trim(),
        content: String(n.data?.content || '').trim(),
        workflowRole: String(n.data?.workflowRole || '').trim(),
        order: 1
      }
    }
  }

  const inputs = getIncomingTextInputs()

  const byRole = inputs.find(i => String(i.workflowRole || '').toLowerCase() === 'script')
  if (byRole) return byRole

  const byLabel = inputs.find(i => /剧本|脚本/i.test(String(i.label || '')))
  if (byLabel) return byLabel

  // If nothing explicitly marked, pick the longest text as "script"
  const withContent = inputs.filter(i => i.content)
  if (withContent.length > 0) {
    return withContent.reduce((a, b) => (b.content.length > a.content.length ? b : a))
  }

  return null
}

const buildGenerationInput = () => {
  const script = resolveScriptInput()
  const story = String(localPrompt.value || '').trim() || String(script?.content || '').trim()

  const incoming = getIncomingTextInputs()
  const constraintNodes = incoming
    .filter(i => i.nodeId !== script?.nodeId)
    .filter(i => {
      const role = String(i.workflowRole || '').toLowerCase()
      if (role === 'script' || role === 'instructions') return false
      return Boolean(String(i.content || '').trim())
    })
    .sort((a, b) => rolePriority(a.workflowRole) - rolePriority(b.workflowRole))

  const constraintsText = constraintNodes
    .map(i => `【${roleToTitle(i.workflowRole, i.label)}】\n${i.content}`)
    .join('\n\n')

  const composed = constraintsText ? `${story}\n\n${constraintsText}` : story

  return {
    story,
    composed,
    scriptNodeId: script?.nodeId || null,
    constraintNodeIds: constraintNodes.map(i => i.nodeId)
  }
}

const getExtraPromptNodesForExpansion = () => {
  const script = resolveScriptInput()
  const incoming = getIncomingTextInputs()

  return incoming
    .filter(i => i.nodeId !== script?.nodeId)
    .filter(i => {
      const role = String(i.workflowRole || '').toLowerCase()
      if (role === 'script' || role === 'instructions') return false
      return Boolean(String(i.content || '').trim())
    })
    .sort((a, b) => rolePriority(a.workflowRole) - rolePriority(b.workflowRole))
}

const connectExtraPrompts = (extraNodes, targetId, startOrder = 2) => {
  let order = startOrder
  ;(extraNodes || []).forEach(n => {
    if (edges.value.some(e => e.source === n.nodeId && e.target === targetId)) return

    addEdge({
      source: n.nodeId,
      target: targetId,
      sourceHandle: 'right',
      targetHandle: 'left',
      type: 'promptOrder',
      data: { promptOrder: order++ }
    })
  })
}

const getOutgoingShotSlots = () => {
  const outgoingEdges = edges.value.filter(e => e.source === props.id)
  const slots = [] // { textId, shotIndex }

  for (const edge of outgoingEdges) {
    const target = nodes.value.find(n => n.id === edge.target)
    if (target?.type !== 'text') continue

    const idxRaw = edge.data?.shotIndex ?? target.data?.shotIndex
    const idx = parseInt(String(idxRaw ?? ''), 10)
    if (!Number.isFinite(idx) || idx <= 0) continue

    slots.push({ textId: target.id, shotIndex: idx })
  }

  slots.sort((a, b) => a.shotIndex - b.shotIndex)
  return slots
}

const writeShotsToSlots = (shotList) => {
  const slots = getOutgoingShotSlots()
  if (slots.length === 0) return false

  slots.forEach(slot => {
    const s = Array.isArray(shotList) ? shotList[slot.shotIndex - 1] : null
    const prompt = String(s?.prompt || '').trim()
    if (!prompt) return
    updateNode(slot.textId, { content: prompt })
  })

  return true
}

const resetDownstreamConfigsAndOutputs = () => {
  const outgoingEdges = edges.value.filter(e => e.source === props.id)
  const downstream = outgoingEdges
    .map(e => nodes.value.find(n => n.id === e.target))
    .filter(Boolean)
    .filter(n => n.type === 'imageConfig' || n.type === 'videoConfig')

  const clearOutputNode = (node) => {
    if (!node) return
    if (node.type === 'image') {
      updateNode(node.id, {
        url: '',
        base64: '',
        loading: false,
        error: '',
        updatedAt: Date.now()
      })
    } else if (node.type === 'video') {
      updateNode(node.id, {
        url: '',
        duration: 0,
        loading: false,
        error: '',
        updatedAt: Date.now()
      })
    }
  }

  downstream.forEach(cfg => {
    updateNode(cfg.id, { executed: false, outputNodeId: null })

    // Clear any connected outputs (placeholders or previously generated outputs)
    const outEdges = edges.value.filter(e => e.source === cfg.id)
    outEdges.forEach(e => {
      const outNode = nodes.value.find(n => n.id === e.target)
      if (outNode?.type === 'image' || outNode?.type === 'video') {
        clearOutputNode(outNode)
      }
    })
  })
}

watch(() => props.data?.prompt, (v) => {
  const next = String(v || '')
  if (next !== localPrompt.value) localPrompt.value = next
})

watch(() => props.data?.shotCount, (v) => {
  const next = clampInt(v ?? 16, 4, 30, 16)
  if (next !== localShotCount.value) localShotCount.value = next
})

watch(() => props.data?.shots, (v) => {
  if (Array.isArray(v)) {
    shots.value = v.map(s => ({
      title: String(s?.title || ''),
      prompt: String(s?.prompt || '')
    }))
  }
})

const commitPrompt = () => {
  updateNode(props.id, { prompt: localPrompt.value, error: '' })
}

const commitShotCount = () => {
  localShotCount.value = clampInt(localShotCount.value, 4, 30, 16)
  updateNode(props.id, { shotCount: localShotCount.value })
}

const commitShots = () => {
  const normalized = (shots.value || []).map((s, i) => ({
    title: String(s?.title || `镜头 ${String(i + 1).padStart(2, '0')}`).trim(),
    prompt: String(s?.prompt || '').trim()
  }))
  shots.value = normalized
  updateNode(props.id, { shots: normalized, error: '' })
}

const extractJsonObject = (raw = '') => {
  if (!raw) return null
  let text = String(raw)

  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i)
  if (fenced?.[1]) text = fenced[1]

  const start = text.indexOf('{')
  const end = text.lastIndexOf('}')
  if (start === -1 || end === -1 || end <= start) return null

  let jsonText = text.slice(start, end + 1).trim()
  jsonText = jsonText
    .replace(/^\uFEFF/, '')
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/,\s*([}\]])/g, '$1')

  try {
    return JSON.parse(jsonText)
  } catch {
    return null
  }
}

const buildSystemPrompt = (spec = {}) => {
  const mode = String(spec?.mode || 'fixed').trim().toLowerCase()

  const minShots = clampInt(spec?.minShots ?? 4, 1, 30, 4)
  const maxShots = clampInt(spec?.maxShots ?? (spec?.targetShots ?? 16), minShots, 30, 16)
  const targetShots = clampInt(spec?.targetShots ?? maxShots, minShots, 30, maxShots)

  const countRule = mode === 'auto'
    ? `- 你必须根据剧本内容自动决定镜头数量：不少于 ${minShots}，不多于 ${maxShots}。\n- 镜头数量要“刚好够用”：覆盖所有关键情节/动作/转折，但不要为了凑数而拆得过碎。\n- 建议：很短的输入(一句话/少于 200 字)通常 4~8 镜头；中等长度 8~16；更长的剧本可到 16~${maxShots}，但不要超过上限。`
    : `- shots 数量必须严格等于 ${targetShots}。`

  return `你是一个电影分镜导演 + 提示词工程师。\n\n你的任务：把用户输入的【剧本/故事】拆成一组镜头(shots)，并为每个镜头写出可直接用于「首帧生图 + 图生视频」的高质量提示词。\n\n只输出一个 JSON 对象，不要 Markdown，不要解释。JSON 必须可直接 JSON.parse（双引号、无注释、无尾逗号）。\n\n输出 schema：\n{\n  "shots": [ { "title": "镜头标题", "prompt": "镜头提示词" } ]\n}\n\n硬性要求：\n${countRule}\n- 必须严格按剧本拆分镜头，不得编造与原文无关的新剧情/新场景/新角色。\n- 每个镜头必须是“可视化”的：让人能拍出来，而不是抽象概括。\n- 每个 prompt 必须包含（缺一不可）：\n  1) 景别（远景/全景/中景/近景/特写）\n  2) 机位角度（平视/俯拍/仰拍/侧拍/斜角等）\n  3) 主体动作与情绪（明确可见的动作/表情）\n  4) 场景环境（地点/时间/天气/道具/背景层次）\n  5) 光影与氛围（主光方向/冷暖/对比/情绪）\n  6) 风格与材质细节（写实/电影感/胶片/赛博等 + 关键材质）\n  7) 画面质量（电影级光影、高清细节、景深、构图、干净画面）\n- 为了视频生成，每个 prompt 还必须包含：\n  A) 镜头运动（推进/拉远/摇镜/跟拍/环绕/变焦/手持感等，选 1~2 个且合理）\n  B) 至少 1 个环境动态元素（风/雨/尘埃/灯光变化/人群流动/车流/水波等）\n- 角色一致性：必须出现主角名字（若用户未提供，请自取一个简短中文名），并在所有镜头保持一致；外观锚点（发型/服装/气质）前后一致。\n- 每个 prompt 至少 90 字，禁止复读用户原句；允许补充镜头语言与视觉细节，但不能新增剧情事件。\n- 如果用户输入包含「【角色设定】/【全局风格】/【镜头规则】/【视频运动】/【负面约束】」等段落，你必须严格遵守并融入每个镜头。\n\n再次强调：只输出 JSON。`
}

const normalizeShots = (rawShots, spec = {}) => {
  const list = Array.isArray(rawShots) ? rawShots : []
  const mode = String(spec?.mode || 'fixed').trim().toLowerCase()

  const minShots = clampInt(spec?.minShots ?? 4, 1, 30, 4)
  const maxShots = clampInt(spec?.maxShots ?? (spec?.targetShots ?? 16), minShots, 30, 16)
  const targetShots = clampInt(spec?.targetShots ?? maxShots, minShots, 30, maxShots)

  const out = list
    .filter(Boolean)
    .map((s, i) => ({
      title: String(s?.title || `镜头 ${String(i + 1).padStart(2, '0')}`).trim(),
      prompt: String(s?.prompt || '').trim()
    }))
    .filter(s => s.prompt)

  if (mode === 'fixed') {
    if (out.length >= targetShots) return out.slice(0, targetShots)
    return out
  }

  return out.slice(0, maxShots)
}

const validateShots = (shotList, spec = {}) => {
  const mode = String(spec?.mode || 'fixed').trim().toLowerCase()

  const minShots = clampInt(spec?.minShots ?? 4, 1, 30, 4)
  const maxShots = clampInt(spec?.maxShots ?? (spec?.targetShots ?? 16), minShots, 30, 16)
  const targetShots = clampInt(spec?.targetShots ?? maxShots, minShots, 30, maxShots)

  const needsVideo = Boolean(spec?.needsVideo)
  const list = Array.isArray(shotList) ? shotList : []

  if (mode === 'fixed') {
    if (list.length !== targetShots) {
      return { ok: false, reason: `镜头数量不符合：需要 ${targetShots}，实际 ${list.length}` }
    }
  } else {
    if (list.length < minShots || list.length > maxShots) {
      return { ok: false, reason: `镜头数量不符合：需要 ${minShots}~${maxShots}，实际 ${list.length}` }
    }
  }

  const minLen = 90
  if (list.some(s => String(s?.prompt || '').trim().length < minLen)) {
    return { ok: false, reason: `有镜头提示词太短（至少 ${minLen} 字）` }
  }

  if (list.some(s => !/(远景|全景|中景|近景|特写)/.test(String(s?.prompt || '')))) {
    return { ok: false, reason: '有镜头缺少景别（远景/全景/中景/近景/特写）' }
  }

  if (list.some(s => !/(平视|俯拍|俯视|仰拍|仰视|侧拍|侧面|斜角|低机位|高机位|鸟瞰|顶视|低角度|高角度)/.test(String(s?.prompt || '')))) {
    return { ok: false, reason: '有镜头缺少机位角度（平视/俯拍/仰拍/侧拍/斜角等）' }
  }

  if (needsVideo) {
    if (list.some(s => !/(推进|推近|拉远|摇镜|跟拍|环绕|推拉|平移|横移|升降|俯冲|旋转|变焦|稳定器|手持|轨道|镜头\s*运动|pan|tilt|dolly|tracking)/i.test(String(s?.prompt || '')))) {
      return { ok: false, reason: '有镜头缺少镜头运动（推进/摇镜/跟拍/环绕等）' }
    }

    if (list.some(s => !/(风|雨|雪|尘|烟|雾|火花|水波|飘动|闪烁|光线变化|灯光变化|人群|车流|粒子)/.test(String(s?.prompt || '')))) {
      return { ok: false, reason: '有镜头缺少环境动态元素（风/雨/灯光变化/人群等）' }
    }
  }

  return { ok: true, reason: '' }
}

const runOnce = async (input, spec, draftJson = null) => {
  const model = chatModel.value || DEFAULT_CHAT_MODEL

  const mode = String(spec?.mode || 'fixed').trim().toLowerCase()
  const minShots = clampInt(spec?.minShots ?? 4, 1, 30, 4)
  const maxShots = clampInt(spec?.maxShots ?? (spec?.targetShots ?? 16), minShots, 30, 16)
  const targetShots = clampInt(spec?.targetShots ?? maxShots, minShots, 30, maxShots)

  const requirement = (mode === 'auto')
    ? `shots 数量必须在 ${minShots}~${maxShots} 之间`
    : `shots 数量必须严格等于 ${targetShots}`

  const messages = [
    { role: 'system', content: buildSystemPrompt({ ...spec, minShots, maxShots, targetShots }) },
    { role: 'user', content: input }
  ]

  if (draftJson) {
    messages.push({
      role: 'user',
      content:
        '你上一次的 JSON 不符合要求（数量/格式/内容太短/不够电影化）。请修正，并确保 ' +
        requirement +
        '。只输出 JSON。\n\n上一次草稿：\n' +
        JSON.stringify(draftJson)
    })
  }

  let response = ''
  for await (const chunk of streamChatCompletions({ model, messages })) {
    response += chunk
  }

  const parsed = extractJsonObject(response)
  return { parsed, response }
}

const handleGenerate = async () => {
  const { story, composed } = buildGenerationInput()

  const maxShots = clampInt(localShotCount.value, 4, 30, 16)
  const minShots = 4
  const autoShotCount = Boolean(props.data?.autoShotCount)
  const needsVideo = Boolean(props.data?.expandWithVideo)

  // Persist shotCount even if user didn't blur the input.
  // - autoShotCount=true: shotCount means MAX shots (upper bound)
  // - autoShotCount=false: shotCount means exact desired count
  updateNode(props.id, { shotCount: maxShots })

  const shotSpec = autoShotCount
    ? { mode: 'auto', minShots, maxShots, needsVideo }
    : { mode: 'fixed', minShots, maxShots, targetShots: maxShots, needsVideo }

  if (!story) {
    window.$message?.warning('请输入剧本/剧情（可在本节点或连接的「剧本输入」节点中填写）')
    return
  }
  if (!isApiConfigured.value) {
    window.$message?.warning('请先配置 API Key')
    return
  }

  // If prompt comes from an upstream script node, sync it into this plan node for visibility.
  if (!String(localPrompt.value || '').trim()) {
    localPrompt.value = story
    updateNode(props.id, { prompt: story, error: '' })
  }

  localError.value = ''
  isGenerating.value = true
  updateNode(props.id, { status: 'generating', error: '', executed: false })

  try {
    const { parsed } = await runOnce(composed, shotSpec)
    if (!parsed) {
      throw new Error('模型返回不是有效 JSON')
    }

    let normalized = normalizeShots(parsed.shots, shotSpec)
    let verdict = validateShots(normalized, shotSpec)

    // Retry once if invalid
    if (!verdict.ok) {
      const { parsed: parsed2 } = await runOnce(composed, shotSpec, parsed)
      if (parsed2) {
        normalized = normalizeShots(parsed2.shots, shotSpec)
        verdict = validateShots(normalized, shotSpec)
      }
    }

    if (!verdict.ok) {
      throw new Error(verdict.reason || '分镜输出不符合要求')
    }

    shots.value = normalized

    const baseUpdate = {
      prompt: story,
      shots: normalized,
      error: ''
    }

    if (autoShotCount) {
      baseUpdate.resolvedShotCount = normalized.length
    }

    // If dynamicExpand is enabled, auto-expand to create shot nodes (ComfyUI-like step-by-step flow)
    if (props.data?.dynamicExpand) {
      // Mark as expanding so the workflow runner waits for node creation too.
      updateNode(props.id, { ...baseUpdate, status: 'expanding', executed: false })

      await nextTick()
      await handleExpand('all')

      updateNode(props.id, { status: 'ready', executed: true })
      window.$message?.success(`分镜已生成并创建 ${normalized.length} 个镜头节点`)
    } else {
      updateNode(props.id, { ...baseUpdate, status: 'ready', executed: true })

      // Legacy: write to fixed slots if connected
      const wroteSlots = writeShotsToSlots(normalized)
      if (wroteSlots || props.data?.slotMode) {
        resetDownstreamConfigsAndOutputs()
      }
      window.$message?.success('分镜已生成')
    }
  } catch (err) {
    const msg = err?.message || '生成失败'
    localError.value = msg
    updateNode(props.id, { status: 'error', error: msg, executed: false })
    window.$message?.error(msg)
  } finally {
    isGenerating.value = false
  }
}

// Auto-execute support (so storyboardPlan participates in "执行工作流")
watch(
  () => props.data?.autoExecute,
  (shouldExecute) => {
    if (shouldExecute && !isGenerating.value) {
      updateNode(props.id, { autoExecute: false })
      setTimeout(() => {
        handleGenerate()
      }, 60)
    }
  },
  { immediate: true }
)

const handleAddShot = () => {
  const next = Array.isArray(shots.value) ? [...shots.value] : []
  next.push({
    title: `镜头 ${String(next.length + 1).padStart(2, '0')}`,
    prompt: ''
  })
  shots.value = next
  updateNode(props.id, { shots: next, shotCount: clampInt(next.length, 4, 30, localShotCount.value) })
}

const moveShot = (idx, dir) => {
  const list = Array.isArray(shots.value) ? [...shots.value] : []
  const j = idx + dir
  if (idx < 0 || idx >= list.length) return
  if (j < 0 || j >= list.length) return
  const tmp = list[idx]
  list[idx] = list[j]
  list[j] = tmp
  shots.value = list
  commitShots()
}

const removeShot = (idx) => {
  const list = Array.isArray(shots.value) ? [...shots.value] : []
  list.splice(idx, 1)
  shots.value = list
  updateNode(props.id, { shots: list })
}

const guessNodeSize = (node) => {
  switch (node.type) {
    case 'text':
      return { w: 320, h: 220 }
    case 'image':
      return { w: 280, h: 360 }
    case 'video':
      return { w: 320, h: 300 }
    case 'imageConfig':
    case 'videoConfig':
      return { w: 300, h: 320 }
    case 'frame':
      return { w: node.data?.w || 720, h: node.data?.h || 460 }
    default:
      return { w: 320, h: 260 }
  }
}

const createFrameAroundNodes = async (nodeIds, label) => {
  const headerH = 40
  const padding = 28

  const list = nodeIds
    .map(id => nodes.value.find(n => n.id === id))
    .filter(Boolean)

  if (list.length === 0) return null

  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity

  for (const n of list) {
    const x = n.position?.x ?? 0
    const y = n.position?.y ?? 0
    const size = (n.dimensions?.width && n.dimensions?.height)
      ? { w: n.dimensions.width, h: n.dimensions.height }
      : guessNodeSize(n)

    minX = Math.min(minX, x)
    minY = Math.min(minY, y)
    maxX = Math.max(maxX, x + size.w)
    maxY = Math.max(maxY, y + size.h)
  }

  if (!isFinite(minX) || !isFinite(minY)) return null

  const frameX = Math.round(minX - padding)
  const frameY = Math.round(minY - padding - headerH)
  const frameW = Math.max(520, Math.round((maxX - minX) + padding * 2))
  const frameH = Math.max(320, Math.round((maxY - minY) + padding * 2 + headerH))

  const minZIndex = Math.min(0, ...nodes.value.map(n => n.zIndex || 0))

  const frameId = addNode(
    'frame',
    { x: frameX, y: frameY },
    { label: label || '分镜', w: frameW, h: frameH },
    { zIndex: minZIndex - 1, draggable: true, connectable: false, dragHandle: '.frame-drag-handle' }
  )

  const selectedIds = new Set(nodeIds)

  // Re-parent nodes (keep absolute positions stable)
  nodes.value = nodes.value.map(n => {
    if (!selectedIds.has(n.id)) return n
    const absX = n.position?.x ?? 0
    const absY = n.position?.y ?? 0
    const { computedPosition, ...rest } = n
    return {
      ...rest,
      parentNode: frameId,
      extent: undefined,
      position: {
        x: Math.round(absX - frameX),
        y: Math.round(absY - frameY)
      },
      dragHandle: '.node-drag-handle'
    }
  })

  manualSaveHistory()
  await nextTick()
  updateNodeInternals([frameId, ...nodeIds])

  return frameId
}

const getExpandedNodeIds = () => {
  return nodes.value
    .filter(n => n?.data?.originPlanId === props.id)
    .map(n => n.id)
}

const cleanupExpandedNodes = async () => {
  const ids = getExpandedNodeIds()
  if (ids.length === 0) return

  const idSet = new Set(ids)
  nodes.value = nodes.value.filter(n => !idSet.has(n.id))
  edges.value = edges.value.filter(e => !idSet.has(e.source) && !idSet.has(e.target))

  manualSaveHistory()
  await nextTick()
}

const handleExpand = async (count) => {
  const list = Array.isArray(shots.value) ? shots.value : []
  if (list.length === 0) return

  // Dynamic expansion is used by reusable workflows; keep it idempotent to avoid node spam.
  if (props.data?.dynamicExpand) {
    await cleanupExpandedNodes()
  }

  const currentNode = nodes.value.find(n => n.id === props.id)
  const nodeX = currentNode?.position?.x ?? 0
  const nodeY = currentNode?.position?.y ?? 0

  const expandWithVideo = Boolean(props.data?.expandWithVideo)
  const imageParams = (props.data?.image_params && typeof props.data.image_params === 'object') ? props.data.image_params : {}
  const videoParams = (props.data?.video_params && typeof props.data.video_params === 'object') ? props.data.video_params : {}

  const nodeSpacing = 400
  const innerRowSpacing = 240
  const blockSpacing = expandWithVideo ? innerRowSpacing * 2 + 120 : innerRowSpacing

  const expandCount = (count === 'all')
    ? list.length
    : Math.max(1, Math.min(Number(count) || 10, list.length))

  const baseX = nodeX + 520
  const baseY = nodeY

  const createdIds = []

  const extraPromptNodes = getExtraPromptNodesForExpansion()
  const imageExtra = extraPromptNodes.filter(n => !isVideoOnlyRole(n.workflowRole))

  for (let i = 0; i < expandCount; i++) {
    const shot = list[i] || {}
    const shotIndex = i + 1
    const y0 = baseY + i * blockSpacing

    const indexLabel = String(shotIndex).padStart(2, '0')

    const textId = addNode('text', { x: baseX, y: y0 }, {
      originPlanId: props.id,
      shotIndex,
      content: String(shot.prompt || '').trim(),
      label: `镜头${indexLabel}提示词`
    })

    const configId = addNode('imageConfig', { x: baseX + nodeSpacing, y: y0 }, {
      originPlanId: props.id,
      shotIndex,
      ...(imageParams || {}),
      label: `首帧${indexLabel}`
    })

    const imageId = addNode('image', { x: baseX + nodeSpacing * 2, y: y0 }, {
      originPlanId: props.id,
      shotIndex,
      url: '',
      label: `首帧${indexLabel}结果`
    })

    addEdge({
      source: textId,
      target: configId,
      sourceHandle: 'right',
      targetHandle: 'left',
      type: 'promptOrder',
      data: { promptOrder: 1 }
    })

    // Propagate global prompts (style/character/negative...) to every shot imageConfig
    connectExtraPrompts(imageExtra, configId, 2)

    addEdge({
      source: configId,
      target: imageId,
      sourceHandle: 'right',
      targetHandle: 'left'
    })

    createdIds.push(textId, configId, imageId)

    if (expandWithVideo) {
      const videoConfigId = addNode('videoConfig', { x: baseX + nodeSpacing * 2, y: y0 + innerRowSpacing }, {
        originPlanId: props.id,
        shotIndex,
        ...(videoParams || {}),
        label: `视频${indexLabel}`
      })

      const videoId = addNode('video', { x: baseX + nodeSpacing * 3, y: y0 + innerRowSpacing }, {
        originPlanId: props.id,
        shotIndex,
        url: '',
        label: `视频${indexLabel}结果`
      })

      // Shot prompt → video config
      addEdge({
        source: textId,
        target: videoConfigId,
        sourceHandle: 'right',
        targetHandle: 'left',
        type: 'promptOrder',
        data: { promptOrder: 1 }
      })

      // Propagate global prompts; motion prompts (workflowRole=motion) only apply to video
      connectExtraPrompts(extraPromptNodes, videoConfigId, 2)

      // First frame image → video config
      addEdge({
        source: imageId,
        target: videoConfigId,
        sourceHandle: 'right',
        targetHandle: 'left',
        type: 'imageRole',
        data: { imageRole: 'first_frame_image' }
      })

      // Dependency edge: imageConfig → videoConfig (so execution runs keyframe first)
      addEdge({ source: configId, target: videoConfigId, sourceHandle: 'right', targetHandle: 'left' })

      // videoConfig → video output placeholder
      addEdge({ source: videoConfigId, target: videoId, sourceHandle: 'right', targetHandle: 'left' })

      createdIds.push(videoConfigId, videoId)
    }
  }

  setTimeout(() => updateNodeInternals(createdIds), 120)

  if (!props.data?.dynamicExpand) {
    window.$message?.success(`已展开 ${expandCount} 个镜头`)
  }
}

const handleDelete = () => {
  removeNode(props.id)
}

const handleDuplicate = () => {
  const newId = duplicateNode(props.id)
  if (newId) {
    window.$message?.success('节点已复制')
    setTimeout(() => updateNodeInternals(newId), 50)
  }
}
</script>

<style scoped>
.storyboard-plan-node-wrapper {
  position: relative;
}
.storyboard-plan-node {
  cursor: default;
}
</style>
