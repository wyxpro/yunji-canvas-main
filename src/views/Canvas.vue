<template>
  <!-- Canvas page | 画布页面 -->
  <div
    class="canvas-page h-screen w-screen flex flex-col bg-[var(--bg-primary)] overflow-hidden font-sans relative selection:bg-purple-500/30"
    :class="{ 'is-dragging': isNodeDragging }"
  >
    
    <!-- Floating HUD Header -->
    <header class="absolute top-6 left-6 right-6 h-14 z-40 flex items-center justify-between px-2 pointer-events-none">
      <!-- Left Controls -->
      <div class="pointer-events-auto flex items-center gap-3 bg-[var(--glass-bg)] rounded-full border border-[color:var(--glass-border)] px-4 py-2 shadow-sm transition-all hover:border-purple-500/20">
        <button 
          @click="goBack"
          class="p-1.5 hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
        >
          <n-icon :size="20"><chevron-back-outline /></n-icon>
        </button>
        <div class="h-4 w-px bg-black/10 dark:bg-white/10 mx-1"></div>
        <n-dropdown :options="projectOptions" @select="handleProjectAction" trigger="click">
          <button class="flex items-center gap-2 hover:bg-black/5 dark:hover:bg-white/5 px-2 py-1 rounded-lg transition-colors group">
            <span class="font-bold text-sm tracking-wide text-[var(--text-primary)] transition-colors">{{ projectName }}</span>
            <n-icon :size="14" class="opacity-50 group-hover:opacity-100 text-[var(--text-primary)]"><chevron-down-outline /></n-icon>
          </button>
        </n-dropdown>
      </div>

      <!-- Right Controls -->
      <div class="pointer-events-auto flex items-center gap-3 bg-[var(--glass-bg)] rounded-full border border-[color:var(--glass-border)] px-4 py-2 shadow-sm">
        <button 
          @click="toggleTheme"
          class="w-8 h-8 flex items-center justify-center rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors text-[var(--text-secondary)] hover:text-[var(--accent-color)]"
        >
          <n-icon :size="18">
            <sunny-outline v-if="isDark" />
            <moon-outline v-else />
          </n-icon>
        </button>
        <button 
          @click="showDownloadModal = true"
          class="w-8 h-8 flex items-center justify-center rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          :class="{ 'text-purple-500 dark:text-purple-400': hasDownloadableAssets }"
          title="下载素材"
        >
          <n-icon :size="18"><download-outline /></n-icon>
        </button>
        <button 
          @click="showApiSettings = true"
          class="w-8 h-8 flex items-center justify-center rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          :class="{ 'text-green-500 dark:text-green-400': isApiConfigured }"
          title="设置"
        >
          <n-icon :size="18"><settings-outline /></n-icon>
        </button>
      </div>
    </header>

    <!-- Main canvas area -->
    <div class="flex-1 relative overflow-hidden bg-[var(--bg-primary)]">
      <!-- Deep Space Background -->
      <div class="absolute inset-0 z-0 opacity-35 pointer-events-none">
        <Background :gap="40" :size="1" :color="isDark ? '#334155' : '#cbd5e1'" />
      </div>

      <!-- Vue Flow canvas -->
      <VueFlow
        :key="flowKey"
        v-model:nodes="nodes"
        v-model:edges="edges"
        v-model:viewport="viewport"
        :node-types="nodeTypes"
        :edge-types="edgeTypes"
        :default-viewport="canvasViewport"
        :min-zoom="0.1"
        :max-zoom="2"
        :snap-to-grid="false"
        :snap-grid="[10, 10]"
        :elements-selectable="true"
        :select-nodes-on-drag="true"
        :elevate-nodes-on-select="false"
        selection-key-code="Shift"
        :multi-selection-key-code="['Control', 'Shift']"
        :delete-key-code="null"
        no-drag-class-name="nodrag"
        no-pan-class-name="nopan"
        @connect="onConnect"
        @node-click="onNodeClick"
        @pane-click="onPaneClick"
        @viewport-change="handleViewportChange"
        @nodes-change="onNodesChange"
        @edges-change="onEdgesChange"
        @node-drag-start="onNodeDragStart"
        @node-drag-stop="onNodeDragStop"
        @selection-drag-start="onSelectionDragStart"
        @selection-drag-stop="onSelectionDragStop"
        class="canvas-flow z-10"
      >
        <MiniMap 
          v-if="!isMobile"
          position="bottom-right"
          :pannable="true"
          :zoomable="true"
class="!bg-[var(--glass-bg)] !border !border-[color:var(--glass-border)] !rounded-2xl !bottom-24 !right-6 !shadow-lg"
          node-color="#8b5cf6"
          :mask-color="isDark ? 'rgba(0,0,0,0.6)' : 'rgba(2, 6, 23, 0.12)'"
        />
      </VueFlow>

      <!-- HUD Left Toolbar -->
      <aside class="absolute left-6 top-1/2 -translate-y-1/2 flex flex-col gap-4 p-2 z-30 pointer-events-none">
<div class="pointer-events-auto flex flex-col gap-2 bg-[var(--glass-bg)] rounded-2xl border border-[color:var(--glass-border)] p-2 shadow-sm transition-all hover:border-purple-500/20">
          <button 
            @click="showNodeMenu = !showNodeMenu"
            class="w-10 h-10 flex items-center justify-center rounded-xl bg-purple-600 text-white shadow-sm hover:bg-purple-500 transition-colors"
            title="添加节点"
          >
            <n-icon :size="20"><add-outline /></n-icon>
          </button>
          
          <div class="w-6 h-px bg-black/10 dark:bg-white/10 mx-auto my-1"></div>
          
          <button 
            @click="showWorkflowPanel = true"
            class="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-black/5 dark:hover:bg-white/10 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-all group relative"
            title="工作流"
          >
            <n-icon :size="20"><apps-outline /></n-icon>
             <div class="absolute left-full ml-3 px-2 py-1 bg-white/80 dark:bg-black/80 backdrop-blur text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap border border-black/10 dark:border-white/10 pointer-events-none text-gray-800 dark:text-white">工作流</div>
          </button>
          
          <button 
            v-for="tool in tools" 
            :key="tool.id"
            @click="tool.action"
            :disabled="tool.disabled && tool.disabled()"
            class="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-black/5 dark:hover:bg-white/10 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed group relative"
          >
            <n-icon :size="20"><component :is="tool.icon" /></n-icon>
             <div class="absolute left-full ml-3 px-2 py-1 bg-white/80 dark:bg-black/80 backdrop-blur text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap border border-black/10 dark:border-white/10 pointer-events-none text-gray-800 dark:text-white">{{ tool.name }}</div>
          </button>
        </div>
      </aside>

      <!-- Node Menu Popup (Crystal Style) -->
      <Transition name="fade-slide">
        <div 
          v-if="showNodeMenu"
          class="absolute left-24 top-1/2 -translate-y-1/2 bg-[var(--glass-bg)] rounded-2xl border border-[color:var(--glass-border)] shadow-lg p-2 z-40 w-56 flex flex-col gap-1"
        >
          <div class="px-3 py-2 text-[10px] font-bold text-gray-500 uppercase tracking-widest border-b border-black/5 dark:border-white/5 mb-1">添加到画布</div>
          <button 
            v-for="nodeType in nodeTypeOptions" 
            :key="nodeType.type"
            @click="addNewNode(nodeType.type)"
            class="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 transition-all text-left group"
          >
            <div class="w-8 h-8 rounded-lg flex items-center justify-center bg-black/5 dark:bg-white/5 group-hover:bg-purple-500/20 transition-colors border border-black/5 dark:border-white/5 group-hover:border-purple-500/30">
              <n-icon :size="16" :color="nodeType.color"><component :is="nodeType.icon" /></n-icon>
            </div>
            <span class="text-sm font-medium text-gray-600 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white tracking-wide">{{ nodeType.name }}</span>
          </button>
        </div>
      </Transition>

      <!-- Bottom Controls (Zoom HUD) -->
      <div class="absolute bottom-6 left-6 flex items-center gap-1 bg-[var(--glass-bg)] rounded-full border border-[color:var(--glass-border)] p-1.5 z-30 shadow-sm">
        <button 
          @click="fitView({ padding: 0.2 })" 
          class="p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
          title="适应视图"
        >
          <n-icon :size="16"><locate-outline /></n-icon>
        </button>
        <div class="h-3 w-px bg-black/10 dark:bg-white/10 mx-1"></div>
        <button @click="zoomOut" class="p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
          <n-icon :size="16"><remove-outline /></n-icon>
        </button>
        <span class="text-[10px] font-mono min-w-[36px] text-center text-gray-500 dark:text-gray-400">{{ Math.round(viewport.zoom * 100) }}%</span>
        <button @click="zoomIn" class="p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
          <n-icon :size="16"><add-outline /></n-icon>
        </button>
      </div>

      <!-- Command Center (Futuristic Chat) -->
      <div class="absolute bottom-8 left-1/2 -translate-x-1/2 w-full max-w-2xl px-4 z-40">
        <!-- AI Thinking Indicator -->
        <Transition name="fade">
          <div 
            v-if="isProcessing" 
            class="mb-4 mx-auto max-w-fit px-4 py-2 bg-white/90 dark:bg-[#0a0f1c]/90 rounded-full border border-purple-500/20 shadow-sm flex items-center gap-3"
          >
            <n-spin :size="14" stroke="#a855f7" />
            <span class="text-xs font-medium text-purple-600 dark:text-purple-200 tracking-wide animate-pulse">AI 思考中</span>
          </div>
        </Transition>

        <div class="relative group">
          <div class="relative bg-white dark:bg-[#0a0f1c] rounded-[19px] border border-black/10 dark:border-white/10 p-1 shadow-lg flex items-end gap-2">
            <!-- AI Polish Button -->
             <button 
              @click="handlePolish"
              :disabled="isProcessing || !chatInput.trim()"
              class="mb-1 ml-1 w-9 h-9 flex items-center justify-center rounded-xl bg-black/5 dark:bg-white/5 hover:bg-purple-500/20 text-gray-500 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-300 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              title="润色提示词"
            >
              <n-icon :size="18"><sparkles-outline /></n-icon>
            </button>

            <!-- Input Area -->
            <div class="flex-1 min-h-[48px] flex items-center">
              <textarea
                v-model="chatInput"
                :placeholder="inputPlaceholder"
                :disabled="isProcessing"
                class="w-full bg-transparent resize-none outline-none text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-600 px-2 py-3 text-base font-light leading-relaxed disabled:opacity-50"
                rows="1"
                style="min-height: 24px; max-height: 120px;"
                @click.stop
                @keydown.stop
                @keydown.enter.exact="handleEnterKey"
                @keydown.enter.ctrl="sendMessage"
              />
            </div>

            <!-- Right Actions -->
            <div class="flex items-center gap-2 mb-1 mr-1">
              <n-switch v-model:value="aiWorkflowBuilderEnabled" size="small" :round="false" class="!opacity-70 hover:!opacity-100" />
              
              <button 
                @click="sendMessage"
                :disabled="isProcessing"
                class="w-9 h-9 rounded-xl bg-purple-600 hover:bg-purple-500 text-white flex items-center justify-center shadow-lg transition-all transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                <n-icon v-if="!isProcessing" :size="18"><arrow-forward-outline /></n-icon>
                <div v-else class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              </button>
            </div>
          </div>
          
          <!-- Quick Suggestions (Below Input) -->
          <div class="absolute top-full left-0 right-0 flex justify-center gap-2 mt-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none group-hover:pointer-events-auto">
             <button 
              v-for="tag in suggestions.slice(0, 3)" 
              :key="tag"
              @click="chatInput = tag"
              class="px-3 py-1 text-[10px] uppercase tracking-wider font-bold rounded-full bg-white/60 dark:bg-black/60 backdrop-blur border border-black/10 dark:border-white/10 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:border-purple-500/50 transition-all"
            >
              {{ tag }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modals -->
    <ApiSettings v-model:show="showApiSettings" />
    <DownloadModal v-model:show="showDownloadModal" />
    <WorkflowPanel
      v-model:show="showWorkflowPanel"
      @ai-generate="handleAiGenerateWorkflow"
      @save-workflow="handleSaveWorkflowTemplate"
      @add-workflow-template="handleAddWorkflowTemplate"
    />

    <n-modal v-model:show="showAiPlanModal" preset="dialog" :show-icon="false" class="custom-modal backdrop-blur-3xl bg-white/90 dark:bg-[#0a0f1c]/95 border border-black/10 dark:border-white/10">
      <template #header>
        <div class="flex items-center gap-2 text-gray-900 dark:text-white">
          <n-icon class="text-purple-500"><sparkles-outline /></n-icon>
          <span class="font-bold">AI 解析完成</span>
        </div>
      </template>

      <div class="py-4 space-y-3">
        <div class="text-xs text-gray-600 dark:text-gray-400 leading-relaxed space-y-1">
          <div v-if="aiPlanResult?.description" class="mb-2">
            <span class="text-gray-800 dark:text-gray-300 font-bold block mb-1">说明：</span>
            <span class="text-gray-600 dark:text-gray-400">{{ aiPlanResult.description }}</span>
          </div>
          
          <div v-if="aiPlanResult?.nodes?.length" class="bg-black/5 dark:bg-white/5 rounded-xl p-3 border border-black/10 dark:border-white/10">
             <div class="flex items-center gap-4 mb-2">
                <div class="flex flex-col">
                  <span class="text-[10px] text-gray-500 uppercase">节点</span>
                  <span class="text-lg font-bold text-gray-900 dark:text-white">{{ aiPlanResult.nodes.length }}</span>
                </div>
                <div class="flex flex-col">
                  <span class="text-[10px] text-gray-500 uppercase">连线</span>
                  <span class="text-lg font-bold text-gray-900 dark:text-white">{{ aiPlanResult.edges?.length || 0 }}</span>
                </div>
             </div>
             <div class="text-[10px] text-gray-500 max-h-[100px] overflow-auto space-y-1">
                <div v-for="n in aiPlanResult.nodes.slice(0, 8)" :key="n.id" class="flex items-center gap-2">
                  <div class="w-1.5 h-1.5 rounded-full bg-purple-500"></div>
                  <span class="text-gray-800 dark:text-gray-300">{{ n.label || n.type }}</span>
                </div>
                <div v-if="aiPlanResult.nodes.length > 8" class="pl-3.5">...等 {{ aiPlanResult.nodes.length - 8 }} 个节点</div>
             </div>
          </div>

          <div v-else class="text-yellow-500/80">
            <span class="block">即将使用经典模式创建：</span>
            <span class="font-mono text-xs">{{ workflowTypeLabel(aiPlanResult?.workflow_type) }}</span>
          </div>
        </div>

        <details class="group">
          <summary class="text-[10px] text-gray-600 dark:text-gray-500 cursor-pointer hover:text-gray-900 dark:hover:text-gray-400 select-none list-none flex items-center gap-1">
            <n-icon><chevron-down-outline class="transform transition-transform group-open:rotate-180" /></n-icon>
            查看原始 JSON
          </summary>
          <pre class="mt-2 text-[10px] text-gray-600 dark:text-gray-500 bg-black/5 dark:bg-black/30 border border-black/10 dark:border-white/5 rounded-lg p-2 max-h-[200px] overflow-auto font-mono leading-tight">{{ aiPlanJson }}</pre>
        </details>
      </div>

      <template #action>
        <div class="flex gap-3">
          <button @click="showAiPlanModal = false" class="px-4 py-2 rounded-lg text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors">取消</button>
          <button @click="confirmCreateAiPlanAsIs" :disabled="isProcessing || !aiPlanResult" class="px-6 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold shadow-lg shadow-purple-900/30 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none">确认创建</button>
        </div>
      </template>
    </n-modal>

    <n-modal v-model:show="showRenameModal" preset="dialog" title="重命名项目" :show-icon="false" class="custom-modal backdrop-blur-3xl bg-white/90 dark:bg-[#0a0f1c]/95 border border-black/10 dark:border-white/10">
      <template #header>
        <div class="flex items-center gap-2 text-gray-900 dark:text-white">
          <n-icon class="text-purple-500"><create-outline /></n-icon>
          <span class="font-bold">重命名项目</span>
        </div>
      </template>
      <div class="py-6">
        <n-input v-model:value="renameValue" placeholder="项目名称" class="!bg-black/5 dark:!bg-white/5 !border-black/10 dark:!border-white/10 !text-gray-900 dark:!text-white" />
      </div>
      <template #action>
        <div class="flex gap-3">
          <button @click="showRenameModal = false" class="px-4 py-2 rounded-lg text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors">取消</button>
          <button @click="confirmRename" class="px-6 py-2 rounded-lg bg-white text-black font-bold hover:bg-gray-200 transition-colors">保存</button>
        </div>
      </template>
    </n-modal>

    <n-modal v-model:show="showDeleteModal" preset="dialog" title="删除项目" type="warning" :show-icon="false" class="custom-modal backdrop-blur-3xl bg-white/90 dark:bg-[#0a0f1c]/95 border border-black/10 dark:border-white/10">
      <template #header>
        <div class="flex items-center gap-2 text-red-400">
          <n-icon><trash-outline /></n-icon>
          <span>删除项目</span>
        </div>
      </template>
      <p class="py-4 text-gray-700 dark:text-gray-300">确定要删除“{{ projectName }}”吗？此操作无法撤销。</p>
      <template #action>
        <div class="flex gap-3">
          <button @click="showDeleteModal = false" class="px-4 py-2 rounded-lg text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors">取消</button>
          <button @click="confirmDelete" class="px-6 py-2 rounded-lg bg-red-500/10 border border-red-500/50 text-red-400 font-bold hover:bg-red-500/20 transition-colors">删除</button>
        </div>
      </template>
    </n-modal>
  </div>
</template>

<script setup>
/**
 * Canvas view component | 画布视图组件
 * Refined with "Obsidian & Aurora" High-End Aesthetic
 */
import { ref, computed, onMounted, onUnmounted, watch, nextTick, markRaw } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { VueFlow, useVueFlow } from '@vue-flow/core'
import { Background } from '@vue-flow/background'
import { MiniMap } from '@vue-flow/minimap'
import { NIcon, NSwitch, NDropdown, NSpin, NModal, NInput } from 'naive-ui'
import { 
  ChevronBackOutline,
  ChevronDownOutline,
  SunnyOutline, 
  MoonOutline,
  SettingsOutline,
  AddOutline,
  ImageOutline,
  ArrowForwardOutline,
  RefreshOutline,
  TextOutline,
  VideocamOutline,
  ColorPaletteOutline,
  ArrowUndoOutline,
  ArrowRedoOutline,
  GridOutline,
  LocateOutline,
  PlayOutline,
  AlbumsOutline,
  LayersOutline,
  ContractOutline,
  LockClosedOutline,
  LockOpenOutline,
  RemoveOutline,
  DownloadOutline,
  AppsOutline,
  TrashOutline,
  CreateOutline,
  SparklesOutline
} from '@vicons/ionicons5'
import { isDark, toggleTheme } from '../stores/theme'
import { nodes, edges, addNode, addEdge, removeNode, removeEdge, updateNode, updateNodeProps, initSampleData, loadProject, saveProject, clearCanvas, canvasViewport, updateViewport, undo, redo, canUndo, canRedo, manualSaveHistory, requestAutoSave } from '../stores/canvas'
import { loadAllModels } from '../stores/models'
import {
  createWorkflowTemplateFromSelection,
  getWorkflowTemplateById
} from '../stores/workflowTemplates'
import { useApiConfig, useAppSettings, useChat, useWorkflowOrchestrator } from '../hooks'
import { projects, initProjectsStore, updateProject, renameProject, currentProject } from '../stores/projects'

// Components
import ApiSettings from '../components/ApiSettings.vue'
import DownloadModal from '../components/DownloadModal.vue'
import WorkflowPanel from '../components/WorkflowPanel.vue'

// API Config hook
const { isConfigured: isApiConfigured } = useApiConfig()
const { aiWorkflowBuilderEnabled } = useAppSettings()

// Initialize models
onMounted(() => {
  loadAllModels()
})

// Chat Logic
const CHAT_TEMPLATES = {
  imagePrompt: {
    name: '生图提示词',
    systemPrompt: '你是一个专业的AI绘画提示词专家。将用户输入的内容美化成高质量的生图提示词，包含风格、光线、構图、细节等要素。直接返回提示词，不要其他解释。'
  }
}

const { 
  loading: chatLoading, 
  status: chatStatus, 
  currentResponse, 
  send: sendChat 
} = useChat({
  systemPrompt: CHAT_TEMPLATES.imagePrompt.systemPrompt
})

const {
  analyzeIntent,
  WORKFLOW_TYPES,
  MULTI_ANGLE_PROMPTS
} = useWorkflowOrchestrator()

// Custom node components
import FrameNode from '../components/nodes/FrameNode.vue'
import TextNode from '../components/nodes/TextNode.vue'
import ImageConfigNode from '../components/nodes/ImageConfigNode.vue'
import VideoNode from '../components/nodes/VideoNode.vue'
import ImageNode from '../components/nodes/ImageNode.vue'
import VideoConfigNode from '../components/nodes/VideoConfigNode.vue'
import StoryboardPlanNode from '../components/nodes/StoryboardPlanNode.vue'
import ImageRoleEdge from '../components/edges/ImageRoleEdge.vue'
import PromptOrderEdge from '../components/edges/PromptOrderEdge.vue'
import ImageOrderEdge from '../components/edges/ImageOrderEdge.vue'
import DefaultEdge from '../components/edges/DefaultEdge.vue'

const router = useRouter()
const route = useRoute()
const { viewport, zoomIn, zoomOut, fitView, updateNodeInternals } = useVueFlow()

const nodeTypes = {
  frame: markRaw(FrameNode),
  text: markRaw(TextNode),
  imageConfig: markRaw(ImageConfigNode),
  video: markRaw(VideoNode),
  image: markRaw(ImageNode),
  videoConfig: markRaw(VideoConfigNode),
  storyboardPlan: markRaw(StoryboardPlanNode)
}

const edgeTypes = {
  default: markRaw(DefaultEdge),
  imageRole: markRaw(ImageRoleEdge),
  promptOrder: markRaw(PromptOrderEdge),
  imageOrder: markRaw(ImageOrderEdge)
}

const isEditableTarget = (target) => {
  if (!target || !(target instanceof HTMLElement)) return false
  return !!target.closest('input, textarea, select, [contenteditable="true"], [role="textbox"], .n-input, .nodrag')
}

const handleCanvasDeleteKey = (event) => {
  if (!['Backspace', 'Delete'].includes(event.key)) return
  if (isEditableTarget(event.target)) return

  const selectedNodeIds = nodes.value
    .filter(node => node.selected && !node.data?.locked)
    .map(node => node.id)
  const selectedEdgeIds = edges.value
    .filter(edge => edge.selected)
    .map(edge => edge.id)

  if (!selectedNodeIds.length && !selectedEdgeIds.length) return

  event.preventDefault()
  selectedEdgeIds.forEach(id => removeEdge(id))
  selectedNodeIds.forEach(id => removeNode(id))
}

// UI State
const showNodeMenu = ref(false)
const chatInput = ref('')
const isMobile = ref(false)
const showApiSettings = ref(false)
const isProcessing = ref(false)
const flowKey = ref(Date.now())

const showRenameModal = ref(false)
const showDeleteModal = ref(false)
const showDownloadModal = ref(false)
const showWorkflowPanel = ref(false)

// AI intent preview (Cursor-like confirm) | AI 意图预览确认
const showAiPlanModal = ref(false)
const aiPlanResult = ref(null)
const aiPlanInput = ref('')
const aiPlanUseSelection = ref(true)
const aiPlanSelectedTemplateType = ref('') // Deprecated but kept for ref structure if needed

const renameValue = ref('')

// Drag state | 拖动状态
const isNodeDragging = ref(false)
let dragStartNodesSnapshot = null

const cloneNodeForDragSnapshot = (node) => JSON.parse(JSON.stringify(node))

const rememberDragStartNodes = () => {
  dragStartNodesSnapshot = nodes.value.map(cloneNodeForDragSnapshot)
}

const isFinitePosition = (position) => (
  Number.isFinite(Number(position?.x)) && Number.isFinite(Number(position?.y))
)

const restoreMissingOrInvalidDragNodes = () => {
  if (!dragStartNodesSnapshot) return false

  const currentById = new Map(nodes.value.map(node => [node.id, node]))
  let changed = false
  const restoredNodes = [...nodes.value]

  for (const before of dragStartNodesSnapshot) {
    const current = currentById.get(before.id)

    if (!current) {
      restoredNodes.push(before)
      changed = true
      continue
    }

    if (!isFinitePosition(current.position)) {
      const index = restoredNodes.findIndex(node => node.id === current.id)
      if (index >= 0) {
        restoredNodes[index] = {
          ...current,
          position: cloneNodeForDragSnapshot(before.position || { x: 0, y: 0 })
        }
        changed = true
      }
    }
  }

  if (changed) {
    nodes.value = restoredNodes
    window.$message?.warning('拖拽异常已自动恢复，卡片未被删除')
  }

  return changed
}

const finishNodeDrag = () => {
  isNodeDragging.value = false
  const restored = restoreMissingOrInvalidDragNodes()
  dragStartNodesSnapshot = null

  // Persist final positions after drag (avoid saving on every mousemove)
  if (restored) {
    manualSaveHistory()
  } else {
    requestAutoSave()
  }
}

const onNodeDragStart = () => {
  isNodeDragging.value = true
  rememberDragStartNodes()
}
const onNodeDragStop = () => {
  finishNodeDrag()
}

// Selection drag (multi-node) | 多选拖动
const onSelectionDragStart = () => {
  isNodeDragging.value = true
  rememberDragStartNodes()
}
const onSelectionDragStop = () => {
  finishNodeDrag()
}

const hasDownloadableAssets = computed(() => {
  return nodes.value.some(n => 
    (n.type === 'image' || n.type === 'video') && n.data?.url
  )
})

const projectName = computed(() => {
  const project = projects.value.find(p => p.id === route.params.id)
  return project?.name || '未命名项目'
})

const projectOptions = [
  { label: '重命名', key: 'rename' },
  { label: '复制', key: 'duplicate' },
  { label: '删除', key: 'delete' }
]

const tools = [
  { id: 'text', name: '文本', icon: TextOutline, action: () => addNewNode('text') },
  { id: 'image', name: '图片', icon: ImageOutline, action: () => addNewNode('image') },
  { id: 'imageConfig', name: '文生图', icon: ColorPaletteOutline, action: () => addNewNode('imageConfig') },
  { id: 'frame', name: '镜头画框', icon: AlbumsOutline, action: () => addNewNode('frame') },
  { id: 'group', name: '成组', icon: LayersOutline, action: () => groupSelectionToFrame(), disabled: () => !canGroupSelection() },
  { id: 'ungroup', name: '解组', icon: ContractOutline, action: () => ungroupSelection(), disabled: () => !canUngroupSelection() },
  { id: 'lock', name: '锁定', icon: LockClosedOutline, action: () => lockSelection(), disabled: () => !canLockSelection() },
  { id: 'unlock', name: '解锁', icon: LockOpenOutline, action: () => unlockSelection(), disabled: () => !canUnlockSelection() },
  { id: 'run', name: '执行工作流', icon: PlayOutline, action: () => executeAllWorkflows(), disabled: () => !hasExecutableNodes() },
  { id: 'undo', name: '撤销', icon: ArrowUndoOutline, action: () => undo(), disabled: () => !canUndo() },
  { id: 'redo', name: '重做', icon: ArrowRedoOutline, action: () => redo(), disabled: () => !canRedo() }
]

const nodeTypeOptions = [
  { type: 'frame', name: '镜头画框', icon: AlbumsOutline, color: '#a855f7' },
  { type: 'storyboardPlan', name: '分镜计划', icon: GridOutline, color: '#ec4899' },
  { type: 'text', name: '文本节点', icon: TextOutline, color: '#3b82f6' },
  { type: 'imageConfig', name: '文生图配置', icon: ColorPaletteOutline, color: '#22c55e' },
  { type: 'videoConfig', name: '视频生成配置', icon: VideocamOutline, color: '#f59e0b' },
  { type: 'image', name: '图片节点', icon: ImageOutline, color: '#8b5cf6' },
  { type: 'video', name: '视频节点', icon: VideocamOutline, color: '#ef4444' }
]

const inputPlaceholder = '描述你的创意... (例如 "赛博朋克风格的城市")'
const suggestions = [
  '像个魔法森林',
  '三只不同的小猫',
  '生成多角度分镜'
]

const workflowTypeLabel = (type) => {
  const t = String(type || '')
  if (t === WORKFLOW_TYPES.TEXT_TO_IMAGE) return '文生图'
  if (t === WORKFLOW_TYPES.TEXT_TO_IMAGE_TO_VIDEO) return '文生图 → 视频'
  if (t === WORKFLOW_TYPES.STORYBOARD) return '分镜（关键帧）'
  if (t === WORKFLOW_TYPES.SCRIPT_TO_STORYBOARD_TO_VIDEO) return '长文本 → 分镜 → 批量视频'
  if (t === WORKFLOW_TYPES.MULTI_ANGLE_STORYBOARD) return '多角度四宫格'
  if (t === WORKFLOW_TYPES.REUSABLE_SCRIPT_WORKFLOW) return '可复用分镜模板（自动拆镜头）'
  return t || '未知'
}

// Removed unused template options

const aiPlanJson = computed(() => {
  try {
    return aiPlanResult.value ? JSON.stringify(aiPlanResult.value, null, 2) : ''
  } catch {
    return ''
  }
})

// Removed unused onSelectAiPlanTemplateType

// Selection helpers | 选择相关
const selectedElements = computed(() => nodes.value.filter(n => n.selected))
const selectedFrames = computed(() => selectedElements.value.filter(n => n.type === 'frame'))
const selectedNonFrames = computed(() => selectedElements.value.filter(n => n.type !== 'frame'))

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
      return { w: 300, h: 240 }
  }
}

const getAbsPos = (node) => {
  // Prefer `position` for root nodes (it's the persisted source of truth).
  // For child nodes, `computedPosition` is the absolute position.
  const x = node.parentNode
    ? (node.computedPosition?.x ?? node.position?.x ?? 0)
    : (node.position?.x ?? node.computedPosition?.x ?? 0)
  const y = node.parentNode
    ? (node.computedPosition?.y ?? node.position?.y ?? 0)
    : (node.position?.y ?? node.computedPosition?.y ?? 0)
  return { x, y }
}

const getBounds = (list) => {
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity

  for (const n of list) {
    const { x, y } = getAbsPos(n)
    const size = n.dimensions?.width && n.dimensions?.height
      ? { w: n.dimensions.width, h: n.dimensions.height }
      : guessNodeSize(n)

    minX = Math.min(minX, x)
    minY = Math.min(minY, y)
    maxX = Math.max(maxX, x + size.w)
    maxY = Math.max(maxY, y + size.h)
  }

  if (!isFinite(minX) || !isFinite(minY)) {
    return { minX: 0, minY: 0, maxX: 0, maxY: 0 }
  }

  return { minX, minY, maxX, maxY }
}

// Group selection into a frame | 成组到画框
const canGroupSelection = () => {
  // If exactly one frame is selected, allow "add into this frame" grouping
  if (selectedFrames.value.length === 1) {
    const movable = selectedNonFrames.value.filter(n => !n.parentNode)
    return movable.length >= 1
  }

  if (selectedNonFrames.value.length < 2) return false
  // disallow nested grouping for MVP
  if (selectedNonFrames.value.some(n => n.parentNode)) return false
  return true
}

const groupSelectionToFrame = async () => {
  if (!canGroupSelection()) {
    window.$message?.warning('请选择：①至少 2 个未分组节点，或 ②选中 1 个画框 + 至少 1 个节点')
    return
  }

  const headerH = 40
  const padding = 28

  // Case A: add selected nodes into an existing frame | 选中 1 个画框：把节点添加进该画框
  if (selectedFrames.value.length === 1) {
    const frame = selectedFrames.value[0]
    const currentFrameX = frame.position?.x ?? frame.computedPosition?.x ?? 0
    const currentFrameY = frame.position?.y ?? frame.computedPosition?.y ?? 0

    const toMove = selectedNonFrames.value.filter(n => !n.parentNode)
    const toMoveIds = new Set(toMove.map(n => n.id))

    // Include existing children + new nodes | 包含画框内已有子节点 + 本次新增节点
    const nodeById = new Map(nodes.value.map(n => [n.id, n]))
    const existingChildIds = nodes.value.filter(n => n.parentNode === frame.id).map(n => n.id)
    const allChildIds = Array.from(new Set([...existingChildIds, ...Array.from(toMoveIds)]))

    // Build absolute position map for all children BEFORE any updates
    const absById = new Map()
    for (const id of allChildIds) {
      const n = nodeById.get(id)
      if (!n) continue

      if (n.parentNode === frame.id) {
        absById.set(id, {
          x: currentFrameX + (n.position?.x ?? 0),
          y: currentFrameY + (n.position?.y ?? 0)
        })
      } else {
        absById.set(id, {
          x: n.position?.x ?? 0,
          y: n.position?.y ?? 0
        })
      }
    }

    // Compute bounds based on absolute positions
    let minX = Infinity
    let minY = Infinity
    let maxX = -Infinity
    let maxY = -Infinity

    for (const id of allChildIds) {
      const n = nodeById.get(id)
      const abs = absById.get(id)
      if (!n || !abs) continue

      const size = n.dimensions?.width && n.dimensions?.height
        ? { w: n.dimensions.width, h: n.dimensions.height }
        : guessNodeSize(n)

      minX = Math.min(minX, abs.x)
      minY = Math.min(minY, abs.y)
      maxX = Math.max(maxX, abs.x + size.w)
      maxY = Math.max(maxY, abs.y + size.h)
    }

    if (!isFinite(minX) || !isFinite(minY)) {
      window.$message?.warning('成组失败：无法计算节点边界')
      return
    }

    const nextFrameX = Math.round(minX - padding)
    const nextFrameY = Math.round(minY - padding - headerH)
    const nextFrameW = Math.max(420, Math.round((maxX - minX) + padding * 2))
    const nextFrameH = Math.max(320, Math.round((maxY - minY) + padding * 2 + headerH))

    const allChildSet = new Set(allChildIds)

    // Apply: resize/move frame + re-parent nodes + keep absolute positions stable
    nodes.value = nodes.value.map(n => {
      if (n.id === frame.id) {
        const { computedPosition, ...rest } = n
        return {
          ...rest,
          position: { x: nextFrameX, y: nextFrameY },
          data: { ...n.data, w: nextFrameW, h: nextFrameH }
        }
      }

      if (!allChildSet.has(n.id)) return n

      const abs = absById.get(n.id) || { x: n.position?.x ?? 0, y: n.position?.y ?? 0 }
      const { computedPosition, ...rest } = n

      return {
        ...rest,
        parentNode: frame.id,
        extent: undefined,
        position: {
          x: Math.round(abs.x - nextFrameX),
          y: Math.round(abs.y - nextFrameY)
        },
        dragHandle: '.node-drag-handle'
      }
    })

    manualSaveHistory()
    window.$message?.success('已添加到镜头画框')

    await nextTick()
    updateNodeInternals([frame.id, ...allChildIds])
    return
  }

  // Case B: create a new frame around the selected nodes | 创建新画框包住所选节点
  const sel = selectedNonFrames.value

  // Store absolute positions BEFORE re-parenting (selected nodes are root nodes here)
  const absPosMap = new Map(sel.map(n => [n.id, { x: n.position?.x ?? 0, y: n.position?.y ?? 0 }]))
  const bounds = getBounds(sel)

  const frameX = Math.round(bounds.minX - padding)
  const frameY = Math.round(bounds.minY - padding - headerH)
  const frameW = Math.max(420, Math.round((bounds.maxX - bounds.minX) + padding * 2))
  const frameH = Math.max(320, Math.round((bounds.maxY - bounds.minY) + padding * 2 + headerH))

  const minZIndex = Math.min(0, ...nodes.value.map(n => n.zIndex || 0))
  const frameCount = nodes.value.filter(n => n.type === 'frame').length

  // Create frame behind children | 创建画框（置于子节点之下）
  const frameId = addNode(
    'frame',
    { x: frameX, y: frameY },
    { label: `镜头 ${String(frameCount + 1).padStart(2, '0')}`, w: frameW, h: frameH },
    { zIndex: minZIndex - 1, draggable: true, connectable: false, dragHandle: '.frame-drag-handle' }
  )

  const selectedIds = new Set(sel.map(n => n.id))

  // Attach as children | 绑定为子节点
  nodes.value = nodes.value.map(n => {
    if (!selectedIds.has(n.id)) return n

    const abs = absPosMap.get(n.id) || { x: n.position?.x ?? 0, y: n.position?.y ?? 0 }

    // IMPORTANT: do NOT carry over computedPosition when re-parenting
    const { computedPosition, ...rest } = n

    return {
      ...rest,
      parentNode: frameId,
      // Do not use extent:'parent' here, it can clamp nodes into weird positions when parent dimensions are not ready
      extent: undefined,
      position: {
        x: Math.round(abs.x - frameX),
        y: Math.round(abs.y - frameY)
      },
      dragHandle: '.node-drag-handle'
    }
  })

  manualSaveHistory()
  window.$message?.success('已成组到镜头画框')

  await nextTick()
  updateNodeInternals([frameId, ...Array.from(selectedIds)])
}

// Ungroup selection | 解组
const canUngroupSelection = () => {
  if (selectedFrames.value.length > 0) return true
  if (selectedNonFrames.value.some(n => n.parentNode)) return true
  return false
}

const ungroupSelection = () => {
  if (!canUngroupSelection()) {
    window.$message?.info('请选择画框或画框内节点')
    return
  }

  const frameIds = new Set(selectedFrames.value.map(f => f.id))
  const framePos = new Map()

  for (const f of nodes.value) {
    if (frameIds.has(f.id)) {
      framePos.set(f.id, { x: f.position?.x || 0, y: f.position?.y || 0 })
    }
  }

  // If frames selected: detach children and remove frames | 选中画框：解绑子节点并删除画框
  if (frameIds.size > 0) {
    nodes.value = nodes.value
      .filter(n => !frameIds.has(n.id))
      .map(n => {
        if (!n.parentNode || !frameIds.has(n.parentNode)) return n
        const p = framePos.get(n.parentNode) || { x: 0, y: 0 }

        // IMPORTANT: do NOT carry over computedPosition when detaching
        const { computedPosition, ...rest } = n

        return {
          ...rest,
          parentNode: undefined,
          extent: undefined,
          position: {
            x: Math.round(p.x + (n.position?.x || 0)),
            y: Math.round(p.y + (n.position?.y || 0))
          }
        }
      })

    manualSaveHistory()
    window.$message?.success('已解组')
    return
  }

  // Otherwise: detach selected children only | 仅解绑选中的子节点
  const selectedChildIds = new Set(selectedNonFrames.value.filter(n => n.parentNode).map(n => n.id))
  const parentMap = new Map(nodes.value.map(n => [n.id, n]))

  nodes.value = nodes.value.map(n => {
    if (!selectedChildIds.has(n.id) || !n.parentNode) return n
    const parent = parentMap.get(n.parentNode)
    const px = parent?.position?.x || 0
    const py = parent?.position?.y || 0

    // IMPORTANT: do NOT carry over computedPosition when detaching
    const { computedPosition, ...rest } = n

    return {
      ...rest,
      parentNode: undefined,
      extent: undefined,
      position: {
        x: Math.round(px + (n.position?.x || 0)),
        y: Math.round(py + (n.position?.y || 0))
      }
    }
  })

  manualSaveHistory()
  window.$message?.success('已解组')
}

// Lock/unlock selection | 锁定/解锁
const canLockSelection = () => {
  return nodes.value.some(n => n.selected && !n.data?.locked)
}

const canUnlockSelection = () => {
  return nodes.value.some(n => n.selected && n.data?.locked)
}

const lockSelection = () => {
  const sel = nodes.value.filter(n => n.selected)
  if (sel.length === 0) return

  sel.forEach(n => {
    updateNode(n.id, { locked: true })
    updateNodeProps(n.id, { draggable: false, connectable: false }, { saveHistory: false })
  })

  manualSaveHistory()
  window.$message?.success('已锁定')
}

const unlockSelection = () => {
  const sel = nodes.value.filter(n => n.selected)
  if (sel.length === 0) return

  sel.forEach(n => {
    updateNode(n.id, { locked: false })
    updateNodeProps(n.id, { draggable: true, connectable: true }, { saveHistory: false })
  })

  manualSaveHistory()
  window.$message?.success('已解锁')
}

const addNewNode = async (type) => {
  const viewportCenterX = -viewport.value.x / viewport.value.zoom + (window.innerWidth / 2) / viewport.value.zoom
  const viewportCenterY = -viewport.value.y / viewport.value.zoom + (window.innerHeight / 2) / viewport.value.zoom

  const nodeId = addNode(type, { x: viewportCenterX - 100, y: viewportCenterY - 100 })

  // zIndex & drag handle defaults | 默认层级与拖拽区域
  const maxZIndex = Math.max(0, ...nodes.value.map(n => n.zIndex || 0))
  const minZIndex = Math.min(0, ...nodes.value.map(n => n.zIndex || 0))

  if (type === 'frame') {
    updateNodeProps(nodeId, {
      zIndex: minZIndex - 1,
      draggable: true,
      connectable: false,
      dragHandle: '.frame-drag-handle'
    })
  } else {
    updateNodeProps(nodeId, {
      zIndex: maxZIndex + 1,
      draggable: true,
      dragHandle: '.node-drag-handle'
    })
  }

  setTimeout(() => {
    updateNodeInternals(nodeId)
  }, 50)

  showNodeMenu.value = false
}

// === My Workflow Templates | 我的工作流模板 ===
const getViewportCenter = () => {
  const x = -viewport.value.x / viewport.value.zoom + (window.innerWidth / 2) / viewport.value.zoom
  const y = -viewport.value.y / viewport.value.zoom + (window.innerHeight / 2) / viewport.value.zoom
  return { x, y }
}

const handleSaveWorkflowTemplate = ({ name, description } = {}) => {
  const selectedIds = nodes.value.filter(n => n.selected).map(n => n.id)
  if (selectedIds.length === 0) {
    window.$message?.warning('请先选中要保存的节点')
    return
  }

  try {
    const tpl = createWorkflowTemplateFromSelection({
      name,
      description,
      nodes: nodes.value,
      edges: edges.value,
      selectedNodeIds: selectedIds
    })
    window.$message?.success(`已保存工作流: ${tpl.name}`)
  } catch (err) {
    window.$message?.error(err?.message || '保存失败')
  }
}

const addWorkflowTemplateToCanvas = (tpl, startPosition) => {
  const tplNodes = Array.isArray(tpl?.nodes) ? tpl.nodes : []
  const tplEdges = Array.isArray(tpl?.edges) ? tpl.edges : []
  if (tplNodes.length === 0) return { createdNodeIds: [], createdEdgeCount: 0 }

  const existingMaxZ = Math.max(0, ...nodes.value.map(n => n.zIndex || 0))
  const existingMinZ = Math.min(0, ...nodes.value.map(n => n.zIndex || 0))

  // Normalize: remove invalid parent references
  const byId = new Map(tplNodes.map(n => [n.id, n]))
  const normalizedNodes = tplNodes.map(n => {
    if (n.parentNode && !byId.has(n.parentNode)) {
      const { parentNode, ...rest } = n
      return rest
    }
    return n
  })

  const idMap = new Map()
  const createdNodeIds = []

  let frameIdx = 0
  let normalIdx = 0

  const createRootNode = (n) => {
    const isFrame = n.type === 'frame'
    const pos = {
      x: (startPosition?.x ?? 0) + Number(n.position?.x ?? 0),
      y: (startPosition?.y ?? 0) + Number(n.position?.y ?? 0)
    }

    const nodeProps = {}
    if (isFrame) {
      nodeProps.zIndex = existingMinZ - 1 - frameIdx++
      nodeProps.draggable = true
      nodeProps.connectable = false
      nodeProps.dragHandle = '.frame-drag-handle'
    } else {
      nodeProps.zIndex = existingMaxZ + 1 + normalIdx++
      nodeProps.draggable = true
      nodeProps.dragHandle = '.node-drag-handle'
    }

    if (n.data?.locked) {
      nodeProps.draggable = false
      nodeProps.connectable = false
    }

    const newId = addNode(n.type, pos, n.data || {}, nodeProps)
    idMap.set(n.id, newId)
    createdNodeIds.push(newId)
  }

  // Root nodes: frames first, then others
  const roots = normalizedNodes.filter(n => !n.parentNode)
  const rootFrames = roots.filter(n => n.type === 'frame')
  const rootOthers = roots.filter(n => n.type !== 'frame')

  rootFrames.forEach(createRootNode)
  rootOthers.forEach(createRootNode)

  // Child nodes (parentNode exists)
  const children = normalizedNodes.filter(n => n.parentNode)
  let remaining = children.slice()
  let safety = 0

  while (remaining.length > 0 && safety < 5) {
    safety++
    const next = []

    for (const n of remaining) {
      const parentNewId = idMap.get(n.parentNode)
      if (!parentNewId) {
        next.push(n)
        continue
      }

      const nodeProps = {
        parentNode: parentNewId,
        extent: typeof n.extent !== 'undefined' ? n.extent : undefined,
        dragHandle: '.node-drag-handle',
        draggable: true,
        zIndex: existingMaxZ + 1 + normalIdx++
      }

      if (n.data?.locked) {
        nodeProps.draggable = false
        nodeProps.connectable = false
      }

      const pos = {
        x: Number(n.position?.x ?? 0),
        y: Number(n.position?.y ?? 0)
      }

      const newId = addNode(n.type, pos, n.data || {}, nodeProps)
      idMap.set(n.id, newId)
      createdNodeIds.push(newId)
    }

    if (next.length === remaining.length) {
      // Can't resolve parent chain; treat them as roots
      break
    }
    remaining = next
  }

  // Any unresolved children become roots (best effort)
  remaining.forEach(n => {
    const fallback = { ...n }
    delete fallback.parentNode
    createRootNode(fallback)
  })

  // Edges
  let createdEdgeCount = 0
  tplEdges.forEach(e => {
    const source = idMap.get(e.source)
    const target = idMap.get(e.target)
    if (!source || !target) return

    addEdge({
      source,
      target,
      sourceHandle: e.sourceHandle || 'right',
      targetHandle: e.targetHandle || 'left',
      type: e.type,
      data: e.data
    })
    createdEdgeCount++
  })

  setTimeout(() => {
    updateNodeInternals(createdNodeIds)
  }, 80)

  return { createdNodeIds, createdEdgeCount }
}

const handleAddWorkflowTemplate = ({ templateId } = {}) => {
  const tpl = getWorkflowTemplateById(templateId)
  if (!tpl) {
    window.$message?.error('未找到工作流模板')
    return
  }

  const center = getViewportCenter()
  const startPosition = { x: center.x - 320, y: center.y - 220 }

  try {
    addWorkflowTemplateToCanvas(tpl, startPosition)
    window.$message?.success(`已添加工作流: ${tpl.name}`)
  } catch (err) {
    window.$message?.error(err?.message || '添加失败')
  }
}

// === AI Workflow Builder (MVP) | AI 工作流搭建（MVP） ===
const getAiBasePosition = (useSelection = true) => {
  const selected = useSelection ? nodes.value.filter(n => n.selected) : []

  if (selected.length > 0) {
    const maxX = Math.max(...selected.map(n => n.position?.x ?? 0))
    const minY = Math.min(...selected.map(n => n.position?.y ?? 0))
    return { x: maxX + 350, y: minY }
  }

  let maxY = 0
  if (nodes.value.length > 0) {
    maxY = Math.max(...nodes.value.map(n => n.position?.y ?? 0))
  }

  return { x: 100, y: maxY + 200 }
}

const connectTextToImageConfig = (textNodeIds, imageConfigId) => {
  const existingTextEdges = edges.value.filter(e => e.target === imageConfigId && e.type === 'promptOrder')
  let nextOrder = existingTextEdges.length + 1

  textNodeIds.forEach((textNodeId) => {
    if (edges.value.some(e => e.source === textNodeId && e.target === imageConfigId)) return

    addEdge({
      source: textNodeId,
      target: imageConfigId,
      sourceHandle: 'right',
      targetHandle: 'left',
      type: 'promptOrder',
      data: { promptOrder: nextOrder++ }
    })
  })
}

const connectImagesToImageConfig = (imageNodeIds, imageConfigId) => {
  const existingImageEdges = edges.value.filter(e => e.target === imageConfigId && e.type === 'imageOrder')
  let nextOrder = existingImageEdges.length + 1

  imageNodeIds.forEach((imageNodeId) => {
    if (edges.value.some(e => e.source === imageNodeId && e.target === imageConfigId)) return

    addEdge({
      source: imageNodeId,
      target: imageConfigId,
      sourceHandle: 'right',
      targetHandle: 'left',
      type: 'imageOrder',
      data: { imageOrder: nextOrder++ }
    })
  })
}

const connectImageToVideoConfig = (imageNodeId, videoConfigId, role = 'first_frame_image') => {
  if (edges.value.some(e => e.source === imageNodeId && e.target === videoConfigId)) return

  addEdge({
    source: imageNodeId,
    target: videoConfigId,
    sourceHandle: 'right',
    targetHandle: 'left',
    type: 'imageRole',
    data: { imageRole: role }
  })
}

const findFirstConnectedOutputImage = (imageConfigId) => {
  const outputEdges = edges.value.filter(e => e.source === imageConfigId)
  for (const edge of outputEdges) {
    const targetNode = nodes.value.find(n => n.id === edge.target)
    if (targetNode?.type === 'image') return targetNode.id
  }
  return null
}

const findFirstConnectedOutputVideo = (videoConfigId) => {
  const outputEdges = edges.value.filter(e => e.source === videoConfigId)
  for (const edge of outputEdges) {
    const targetNode = nodes.value.find(n => n.id === edge.target)
    if (targetNode?.type === 'video') return targetNode.id
  }
  return null
}

const createFrameAroundNodeIds = async (nodeIds, label) => {
  const headerH = 40
  const padding = 28

  const list = (nodeIds || [])
    .map(id => nodes.value.find(n => n.id === id))
    .filter(Boolean)

  if (list.length === 0) return null

  // Store absolute positions BEFORE re-parenting
  const absPosMap = new Map(list.map(n => [n.id, getAbsPos(n)]))
  const bounds = getBounds(list)

  const frameX = Math.round(bounds.minX - padding)
  const frameY = Math.round(bounds.minY - padding - headerH)
  const frameW = Math.max(520, Math.round((bounds.maxX - bounds.minX) + padding * 2))
  const frameH = Math.max(320, Math.round((bounds.maxY - bounds.minY) + padding * 2 + headerH))

  const minZIndex = Math.min(0, ...nodes.value.map(n => n.zIndex || 0))

  const frameId = addNode(
    'frame',
    { x: frameX, y: frameY },
    { label: label || '工作流', w: frameW, h: frameH },
    { zIndex: minZIndex - 1, draggable: true, connectable: false, dragHandle: '.frame-drag-handle' }
  )

  const selectedIds = new Set(nodeIds)

  // Re-parent nodes (keep absolute positions stable)
  nodes.value = nodes.value.map(n => {
    if (!selectedIds.has(n.id)) return n
    const abs = absPosMap.get(n.id) || getAbsPos(n)
    const { computedPosition, ...rest } = n
    return {
      ...rest,
      parentNode: frameId,
      extent: undefined,
      position: {
        x: Math.round(abs.x - frameX),
        y: Math.round(abs.y - frameY)
      },
      dragHandle: '.node-drag-handle'
    }
  })

  manualSaveHistory()
  await nextTick()
  updateNodeInternals([frameId, ...nodeIds])

  return frameId
}

const buildAiWorkflow = async (input, { useSelection = true, intentResult = null } = {}) => {
  const result = intentResult || await analyzeIntent(input)
  
  // New graph-based generation | 基于图生成的逻辑
  if (result.nodes && Array.isArray(result.nodes)) {
    const base = getAiBasePosition(useSelection)
    const nodeSpacing = 400
    const rowSpacing = 300
    
    // Map to store temporary IDs (from AI) to real VueFlow IDs
    const idMap = new Map()
    const createdIds = []

    // 1. Create Nodes
    result.nodes.forEach(n => {
      const gx = parseInt(n.grid_x) || 0
      const gy = parseInt(n.grid_y) || 0
      
      const posX = base.x + gx * nodeSpacing
      const posY = base.y + gy * rowSpacing
      
      // Determine node data
      let data = {}
      if (n.type === 'text') {
        data = { content: n.content || '', label: n.label || '文本' }
        if (n.workflowRole) data.workflowRole = n.workflowRole
      } else if (n.type === 'imageConfig') {
        data = { label: n.label || '文生图', ...(n.params || {}) }
      } else if (n.type === 'videoConfig') {
        data = { label: n.label || '图生视频', ...(n.params || {}) }
      } else if (n.type === 'image') {
        data = { url: '', label: n.label || '图片结果' }
      } else if (n.type === 'video') {
        data = { url: '', label: n.label || '视频结果' }
      } else if (n.type === 'storyboardPlan') {
        data = {
           label: n.label || '分镜计划',
           prompt: n.prompt || '',
           autoShotCount: n.autoShotCount !== false, // default true
           expandWithVideo: n.expandWithVideo !== false,
           dynamicExpand: n.dynamicExpand !== false,
           shotCount: 16,
           shots: [],
           status: 'idle',
           error: ''
        }
      }
      
      const realId = addNode(n.type, { x: posX, y: posY }, data)
      idMap.set(n.id, realId)
      createdIds.push(realId)
    })
    
    // 2. Create Edges
    if (Array.isArray(result.edges)) {
      result.edges.forEach(e => {
        const sourceId = idMap.get(e.source)
        const targetId = idMap.get(e.target)
        
        if (sourceId && targetId) {
           addEdge({
             source: sourceId,
             target: targetId,
             sourceHandle: e.sourceHandle || 'right',
             targetHandle: e.targetHandle || 'left',
             type: e.type || 'default',
             data: e.data || {}
           })
        }
      })
    }
    
    setTimeout(() => updateNodeInternals(createdIds), 100)
    return { build_mode: 'graph_generation' }
  }

  // Fallback to legacy logic (should rarely be hit if useWorkflowOrchestrator works correctly)
  const workflow_type = result?.workflow_type || WORKFLOW_TYPES.TEXT_TO_IMAGE
  const base = getAiBasePosition(useSelection)
  const selected = useSelection ? nodes.value.filter(n => n.selected) : []
  const selectedTexts = selected.filter(n => n.type === 'text')
  const selectedImages = selected.filter(n => n.type === 'image' && (n.data?.url || n.data?.base64))
  const selectedImageConfigs = selected.filter(n => n.type === 'imageConfig')
  const selectedVideoConfigs = selected.filter(n => n.type === 'videoConfig')

  const build_mode = String(result?.build_mode || '').toLowerCase() === 'template' ? 'template' : 'generate'

  const workflowParams = {
    workflow_type,
    build_mode,

    // In template mode, do NOT fill prompts with the user's meta instruction.
    image_prompt: build_mode === 'template' ? '' : (result?.image_prompt || input),
    video_prompt: build_mode === 'template' ? '' : (result?.video_prompt || input),

    image_params: result?.image_params,
    video_params: result?.video_params,

    character: build_mode === 'template' ? undefined : result?.character,
    shots: build_mode === 'template' ? undefined : result?.shots,
    multi_angle: build_mode === 'template' ? undefined : result?.multi_angle
  }

  const nodeSpacing = 400
  const rowSpacing = 260

  if (workflow_type === WORKFLOW_TYPES.TEXT_TO_IMAGE) {
    const reuseConfig = selectedImageConfigs.length === 1 ? selectedImageConfigs[0] : null
    const configPos = reuseConfig?.position || { x: base.x + nodeSpacing, y: base.y }

    const imageConfigId = reuseConfig?.id || addNode('imageConfig', configPos, { label: '文生图', ...(workflowParams.image_params || {}) })

    // Ensure an output placeholder exists so ImageConfigNode can reuse it.
    let outputImageId = findFirstConnectedOutputImage(imageConfigId)
    if (!outputImageId) {
      outputImageId = addNode('image', { x: configPos.x + nodeSpacing, y: configPos.y }, { url: '', label: '图像生成结果' })
      addEdge({ source: imageConfigId, target: outputImageId, sourceHandle: 'right', targetHandle: 'left' })
    }

    const promptTextIds = selectedTexts.length > 0
      ? selectedTexts.map(n => n.id)
      : [addNode('text', { x: configPos.x - nodeSpacing, y: configPos.y }, { content: workflowParams.image_prompt, label: '图片提示词' })]

    connectTextToImageConfig(promptTextIds, imageConfigId)
    connectImagesToImageConfig(selectedImages.map(n => n.id), imageConfigId)

    setTimeout(() => updateNodeInternals([imageConfigId, outputImageId, ...promptTextIds]), 60)
    return { workflow_type }
  }

  if (workflow_type === WORKFLOW_TYPES.TEXT_TO_IMAGE_TO_VIDEO) {
    const isTemplate = workflowParams.build_mode === 'template'

    // Prefer direct image-to-video when user selected an existing image.
    const preferImageToVideoBySelection = selectedImages.length > 0 && selectedTexts.length <= 1

    // In template mode, also allow "image → video" skeleton when the user explicitly asks for 图生视频/图片转视频.
    const preferImageToVideoByText = isTemplate
      && /(图生视频|图片转视频|以图生视频|用图片.*视频|已有图片|给.*图片.*生成视频)/i.test(input)
      && !/(先.*图|先生成.*图|文生图)/i.test(input)

    const preferImageToVideo = preferImageToVideoBySelection || preferImageToVideoByText

    if (preferImageToVideo) {
      const reuseVideoConfig = selectedVideoConfigs.length === 1 ? selectedVideoConfigs[0] : null
      const videoConfigPos = reuseVideoConfig?.position || { x: base.x + nodeSpacing, y: base.y }
      const videoConfigId = reuseVideoConfig?.id || addNode('videoConfig', videoConfigPos, { label: '图生视频', ...(workflowParams.video_params || {}) })

      const promptTextId = selectedTexts[0]?.id
        || addNode('text', { x: videoConfigPos.x - nodeSpacing, y: videoConfigPos.y }, { content: workflowParams.video_prompt, label: '视频提示词' })

      if (!edges.value.some(e => e.source === promptTextId && e.target === videoConfigId)) {
        addEdge({
          source: promptTextId,
          target: videoConfigId,
          sourceHandle: 'right',
          targetHandle: 'left',
          type: 'promptOrder',
          data: { promptOrder: 1 }
        })
      }

      // Ensure there is a first-frame image input (selected image or an upload placeholder)
      let firstFrameImageId = selectedImages[0]?.id
      if (!firstFrameImageId) {
        firstFrameImageId = addNode(
          'image',
          { x: videoConfigPos.x - nodeSpacing, y: videoConfigPos.y + rowSpacing },
          { url: '', label: '首帧/参考图（上传）' }
        )
      }

      connectImageToVideoConfig(firstFrameImageId, videoConfigId, 'first_frame_image')
      selectedImages
        .filter(img => img.id !== firstFrameImageId)
        .forEach(img => connectImageToVideoConfig(img.id, videoConfigId, 'input_reference'))

      // Ensure an output placeholder exists so VideoConfigNode can reuse it (prevents node spam on reruns)
      let outputVideoId = findFirstConnectedOutputVideo(videoConfigId)
      if (!outputVideoId) {
        outputVideoId = addNode('video', { x: videoConfigPos.x + nodeSpacing, y: videoConfigPos.y }, { url: '', label: '视频生成结果' })
        addEdge({ source: videoConfigId, target: outputVideoId, sourceHandle: 'right', targetHandle: 'left' })
      }

      setTimeout(() => updateNodeInternals([videoConfigId, promptTextId, firstFrameImageId, outputVideoId]), 80)
      return { workflow_type }
    }

    // Full pipeline: imagePrompt → imageConfig → image → videoConfig (videoPrompt → videoConfig)
    const reuseImageConfig = selectedImageConfigs.length === 1 ? selectedImageConfigs[0] : null
    const reuseVideoConfig = selectedVideoConfigs.length === 1 ? selectedVideoConfigs[0] : null

    const imageConfigPos = reuseImageConfig?.position || { x: base.x + nodeSpacing, y: base.y }
    const videoConfigPos = reuseVideoConfig?.position || { x: imageConfigPos.x + nodeSpacing, y: imageConfigPos.y + rowSpacing }

    const imageConfigId = reuseImageConfig?.id || addNode('imageConfig', imageConfigPos, { label: '文生图', ...(workflowParams.image_params || {}) })
    const videoConfigId = reuseVideoConfig?.id || addNode('videoConfig', videoConfigPos, { label: '图生视频', ...(workflowParams.video_params || {}) })

    let outputImageId = findFirstConnectedOutputImage(imageConfigId)
    if (!outputImageId) {
      outputImageId = addNode('image', { x: imageConfigPos.x + nodeSpacing, y: imageConfigPos.y }, { url: '', label: '图像生成结果' })
      addEdge({ source: imageConfigId, target: outputImageId, sourceHandle: 'right', targetHandle: 'left' })
    }

    const videoTextFromSelection = selectedTexts.find(t => (t.data?.label || '').includes('视频'))
    const videoPromptTextId = videoTextFromSelection?.id
      || (selectedTexts.length >= 2 ? selectedTexts[1].id : null)
      || addNode('text', { x: videoConfigPos.x - nodeSpacing, y: videoConfigPos.y }, { content: workflowParams.video_prompt, label: '视频提示词' })

    const imagePromptTextIds = selectedTexts.length > 0
      ? selectedTexts.filter(t => t.id !== videoPromptTextId).map(t => t.id)
      : [addNode('text', { x: imageConfigPos.x - nodeSpacing, y: imageConfigPos.y }, { content: workflowParams.image_prompt, label: '图片提示词' })]

    if (imagePromptTextIds.length === 0) {
      imagePromptTextIds.push(addNode('text', { x: imageConfigPos.x - nodeSpacing, y: imageConfigPos.y }, { content: workflowParams.image_prompt, label: '图片提示词' }))
    }

    connectTextToImageConfig(imagePromptTextIds, imageConfigId)
    connectImagesToImageConfig(selectedImages.map(n => n.id), imageConfigId)

    if (!edges.value.some(e => e.source === videoPromptTextId && e.target === videoConfigId)) {
      addEdge({
        source: videoPromptTextId,
        target: videoConfigId,
        sourceHandle: 'right',
        targetHandle: 'left',
        type: 'promptOrder',
        data: { promptOrder: 1 }
      })
    }

    connectImageToVideoConfig(outputImageId, videoConfigId, 'first_frame_image')
    selectedImages.forEach(img => connectImageToVideoConfig(img.id, videoConfigId, 'input_reference'))

    // Dependency edge so video runs after keyframe generation (topological runner only sees executable nodes)
    if (!edges.value.some(e => e.source === imageConfigId && e.target === videoConfigId)) {
      addEdge({ source: imageConfigId, target: videoConfigId, sourceHandle: 'right', targetHandle: 'left' })
    }

    // Ensure an output placeholder exists so VideoConfigNode can reuse it (prevents node spam on reruns)
    let outputVideoId = findFirstConnectedOutputVideo(videoConfigId)
    if (!outputVideoId) {
      outputVideoId = addNode('video', { x: videoConfigPos.x + nodeSpacing, y: videoConfigPos.y }, { url: '', label: '视频生成结果' })
      addEdge({ source: videoConfigId, target: outputVideoId, sourceHandle: 'right', targetHandle: 'left' })
    }

    setTimeout(() => updateNodeInternals([imageConfigId, videoConfigId, outputImageId, outputVideoId, videoPromptTextId, ...imagePromptTextIds]), 90)
    return { workflow_type }
  }

  if (workflow_type === WORKFLOW_TYPES.MULTI_ANGLE_STORYBOARD) {
    const isTemplate = workflowParams.build_mode === 'template'
    const characterDesc = isTemplate ? '' : (workflowParams.multi_angle?.character_description || '')
    const angles = ['front', 'side', 'back', 'top']

    const characterImageId = addNode('image', { x: base.x, y: base.y }, {
      url: '',
      label: '主角色图（请上传）',
      isCharacterRef: true
    })

    const createdIds = [characterImageId]

    const angleX = base.x + nodeSpacing + 100
    const angleRowSpacing = 300

    for (let i = 0; i < angles.length; i++) {
      const angleKey = angles[i]
      const angleConfig = MULTI_ANGLE_PROMPTS[angleKey]
      const angleY = base.y + i * angleRowSpacing

      const textNodeId = addNode('text', { x: angleX, y: angleY }, {
        content: isTemplate ? '' : angleConfig.prompt(characterDesc),
        label: `${angleConfig.label}提示词`
      })

      const configNodeId = addNode('imageConfig', { x: angleX + nodeSpacing, y: angleY }, {
        ...(workflowParams.image_params || {}),
        label: `${angleConfig.label} (${angleConfig.english})`
      })

      // Output placeholder (so reruns don't keep creating new image nodes)
      const outImageId = addNode('image', { x: angleX + nodeSpacing * 2, y: angleY }, {
        url: '',
        label: `${angleConfig.label}结果`
      })

      addEdge({
        source: textNodeId,
        target: configNodeId,
        sourceHandle: 'right',
        targetHandle: 'left',
        type: 'promptOrder',
        data: { promptOrder: 1 }
      })

      addEdge({
        source: characterImageId,
        target: configNodeId,
        sourceHandle: 'right',
        targetHandle: 'left',
        type: 'imageOrder',
        data: { imageOrder: 1 }
      })

      addEdge({ source: configNodeId, target: outImageId, sourceHandle: 'right', targetHandle: 'left' })

      createdIds.push(textNodeId, configNodeId, outImageId)
    }

    setTimeout(() => updateNodeInternals(createdIds), 80)
    return { workflow_type }
  }

  if (workflow_type === WORKFLOW_TYPES.SCRIPT_TO_STORYBOARD_TO_VIDEO) {
    const rawShots = Array.isArray(workflowParams.shots) ? workflowParams.shots : []
    const shots = rawShots.filter(Boolean)

    const characterName = workflowParams.character?.name || '主角'
    const characterDesc = workflowParams.character?.description || ''

    const createdIds = []

    // Storyboard plan node (editable JSON)
    const planId = addNode('storyboardPlan', { x: base.x, y: base.y }, {
      label: '分镜计划',
      prompt: input,
      shotCount: shots.length > 0 ? shots.length : 16,
      shots: shots.map((s, i) => ({
        title: String(s?.title || `镜头${String(i + 1).padStart(2, '0')}`).trim(),
        prompt: String(s?.prompt || '').trim()
      })),
      status: shots.length > 0 ? 'ready' : 'idle',
      error: ''
    })
    createdIds.push(planId)

    // Optional character card (for readability, not connected)
    if (characterDesc) {
      const characterTextId = addNode('text', { x: base.x, y: base.y + 340 }, {
        content: `${characterName}: ${characterDesc}`,
        label: `角色设定: ${characterName}`
      })
      createdIds.push(characterTextId)
    }

    const gridBaseX = base.x + 560
    const gridBaseY = base.y

    const shotsPerCol = shots.length > 20 ? 5 : 4
    const colSpacing = 1400
    const blockSpacing = rowSpacing * 2 + 140

    for (let i = 0; i < shots.length; i++) {
      const shot = shots[i] || {}
      const col = Math.floor(i / shotsPerCol)
      const row = i % shotsPerCol

      const x0 = gridBaseX + col * colSpacing
      const y0 = gridBaseY + row * blockSpacing

      const shotIndexLabel = String(i + 1).padStart(2, '0')
      const shotTitle = String(shot.title || `镜头${shotIndexLabel}`).trim()
      const shotPrompt = String(shot.prompt || '').trim() || input

      const textId = addNode('text', { x: x0, y: y0 }, {
        content: shotPrompt,
        label: `镜头${shotIndexLabel}: ${shotTitle}`
      })

      const imageConfigId = addNode('imageConfig', { x: x0 + nodeSpacing, y: y0 }, {
        ...(workflowParams.image_params || {}),
        label: `首帧${shotIndexLabel}`
      })

      const imageId = addNode('image', { x: x0 + nodeSpacing * 2, y: y0 }, {
        url: '',
        label: `首帧${shotIndexLabel}结果`
      })

      const videoConfigId = addNode('videoConfig', { x: x0 + nodeSpacing * 2, y: y0 + rowSpacing }, {
        ...(workflowParams.video_params || {}),
        label: `视频${shotIndexLabel}`
      })

      const videoId = addNode('video', { x: x0 + nodeSpacing * 3, y: y0 + rowSpacing }, {
        url: '',
        label: `视频${shotIndexLabel}结果`
      })

      addEdge({
        source: textId,
        target: imageConfigId,
        sourceHandle: 'right',
        targetHandle: 'left',
        type: 'promptOrder',
        data: { promptOrder: 1 }
      })

      addEdge({ source: imageConfigId, target: imageId, sourceHandle: 'right', targetHandle: 'left' })

      // Shot prompt → video config
      addEdge({
        source: textId,
        target: videoConfigId,
        sourceHandle: 'right',
        targetHandle: 'left',
        type: 'promptOrder',
        data: { promptOrder: 1 }
      })

      // First frame image → video config
      connectImageToVideoConfig(imageId, videoConfigId, 'first_frame_image')

      // Dependency edge: keyframe first, then video (runner only sorts executable nodes)
      addEdge({ source: imageConfigId, target: videoConfigId, sourceHandle: 'right', targetHandle: 'left' })

      // videoConfig → video output placeholder
      addEdge({ source: videoConfigId, target: videoId, sourceHandle: 'right', targetHandle: 'left' })

      createdIds.push(textId, imageConfigId, imageId, videoConfigId, videoId)
    }

    setTimeout(() => updateNodeInternals(createdIds), 120)
    return { workflow_type }
  }

  // Reusable Script Workflow: minimal template with dynamic shot expansion
  // 可复用剧本工作流模板：只搭建核心流程节点，执行时由分镜解析节点根据实际内容动态创建镜头
  if (workflow_type === WORKFLOW_TYPES.REUSABLE_SCRIPT_WORKFLOW) {
    const createdIds = []

    const defaultImageParams = (workflowParams.image_params && typeof workflowParams.image_params === 'object')
      ? workflowParams.image_params
      : { size: '2048x2048', quality: 'standard', style: 'vivid' }

    const defaultVideoParams = (workflowParams.video_params && typeof workflowParams.video_params === 'object')
      ? workflowParams.video_params
      : { ratio: '16x9', dur: 5 }

    // 1) Script input node
    const scriptTextId = addNode('text', { x: base.x, y: base.y }, {
      content: '',
      label: '📝 输入内容',
      workflowRole: 'script'
    })
    createdIds.push(scriptTextId)

    // 2) Storyboard plan node: will parse script and dynamically create shot nodes
    const planId = addNode('storyboardPlan', { x: base.x + nodeSpacing, y: base.y }, {
      label: '🎬 分镜解析（自动拆镜头）',
      prompt: '',
      // When autoShotCount=true, this value represents MAX shots (upper bound)
      shotCount: 20,
      shots: [],
      status: 'idle',
      error: '',
      scriptNodeId: scriptTextId,
      autoShotCount: true,
      expandWithVideo: true,  // Auto-expand with video nodes
      image_params: defaultImageParams,
      video_params: defaultVideoParams,
      dynamicExpand: true  // Auto expand to create per-shot nodes after planning
    })
    createdIds.push(planId)

    // Script → Plan (promptOrder)
    addEdge({
      source: scriptTextId,
      target: planId,
      sourceHandle: 'right',
      targetHandle: 'left',
      type: 'promptOrder',
      data: { promptOrder: 1 }
    })

    // Optional: Global style constraint node
    const styleTextId = addNode('text', { x: base.x, y: base.y + rowSpacing }, {
      content: '',
      label: '🎨 全局风格',
      workflowRole: 'style'
    })
    createdIds.push(styleTextId)

    addEdge({
      source: styleTextId,
      target: planId,
      sourceHandle: 'right',
      targetHandle: 'left',
      type: 'promptOrder',
      data: { promptOrder: 2 }
    })

    // Optional: Negative prompt constraint node
    const negativeTextId = addNode('text', { x: base.x, y: base.y + rowSpacing * 2 }, {
      content: '',
      label: '🚫 负面约束',
      workflowRole: 'negative'
    })
    createdIds.push(negativeTextId)

    addEdge({
      source: negativeTextId,
      target: planId,
      sourceHandle: 'right',
      targetHandle: 'left',
      type: 'promptOrder',
      data: { promptOrder: 3 }
    })

    setTimeout(() => updateNodeInternals(createdIds), 160)
    window.$message?.info('工作流模板已创建。请在「输入内容」填写内容，点击「生成分镜」后会自动创建各镜头节点。')
    return { workflow_type }
  }

  if (workflow_type === WORKFLOW_TYPES.STORYBOARD) {
    // Template mode: only build the node graph (no concrete shots yet)
    if (workflowParams.build_mode === 'template') {
      const createdIds = []

      const defaultImageParams = (workflowParams.image_params && typeof workflowParams.image_params === 'object')
        ? workflowParams.image_params
        : { size: '2048x2048', quality: 'standard', style: 'vivid' }

      const storyTextId = addNode('text', { x: base.x, y: base.y }, {
        content: '',
        label: '📝 输入内容',
        workflowRole: 'script'
      })
      createdIds.push(storyTextId)

      const planId = addNode('storyboardPlan', { x: base.x + nodeSpacing, y: base.y }, {
        label: '🎬 分镜解析（自动拆镜头）',
        prompt: '',
        // When autoShotCount=true, this value represents MAX shots (upper bound)
        shotCount: 16,
        shots: [],
        status: 'idle',
        error: '',
        scriptNodeId: storyTextId,
        autoShotCount: true,
        expandWithVideo: false,
        image_params: defaultImageParams,
        dynamicExpand: true
      })
      createdIds.push(planId)

      addEdge({
        source: storyTextId,
        target: planId,
        sourceHandle: 'right',
        targetHandle: 'left',
        type: 'promptOrder',
        data: { promptOrder: 1 }
      })

      setTimeout(() => updateNodeInternals(createdIds), 120)
      return { workflow_type }
    }

    const shotCount = Array.isArray(workflowParams.shots) ? workflowParams.shots.length : 0
    const characterName = workflowParams.character?.name || '角色'
    const characterDesc = workflowParams.character?.description || ''

    const characterTextId = addNode('text', { x: base.x, y: base.y }, {
      content: `${characterName}: ${characterDesc}`,
      label: `角色: ${characterName}`
    })

    const characterConfigId = addNode('imageConfig', { x: base.x + nodeSpacing, y: base.y }, {
      ...(workflowParams.image_params || {}),
      label: '角色参考图'
    })

    const characterImageId = addNode('image', { x: base.x + nodeSpacing * 2, y: base.y }, {
      url: '',
      label: '角色图结果'
    })

    addEdge({ source: characterTextId, target: characterConfigId, sourceHandle: 'right', targetHandle: 'left', type: 'promptOrder', data: { promptOrder: 1 } })
    addEdge({ source: characterConfigId, target: characterImageId, sourceHandle: 'right', targetHandle: 'left' })

    const createdShotConfigIds = []

    for (let i = 0; i < shotCount; i++) {
      const shot = workflowParams.shots[i]
      const y = base.y + (i + 1) * rowSpacing

      const shotTextId = addNode('text', { x: base.x, y }, {
        content: shot?.prompt || '',
        label: `分镜${i + 1}: ${shot?.title || ''}`
      })

      const shotConfigId = addNode('imageConfig', { x: base.x + nodeSpacing, y }, {
        ...(workflowParams.image_params || {}),
        label: `分镜${i + 1}`
      })
      createdShotConfigIds.push(shotConfigId)

      const shotImageId = addNode('image', { x: base.x + nodeSpacing * 2, y }, {
        url: '',
        label: `分镜${i + 1}结果`
      })

      addEdge({ source: shotTextId, target: shotConfigId, sourceHandle: 'right', targetHandle: 'left', type: 'promptOrder', data: { promptOrder: 1 } })
      addEdge({ source: characterImageId, target: shotConfigId, sourceHandle: 'right', targetHandle: 'left', type: 'imageOrder', data: { imageOrder: 1 } })
      addEdge({ source: shotConfigId, target: shotImageId, sourceHandle: 'right', targetHandle: 'left' })
    }

    setTimeout(() => updateNodeInternals([characterTextId, characterConfigId, characterImageId, ...createdShotConfigIds]), 100)
    return { workflow_type }
  }

  // Fallback to a simple text-to-image skeleton
  const basePos = { x: base.x + nodeSpacing, y: base.y }
  const textId = addNode('text', { x: basePos.x - nodeSpacing, y: basePos.y }, { content: workflowParams.image_prompt, label: '图片提示词' })
  const configId = addNode('imageConfig', basePos, { label: '文生图', ...(workflowParams.image_params || {}) })
  const outId = addNode('image', { x: basePos.x + nodeSpacing, y: basePos.y }, { url: '', label: '图像生成结果' })
  addEdge({ source: textId, target: configId, sourceHandle: 'right', targetHandle: 'left', type: 'promptOrder', data: { promptOrder: 1 } })
  addEdge({ source: configId, target: outId, sourceHandle: 'right', targetHandle: 'left' })
  setTimeout(() => updateNodeInternals([textId, configId, outId]), 60)

  return { workflow_type: WORKFLOW_TYPES.TEXT_TO_IMAGE }
}

const analyzeAndShowAiPlan = async (input, { useSelection = true } = {}) => {
  const content = String(input || '').trim()
  if (!content) return

  window.$message?.info('正在分析意图...')
  const result = await analyzeIntent(content)

  aiPlanResult.value = result
  aiPlanInput.value = content
  aiPlanUseSelection.value = Boolean(useSelection)
  aiPlanSelectedTemplateType.value = result?.workflow_type || WORKFLOW_TYPES.TEXT_TO_IMAGE
  showAiPlanModal.value = true

  if (typeof window !== 'undefined') {
    window.__AI_CANVAS_LAST_INTENT__ = result
  }
}

const makeTemplateIntentResult = (baseResult, templateTypeOverride) => {
  const r = (baseResult && typeof baseResult === 'object') ? { ...baseResult } : {}

  r.build_mode = 'template'

  const t = String(templateTypeOverride || r.workflow_type || WORKFLOW_TYPES.TEXT_TO_IMAGE)
  r.workflow_type = t

  // For template builds, map script_to_storyboard_to_video to the reusable template builder.
  if (r.workflow_type === WORKFLOW_TYPES.SCRIPT_TO_STORYBOARD_TO_VIDEO) {
    r.workflow_type = WORKFLOW_TYPES.REUSABLE_SCRIPT_WORKFLOW
  }

  delete r.image_prompt
  delete r.video_prompt
  delete r.character
  delete r.shots
  delete r.multi_angle

  if (!r.description) {
    r.description = '工作流模板（只搭建节点，不生成内容）'
  }

  return r
}

const confirmCreateAiPlanAsIs = async () => {
  if (!aiPlanResult.value || !aiPlanInput.value) return
  if (!isApiConfigured.value) {
    window.$message?.warning('请先配置 API Key')
    showApiSettings.value = true
    return
  }

  isProcessing.value = true
  showAiPlanModal.value = false

  try {
    await buildAiWorkflow(aiPlanInput.value, { useSelection: aiPlanUseSelection.value, intentResult: aiPlanResult.value })
    window.$message?.success('工作流已创建')
  } catch (err) {
    window.$message?.error(err?.message || '创建失败')
  } finally {
    isProcessing.value = false
  }
}

const handleAiGenerateWorkflow = async ({ prompt, useSelection = true } = {}) => {
  const input = (prompt || '').trim()
  if (!input) {
    window.$message?.warning('请输入工作流描述')
    return
  }

  if (!isApiConfigured.value) {
    window.$message?.warning('请先配置 API Key')
    showApiSettings.value = true
    return
  }

  isProcessing.value = true

  try {
    window.$message?.info('正在分析意图...')
    await buildAiWorkflow(input, { useSelection })
    window.$message?.success('工作流节点已创建')
  } catch (err) {
    window.$message?.error(err?.message || '创建失败')
  } finally {
    isProcessing.value = false
  }
}

const onConnect = (params) => {
  addEdge(params)
}

const bringNodeToFront = (nodeId) => {
  const maxZIndex = Math.max(0, ...nodes.value.map(n => n.zIndex || 0))
  const current = nodes.value.find(n => n.id === nodeId)
  const currentZ = current?.zIndex || 0
  if (currentZ >= maxZIndex) return

  // Avoid polluting undo history on every click
  updateNodeProps(nodeId, { zIndex: maxZIndex + 1 }, { saveHistory: false })
}

const onNodeClick = ({ event, node }) => {
  // Vue Flow handles selection; we only manage z-order.
  // Keep frames behind (so background never covers other nodes).
  if (node?.type === 'frame') return

  // If multi-selecting, don't reshuffle z-order (keeps selection stable)
  if (event?.ctrlKey || event?.metaKey || event?.shiftKey) return

  bringNodeToFront(node.id)
}

const handleViewportChange = (newViewport) => {
  updateViewport(newViewport)
}

const onNodesChange = (changes) => {
  if (isNodeDragging.value && changes.some(change => change.type === 'remove')) {
    nextTick(() => {
      restoreMissingOrInvalidDragNodes()
    })
    return
  }

  // Save after node removals (keyboard delete etc.)
  if (changes.some(change => change.type === 'remove')) {
    nextTick(() => manualSaveHistory())
  }
}

const onEdgesChange = (changes) => {
  if (changes.some(change => change.type === 'remove')) {
    nextTick(() => manualSaveHistory())
  }
}

const onPaneClick = () => {
  showNodeMenu.value = false
}

const handleProjectAction = (key) => {
  switch (key) {
    case 'rename':
      renameValue.value = projectName.value
      showRenameModal.value = true
      break
    case 'duplicate':
      window.$message?.info('复制功能开发中')
      break
    case 'delete':
      showDeleteModal.value = true
      break
  }
}

const confirmRename = () => {
  const projectId = route.params.id
  if (renameValue.value.trim()) {
    renameProject(projectId, renameValue.value.trim())
    window.$message?.success('已重命名')
  }
  showRenameModal.value = false
}

const confirmDelete = () => {
  const projectId = route.params.id
  showDeleteModal.value = false
  window.$message?.success('项目已删除')
  router.push('/')
}

const handleEnterKey = (e) => {
  e.preventDefault()
  sendMessage()
}

const handlePolish = async () => {
  const input = chatInput.value.trim()
  if (!input) return
  
  if (!isApiConfigured.value) {
    window.$message?.warning('请先配置 API Key')
    showApiSettings.value = true
    return
  }

  isProcessing.value = true
  const originalInput = chatInput.value
  try {
    const result = await sendChat(input, true)
    if (result) {
      chatInput.value = result
      window.$message?.success('提示词已润色')
    }
  } catch (err) {
    chatInput.value = originalInput
    window.$message?.error(err.message || '润色失败')
  } finally {
    isProcessing.value = false
  }
}

const sendMessage = async () => {
  const input = chatInput.value.trim()
  if (!input) return
  if (!isApiConfigured.value) {
    window.$message?.warning('请先配置 API Key')
    showApiSettings.value = true
    return
  }

  isProcessing.value = true
  const content = chatInput.value
  chatInput.value = ''

  try {
    if (aiWorkflowBuilderEnabled.value) {
      window.$message?.info('正在分析意图...')
      await buildAiWorkflow(content, { useSelection: true })
      window.$message?.success('工作流节点已创建')
      return
    }

    // Classic mode: create a simple text → imageConfig → image skeleton
    const base = getAiBasePosition(true)
    const nodeSpacing = 400

    const textNodeId = addNode('text', { x: base.x, y: base.y }, { content: content, label: '提示词' })
    const imageConfigNodeId = addNode('imageConfig', { x: base.x + nodeSpacing, y: base.y }, { label: '文生图' })
    const outputImageId = addNode('image', { x: base.x + nodeSpacing * 2, y: base.y }, { url: '', label: '图像生成结果' })

    addEdge({
      source: textNodeId,
      target: imageConfigNodeId,
      sourceHandle: 'right',
      targetHandle: 'left',
      type: 'promptOrder',
      data: { promptOrder: 1 }
    })
    addEdge({ source: imageConfigNodeId, target: outputImageId, sourceHandle: 'right', targetHandle: 'left' })

    setTimeout(() => updateNodeInternals([textNodeId, imageConfigNodeId, outputImageId]), 60)
    window.$message?.success('节点已创建')
  } catch (err) {
    window.$message?.error(err?.message || '创建失败')
  } finally {
    isProcessing.value = false
  }
}

const goBack = () => router.push('/')
const checkMobile = () => { isMobile.value = window.innerWidth < 768 }

// Check if there are executable nodes | 检查是否有可执行的节点
const isExecutableNode = (n) => {
  return n?.type === 'storyboardPlan' || n?.type === 'imageConfig' || n?.type === 'videoConfig'
}

const hasExecutableNodes = () => {
  return nodes.value.some(isExecutableNode)
}

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms))

const waitForStoryboardReady = async (planId, opts = {}) => {
  const { timeoutMs = 5 * 60 * 1000 } = opts || {}
  const deadline = Date.now() + timeoutMs

  while (Date.now() < deadline) {
    const plan = nodes.value.find(n => n.id === planId)
    if (!plan) throw new Error('分镜计划节点不存在')

    const status = String(plan.data?.status || '')
    const err = String(plan.data?.error || '')

    if (err) throw new Error(err)
    if (plan.data?.executed || status === 'ready') return plan

    await sleep(250)
  }

  throw new Error('分镜计划执行超时')
}

const findConnectedOutputNodeId = (configId, outputType) => {
  const outEdges = edges.value.filter(e => e.source === configId)
  for (const e of outEdges) {
    const t = nodes.value.find(n => n.id === e.target)
    if (t?.type === outputType) return t.id
  }
  return null
}

const waitForOutputReady = async (configId, outputType, opts = {}) => {
  const { timeoutMs = 10 * 60 * 1000 } = opts || {}
  const deadline = Date.now() + timeoutMs

  while (Date.now() < deadline) {
    const cfg = nodes.value.find(n => n.id === configId)
    if (!cfg) throw new Error('配置节点不存在')

    const outId = findConnectedOutputNodeId(configId, outputType)
    if (outId) {
      const out = nodes.value.find(n => n.id === outId)
      const err = String(out?.data?.error || '')
      if (err) throw new Error(err)

      const url = String(out?.data?.url || '')
      const loading = Boolean(out?.data?.loading)
      if (url && !loading) return out
    }

    await sleep(300)
  }

  throw new Error('生成输出超时')
}

// Execute all workflows | 执行所有工作流（按依赖顺序一步步执行，类似 ComfyUI）
const executeAllWorkflows = async () => {
  if (!isApiConfigured.value) {
    window.$message?.warning('请先配置 API Key')
    showApiSettings.value = true
    return
  }

  const executableNodes = nodes.value.filter(isExecutableNode)
  if (executableNodes.length === 0) {
    window.$message?.info('没有可执行的节点')
    return
  }

  // First, find and execute all storyboardPlan nodes (they may create new nodes dynamically)
  const planNodes = executableNodes.filter(n => n.type === 'storyboardPlan')
  const otherNodes = executableNodes.filter(n => n.type !== 'storyboardPlan')

  try {
    // Phase 1: Execute storyboardPlan nodes first (they will dynamically create shot nodes)
    if (planNodes.length > 0) {
      window.$message?.info(`步骤 1/2：解析分镜 (${planNodes.length} 个)...`)

      for (const planNode of planNodes) {
        const node = nodes.value.find(x => x.id === planNode.id)
        if (!node) continue

        updateNode(node.id, { autoExecute: true })
        await waitForStoryboardReady(node.id)
        await sleep(200)
      }
    }

    // Phase 2: Re-collect executable nodes (new imageConfig/videoConfig may have been created)
    await sleep(300) // Wait for DOM/state to settle
    const newExecutableNodes = nodes.value.filter(n => n.type === 'imageConfig' || n.type === 'videoConfig')

    if (newExecutableNodes.length === 0) {
      window.$message?.success('分镜解析完成，没有生成任务')
      return
    }

    // Sort by topological order | 按拓扑顺序排序
    const sorted = topologicalSort(newExecutableNodes)

    window.$message?.info(`步骤 2/2：执行 ${sorted.length} 个生成任务...`)

    for (const n of sorted) {
      const node = nodes.value.find(x => x.id === n.id)
      if (!node) continue

      // Skip already executed nodes
      if (node.data?.executed) continue

      updateNode(node.id, { autoExecute: true })

      if (node.type === 'imageConfig') {
        await waitForOutputReady(node.id, 'image')
      } else if (node.type === 'videoConfig') {
        await waitForOutputReady(node.id, 'video')
      }

      // Small delay to avoid hammering reactive updates
      await sleep(120)
    }

    window.$message?.success('工作流执行完成')
  } catch (err) {
    window.$message?.error(err?.message || '执行失败')
    throw err
  }
}

// Topological sort for execution order | 拓扑排序确定执行顺序
const topologicalSort = (configNodes) => {
  const nodeIds = new Set(configNodes.map(n => n.id))
  const inDegree = new Map()
  const adjacency = new Map()

  // Initialize | 初始化
  configNodes.forEach(node => {
    inDegree.set(node.id, 0)
    adjacency.set(node.id, [])
  })

  // Build graph based on edges | 根据边构建图
  edges.value.forEach(edge => {
    if (nodeIds.has(edge.source) && nodeIds.has(edge.target)) {
      adjacency.get(edge.source).push(edge.target)
      inDegree.set(edge.target, (inDegree.get(edge.target) || 0) + 1)
    }
  })

  // Kahn's algorithm | Kahn 算法
  const queue = configNodes.filter(n => inDegree.get(n.id) === 0)
  const result = []

  while (queue.length > 0) {
    const node = queue.shift()
    result.push(node)

    adjacency.get(node.id)?.forEach(neighborId => {
      const newDegree = inDegree.get(neighborId) - 1
      inDegree.set(neighborId, newDegree)
      if (newDegree === 0) {
        const neighborNode = configNodes.find(n => n.id === neighborId)
        if (neighborNode) queue.push(neighborNode)
      }
    })
  }

  // If some nodes weren't processed (cycle), add them at the end | 如果有节点未处理（存在环），添加到末尾
  configNodes.forEach(node => {
    if (!result.includes(node)) {
      result.push(node)
    }
  })

  return result
}

const loadProjectById = (projectId) => {
  flowKey.value = Date.now()
  if (projectId && projectId !== 'new') {
    loadProject(projectId)
  } else {
    clearCanvas()
  }
}

watch(() => route.params.id, (newId, oldId) => {
  if (newId && newId !== oldId) {
    if (oldId) saveProject()
    loadProjectById(newId)
  }
})

onMounted(() => {
  checkMobile()
  window.addEventListener('resize', checkMobile)
  window.addEventListener('keydown', handleCanvasDeleteKey)
  initProjectsStore()
  loadProjectById(route.params.id)
  
  const initialPrompt = sessionStorage.getItem('ai-canvas-initial-prompt')
  if (initialPrompt) {
    sessionStorage.removeItem('ai-canvas-initial-prompt')
    chatInput.value = initialPrompt
    nextTick(() => sendMessage())
  }
})

onUnmounted(() => {
  window.removeEventListener('resize', checkMobile)
  window.removeEventListener('keydown', handleCanvasDeleteKey)
  saveProject()
})
</script>

<style>
/* Import Vue Flow styles */
@import '@vue-flow/core/dist/style.css';
@import '@vue-flow/core/dist/theme-default.css';
@import '@vue-flow/minimap/dist/style.css';

.canvas-flow {
  width: 100%;
  height: 100%;
}

.canvas-page .shadow-neon,
.canvas-page .hover\:shadow-neon:hover {
  box-shadow: none !important;
}

.canvas-page .text-node,
.canvas-page .image-node,
.canvas-page .video-node,
.canvas-page .image-config-node,
.canvas-page .video-config-node,
.canvas-page .storyboard-plan-node {
  box-shadow: 0 8px 20px rgba(15, 23, 42, 0.08) !important;
}

.dark .canvas-page .text-node,
.dark .canvas-page .image-node,
.dark .canvas-page .video-node,
.dark .canvas-page .image-config-node,
.dark .canvas-page .video-config-node,
.dark .canvas-page .storyboard-plan-node {
  box-shadow: 0 12px 26px rgba(0, 0, 0, 0.24) !important;
}

.canvas-page .text-node:hover,
.canvas-page .image-node:hover,
.canvas-page .video-node:hover,
.canvas-page .image-config-node:hover,
.canvas-page .video-config-node:hover,
.canvas-page .storyboard-plan-node:hover {
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.12) !important;
}

.canvas-page .text-node [class*="shadow-[0_0"],
.canvas-page .storyboard-plan-node [class*="shadow-[0_0"],
.canvas-page .frame-node [class*="shadow-[0_0"] {
  box-shadow: none !important;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.3s ease;
}

.fade-slide-enter-from,
.fade-slide-leave-to {
  opacity: 0;
  transform: translate(-20px, -50%);
}

/* Node drag optimization | 节点拖动优化 */
.vue-flow__node {
  cursor: grab;
  will-change: transform;
  transition: box-shadow 0.2s ease;
}

/* During drag: remove transitions & heavy effects | 拖动中：移除过渡和重效果 */
.is-dragging .vue-flow__node {
  transition: none !important;
}

.vue-flow__node:active {
  cursor: grabbing;
}

.vue-flow__node.dragging {
  cursor: grabbing;
  z-index: 1000 !important;
}

/* Disable blur/shadows while dragging for smoothness | 拖动时禁用模糊和阴影提升流畅度 */
.is-dragging .text-node,
.is-dragging .image-node,
.is-dragging .video-node,
.is-dragging .image-config-node,
.is-dragging .video-config-node,
.vue-flow__node.dragging .text-node,
.vue-flow__node.dragging .image-node,
.vue-flow__node.dragging .video-node,
.vue-flow__node.dragging .image-config-node,
.vue-flow__node.dragging .video-config-node {
  -webkit-backdrop-filter: none !important;
  backdrop-filter: none !important;
  box-shadow: none !important;
}

.is-dragging .text-node,
.is-dragging .image-node,
.is-dragging .video-node,
.is-dragging .image-config-node,
.is-dragging .video-config-node,
.vue-flow__node.dragging .text-node,
.vue-flow__node.dragging .image-node,
.vue-flow__node.dragging .video-node,
.vue-flow__node.dragging .image-config-node,
.vue-flow__node.dragging .video-config-node {
  border-color: var(--glass-border) !important;
}

/* Hide heavy edge label renderers while dragging | 拖动时隐藏边标签（提升性能） */
.is-dragging .vue-flow__edge-labels {
  display: none !important;
}

.vue-flow__node.selected {
  z-index: 999 !important;
}

/* Edge styling | 连线样式 */
.vue-flow__edge-path {
  stroke-linecap: round;
  transition: stroke 0.2s ease, stroke-width 0.2s ease;
}

.vue-flow__edge:hover .vue-flow__edge-path {
  stroke-width: 2.5;
}

/* Handle styling | 连接点样式 */
.vue-flow__handle {
  transition: transform 0.15s ease, background 0.15s ease;
  box-shadow: none !important;
}

.vue-flow__handle:hover {
  transform: scale(1.15);
  box-shadow: none !important;
}

/* Disable text selection during drag | 拖动时禁用文本选择 */
.vue-flow {
  user-select: none;
}
</style>
