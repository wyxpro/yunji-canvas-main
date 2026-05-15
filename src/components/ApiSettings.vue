<template>
  <!-- API Settings Modal | 设置弹窗 -->
  <n-modal
    v-model:show="showModal"
    preset="card"
    title="设置"
    class="api-settings-modal"
    :style="{ width: '720px', maxWidth: 'calc(100vw - 32px)' }"
  >
    <div class="api-settings-body">
      <n-form ref="formRef" :model="formData" label-placement="left" label-width="92">
        <n-tabs v-model:value="activeTab" type="line" animated>
          <!-- 基础 -->
          <n-tab-pane name="basic" tab="基础">
            <n-form-item label="Base URL" path="baseUrl">
              <n-input
                v-model:value="formData.baseUrl"
                placeholder="请输入 Base URL"
              />
            </n-form-item>

            <n-form-item label="API Key" path="apiKey">
              <n-input
                v-model:value="formData.apiKey"
                type="password"
                show-password-on="click"
                placeholder="请输入 API Key"
              />
            </n-form-item>

            <n-form-item label="对话模型" path="chatModel">
              <n-select
                v-model:value="formData.chatModel"
                :options="chatModelOptions"
                filterable
                placeholder="选择对话模型"
              />
              <div class="mt-2 text-[11px] text-[var(--text-secondary)] leading-relaxed">
                这里控制「润色提示词 / AI 搭建工作流」使用的对话模型。
              </div>
            </n-form-item>

            <n-alert v-if="!isConfigured" type="warning" title="未配置" class="mt-2">
              <div class="flex flex-col gap-2">
                <p>请配置 API Key 以使用 AI 功能</p>
              </div>
            </n-alert>

            <n-alert v-else type="success" title="已配置" class="mt-2">
              API 已就绪，可以使用 AI 功能
            </n-alert>
          </n-tab-pane>

          <!-- 模型模板 -->
          <n-tab-pane name="models" tab="模型模板">
            <div class="text-xs text-[var(--text-secondary)] mb-3">
              这里配置「节点下拉框」里显示哪些模型（图片 / 视频 / 对话）。
            </div>

            <n-divider title-placement="left" class="!my-3">
              <span class="text-xs text-[var(--text-secondary)]">图片模型</span>
            </n-divider>
            <n-form-item label="列表">
              <div class="w-full">
                <n-dynamic-input
                  v-model:value="formData.imageModelTemplates"
                  :on-create="() => ({ label: '', key: '' })"
                >
                  <template #default="{ value }">
                    <div class="flex gap-2 w-full">
                      <n-input v-model:value="value.label" placeholder="显示名称" />
                      <n-input v-model:value="value.key" placeholder="模型 ID" />
                    </div>
                  </template>
                </n-dynamic-input>
                <div class="mt-2 flex justify-end">
                  <n-button size="small" tertiary @click="resetImageTemplates">恢复默认</n-button>
                </div>
              </div>
            </n-form-item>

            <n-divider title-placement="left" class="!my-3">
              <span class="text-xs text-[var(--text-secondary)]">视频模型</span>
            </n-divider>
            <n-form-item label="列表">
              <div class="w-full">
                <n-dynamic-input
                  v-model:value="formData.videoModelTemplates"
                  :on-create="() => ({ label: '', key: '' })"
                >
                  <template #default="{ value }">
                    <div class="flex gap-2 w-full">
                      <n-input v-model:value="value.label" placeholder="显示名称" />
                      <n-input v-model:value="value.key" placeholder="模型 ID" />
                    </div>
                  </template>
                </n-dynamic-input>
                <div class="mt-2 flex justify-end">
                  <n-button size="small" tertiary @click="resetVideoTemplates">恢复默认</n-button>
                </div>
              </div>
            </n-form-item>

            <n-divider title-placement="left" class="!my-3">
              <span class="text-xs text-[var(--text-secondary)]">对话模型</span>
            </n-divider>
            <n-form-item label="列表">
              <div class="w-full">
                <n-dynamic-input
                  v-model:value="formData.chatModelTemplates"
                  :on-create="() => ({ label: '', key: '' })"
                >
                  <template #default="{ value }">
                    <div class="flex gap-2 w-full">
                      <n-input v-model:value="value.label" placeholder="显示名称" />
                      <n-input v-model:value="value.key" placeholder="模型 ID" />
                    </div>
                  </template>
                </n-dynamic-input>
                <div class="mt-2 flex justify-end">
                  <n-button size="small" tertiary @click="resetChatTemplates">恢复默认</n-button>
                </div>
              </div>
            </n-form-item>
          </n-tab-pane>

          <!-- 素材存储 -->
          <n-tab-pane name="storage" tab="素材存储">
            <div class="text-xs text-[var(--text-secondary)] mb-3 leading-relaxed">
              可选：配置阿里云 OSS 后，本地上传的图片/视频、以及视频抽帧会自动上传到 OSS；
              未配置则保持现状（图片用 data:，视频用本地 objectURL）。
            </div>

            <n-alert type="warning" title="安全提示" :show-icon="false" class="mb-3">
              <div class="text-xs leading-relaxed">
                不建议在公开网站/多人环境把 AccessKeySecret 存在浏览器里。
                更安全的方式是用 STS 临时凭证或后端签名上传。
              </div>
            </n-alert>

            <n-form-item label="Bucket" path="aliyunOss.bucket">
              <n-input v-model:value="formData.aliyunOss.bucket" placeholder="例如: my-bucket" />
            </n-form-item>

            <n-form-item label="Endpoint" path="aliyunOss.endpoint">
              <n-input
                v-model:value="formData.aliyunOss.endpoint"
                placeholder="例如: oss-cn-hangzhou.aliyuncs.com"
              />
              <div class="mt-2 text-[11px] text-[var(--text-secondary)] leading-relaxed">
                最终上传地址会是：<span class="font-mono">https://&lt;bucket&gt;.&lt;endpoint&gt;</span>
              </div>
            </n-form-item>

            <n-form-item label="AccessKeyId" path="aliyunOss.accessKeyId">
              <n-input v-model:value="formData.aliyunOss.accessKeyId" placeholder="LTAI..." />
            </n-form-item>

            <n-form-item label="AccessKeySecret" path="aliyunOss.accessKeySecret">
              <n-input
                v-model:value="formData.aliyunOss.accessKeySecret"
                type="password"
                show-password-on="click"
                placeholder="填写后会存到 localStorage"
              />
            </n-form-item>

            <n-form-item label="STS Token" path="aliyunOss.stsToken">
              <n-input
                v-model:value="formData.aliyunOss.stsToken"
                placeholder="可选：临时凭证 token"
              />
            </n-form-item>

            <n-form-item label="目录前缀" path="aliyunOss.dir">
              <n-input v-model:value="formData.aliyunOss.dir" placeholder="例如: ai-canvas/" />
            </n-form-item>

            <n-form-item label="公开域名" path="aliyunOss.publicBaseUrl">
              <n-input
                v-model:value="formData.aliyunOss.publicBaseUrl"
                placeholder="可选：CDN 域名，如 https://cdn.xxx.com"
              />
              <div class="mt-2 text-[11px] text-[var(--text-secondary)] leading-relaxed">
                不填则默认使用 OSS Host 作为访问地址。
              </div>
            </n-form-item>

            <n-alert :type="aliyunOssEnabled ? 'success' : 'info'" :show-icon="false" class="mt-2">
              <span class="text-xs">
                {{ aliyunOssEnabled ? '已启用：上传素材会使用阿里云 OSS' : '未启用：将继续使用当前本地 data/objectURL 方式' }}
              </span>
            </n-alert>

            <div class="mt-3 flex justify-end">
              <n-button size="small" tertiary @click="clearAliyunOss">清除阿里云配置</n-button>
            </div>
          </n-tab-pane>

          <!-- 端点 -->
          <n-tab-pane name="endpoints" tab="端点">
            <div class="endpoint-list">
              <div class="endpoint-item">
                <span class="endpoint-label">问答</span>
                <n-tag size="small" type="info" class="endpoint-tag">/chat/completions</n-tag>
              </div>
              <div class="endpoint-item">
                <span class="endpoint-label">生图</span>
                <n-tag size="small" type="success" class="endpoint-tag">/images/generations</n-tag>
              </div>
              <div class="endpoint-item">
                <span class="endpoint-label">视频生成</span>
                <n-tag size="small" type="warning" class="endpoint-tag">/videos</n-tag>
              </div>
              <div class="endpoint-item">
                <span class="endpoint-label">视频查询</span>
                <n-tag size="small" type="warning" class="endpoint-tag">/videos/{taskId}</n-tag>
              </div>
            </div>

            <div class="text-xs text-[var(--text-secondary)] leading-relaxed">
              如果你的三方渠道端点不一致，可以在这里对照检查 Base URL。
            </div>
          </n-tab-pane>
        </n-tabs>
      </n-form>
    </div>

    <template #footer>
      <div class="flex justify-end items-center">
        <div class="flex gap-2">
          <n-button @click="handleClear" tertiary>清除配置</n-button>
          <n-button @click="showModal = false">取消</n-button>
          <n-button type="primary" @click="handleSave">保存</n-button>
        </div>
      </div>
    </template>
  </n-modal>
</template>

<script setup>
/**
 * API Settings Component | 设置组件
 */
import { ref, reactive, watch, computed } from 'vue'
import {
  NModal,
  NForm,
  NFormItem,
  NInput,
  NSelect,
  NButton,
  NAlert,
  NDivider,
  NTag,
  NDynamicInput,
  NTabs,
  NTabPane
} from 'naive-ui'
import { useApiConfig } from '../hooks'
import { CHAT_MODELS, DEFAULT_CHAT_MODEL, IMAGE_MODELS, VIDEO_MODELS } from '../config/models'
import { DEFAULT_API_BASE_URL } from '../utils'
import { getAliyunOssConfig, setAliyunOssConfig, isAliyunOssConfigured } from '../utils/assetStorage'
import {
  imageModelTemplates as storedImageModelTemplates,
  videoModelTemplates as storedVideoModelTemplates,
  chatModelTemplates as storedChatModelTemplates,
  setImageModelTemplates,
  setVideoModelTemplates,
  setChatModelTemplates
} from '../stores/models'

// Props | 属性
const props = defineProps({
  show: {
    type: Boolean,
    default: false
  }
})

// Emits | 事件
const emit = defineEmits(['update:show', 'saved'])

// API Config hook | API 配置 hook
const { apiKey, baseUrl, chatModel, isConfigured, setApiKey, setBaseUrl, setChatModel, clear: clearConfig } =
  useApiConfig()

// Modal visibility | 弹窗可见性
const showModal = ref(props.show)
const activeTab = ref('basic')

const defaultImageTemplates = IMAGE_MODELS.map(m => ({ label: m.label, key: m.key }))
const defaultVideoTemplates = VIDEO_MODELS.map(m => ({ label: m.label, key: m.key }))
const defaultChatTemplates = CHAT_MODELS.map(m => ({ label: m.label, key: m.key }))

const defaultAliyunOss = {
  bucket: '',
  endpoint: '',
  accessKeyId: '',
  accessKeySecret: '',
  stsToken: '',
  dir: 'ai-canvas/',
  publicBaseUrl: ''
}

// Form data | 表单数据
const formData = reactive({
  apiKey: apiKey.value,
  baseUrl: baseUrl.value,
  chatModel: chatModel.value || DEFAULT_CHAT_MODEL,
  imageModelTemplates: JSON.parse(JSON.stringify(storedImageModelTemplates.value || defaultImageTemplates)),
  videoModelTemplates: JSON.parse(JSON.stringify(storedVideoModelTemplates.value || defaultVideoTemplates)),
  chatModelTemplates: JSON.parse(JSON.stringify(storedChatModelTemplates.value || defaultChatTemplates)),
  aliyunOss: JSON.parse(JSON.stringify(getAliyunOssConfig() || defaultAliyunOss))
})

// Chat model options from current (editable) template list
const chatModelOptions = computed(() => {
  const list = Array.isArray(formData.chatModelTemplates) ? formData.chatModelTemplates : []
  const out = []
  const seen = new Set()

  for (const item of list) {
    const key = String(item?.key || '').trim()
    if (!key) continue
    if (seen.has(key)) continue
    seen.add(key)
    const label = String(item?.label || key).trim() || key
    out.push({ label, value: key })
  }

  return out.length > 0 ? out : CHAT_MODELS.map(m => ({ label: m.label, value: m.key }))
})

const ensureValidChatModel = () => {
  const opts = chatModelOptions.value || []
  if (opts.length === 0) return
  if (!opts.some(o => o.value === formData.chatModel)) {
    formData.chatModel = opts[0].value
  }
}

watch(chatModelOptions, () => ensureValidChatModel(), { immediate: true })

// Watch prop changes | 监听属性变化
watch(
  () => props.show,
  (val) => {
    showModal.value = val
    if (val) {
      activeTab.value = 'basic'
      formData.apiKey = apiKey.value
      formData.baseUrl = baseUrl.value
      formData.chatModel = chatModel.value || DEFAULT_CHAT_MODEL
      formData.imageModelTemplates = JSON.parse(
        JSON.stringify(storedImageModelTemplates.value || defaultImageTemplates)
      )
      formData.videoModelTemplates = JSON.parse(
        JSON.stringify(storedVideoModelTemplates.value || defaultVideoTemplates)
      )
      formData.chatModelTemplates = JSON.parse(
        JSON.stringify(storedChatModelTemplates.value || defaultChatTemplates)
      )
      formData.aliyunOss = JSON.parse(JSON.stringify(getAliyunOssConfig() || defaultAliyunOss))
      ensureValidChatModel()
    }
  }
)

// Watch modal changes | 监听弹窗变化
watch(showModal, (val) => {
  emit('update:show', val)
})

// Aliyun OSS enabled | 阿里云 OSS 是否启用（配置完整）
const aliyunOssEnabled = computed(() => isAliyunOssConfigured(formData.aliyunOss))

const clearAliyunOss = () => {
  formData.aliyunOss = JSON.parse(JSON.stringify(defaultAliyunOss))
  setAliyunOssConfig(null)
  window.$message?.success('阿里云配置已清除')
}

// Handle save | 处理保存
const handleSave = () => {
  if (formData.apiKey) {
    setApiKey(formData.apiKey)
  }
  if (formData.baseUrl) {
    setBaseUrl(formData.baseUrl)
  }
  if (formData.chatModel) {
    setChatModel(formData.chatModel)
  }

  // Persist model templates (used by dropdowns)
  setImageModelTemplates(formData.imageModelTemplates)
  setVideoModelTemplates(formData.videoModelTemplates)
  setChatModelTemplates(formData.chatModelTemplates)

  // Persist optional Aliyun OSS config
  setAliyunOssConfig(formData.aliyunOss)

  showModal.value = false
  emit('saved')
}

const resetImageTemplates = () => {
  formData.imageModelTemplates = JSON.parse(JSON.stringify(defaultImageTemplates))
}

const resetVideoTemplates = () => {
  formData.videoModelTemplates = JSON.parse(JSON.stringify(defaultVideoTemplates))
}

const resetChatTemplates = () => {
  formData.chatModelTemplates = JSON.parse(JSON.stringify(defaultChatTemplates))
  ensureValidChatModel()
}

// Handle clear | 处理清除
const handleClear = () => {
  clearConfig()
  formData.apiKey = ''
  formData.baseUrl = DEFAULT_API_BASE_URL
  formData.chatModel = DEFAULT_CHAT_MODEL

  // Do not clear templates automatically; keep user presets.
}
</script>

<style scoped>
.api-settings-body {
  max-height: 62vh;
  overflow: auto;
  padding-right: 4px;
}

.endpoint-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 14px;
  padding: 12px;
  background: var(--bg-secondary, #f5f5f5);
  border-radius: 10px;
  border: 1px solid var(--border-color, rgba(0, 0, 0, 0.08));
}

.endpoint-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.endpoint-label {
  font-size: 13px;
  color: var(--text-secondary, #666);
  min-width: 70px;
}

.endpoint-tag {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;
  font-size: 12px;
}
</style>
