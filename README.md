# 云迹无限画布 (Yunji Canvas)

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Vue](https://img.shields.io/badge/Vue.js-3.5-4FC08D?logo=vue.js)
![Vue Flow](https://img.shields.io/badge/Vue%20Flow-1.48-ff0072?logo=vue.js)
![Vite](https://img.shields.io/badge/Vite-5.2-646CFF?logo=vite)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4-38B2AC?logo=tailwind-css)

**云迹无限画布** 是一个基于 Vue 3 + Vue Flow 构建的可视化 AI 创作平台。它允许用户在无限的画布上通过拖拽节点来编排复杂的工作流（如文生图、图生视频等），并内置了 AI 辅助功能，能够自动根据描述搭建工作流骨架或润色提示词。

作者微信：soe303

---

## ✨ 功能特性

- **可视化编排**: 基于 Vue Flow 的无限画布，支持节点的拖拽、缩放、连接、成组与自动布局。
- **AI 赋能**:
  - **智能搭建**: 输入自然语言描述，AI 自动生成完整的工作流节点结构。
  - **提示词润色**: 内置 LLM 辅助工具，优化绘画提示词。
- **多模态节点**:
  - **图像生成**: 集成文生图、图生图能力。
  - **视频生成**: 支持图片转视频工作流。
  - **基础组件**: 文本、配置、多媒体展示等基础节点。
- **项目管理**:
  - 支持多项目管理。
  - 工作流模板的导入/导出（JSON格式）。
  - 本地数据持久化存储。
- **极致体验**: 响应式设计，支持亮色/暗色模式（跟随系统或自定义），流畅的交互体验。

## 🛠 技术栈

| 模块 | 技术选型 | 说明 |
| :--- | :--- | :--- |
| **核心框架** | [Vue 3](https://vuejs.org/) | Composition API |
| **流程引擎** | [Vue Flow](https://vueflow.dev/) | 节点编排与交互核心 |
| **UI 组件库** | [Naive UI](https://www.naiveui.com/) | 现代化 Vue 3 组件库 |
| **样式工具** | [Tailwind CSS](https://tailwindcss.com/) | 原子化 CSS 框架 |
| **构建工具** | [Vite](https://vitejs.dev/) | 极速开发与构建 |
| **HTTP 客户端** | [Axios](https://axios-http.com/) | 网络请求处理 |

## 📸 项目截图

### 首页概览
![首页](./doc/home.png)

### 画布编辑
![画布](./doc/canvas.png)

### API 配置
![API 配置](./doc/api-config.png)

## 📂 目录结构

```
src/
├── api/             # API 接口定义 (Image, Video, Chat 等)
├── components/      # Vue 组件
│   ├── edges/       # 自定义连线组件 (Vue Flow)
│   └── nodes/       # 自定义节点组件 (Vue Flow)
├── config/          # 全局配置文件
├── hooks/           # 组合式函数 (useApiConfig, useWorkflow 等)
├── router/          # 路由配置
├── stores/          # 状态管理 (Reactive / Composition)
├── utils/           # 工具函数库
└── views/           # 页面视图 (Home, Canvas)
```

## 🚀 快速开始

### 环境要求

- **Node.js**: >= 18.0.0
- **包管理器**: pnpm (推荐) 或 npm

### 安装与运行

1.  **克隆项目**

    ```bash
    git clone https://github.com/your-username/huobao-canvas.git
    cd huobao-canvas
    ```

2.  **安装依赖**

    ```bash
    pnpm install
    ```

3.  **启动开发服务器**

    ```bash
    pnpm dev
    ```

    访问 `http://localhost:5173` 即可预览。

### 构建部署

```bash
# 构建生产环境代码
pnpm build

# 预览构建产物
pnpm preview
```

## ⚙️ 配置指南

首次启动后，请点击界面上的「设置」图标进行 API 配置：

- **API Base URL**: AI 服务接口地址 (支持 OpenAI 兼容格式)
- **API Key**: 你的 API 密钥
- **Chat Model**: 对话模型选择 (用于智能搭建和提示词优化)

所有配置均存储于本地浏览器 (`localStorage`)，不会上传至服务器。

## 🐳 Docker 部署

本项目支持 Docker 快速部署。

详情请参考: [README.docker.md](./README.docker.md)

```bash
# 快速启动
docker-compose up -d --build
```

## 📄 License

本项目采用 [MIT License](LICENSE) 开源。

---
<p align="center">Made with ❤️ by Yunji Team</p>
