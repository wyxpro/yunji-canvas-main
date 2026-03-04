<template>
  <div class="flex h-screen w-screen bg-[var(--bg-primary)] text-[var(--text-primary)] overflow-hidden font-sans">
    <!-- Floating Dock Sidebar (macOS Style) -->
    <aside class="fixed left-6 top-1/2 -translate-y-1/2 flex flex-col gap-4 p-3 bg-white/80 dark:bg-white/5 backdrop-blur-xl rounded-3xl border border-black/5 dark:border-white/10 shadow-glass z-50 hover:scale-105 transition-all duration-300">
      <!-- Logo -->
      <div class="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-500/30 mb-4">
        <n-icon size="28" color="white"><color-palette-outline /></n-icon>
      </div>

      <!-- Nav Items -->
      <button 
        @click="currentView = 'home'"
        class="w-12 h-12 flex items-center justify-center rounded-2xl transition-all group relative"
        :class="currentView === 'home' ? 'bg-black/10 dark:bg-white/10 text-purple-500 dark:text-purple-300 shadow-inner-light' : 'hover:bg-black/5 dark:hover:bg-white/10 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'"
      >
        <n-icon size="24"><home-outline /></n-icon>
        <div class="absolute left-full ml-4 px-3 py-1 bg-white/80 dark:bg-black/80 backdrop-blur text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap border border-black/10 dark:border-white/10 pointer-events-none text-gray-800 dark:text-white">
          主页
        </div>
      </button>
      
      <button 
        @click="currentView = 'projects'"
        class="w-12 h-12 flex items-center justify-center rounded-2xl transition-all group relative"
        :class="currentView === 'projects' ? 'bg-black/10 dark:bg-white/10 text-purple-500 dark:text-purple-300 shadow-inner-light' : 'hover:bg-black/5 dark:hover:bg-white/10 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'"
      >
        <n-icon size="24"><folder-outline /></n-icon>
        <div class="absolute left-full ml-4 px-3 py-1 bg-white/80 dark:bg-black/80 backdrop-blur text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap border border-black/10 dark:border-white/10 pointer-events-none text-gray-800 dark:text-white">
          我的项目
        </div>
      </button>
      
      <button 
        @click="currentView = 'templates'"
        class="w-12 h-12 flex items-center justify-center rounded-2xl transition-all group relative"
        :class="currentView === 'templates' ? 'bg-black/10 dark:bg-white/10 text-purple-500 dark:text-purple-300 shadow-inner-light' : 'hover:bg-black/5 dark:hover:bg-white/10 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'"
      >
        <n-icon size="24"><albums-outline /></n-icon>
        <div class="absolute left-full ml-4 px-3 py-1 bg-white/80 dark:bg-black/80 backdrop-blur text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap border border-black/10 dark:border-white/10 pointer-events-none text-gray-800 dark:text-white">
          模板库
        </div>
      </button>

      <div class="w-8 h-px bg-black/10 dark:bg-white/10 mx-auto my-2"></div>

      <!-- Settings -->
      <button 
        @click="showApiSettings = true"
        class="w-12 h-12 flex items-center justify-center rounded-2xl hover:bg-black/5 dark:hover:bg-white/10 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-all group relative"
        :class="{ 'text-green-500 dark:text-green-400': isApiConfigured }"
      >
        <n-icon size="24"><settings-outline /></n-icon>
         <div class="absolute left-full ml-4 px-3 py-1 bg-white/80 dark:bg-black/80 backdrop-blur text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap border border-black/10 dark:border-white/10 pointer-events-none text-gray-800 dark:text-white">
          设置
        </div>
      </button>

      <button 
        @click="toggleTheme"
        class="w-12 h-12 flex items-center justify-center rounded-2xl hover:bg-black/5 dark:hover:bg-white/10 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-all group relative"
      >
        <n-icon size="24">
          <sunny-outline v-if="isDark" />
          <moon-outline v-else />
        </n-icon>
      </button>
    </aside>

    <!-- Main Content -->
    <main class="flex-1 h-full overflow-y-auto relative scroll-smooth pl-24 lg:pl-32">
      <!-- Ambient Background Lights -->
      <div class="fixed inset-0 pointer-events-none z-0">
        <div class="absolute top-[-20%] left-[20%] w-[800px] h-[800px] bg-purple-900/20 rounded-full blur-[150px] mix-blend-screen animate-pulse-slow"></div>
        <div class="absolute bottom-[-10%] right-[10%] w-[600px] h-[600px] bg-indigo-900/20 rounded-full blur-[120px] mix-blend-screen animate-float"></div>
      </div>

      <div class="relative z-10 max-w-6xl mx-auto px-6 h-full flex flex-col justify-center">
        
        <!-- Hero Section (Home View) -->
        <section v-if="currentView === 'home'" class="text-center relative -mt-20">
          <!-- Floating Badge -->
          <div class="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 mb-8 backdrop-blur-md hover:bg-black/10 dark:hover:bg-white/10 transition-colors cursor-default shadow-lg shadow-purple-500/10">
            <div class="w-2 h-2 rounded-full bg-green-400 animate-pulse shadow-[0_0_10px_theme('colors.green.400')]"></div>
            <span class="text-xs font-semibold tracking-wider uppercase text-gray-600 dark:text-gray-300">无限创意引擎</span>
          </div>
          
          <h1 class="text-5xl lg:text-7xl font-black mb-8 tracking-tight leading-none relative">
            <span class="bg-clip-text text-transparent bg-gradient-to-br from-gray-900 via-gray-700 to-gray-500 dark:from-white dark:via-gray-200 dark:to-gray-500 drop-shadow-2xl">
              创意无限
            </span>
            <br />
            <span class="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-pink-400 to-indigo-400 animate-shine bg-[length:200%_auto]">
              自由无界
            </span>
          </h1>
          
          <p class="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto mb-16 font-light leading-relaxed">
            在无限画布上编排您的灵感。 <br class="hidden md:block"/>
            生成、可视化并与 AI 深度协作。
          </p>

          <!-- Search Bar / Command Input -->
          <div class="max-w-4xl mx-auto relative group z-20">
            <!-- Glow Effect behind input -->
            <div class="absolute -inset-1 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 rounded-2xl blur-lg opacity-40 group-hover:opacity-70 transition duration-700"></div>
            
            <div class="relative bg-white/80 dark:bg-[#0a0f1c]/80 backdrop-blur-2xl rounded-2xl border border-black/10 dark:border-white/10 p-2 shadow-2xl flex flex-col gap-2 transition-all duration-300 group-hover:border-purple-500/30 group-hover:scale-[1.01]">
              <textarea
                v-model="inputText"
                placeholder="今天你想创作什么？"
                class="w-full bg-transparent border-none outline-none text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 text-2xl px-6 py-4 resize-none min-h-[80px] font-medium leading-relaxed"
                @keydown.enter.ctrl="handleCreateWithInput"
              />
              <div class="flex items-center justify-between px-4 pb-2">
                <div class="flex gap-6 items-center">
                  <button class="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
                    <n-icon size="18"><image-outline /></n-icon>
                    <span>上传图片</span>
                  </button>
                  <button class="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
                    <n-icon size="18"><apps-outline /></n-icon>
                    <span>模板库</span>
                  </button>

                  <div class="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                    <span class="select-none">AI 搭建节点</span>
                    <n-switch v-model:value="aiWorkflowBuilderEnabled" size="small" />
                  </div>
                </div>
                
                <button 
                  @click="handleCreateWithInput"
                  class="px-8 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-sm shadow-[0_0_20px_rgba(139,92,246,0.25)] hover:shadow-[0_0_30px_rgba(139,92,246,0.35)] hover:scale-105 transition-all flex items-center gap-2"
                >
                  <span>开始创作</span>
                  <n-icon><arrow-forward-outline /></n-icon>
                </button>
              </div>
            </div>
            
            <!-- Quick Tags -->
            <div class="flex flex-wrap justify-center gap-4 mt-8">
              <button 
                v-for="tag in suggestions" 
                :key="tag"
                @click="inputText = tag"
                class="group/tag px-5 py-2 rounded-full text-sm bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 border border-black/5 dark:border-white/5 hover:border-purple-500/30 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-all cursor-pointer relative overflow-hidden"
              >
                <div class="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-transparent opacity-0 group-hover/tag:opacity-100 transition-opacity"></div>
                <span class="relative">{{ tag }}</span>
              </button>
            </div>
          </div>
        </section>

        <!-- Projects Grid (Projects View) -->
        <section v-if="currentView === 'projects'" class="h-full py-10 overflow-y-auto">
          <div class="flex items-end justify-between mb-10 border-b border-black/5 dark:border-white/5 pb-4">
            <h2 class="text-3xl font-bold flex items-center gap-3">
              <span class="text-transparent bg-clip-text bg-gradient-to-r from-gray-900 to-gray-500 dark:from-white dark:to-gray-500">最近项目</span>
            </h2>
            <button 
              @click="createNewProject"
              class="text-sm text-purple-500 dark:text-purple-400 hover:text-purple-400 dark:hover:text-purple-300 font-medium flex items-center gap-2 transition-colors"
            >
              <n-icon><add-outline /></n-icon>
              新建画布
            </button>
          </div>

          <!-- Empty State -->
          <div v-if="projects.length === 0" class="flex flex-col items-center justify-center py-32 rounded-[2rem] border border-dashed border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 backdrop-blur-sm">
            <div class="w-24 h-24 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 flex items-center justify-center mb-6 shadow-inner border border-black/5 dark:border-white/5">
              <n-icon size="48" class="text-gray-400 dark:text-gray-600"><folder-open-outline /></n-icon>
            </div>
            <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-2">暂无项目</h3>
            <p class="text-gray-500 mb-8 font-light">您的无限画布正等待第一部杰作。</p>
            <button 
              @click="createNewProject"
              class="px-8 py-3 rounded-full bg-purple-600 hover:bg-purple-500 text-white font-medium shadow-lg shadow-purple-900/50 transition-all hover:scale-105"
            >
              创建项目
            </button>
          </div>

          <!-- Holographic Cards -->
          <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-20">
            <div 
              v-for="project in projects" 
              :key="project.id"
              class="group relative h-[280px] rounded-[2rem] p-[1px] bg-gradient-to-b from-black/5 dark:from-white/10 to-transparent hover:from-purple-500/50 hover:to-pink-500/50 transition-all duration-500 cursor-pointer"
            >
              <!-- Card Inner -->
              <div 
                @click="openProject(project)"
                class="relative h-full w-full bg-white dark:bg-[#0a0f1c] rounded-[2rem] overflow-hidden flex flex-col transition-all group-hover:bg-gray-50 dark:group-hover:bg-[#0f1629]"
              >
                <!-- Thumbnail Area -->
                <div class="h-[180px] w-full relative overflow-hidden">
                  <div class="absolute inset-0 bg-gradient-to-t from-white dark:from-[#0a0f1c] to-transparent z-10 opacity-80"></div>
                  
                  <template v-if="project.thumbnail">
                    <video 
                      v-if="isVideoUrl(project.thumbnail)"
                      :src="project.thumbnail"
                      class="w-full h-full object-cover opacity-60 group-hover:opacity-100 group-hover:scale-110 transition-all duration-700 ease-out"
                      muted loop playsinline
                      @mouseenter="e => e.target.play()"
                      @mouseleave="e => { e.target.pause(); e.target.currentTime = 0; }"
                    />
                    <img 
                      v-else
                      :src="project.thumbnail" 
                      :alt="project.name"
                      class="w-full h-full object-cover opacity-60 group-hover:opacity-100 group-hover:scale-110 transition-all duration-700 ease-out"
                    />
                  </template>
                  <div v-else class="w-full h-full flex items-center justify-center bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-repeat opacity-20">
                    <n-icon size="64" class="text-black/10 dark:text-white/10"><images-outline /></n-icon>
                  </div>

                  <!-- Hover Action -->
                  <div class="absolute inset-0 z-20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500 backdrop-blur-[2px]">
                    <div class="w-16 h-16 rounded-full bg-black/10 dark:bg-white/10 backdrop-blur-md border border-black/20 dark:border-white/20 flex items-center justify-center text-black dark:text-white shadow-[0_0_30px_rgba(139,92,246,0.3)]">
                      <n-icon size="28"><arrow-forward-outline /></n-icon>
                    </div>
                  </div>
                </div>

                <!-- Card Content -->
                <div class="flex-1 p-6 relative z-20 flex flex-col justify-between">
                  <div class="flex justify-between items-start">
                    <div>
                      <h3 class="text-xl font-bold text-gray-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-300 transition-colors truncate max-w-[200px]" :title="project.name">
                        {{ project.name }}
                      </h3>
                      <p class="text-sm text-gray-500 mt-1 font-mono">
                        {{ formatDate(project.updatedAt) }}
                      </p>
                    </div>
                    
                    <n-dropdown :options="getProjectActions(project)" @select="(key) => handleProjectAction(key, project)" placement="bottom-end">
                      <button @click.stop class="w-8 h-8 rounded-full hover:bg-black/5 dark:hover:bg-white/10 flex items-center justify-center text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors">
                        <n-icon size="20"><ellipsis-horizontal /></n-icon>
                      </button>
                    </n-dropdown>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- Templates View -->
        <section v-if="currentView === 'templates'" class="h-full py-10 flex items-center justify-center text-center">
          <div class="p-10 rounded-[2rem] bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 backdrop-blur-md">
            <n-icon size="64" class="text-purple-400 mb-4 opacity-50"><albums-outline /></n-icon>
            <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">模板库建设中</h2>
            <p class="text-gray-500 dark:text-gray-400">更多精彩模板即将上线，敬请期待。</p>
          </div>
        </section>
      </div>
    </main>

    <!-- Modals (kept minimal) -->
    <ApiSettings v-model:show="showApiSettings" @saved="refreshApiConfig" />
    
    <n-modal v-model:show="showRenameModal" preset="dialog" title="重命名项目" :show-icon="false" class="custom-modal backdrop-blur-3xl bg-white/90 dark:bg-[#0a0f1c]/90 border border-black/10 dark:border-white/10">
      <template #header>
        <div class="flex items-center gap-2 text-gray-900 dark:text-white">
          <n-icon class="text-purple-500"><create-outline /></n-icon>
          <span class="font-bold">重命名项目</span>
        </div>
      </template>
      <div class="py-6">
        <n-input v-model:value="renameValue" placeholder="输入新项目名称" size="large" class="!bg-black/5 dark:!bg-white/5 !border-black/10 dark:!border-white/10 !text-gray-900 dark:!text-white" />
      </div>
      <template #action>
        <div class="flex gap-3">
          <button @click="showRenameModal = false" class="px-4 py-2 rounded-lg text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">取消</button>
          <button @click="confirmRename" class="px-6 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold transition-colors">保存</button>
        </div>
      </template>
    </n-modal>
  </div>
</template>

<script setup>
import { ref, onMounted, h } from 'vue'
import { useRouter } from 'vue-router'
import { NIcon, NDropdown, NModal, NInput, NSwitch, useDialog } from 'naive-ui'
import { 
  SunnyOutline, 
  MoonOutline, 
  AddOutline, 
  ImageOutline, 
  ArrowForwardOutline,
  AppsOutline,
  FolderOutline,
  FolderOpenOutline,
  ImagesOutline,
  HomeOutline,
  AlbumsOutline,
  SettingsOutline,
  LogoGithub,
  ColorPaletteOutline,
  EllipsisHorizontal,
  CreateOutline,
  CopyOutline,
  TrashOutline
} from '@vicons/ionicons5'
import { isDark, toggleTheme } from '../stores/theme'
import { 
  projects, 
  initProjectsStore, 
  createProject, 
  deleteProject, 
  duplicateProject, 
  renameProject 
} from '../stores/projects'
import { useApiConfig } from '../hooks/useApiConfig'
import { useAppSettings } from '../hooks/useAppSettings'
import ApiSettings from '../components/ApiSettings.vue'

const router = useRouter()
const dialog = useDialog()
const apiConfig = useApiConfig()
const { aiWorkflowBuilderEnabled } = useAppSettings()

const showApiSettings = ref(false)
const isApiConfigured = ref(apiConfig.isConfigured.value)
const currentView = ref('home') // 'home' | 'projects' | 'templates'

const refreshApiConfig = () => {
  isApiConfigured.value = !!localStorage.getItem('apiKey')
}

// Input state
const inputText = ref('')

// Rename modal state
const showRenameModal = ref(false)
const renameValue = ref('')
const renameTargetId = ref(null)

const suggestions = [
  '赛博朋克 2077',
  '吉卜力风格田园',
  '3D 轴侧图房间',
  '极简主义海报'
]

const formatDate = (date) => {
  if (!date) return ''
  const d = new Date(date)
  const now = new Date()
  const diff = now - d
  
  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`
  if (diff < 604800000) return `${Math.floor(diff / 86400000)}天前`
  return `${d.getMonth() + 1}/${d.getDate()}`
}

const getProjectActions = (project) => [
  { label: '重命名', key: 'rename', icon: () => h(NIcon, null, { default: () => h(CreateOutline) }) },
  { label: '复制', key: 'duplicate', icon: () => h(NIcon, null, { default: () => h(CopyOutline) }) },
  { type: 'divider' },
  { label: '删除', key: 'delete', icon: () => h(NIcon, null, { default: () => h(TrashOutline) }) }
]

const handleProjectAction = (key, project) => {
  switch (key) {
    case 'rename':
      renameTargetId.value = project.id
      renameValue.value = project.name
      showRenameModal.value = true
      break
    case 'duplicate':
      duplicateProject(project.id)
      window.$message?.success('项目已复制')
      break
    case 'delete':
      dialog.warning({
        title: '删除项目',
        content: `确定要删除“${project.name}”吗？`,
        positiveText: '删除',
        negativeText: '取消',
        onPositiveClick: () => {
          deleteProject(project.id)
          window.$message?.success('项目已删除')
        }
      })
      break
  }
}

const confirmRename = () => {
  if (renameTargetId.value && renameValue.value.trim()) {
    renameProject(renameTargetId.value, renameValue.value.trim())
    window.$message?.success('已重命名')
  }
  showRenameModal.value = false
  renameTargetId.value = null
  renameValue.value = ''
}

const checkApiKeyAndNavigate = (callback) => {
  if (!isApiConfigured.value) {
    dialog.warning({
      title: '未配置 API Key',
      content: '请先在设置中配置 API Key。',
      positiveText: '好的'
    })
    return false
  }
  callback()
  return true
}

const createNewProject = () => {
  checkApiKeyAndNavigate(() => {
    const id = createProject('未命名项目')
    router.push(`/canvas/${id}`)
  })
}

const handleCreateWithInput = () => {
  checkApiKeyAndNavigate(() => {
    const name = inputText.value.trim() || '未命名项目'
    const id = createProject(name)
    sessionStorage.setItem('ai-canvas-initial-prompt', inputText.value.trim())
    inputText.value = ''
    router.push(`/canvas/${id}`)
  })
}

const openProject = (project) => {
  checkApiKeyAndNavigate(() => {
    router.push(`/canvas/${project.id}`)
  })
}

const isVideoUrl = (url) => {
  if (!url || typeof url !== 'string') return false
  const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov', '.avi', '.mkv']
  return videoExtensions.some(ext => url.toLowerCase().includes(ext))
}

const projectsSection = ref(null)
const scrollToProjects = () => {
  if (projectsSection.value) {
    projectsSection.value.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}

onMounted(() => {
  initProjectsStore()
})
</script>

<style scoped>
.animate-shine {
  animation: shine 8s linear infinite;
}
</style>