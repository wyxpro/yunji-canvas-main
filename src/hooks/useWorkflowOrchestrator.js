/**
 * Workflow Orchestrator Hook | 工作流编排 Hook
 * 使用回调串行结构编排节点执行
 * 
 * 依赖关系：
 * - imageConfig 执行后产生 image 节点
 * - videoConfig 依赖 image 节点作为输入
 * - 串行执行：等待上一步完成后再执行下一步
 */

import { ref, watch } from 'vue'
import { streamChatCompletions } from '@/api'
import { DEFAULT_CHAT_MODEL } from '@/config/models'
import { useApiConfig } from './useApiConfig'
import { 
  nodes, 
  addNode, 
  addEdge, 
  updateNode 
} from '@/stores/canvas'

// Workflow types | 工作流类型
const WORKFLOW_TYPES = {
  TEXT_TO_IMAGE: 'text_to_image',
  TEXT_TO_IMAGE_TO_VIDEO: 'text_to_image_to_video',
  STORYBOARD: 'storyboard', // 分镜工作流（默认输出图片 keyframe）
  SCRIPT_TO_STORYBOARD_TO_VIDEO: 'script_to_storyboard_to_video', // 剧本 → 分镜 → 批量首帧 → 批量视频（直接生成内容）
  REUSABLE_SCRIPT_WORKFLOW: 'reusable_script_workflow', // 可复用剧本工作流模板（空白模板，用户输入剧本后自动执行）
  MULTI_ANGLE_STORYBOARD: 'multi_angle_storyboard', // 多角度分镜工作流
}

// Multi-angle prompts | 多角度提示词模板
const MULTI_ANGLE_PROMPTS = {
  front: {
    label: '正视',
    english: 'Front View',
    prompt: (character) => `使用提供的图片，生成四宫格分镜，每张四宫格包括人物正面对着镜头的4个景别（远景、中景、近景、和局部特写），保持场景、产品、人物特征的一致性，宫格里的每一张照片保持和提供图片相同的比例。并在图片下方用英文标注这个景别

角色参考: ${character}`
  },
  side: {
    label: '侧视',
    english: 'Side View', 
    prompt: (character) => `使用提供的图片，分别生成四宫格分镜，每张四宫格包括人物侧面角度的4个景别（远景、中景、近景、和局部特写），保持场景、产品、人物特征的一致性，宫格里的每一张照片保持和提供图片相同的比例。并在图片下方用英文标注这个景别

角色参考: ${character}`
  },
  back: {
    label: '后视',
    english: 'Back View',
    prompt: (character) => `使用提供的图片，分别生成四宫格分镜，每张四宫格包括人物背影角度的4个景别（远景、中景、近景、和局部特写），保持场景、产品、人物特征的一致性，宫格里的每一张照片保持和提供图片相同的比例。并在图片下方用英文标注这个景别

角色参考: ${character}`
  },
  top: {
    label: '俯视',
    english: 'Top/Bird\'s Eye View',
    prompt: (character) => `使用提供的图片，分别生成四宫格分镜，每张四宫格包括俯视角度的4个景别（远景、中景、近景、和局部特写），保持场景、产品、人物特征的一致性，宫格里的每一张照片保持和提供图片相同的比例。并在图片下方用英文标注这个景别

角色参考: ${character}`
  }
}

// System prompt for intent analysis | 意图分析系统提示词
const INTENT_ANALYSIS_PROMPT = `# 角色
你是「无限画布」的 AI 架构师。你的任务是分析用户需求，并设计一个最优的节点工作流图（Node Graph）。

# 你的能力
你可以支配以下类型的节点（Node Types）：
1. text: 文本节点。用于存放提示词、负面提示词、风格描述、剧本内容等。
   - 属性: label (标题), content (内容)
2. imageConfig: 文生图配置节点。
   - 属性: label (例如"生成背景"), params (size, style等)
3. videoConfig: 图生视频/文生视频配置节点。
   - 属性: label (例如"生成动画"), params (duration, ratio)
4. image: 图片结果占位符。用于展示 imageConfig 的输出，或作为 videoConfig 的输入。
   - 属性: label (例如"背景图结果")
5. video: 视频结果占位符。用于展示 videoConfig 的输出。
   - 属性: label (例如"最终视频")
6. storyboardPlan: 智能分镜规划节点。**仅当**用户提供长文本/故事/剧本，且需要拆分成多个分镜时使用。
   - 属性: label (例如"AI分镜解析"), prompt (用户的原始剧本), autoShotCount (true/false)

# 布局规则（Layout）
你必须为每个节点分配 grid_x (列, 0开始) 和 grid_y (行, 0开始)。
- 输入在左，输出在右。
- 依赖关系清晰，不要重叠。

# 连接规则（Edges）
- 文本 -> 配置: 使用 type="promptOrder"
- 图片 -> 配置: 使用 type="imageOrder" (如果作为参考图) 或 type="imageRole" (如果是图生视频的首帧，data: { imageRole: "first_frame_image" })
- 配置 -> 结果: 普通连接 (type="default")
- 依赖边: 如果 B 必须在 A 之后执行（但没有数据流），建立 A -> B 的连接。

# 响应格式
必须只输出纯 JSON 对象，不要 Markdown，不要解释。Schema:
{
  "description": "简短描述这个工作流做的事情",
  "nodes": [
    { "id": "t1", "type": "text", "label": "提示词", "content": "一只猫", "grid_x": 0, "grid_y": 0 },
    { "id": "c1", "type": "imageConfig", "label": "文生图", "grid_x": 1, "grid_y": 0 },
    { "id": "o1", "type": "image", "label": "结果图", "grid_x": 2, "grid_y": 0 }
  ],
  "edges": [
    { "source": "t1", "target": "c1", "type": "promptOrder" },
    { "source": "c1", "target": "o1", "type": "default" }
  ]
}

# 示例场景
1. "帮我生成一只赛博朋克的猫" -> text(t1) -> imageConfig(c1) -> image(o1).
2. "让这张图动起来" (用户选中图片) -> (隐含选中的图片) -> text(t1, 视频提示词) -> videoConfig(c1) -> video(o1). 同时连线 选中图 -> c1.
3. "把这个故事做成视频：..." -> text(t1, 剧本) -> storyboardPlan(s1). (由 s1 负责后续展开，你只需创建 s1).
4. "生成多角度视图" -> 多个 text 节点(正视/侧视) -> 多个 imageConfig -> 多个 image.

# 这里的 build_mode (兼容字段)
为了兼容性，请在 JSON 根对象中包含 "build_mode": "generate"。
`

/**
 * Workflow Orchestrator Composable
 */
export const useWorkflowOrchestrator = () => {
  const { chatModel } = useApiConfig()

  // State | 状态
  const isAnalyzing = ref(false)
  const isExecuting = ref(false)
  const currentStep = ref(0)
  const totalSteps = ref(0)
  const executionLog = ref([])
  
  // Active watchers | 活跃的监听器
  const activeWatchers = []
  
  /**
   * Add log entry | 添加日志
   */
  const addLog = (type, message) => {
    executionLog.value.push({ type, message, timestamp: Date.now() })

    // Avoid spamming console in production / during heavy interactions.
    // Enable by running: window.__AI_CANVAS_DEBUG__ = true
    if (typeof window !== 'undefined' && window.__AI_CANVAS_DEBUG__) {
      console.log(`[Workflow ${type}] ${message}`)
    }
  }
  
  /**
   * Clear all watchers | 清除所有监听器
   */
  const clearWatchers = () => {
    activeWatchers.forEach(stop => stop())
    activeWatchers.length = 0
  }
  
  /**
   * Wait for config node to complete and return output node ID
   * 等待配置节点完成并返回输出节点 ID
   */
  const waitForConfigComplete = (configNodeId) => {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('执行超时'))
      }, 5 * 60 * 1000)
      
      let stopWatcher = null
      
      const checkNode = (node) => {
        if (!node) return false
        
        // Check for error | 检查错误
        if (node.data?.error) {
          clearTimeout(timeout)
          if (stopWatcher) stopWatcher()
          reject(new Error(node.data.error))
          return true
        }
        
        // Config node completed with output node ID | 配置节点完成并返回输出节点 ID
        if (node.data?.executed && node.data?.outputNodeId) {
          clearTimeout(timeout)
          if (stopWatcher) stopWatcher()
          addLog('success', `节点 ${configNodeId} 完成，输出节点: ${node.data.outputNodeId}`)
          resolve(node.data.outputNodeId)
          return true
        }
        return false
      }
      
      // Check immediately first | 先立即检查一次
      const node = nodes.value.find(n => n.id === configNodeId)
      if (checkNode(node)) return
      
      // Then watch for changes | 然后监听变化
      stopWatcher = watch(
        () => nodes.value.find(n => n.id === configNodeId),
        (node) => checkNode(node),
        { deep: true }
      )
      
      activeWatchers.push(stopWatcher)
    })
  }
  
  /**
   * Wait for output node (image/video) to be ready
   * 等待输出节点准备好
   */
  const waitForOutputReady = (outputNodeId) => {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('输出节点超时'))
      }, 5 * 60 * 1000)
      
      let stopWatcher = null
      
      const checkNode = (node) => {
        if (!node) return false
        
        if (node.data?.error) {
          clearTimeout(timeout)
          if (stopWatcher) stopWatcher()
          reject(new Error(node.data.error))
          return true
        }
        
        // Output node ready when has URL and not loading
        if (node.data?.url && !node.data?.loading) {
          clearTimeout(timeout)
          if (stopWatcher) stopWatcher()
          addLog('success', `输出节点 ${outputNodeId} 已就绪`)
          resolve(node)
          return true
        }
        return false
      }
      
      // Check immediately first | 先立即检查一次
      const node = nodes.value.find(n => n.id === outputNodeId)
      if (checkNode(node)) return
      
      // Then watch for changes | 然后监听变化
      stopWatcher = watch(
        () => nodes.value.find(n => n.id === outputNodeId),
        (node) => checkNode(node),
        { deep: true }
      )
      
      activeWatchers.push(stopWatcher)
    })
  }
  
  /**
   * Detect workflow type from raw text (fallback when parsing fails)
   * 基于关键词做兜底判断（避免 LLM 返回非 JSON 导致总是退回文生图）
   */
  const isExampleLanguage = (text = '') => /(举个例子|例如|比如|比方说)/i.test(String(text || ''))

  const hasWorkflowMetaWords = (text = '') => /(工作流|模板|节点|开始节点|输入节点|后续节点|流程|编排|搭建|pipeline|workflow)/i.test(String(text || ''))

  const wantsTemplateByStructure = (text = '') => {
    const t = String(text || '')
    return /(搞|建|弄|做|创建|来)\s*(一?个|一套|套)?.{0,10}(工作流|模板|流程)/i.test(t) ||
      /(工作流|模板).{0,12}(让我|能|可以)/i.test(t) ||
      /(让我|能|可以)?\s*输入.{0,20}(就|就能|然后|之后).{0,20}(生成|输出|得到|产出)/i.test(t)
  }

  const explicitlySaysNoDirectContent = (text = '') => {
    const t = String(text || '')
    return /(不要|别|不需要).{0,12}(直接)?(生成|输出|分镜|镜头|内容|剧情)/i.test(t) ||
      /不是.{0,12}(要|让).{0,12}(你|AI).{0,8}(分镜|生成)/i.test(t)
  }

  const wantsDirectGenerateNow = (text = '') => {
    const t = String(text || '')
    const hasNowCues = /(帮我|给我|直接|立刻|马上|现在|尽快)/i.test(t)
    const hasActionCues = /(拆|分|生成|输出|制作|做成)/i.test(t)
    const hasTargetCues = /(分镜|镜头|首帧|关键帧|图片|视频|动画)/i.test(t)
    return hasNowCues && hasActionCues && hasTargetCues
  }

  const looksLikeConcreteScript = (text = '') => {
    const t = String(text || '')

    // Strong markers for scripts: scene headings, dialogue markers, or multi-line screenplay style.
    const hasSceneHeadings =
      /(第[一二三四五六七八九十\d]+(幕|场|场景|景))|镜头\s*\d+|分镜\s*\d+|scene\s*\d+|INT\.|EXT\./i.test(t)
    const hasDialogueQuotes = /[“”「」『』]/.test(t) || /^[^\n]{1,12}[:：].+$/m.test(t)
    const hasManyLines = (t.match(/\n/g) || []).length >= 3

    const strongScriptMarkers = hasSceneHeadings || hasDialogueQuotes || hasManyLines

    // If the user is talking about nodes/workflows, treat it as meta unless strong script markers exist.
    if (hasWorkflowMetaWords(t) && !strongScriptMarkers) return false

    // Otherwise, if it has strong markers, consider it a concrete script.
    return strongScriptMarkers
  }

  const normalizeBuildMode = (mode) => {
    const m = String(mode || '').trim().toLowerCase()
    if (!m) return ''

    // English
    if (m === 'template' || m === 'tmpl' || m === 'build' || m === 'skeleton') return 'template'
    if (m === 'generate' || m === 'gen' || m === 'run' || m === 'execute' || m === 'direct' || m === 'content') return 'generate'

    // Chinese
    if (m.includes('模板') || m.includes('搭建')) return 'template'
    if (m.includes('生成') || m.includes('执行')) return 'generate'

    return ''
  }

  const shouldBuildTemplate = (text = '') => {
    const t = String(text || '')

    // Strong cues: user is explicitly asking to *build a template*.
    const strongCue =
      isExampleLanguage(t)
      || explicitlySaysNoDirectContent(t)
      || wantsTemplateByStructure(t)

    // Weak cue: user mentions nodes/workflow words (could be meta, could be a real script that mentions it).
    const weakCue = hasWorkflowMetaWords(t)

    if (!strongCue && !weakCue) return false

    // If user clearly asks to generate now, do not treat as template.
    if (wantsDirectGenerateNow(t)) return false

    // If the user pasted a concrete script/story and only has weak cue, default to "generate".
    if (!strongCue && looksLikeConcreteScript(t)) return false

    return true
  }

  const detectBuildMode = (text = '') => (shouldBuildTemplate(text) ? 'template' : 'generate')

  const detectWorkflowType = (text = '') => {
    const t = String(text || '')

    // Order matters: multi-angle > script/storyboard->video > storyboard > video > image
    if (/(多角度|正视|侧视|后视|俯视|四宫格|景别|四视图|三视图)/i.test(t)) {
      return WORKFLOW_TYPES.MULTI_ANGLE_STORYBOARD
    }

    // Script/storyboard to per-shot videos (keyframes first)
    const hasStoryboard = /(分镜|分镜头|镜头|镜头语言|剧情|故事|脚本|剧本|广告|短片|mv|预告片|storyboard|shot)/i.test(t)
    const hasVideo = /(视频|动画|图生视频|转成\s*视频|做成\s*(动画|视频)|镜头运动|片头|片尾|video)/i.test(t)
    const wantsPerShot = /(每个\s*(分镜|镜头)|批量|一键|首帧|关键帧|key\s*frame)/i.test(t)

    if (hasStoryboard && hasVideo && wantsPerShot) {
      return WORKFLOW_TYPES.SCRIPT_TO_STORYBOARD_TO_VIDEO
    }

    if (hasStoryboard) {
      return WORKFLOW_TYPES.STORYBOARD
    }

    if (hasVideo) {
      return WORKFLOW_TYPES.TEXT_TO_IMAGE_TO_VIDEO
    }

    return WORKFLOW_TYPES.TEXT_TO_IMAGE
  }

  /**
   * Extract a JSON object from model output
   * 从模型输出中提取 JSON（支持 code fence、修复常见尾逗号/引号问题）
   */
  const extractJsonObject = (raw = '') => {
    if (!raw) return null
    let text = String(raw)

    // Prefer fenced JSON
    const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i)
    if (fenced?.[1]) {
      text = fenced[1]
    }

    const start = text.indexOf('{')
    const end = text.lastIndexOf('}')
    if (start === -1 || end === -1 || end <= start) return null

    let jsonText = text.slice(start, end + 1).trim()

    // Common repairs
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

  /**
   * Normalize parsed intent result
   * 现在的策略：如果 AI 返回了 nodes/edges，直接使用。
   * 如果返回的是旧格式（只有 workflow_type），尝试转换（兼容旧逻辑或兜底）。
   */
  const normalizeIntentResult = (parsed, userInput) => {
    const input = String(userInput || '').trim()
    const result = (typeof parsed === 'object' && parsed) ? { ...parsed } : {}

    // 如果 AI 成功返回了 graph 结构，直接返回，稍作清洗
    if (Array.isArray(result.nodes) && result.nodes.length > 0) {
      result.build_mode = 'graph_generation'
      return result
    }

    // ---------------------------------------------------------
    // Fallback: 如果 AI 还是返回了旧格式 (workflow_type)，我们手动构造一个简单的 Graph
    // 这样前端统一只处理 Graph 结构
    // ---------------------------------------------------------
    
    // (这里保留一点旧逻辑作为兜底，防止模型抽风完全不按新 Prompt 输出)
    const fallbackType = detectWorkflowType(input)
    const type = result.workflow_type || fallbackType
    const nodes = []
    const edges = []
    
    // 简单兜底构造：文生图
    if (type === WORKFLOW_TYPES.TEXT_TO_IMAGE || !type) {
        nodes.push(
            { id: 't1', type: 'text', label: '提示词', content: result.image_prompt || input, grid_x: 0, grid_y: 0 },
            { id: 'c1', type: 'imageConfig', label: '文生图', grid_x: 1, grid_y: 0 },
            { id: 'o1', type: 'image', label: '结果', grid_x: 2, grid_y: 0 }
        )
        edges.push(
            { source: 't1', target: 'c1', type: 'promptOrder' },
            { source: 'c1', target: 'o1', type: 'default' }
        )
    } 
    // 兜底：分镜/长视频 -> 既然 AI 没给 graph，我们就给个 StoryboardPlan 让它去拆
    else if (type === WORKFLOW_TYPES.SCRIPT_TO_STORYBOARD_TO_VIDEO || type === WORKFLOW_TYPES.STORYBOARD) {
         nodes.push(
            { id: 't1', type: 'text', label: '输入内容', content: input, grid_x: 0, grid_y: 0 },
            { id: 'p1', type: 'storyboardPlan', label: '智能分镜', prompt: input, autoShotCount: true, expandWithVideo: true, dynamicExpand: true, grid_x: 1, grid_y: 0 }
        )
        edges.push(
            { source: 't1', target: 'p1', type: 'promptOrder' }
        )
    }
    
    return {
        build_mode: 'graph_generation',
        description: result.description || 'AI 自动生成工作流',
        nodes,
        edges
    }
  }
  /**
   * Analyze user intent | 分析用户意图
   */
  const analyzeIntent = async (userInput) => {
    isAnalyzing.value = true

    const input = String(userInput || '').trim()
    const fallbackType = detectWorkflowType(input)

    try {
      let response = ''
      const resolvedModel = chatModel.value || DEFAULT_CHAT_MODEL

      for await (const chunk of streamChatCompletions({
        model: resolvedModel,
        messages: [
          { role: 'system', content: INTENT_ANALYSIS_PROMPT },
          { role: 'user', content: input }
        ]
      })) {
        response += chunk
      }

      const parsed = extractJsonObject(response)
      if (!parsed) {
        addLog('error', '意图解析返回不是有效 JSON，已使用本地规则兜底')
        return normalizeIntentResult({ workflow_type: fallbackType }, input)
      }

      const normalized = normalizeIntentResult(parsed, input)

      // Quality guard: if the graph is too simple (empty or single node), try again.
      const isTooSimple = (r) => {
          // 如果返回的是旧格式（只有 workflow_type），跳过检查，相信兜底逻辑
          if (!r.nodes) return false;
          // 如果是图模式，必须至少有 2 个节点（除非用户只要一个文本？）
          if (Array.isArray(r.nodes) && r.nodes.length < 2) return true;
          return false;
      }

      if (!isTooSimple(normalized)) {
        return normalized
      }

      addLog('info', '意图解析结果偏简略，正在请求更高级版本...')

      let response2 = ''
      for await (const chunk of streamChatCompletions({
        model: resolvedModel,
        messages: [
          { role: 'system', content: INTENT_ANALYSIS_PROMPT },
          { role: 'user', content: input },
          {
            role: 'user',
            content:
              '你上一次输出太简略/偷懒了。请严格按系统要求输出更高级版本：更细节、更电影感、更完整（storyboard 至少 4 镜头；提示词不要复读原句）。只输出 JSON。\n\n上一次 JSON 草稿：\n' +
              JSON.stringify(parsed)
          }
        ]
      })) {
        response2 += chunk
      }

      const parsed2 = extractJsonObject(response2)
      if (!parsed2) {
        addLog('error', '二次意图解析仍非有效 JSON，已使用第一次结果')
        return normalized
      }

      return normalizeIntentResult(parsed2, input)
    } catch (err) {
      addLog('error', `分析失败: ${err.message}`)
      return normalizeIntentResult({ workflow_type: fallbackType }, input)
    } finally {
      isAnalyzing.value = false
    }
  }
  
  /**
   * Execute text-to-image workflow | 执行文生图工作流
   * text → imageConfig (autoExecute) → image
   */
  const executeTextToImage = async (imagePrompt, position) => {
    const nodeSpacing = 400
    let x = position.x
    
    addLog('info', '开始执行文生图工作流')
    currentStep.value = 1
    totalSteps.value = 2
    
    // Step 1: Create text node for image | 创建图片提示词节点
    const textNodeId = addNode('text', { x, y: position.y }, {
      content: imagePrompt,
      label: '图片提示词'
    })
    addLog('info', `创建图片提示词节点: ${textNodeId}`)
    x += nodeSpacing
    
    // Step 2: Create imageConfig with autoExecute | 创建图片配置节点并自动执行
    currentStep.value = 2
    const imageConfigId = addNode('imageConfig', { x, y: position.y }, {
      label: '文生图',
      autoExecute: true
    })
    addLog('info', `创建图片配置节点: ${imageConfigId}`)
    
    // Connect text → imageConfig
    addEdge({
      source: textNodeId,
      target: imageConfigId,
      sourceHandle: 'right',
      targetHandle: 'left'
    })
    
    addLog('success', '文生图工作流已启动')
    return { textNodeId, imageConfigId }
  }
  
  /**
   * Execute text-to-image-to-video workflow | 执行文生图生视频工作流
   * imageText → imageConfig → image
   * videoText → videoConfig → video
   *              image → videoConfig
   */
  const executeTextToImageToVideo = async (imagePrompt, videoPrompt, position) => {
    const nodeSpacing = 400
    const rowSpacing = 200
    let x = position.x
    
    addLog('info', '开始执行文生图生视频工作流')
    currentStep.value = 1
    totalSteps.value = 5
    
    // Step 1: Create image prompt text node | 创建图片提示词节点
    const imageTextNodeId = addNode('text', { x, y: position.y }, {
      content: imagePrompt,
      label: '图片提示词'
    })
    addLog('info', `创建图片提示词节点: ${imageTextNodeId}`)
    
    // Step 2: Create video prompt text node (below image prompt) | 创建视频提示词节点
    currentStep.value = 2
    const videoTextNodeId = addNode('text', { x, y: position.y + rowSpacing }, {
      content: videoPrompt,
      label: '视频提示词'
    })
    addLog('info', `创建视频提示词节点: ${videoTextNodeId}`)
    x += nodeSpacing
    
    // Step 3: Create imageConfig with autoExecute | 创建图片配置节点
    currentStep.value = 3
    const imageConfigId = addNode('imageConfig', { x, y: position.y }, {
      label: '文生图',
      autoExecute: true
    })
    addLog('info', `创建图片配置节点: ${imageConfigId}`)
    
    // Connect imageText → imageConfig
    addEdge({
      source: imageTextNodeId,
      target: imageConfigId,
      sourceHandle: 'right',
      targetHandle: 'left'
    })
    
    // Step 3: Wait for imageConfig to complete and get image node ID
    // 等待图片配置完成并获取图片节点 ID
    currentStep.value = 3
    addLog('info', '等待图片生成完成...')
    
    try {
      const imageNodeId = await waitForConfigComplete(imageConfigId)
      
      // Wait for image to be ready | 等待图片准备好
      await waitForOutputReady(imageNodeId)
      
      // Get image node position | 获取图片节点位置
      const imageNode = nodes.value.find(n => n.id === imageNodeId)
      x = (imageNode?.position?.x || x) + nodeSpacing
      
      // Step 4: Create videoConfig connected to videoText and image nodes
      // 创建视频配置节点，连接视频提示词和图片节点
      currentStep.value = 4
      const videoConfigId = addNode('videoConfig', { x, y: position.y + rowSpacing }, {
        label: '图生视频',
        autoExecute: true
      })
      addLog('info', `创建视频配置节点: ${videoConfigId}`)
      
      // Connect videoText → videoConfig (for video prompt)
      addEdge({
        source: videoTextNodeId,
        target: videoConfigId,
        sourceHandle: 'right',
        targetHandle: 'left'
      })
      
      // Connect image → videoConfig (for image input)
      addEdge({
        source: imageNodeId,
        target: videoConfigId,
        sourceHandle: 'right',
        targetHandle: 'left'
      })
      
      addLog('success', '文生图生视频工作流已启动')
      return { imageTextNodeId, videoTextNodeId, imageConfigId, imageNodeId, videoConfigId }
    } catch (err) {
      addLog('error', `工作流执行失败: ${err.message}`)
      throw err
    }
  }
  
  /**
   * Execute storyboard workflow | 执行分镜工作流
   * 
   * 布局结构:
   * [角色描述] → [imageConfig] → [角色参考图]
   *                                    ↓
   * [分镜1文本] → [imageConfig] → [分镜1图片]
   * [分镜2文本] → [imageConfig] → [分镜2图片]
   * ...
   */
  const executeStoryboard = async (character, shots, position) => {
    const nodeSpacing = 400
    const rowSpacing = 250
    let x = position.x
    let y = position.y
    
    const shotCount = shots?.length || 0
    addLog('info', `开始执行分镜工作流: ${character?.name || '未知角色'}, ${shotCount} 个分镜`)
    currentStep.value = 1
    totalSteps.value = 2 + shotCount * 2 // 角色生成 + 每个分镜(文本+生成)
    
    const createdNodes = {
      characterTextId: null,
      characterConfigId: null,
      characterImageId: null,
      shots: []
    }
    
    try {
      // Step 1: Create character description text node | 创建角色描述文本节点
      const characterDesc = `${character?.name || '角色'}: ${character?.description || ''}`
      createdNodes.characterTextId = addNode('text', { x, y }, {
        content: characterDesc,
        label: `角色: ${character?.name || '参考'}`
      })
      addLog('info', `创建角色描述节点: ${createdNodes.characterTextId}`)
      x += nodeSpacing
      
      // Step 2: Create character imageConfig with autoExecute | 创建角色参考图配置
      currentStep.value = 2
      createdNodes.characterConfigId = addNode('imageConfig', { x, y }, {
        label: '角色参考图',
        autoExecute: true
      })
      addLog('info', `创建角色配置节点: ${createdNodes.characterConfigId}`)
      
      // Connect character text → imageConfig
      addEdge({
        source: createdNodes.characterTextId,
        target: createdNodes.characterConfigId,
        sourceHandle: 'right',
        targetHandle: 'left'
      })
      
      // Wait for character image to complete | 等待角色参考图完成
      addLog('info', '等待角色参考图生成...')
      createdNodes.characterImageId = await waitForConfigComplete(createdNodes.characterConfigId)
      await waitForOutputReady(createdNodes.characterImageId)
      addLog('success', '角色参考图已生成')
      
      // Get character image position for layout | 获取角色图位置用于布局
      const charImageNode = nodes.value.find(n => n.id === createdNodes.characterImageId)
      x = (charImageNode?.position?.x || x) + nodeSpacing
      
      // Step 3+: Create each shot | 创建每个分镜
      for (let i = 0; i < shotCount; i++) {
        const shot = shots[i]
        const shotY = y + (i + 1) * rowSpacing
        let shotX = position.x
        
        currentStep.value = 3 + i * 2
        
        // Create shot text node | 创建分镜文本节点
        const shotTextId = addNode('text', { x: shotX, y: shotY }, {
          content: shot.prompt,
          label: `分镜${i + 1}: ${shot.title}`
        })
        addLog('info', `创建分镜${i + 1}文本节点: ${shotTextId}`)
        shotX += nodeSpacing
        
        // Create shot imageConfig | 创建分镜配置节点
        currentStep.value = 4 + i * 2
        const shotConfigId = addNode('imageConfig', { x: shotX, y: shotY }, {
          label: `分镜${i + 1}`,
          autoExecute: true
        })
        addLog('info', `创建分镜${i + 1}配置节点: ${shotConfigId}`)
        
        // Connect shot text → imageConfig
        addEdge({
          source: shotTextId,
          target: shotConfigId,
          sourceHandle: 'right',
          targetHandle: 'left'
        })
        
        // Connect character image → shot imageConfig (as reference)
        addEdge({
          source: createdNodes.characterImageId,
          target: shotConfigId,
          sourceHandle: 'right',
          targetHandle: 'left'
        })
        
        // Wait for this shot to complete before next | 等待当前分镜完成
        addLog('info', `等待分镜${i + 1}生成...`)
        const shotImageId = await waitForConfigComplete(shotConfigId)
        await waitForOutputReady(shotImageId)
        addLog('success', `分镜${i + 1}已生成`)
        
        createdNodes.shots.push({
          textId: shotTextId,
          configId: shotConfigId,
          imageId: shotImageId,
          title: shot.title
        })
      }
      
      addLog('success', `分镜工作流完成，共生成 ${shotCount} 个分镜`)
      return createdNodes
    } catch (err) {
      addLog('error', `分镜工作流执行失败: ${err.message}`)
      throw err
    }
  }
  
  /**
   * Execute multi-angle storyboard workflow | 执行多角度分镜工作流
   * 
   * 布局结构:
   * [主角色图] ──┬──> [正视提示词] → [imageConfig] → [正视四宫格]
   *              ├──> [侧视提示词] → [imageConfig] → [侧视四宫格]
   *              ├──> [后视提示词] → [imageConfig] → [后视四宫格]
   *              └──> [俯视提示词] → [imageConfig] → [俯视四宫格]
   * 
   * @param {object} multiAngle - 多角度参数 { character_description }
   * @param {object} position - 起始位置
   */
  const executeMultiAngleStoryboard = async (multiAngle, position) => {
    const nodeSpacing = 400
    const rowSpacing = 300
    let x = position.x
    let y = position.y
    
    const characterDesc = multiAngle?.character_description || ''
    const angles = ['front', 'side', 'back', 'top']
    
    addLog('info', `开始执行多角度分镜工作流: ${characterDesc.slice(0, 30)}...`)
    currentStep.value = 1
    totalSteps.value = 2 + angles.length * 2 // 角色图 + 每个角度(提示词+生成)
    
    const createdNodes = {
      characterImageId: null,
      angles: []
    }
    
    try {
      // Step 1: Create character image node (user uploads or existing)
      // 创建角色图节点（用户上传或已有）
      const characterImageId = addNode('image', { x, y }, {
        url: '',
        label: '主角色图（请上传）',
        isCharacterRef: true
      })
      createdNodes.characterImageId = characterImageId
      addLog('info', `创建主角色图节点: ${characterImageId}`)
      
      // Step 2: Create 4 angle nodes in parallel layout
      // 创建4个角度的节点（并行布局）
      const angleX = x + nodeSpacing + 100
      
      for (let i = 0; i < angles.length; i++) {
        const angleKey = angles[i]
        const angleConfig = MULTI_ANGLE_PROMPTS[angleKey]
        const angleY = y + i * rowSpacing
        let currentX = angleX
        
        currentStep.value = 2 + i * 2
        
        // Create angle prompt text node | 创建角度提示词节点
        const promptContent = angleConfig.prompt(characterDesc)
        const textNodeId = addNode('text', { x: currentX, y: angleY }, {
          content: promptContent,
          label: `${angleConfig.label}提示词`
        })
        addLog('info', `创建${angleConfig.label}提示词节点: ${textNodeId}`)
        currentX += nodeSpacing
        
        // Create imageConfig node | 创建图片配置节点
        currentStep.value = 3 + i * 2
        const configNodeId = addNode('imageConfig', { x: currentX, y: angleY }, {
          label: `${angleConfig.label} (${angleConfig.english})`,
          autoExecute: false // 不自动执行，等待用户上传角色图
        })
        addLog('info', `创建${angleConfig.label}配置节点: ${configNodeId}`)
        
        // Connect text → imageConfig
        addEdge({
          source: textNodeId,
          target: configNodeId,
          sourceHandle: 'right',
          targetHandle: 'left'
        })
        
        // Connect character image → imageConfig (as reference)
        addEdge({
          source: characterImageId,
          target: configNodeId,
          sourceHandle: 'right',
          targetHandle: 'left'
        })
        
        createdNodes.angles.push({
          key: angleKey,
          label: angleConfig.label,
          english: angleConfig.english,
          textId: textNodeId,
          configId: configNodeId,
          imageId: null
        })
      }
      
      addLog('success', `多角度分镜工作流已创建，请上传主角色图后点击各节点的"立即生成"按钮`)
      window.$message?.info('请先上传主角色图，然后点击各角度节点的"立即生成"按钮')
      
      return createdNodes
    } catch (err) {
      addLog('error', `多角度分镜工作流执行失败: ${err.message}`)
      throw err
    }
  }
  
  /**
   * Main execute function based on workflow type
   * 根据工作流类型执行
   * @param {object} params - 工作流参数
   * @param {object} position - 起始位置
   */
  const executeWorkflow = async (params, position) => {
    isExecuting.value = true
    clearWatchers()
    executionLog.value = []
    
    const { workflow_type, image_prompt, video_prompt, character, shots, multi_angle } = params
    
    try {
      switch (workflow_type) {
        case WORKFLOW_TYPES.MULTI_ANGLE_STORYBOARD:
          return await executeMultiAngleStoryboard(multi_angle, position)
        case WORKFLOW_TYPES.STORYBOARD:
          return await executeStoryboard(character, shots, position)
        case WORKFLOW_TYPES.TEXT_TO_IMAGE_TO_VIDEO:
          return await executeTextToImageToVideo(image_prompt, video_prompt, position)
        case WORKFLOW_TYPES.TEXT_TO_IMAGE:
        default:
          return await executeTextToImage(image_prompt, position)
      }
    } finally {
      isExecuting.value = false
      clearWatchers()
    }
  }
  
  /**
   * Convenience method for simple text-to-image | 简便方法
   */
  const createTextToImageWorkflow = (imagePrompt, position) => {
    return executeWorkflow({ 
      workflow_type: WORKFLOW_TYPES.TEXT_TO_IMAGE, 
      image_prompt: imagePrompt 
    }, position)
  }
  
  /**
   * Convenience method for multi-angle storyboard | 多角度分镜简便方法
   */
  const createMultiAngleStoryboard = (characterDescription, position) => {
    return executeWorkflow({
      workflow_type: WORKFLOW_TYPES.MULTI_ANGLE_STORYBOARD,
      multi_angle: { character_description: characterDescription }
    }, position)
  }
  
  /**
   * Reset state | 重置状态
   */
  const reset = () => {
    isAnalyzing.value = false
    isExecuting.value = false
    currentStep.value = 0
    totalSteps.value = 0
    executionLog.value = []
    clearWatchers()
  }
  
  return {
    // State
    isAnalyzing,
    isExecuting,
    currentStep,
    totalSteps,
    executionLog,
    
    // Methods
    analyzeIntent,
    executeWorkflow,
    createTextToImageWorkflow,
    createMultiAngleStoryboard,
    reset,
    
    // Constants
    WORKFLOW_TYPES,
    MULTI_ANGLE_PROMPTS
  }
}

export default useWorkflowOrchestrator
