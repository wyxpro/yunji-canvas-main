<template>
  <!-- Workflow panel | 工作流浮动面板 -->
  <Transition name="panel-slide">
    <div v-if="visible" class="workflow-panel" v-click-outside="handleClickOutside">
      <!-- Header | 头部 -->
      <div class="panel-header">
        <div class="panel-tabs">
          <span 
            class="tab-item" 
            :class="{ active: activeTab === 'ai' }"
            @click="activeTab = 'ai'"
          >AI 生成</span>
          <span 
            class="tab-item" 
            :class="{ active: activeTab === 'my' }"
            @click="activeTab = 'my'"
          >我的工作流</span>
        </div>
        <button class="expand-btn" @click="visible = false">
          <n-icon :size="16"><CloseOutline /></n-icon>
        </button>
      </div>
      
      <!-- Content | 内容 -->
      <div class="panel-content">
        <!-- AI generation | AI 生成 -->
        <div v-if="activeTab === 'ai'" class="ai-state">
          <div class="ai-tip">
            描述你想要的工作流，AI 会尽量复用你选中的节点，并自动补齐节点与连线。
          </div>

          <n-input
            v-model:value="aiPrompt"
            type="textarea"
            :autosize="{ minRows: 4, maxRows: 8 }"
            placeholder="例如：生成一张赛博朋克女孩插画，再做成 5 秒动画"
          />

          <div class="ai-options">
            <div class="ai-option">
              <span class="ai-option-label">基于选中节点</span>
              <n-switch v-model:value="aiUseSelection" size="small" />
            </div>
          </div>

          <n-button type="primary" block :disabled="!aiPrompt.trim()" @click="handleAIGenerate">
            生成工作流
          </n-button>

          <div class="ai-examples">
            <button class="example-btn" @click="aiPrompt = '生成一张日系动漫少女头像，柔光，细节丰富'">动漫头像</button>
            <button class="example-btn" @click="aiPrompt = '用这张图做一个轻微镜头推近的 5 秒动画，氛围梦幻'">图生视频</button>
            <button class="example-btn" @click="aiPrompt = '生成一个穿红裙子的女孩的多角度分镜（正视/侧视/后视/俯视）'">多角度分镜</button>
          </div>
        </div>
        
        <!-- My workflows | 我的工作流 -->
        <div v-else class="my-state">
          <div class="my-toolbar">
            <div class="my-toolbar-row">
              <n-input
                v-model:value="myName"
                size="small"
                placeholder="工作流名称（保存选中）"
              />
              <n-button size="small" type="primary" :disabled="!myName.trim()" @click="handleSaveSelection">
                保存选中
              </n-button>
            </div>

            <div class="my-toolbar-row">
              <n-input
                v-model:value="myDesc"
                size="small"
                placeholder="描述（可选）"
              />
              <n-button size="small" tertiary @click="triggerImport">导入</n-button>
              <n-button size="small" tertiary :disabled="myWorkflows.length === 0" @click="handleExportAll">导出全部</n-button>
              <input
                ref="importFileRef"
                type="file"
                accept="application/json"
                class="hidden"
                @change="handleImportFile"
              />
            </div>

            <div class="text-[11px] text-[var(--text-secondary)] leading-relaxed">
              保存时仅会保存「选中节点」及其内部连线；图片/视频节点会自动清空 URL，避免导入后携带素材。
            </div>
          </div>

          <div v-if="myWorkflows.length === 0" class="empty-state">
            <n-icon :size="36" class="text-gray-500">
              <FolderOpenOutline />
            </n-icon>
            <p class="text-gray-500 text-sm mt-2">暂无自定义工作流</p>
          </div>

          <div v-else class="workflow-grid">
            <div
              v-for="wf in myWorkflows"
              :key="wf.id"
              class="workflow-card"
              @click="handleAddMyWorkflow(wf)"
            >
              <div class="card-cover">
                <n-icon :size="36" class="cover-icon">
                  <FolderOpenOutline />
                </n-icon>
              </div>
              <div class="card-title" :title="wf.name">{{ wf.name }}</div>
              <div v-if="wf.description" class="card-desc" :title="wf.description">{{ wf.description }}</div>

              <div class="card-actions" @click.stop>
                <button class="action-btn" @click="handleExportOne(wf)">导出</button>
                <button class="action-btn danger" @click="handleDeleteOne(wf)">删除</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup>
/**
 * Workflow Panel Component | 工作流面板组件
 * 显示工作流模板列表，支持一键添加到画布
 */
import { computed, ref } from 'vue'
import { NIcon, NInput, NButton, NSwitch } from 'naive-ui'
import { CloseOutline, FolderOpenOutline } from '@vicons/ionicons5'
import {
  myWorkflowTemplates,
  deleteWorkflowTemplate,
  exportWorkflowTemplateJson,
  exportAllWorkflowTemplatesJson,
  importWorkflowTemplatesFromJson
} from '../stores/workflowTemplates'

const props = defineProps({
  show: Boolean
})

const emit = defineEmits([
  'update:show',
  'ai-generate',
  'save-workflow',
  'add-workflow-template'
])

// Active tab | 当前标签
const activeTab = ref('ai')

// AI generation state | AI 生成状态
const aiPrompt = ref('')
const aiUseSelection = ref(true)

// Visible state | 显示状态
const visible = computed({
  get: () => props.show,
  set: (val) => emit('update:show', val)
})

// My workflows | 我的工作流
const myWorkflows = myWorkflowTemplates
const myName = ref('')
const myDesc = ref('')
const importFileRef = ref(null)

const downloadJson = (filename, content) => {
  try {
    const blob = new Blob([content], { type: 'application/json;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  } catch (err) {
    window.$message?.error(err?.message || '导出失败')
  }
}

const handleSaveSelection = () => {
  const name = myName.value.trim()
  if (!name) return

  emit('save-workflow', {
    name,
    description: myDesc.value.trim()
  })

  myName.value = ''
  myDesc.value = ''
}

const handleAddMyWorkflow = (wf) => {
  emit('add-workflow-template', { templateId: wf.id })
  visible.value = false
}

const handleDeleteOne = (wf) => {
  deleteWorkflowTemplate(wf.id)
  window.$message?.success('已删除')
}

const handleExportOne = (wf) => {
  try {
    const json = exportWorkflowTemplateJson(wf)
    downloadJson(`${wf.name || 'workflow'}.json`, json)
  } catch (err) {
    window.$message?.error(err?.message || '导出失败')
  }
}

const handleExportAll = () => {
  try {
    const json = exportAllWorkflowTemplatesJson()
    downloadJson(`workflows_${Date.now()}.json`, json)
  } catch (err) {
    window.$message?.error(err?.message || '导出失败')
  }
}

const triggerImport = () => {
  importFileRef.value?.click?.()
}

const handleImportFile = async (e) => {
  const file = e?.target?.files?.[0]
  if (!file) return

  try {
    const text = await file.text()
    const count = importWorkflowTemplatesFromJson(text)
    window.$message?.success(`已导入 ${count} 个工作流`)
  } catch (err) {
    window.$message?.error(err?.message || '导入失败')
  } finally {
    // reset input so same file can be re-imported
    if (e?.target) e.target.value = ''
  }
}

const handleAIGenerate = () => {
  const prompt = aiPrompt.value.trim()
  if (!prompt) return

  emit('ai-generate', {
    prompt,
    useSelection: aiUseSelection.value
  })

  visible.value = false
}

// Handle click outside | 点击外部关闭
const handleClickOutside = () => {
  visible.value = false
}

// Custom directive | 自定义指令
const vClickOutside = {
  mounted(el, binding) {
    el._clickOutside = (e) => {
      if (!el.contains(e.target)) {
        binding.value()
      }
    }
    setTimeout(() => {
      document.addEventListener('click', el._clickOutside)
    }, 0)
  },
  unmounted(el) {
    document.removeEventListener('click', el._clickOutside)
  }
}
</script>

<style scoped>
/* Panel container | 面板容器 */
.workflow-panel {
  position: fixed;
  left: 72px;
  top: 100px;
  width: 520px;
  max-height: 70vh;
  background: var(--bg-secondary);
  backdrop-filter: blur(12px);
  border-radius: 16px;
  border: 1px solid var(--border-color);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
  z-index: 100;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

:global(.dark) .workflow-panel {
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
}

/* Header | 头部 */
.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px 12px;
  border-bottom: 1px solid var(--border-color);
}

.panel-tabs {
  display: flex;
  gap: 24px;
}

.tab-item {
  font-size: 15px;
  color: var(--text-secondary);
  cursor: pointer;
  transition: color 0.2s;
  padding-bottom: 4px;
}

.tab-item:hover {
  color: var(--text-primary);
}

.tab-item.active {
  color: var(--text-primary);
  font-weight: 500;
}

.expand-btn {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-tertiary);
  border: none;
  border-radius: 6px;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s;
}

.expand-btn:hover {
  background: var(--border-color);
  color: var(--text-primary);
}

/* Content | 内容区 */
.panel-content {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

/* Workflow grid | 工作流网格 */
.workflow-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

/* Workflow card | 工作流卡片 */
.workflow-card {
  cursor: pointer;
  transition: transform 0.2s;
}

.workflow-card:hover {
  transform: translateY(-2px);
}

.workflow-card:hover .card-cover {
  border-color: var(--accent-color);
}

.card-cover {
  aspect-ratio: 1;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  transition: border-color 0.2s;
  overflow: hidden;
}

.cover-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.cover-icon {
  color: var(--text-secondary);
}

.card-title {
  margin-top: 10px;
  font-size: 13px;
  color: var(--text-primary);
  text-align: center;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* AI state | AI 生成 */
.ai-state {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* My workflows | 我的工作流 */
.my-state {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.my-toolbar {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 12px;
  border: 1px solid var(--border-color);
  border-radius: 12px;
  background: var(--bg-tertiary);
}

.my-toolbar-row {
  display: flex;
  gap: 8px;
  align-items: center;
}

.my-toolbar-row :global(.n-input) {
  flex: 1;
}

.card-desc {
  margin-top: 4px;
  font-size: 11px;
  color: var(--text-secondary);
  text-align: center;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.card-actions {
  margin-top: 10px;
  display: flex;
  gap: 8px;
  justify-content: center;
}

.action-btn {
  font-size: 12px;
  padding: 6px 10px;
  border-radius: 10px;
  border: 1px solid var(--border-color);
  background: var(--bg-secondary);
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s;
}

.action-btn:hover {
  border-color: var(--accent-color);
  color: var(--text-primary);
}

.action-btn.danger:hover {
  border-color: rgba(239, 68, 68, 0.8);
  color: rgba(239, 68, 68, 0.9);
}

.ai-tip {
  font-size: 12px;
  color: var(--text-secondary);
  line-height: 1.5;
}

.ai-options {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 10px 12px;
  border: 1px solid var(--border-color);
  border-radius: 10px;
  background: var(--bg-tertiary);
}

.ai-option {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.ai-option-label {
  font-size: 12px;
  color: var(--text-primary);
}

.ai-examples {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.example-btn {
  font-size: 12px;
  padding: 6px 10px;
  border-radius: 999px;
  border: 1px solid var(--border-color);
  background: var(--bg-tertiary);
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s;
}

.example-btn:hover {
  border-color: var(--accent-color);
  color: var(--text-primary);
}

/* Empty state | 空状态 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 24px;
  text-align: center;
  color: var(--text-secondary);
}

/* Transition | 过渡动画 */
.panel-slide-enter-active,
.panel-slide-leave-active {
  transition: all 0.25s ease;
}

.panel-slide-enter-from,
.panel-slide-leave-to {
  opacity: 0;
  transform: translateX(-12px);
}

/* Scrollbar | 滚动条 */
.panel-content::-webkit-scrollbar {
  width: 6px;
}

.panel-content::-webkit-scrollbar-track {
  background: transparent;
}

.panel-content::-webkit-scrollbar-thumb {
  background: var(--border-color);
  border-radius: 3px;
}

.panel-content::-webkit-scrollbar-thumb:hover {
  background: var(--text-secondary);
}
</style>
