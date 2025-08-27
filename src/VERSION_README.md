# AI 任务流平台 - 版本存档 (V4.0 Final)

**日期**: 2025-08-25

## 1. 概述

本文档旨在记录和存档 AI 任务流平台在当前重要版本节点 (V4.0) 的技术状态、核心架构和功能实现。它是一个技术快照，用于未来的开发、维护和问题排查。**此版本标志着项目已达到一个功能完整、逻辑闭环、数据持久化的全栈应用里程碑。所有模拟数据和后端流程均已被替换为与真实数据库和 AI 模型 API 对接的生产级实现。**

---

## 2. 技术栈与核心依赖

*   **框架**: Next.js 14.2.3 (App Router)
*   **语言**: TypeScript
*   **UI 组件库**: shadcn/ui
*   **样式**: Tailwind CSS
*   **表单处理**: React Hook Form with Zod for validation
*   **后端服务/数据库**: Firebase (Authentication & Firestore for Admin SDK)
*   **核心依赖**:
    *   `react`: ^18.3.1
    *   `next`: 14.2.3
    *   `firebase`: ^11.9.1
    *   `firebase-admin`: ^13.4.0
    *   `lucide-react`: ^0.475.0 (for icons)

---

## 3. 项目结构概览

`src/
├── app/                  # Next.js App Router (页面)
│   ├── (pages)/          # 各个页面组件
│   ├── globals.css       # 全局样式与CSS变量
│   └── layout.tsx        # 根布局
├── ai/                   # 后端业务逻辑流程
│   ├── flows/            # 所有的后端业务流程 (例如: 用户管理, 提示词管理, AI工作流)
│   └── genkit.ts         # (已禁用) Genkit 初始化与配置
├── components/           # React 组件
│   ├── app/              # 应用核心业务组件
│   └── ui/               # shadcn/ui 自动生成的组件
├── hooks/                # 自定义 React Hooks
├── lib/                  # 辅助函数与库配置
│   ├── data-types.ts     # Zod schemas 和核心 TypeScript 类型
│   ├── firebase.ts       # Firebase 客户端初始化
│   └── firebase-admin.ts # Firebase Admin SDK 初始化 (后端使用)
└── ...
`

---

## 4. 核心功能模块实现 (真实数据对接)

### 4.1. 用户认证 (Authentication) - 已完成

*   **流程**: 采用客户端优先的认证模式，与后端 Firestore 数据库完全集成。
*   **注册 (`/signup`)**:
    1.  **客户端**: 使用 Firebase 客户端 SDK 的 `createUserWithEmailAndPassword` 创建用户。
    2.  **服务器端**: 成功后，调用后端流程 `createUserRecord`，将用户的 UID、角色、姓名等附加信息**真实存入** Firestore 的 `users` 集合。
*   **登录 (`/login`)**:
    1.  **客户端**: 使用 Firebase 客户端 SDK 的 `signInWithEmailAndPassword` 进行登录。
    2.  **服务器端**: 成功后，调用后端流程 `loginUser`，根据 UID 从 Firestore `users` 集合中获取用户角色等真实信息。
*   **状态管理**: 用户登录状态和角色信息存储在 `localStorage` 中，并在 `src/app/page.tsx` 中通过 `useAuth` 钩子进行管理，实现不同角色的视图分发。

### 4.2. 仪表盘 (Dashboards) - 已完成

*   **管理员仪表盘 (`AdminDashboard`)**:
    *   **数据获取**: 通过 `getTenantsAndUsers` 流程**真实地**从 Firestore 加载所有租户和用户信息，并聚合已完成订单的总收入。
    *   **核心功能**: 提供对租户、用户、订单、集采商品和平台资产（LLM连接等）的完整增删改查 (CRUD) 操作，所有操作均通过独立的后端流程与数据库交互，保证了数据的持久化。
*   **企业租户仪表盘 (`TenantDashboard`)**:
    *   **数据获取**: 通过 `getTenantData` 流程**真实地**从 Firestore 加载特定租户的用户、订单和角色数据。该流程还包含**后端聚合逻辑**，用于计算真实的 Token 使用量，为统计图表提供数据。
    *   **核心功能**: 包含集采市场、我的订单、成员管理和资源权限配置等标签页。所有关键操作（如邀请用户、保存角色、创建预购单、管理API密钥）都通过**真实的后端流程**与数据库交互。

### 4.3. 提示词工程师工作台 (`PromptUniverseWorkbench`) - 已完成

*   **三栏布局**: 左侧为提示词库，中间为编辑器，右侧为测试和元数据分析。
*   **提示词库 (`PromptLibrary`)**:
    1.  启动时调用 `getPrompts` 流程加载所有**真实存储在 Firestore 中**的提示词。
    2.  支持搜索、选用和删除（逻辑删除，调用 `deletePrompt` 流程）。
*   **保存流程 (联动AI)**:
    1.  `handleSavePrompt` **首先真实调用** `analyzePromptMetadata` 流程，让 AI 分析提示词并生成元数据。
    2.  然后将提示词内容和AI返回的元数据一起传递给 `savePrompt` 流程，在 Firestore 中**真实地创建或更新**记录。
*   **多模型测试 (`PromptTestbed`)**:
    1.  测试面板通过 `getPlatformAssets` **动态加载**管理员在后台配置的所有 LLM 连接。
    2.  工程师可以选择任意模型，连同提示词内容、变量和参数一起，通过 `executePrompt` 流程**真实调用选定模型的 API**，并获得返回结果。

### 4.4. AI 工作台 (用户视图 - `AIWorkbench`) - 已完成

*   **引导模式 (Guide)**:
    1.  左侧的 `RequirementsNavigator` 通过 `aiRequirementsNavigator` 流程与**真实的 LLM API**进行智能对话，明确用户需求。
    2.  对话结束后，流程返回一个 `suggestedPromptId`。
    3.  中间的 `ScenarioLibraryViewer` 根据 `promptId` 从数据库中筛选并展示推荐场景。
    4.  用户可“选用”或“微调”场景，并在右侧 `UserActionPanel` 中，**选择一个通用模型**，通过 `digitalEmployee` 流程进行**真实测试**。
*   **专家模式 (Expert)**:
    1.  左侧 `TaskDispatchCenter`，用户输入自然语言指令。
    2.  调用 `taskDispatch` 流程，**真实调用 LLM API**，将用户指令分解为结构化的任务列表 (`Task[]`) 并返回。
    3.  前端将任务列表以卡片形式展示，并模拟任务的逐步执行。

---

## 5. 关键架构决策与演进

*   **Firebase Admin SDK 初始化**: 在 `src/lib/firebase-admin.ts` 中实现了一次性的、健壮的 Admin SDK 初始化，解决了在 Server Actions 中反复初始化导致的问题，并确保所有后端流程共享同一个实例。

*   **模型解耦与原生 API 调用**:
    *   **背景**: 鉴于 `genkit` 库与 `next@14.x` 的不兼容性，我们采取了“模型解耦”的核心架构策略。
    *   **实现**: 我们没有绑定任何特定的 AI SDK。相反，我们在 `prompt-execution-flow.ts` 中创建了一个通用的执行器。该执行器根据传入的 `modelId` 从 Firestore 查询模型的提供商 (`provider`) 和密钥 (`apiKey`)，然后使用原生的 `fetch` API，构建符合目标厂商（如 Google AI, DeepSeek）规范的请求，实现对任意模型的调用。
    *   **优势**: 此架构**极其灵活且可扩展**。未来要支持新的大模型（如 OpenAI, Anthropic, 阿里云通义千问等），只需在 `executePrompt` 流程中增加一个新的 `case` 分支，并实现其对应的原生 API 请求即可，无需更改任何前端代码或核心业务逻辑。

*   **模型动态查找与优先级机制**:
    *   **设计思想**: 为了在“确保核心AI功能有可靠的默认模型”和“保留未来接入更多模型的灵活性”之间取得平衡，我们为LLM连接引入了优先级机制。
    *   **实现方式**: 在`LlmConnection`数据结构中增加了`priority`字段（1-100，数字越小优先级越高）。平台内部需要调用通用AI能力的后端流程（如`aiRequirementsNavigator`）会按`priority`升序查询所有状态为“活跃”的“通用”模型，并自动选用优先级最高的一个。
    *   **管理员操作**: 平台管理员可以通过在后台设置LLM连接的优先级，来精确控制平台默认使用哪个AI模型，从而保证了核心AI能力的稳定性、可预测性和可扩展性。

*   **高级可复用布局系统**:
    *   创建了 `ThreeColumnLayout` (`/src/components/app/layouts/three-column-layout.tsx`) 和 `CollapsiblePanel` (`/src/components/app/layouts/collapsible-panel.tsx`) 两个高级布局组件。
    *   该系统通过 `React.Context` 提供了强大的面板控制API，支持**最大化/恢复**和**关闭/打开**每一个栏目，并能通过 Cookie **自动保存和恢复用户自定义的布局尺寸**，提供了媲美桌面应用的专业交互体验。

---

此存档代表了项目当前稳定且功能完整的状态。它是一个完全由真实数据驱动、逻辑闭环、可扩展性强的全栈 AI 应用。
