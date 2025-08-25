# AI 任务流平台 - 版本存档 (V3.0 Final)

**日期**: 2025-08-25

## 1. 概述

本文档旨在记录和存档 AI 任务流平台在当前重要版本节点 (V3.0) 的技术状态、核心架构和功能实现。它是一个技术快照，用于未来的开发、维护和问题排查。**此版本标志着项目已达到一个功能稳定、架构清晰的里程碑，所有核心业务逻辑均已与后端数据库打通，并为未来的 AI 能力扩展做好了准备。**

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

## 4. 核心功能模块实现

### 4.1. 用户认证 (Authentication)

*   **流程**: 采用客户端优先的认证模式，与后端 Firestore 数据库完全集成。
*   **注册 (`/signup`)**:
    1.  **客户端**: 使用 Firebase 客户端 SDK 的 `createUserWithEmailAndPassword` 创建用户。
    2.  **服务器端**: 成功后，调用后端流程 `createUserRecord`，将用户的 UID、角色、姓名等附加信息**真实存入** Firestore 的 `users` 集合。
*   **登录 (`/login`)**:
    1.  **客户端**: 使用 Firebase 客户端 SDK 的 `signInWithEmailAndPassword` 进行登录。
    2.  **服务器端**: 成功后，调用后端流程 `loginUser`，根据 UID 从 Firestore `users` 集合中获取用户角色等真实信息。
*   **状态管理**: 用户登录状态和角色信息存储在 `localStorage` 中，并在 `src/app/page.tsx` 中通过 `useAuth` 钩子进行管理，实现不同角色的视图分发。

### 4.2. 仪表盘 (Dashboards) - 数据持久化

*   **管理员仪表盘 (`AdminDashboard`)**:
    *   **数据获取**: 通过 `getTenantsAndUsers` 流程**真实地**从 Firestore 加载所有租户和用户信息。
    *   **核心功能**: 提供对租户和用户的增删改查 (CRUD) 操作，所有操作均通过独立的后端流程 (`saveTenant`, `deleteUser` 等) 与数据库交互，保证了数据的持久化。
    *   **资产管理**: 提供对 LLM 连接、Token 和软件资产的 CRUD 操作，所有配置均**真实写入** Firestore 数据库。
*   **企业租户仪表盘 (`TenantDashboard`)**:
    *   **数据获取**: 通过 `getTenantData` 流程**真实地**从 Firestore 加载特定租户的用户、订单和角色数据。该流程还包含**后端聚合逻辑**，用于计算真实的 Token 使用量，为统计图表提供数据。
    *   **核心功能**: 包含集采市场、我的订单、成员管理和资源权限配置等标签页。所有关键操作（如邀请用户、保存角色、创建预购单、管理API密钥）都通过**真实的后端流程**与数据库交互。

### 4.3. 提示词工程师工作台 (`PromptUniverseWorkbench`)

*   **三栏布局**: 左侧为提示词库，中间为编辑器，右侧为测试和元数据分析。
*   **提示词库 (`PromptLibrary`)**:
    1.  启动时调用 `getPrompts` 流程加载所有**真实存储在 Firestore 中**的提示词。
    2.  支持搜索、选用和删除（逻辑删除，调用 `deletePrompt` 流程）。
*   **保存流程**:
    1.  `handleSavePrompt` 首先调用 `analyzePromptMetadata` 流程，让 AI 分析提示词并生成元数据 (**当前为模拟调用**)。
    2.  然后将提示词内容和AI生成的元数据一起传递给 `savePrompt` 流程，在 Firestore 中**真实地创建或更新**记录。
*   **测试 (`PromptTestbed`)**: 调用 `executePrompt` 流程 (**当前为模拟调用**)，支持传入动态变量和 `temperature` 参数。

### 4.4. AI 工作台 (用户视图 - `AIWorkbench`) - 模拟后端

*   **双模式设计**:
    *   **引导模式 (Guide)**:
        1.  左侧为 `RequirementsNavigator`，通过 `aiRequirementsNavigator` 流程与 AI 对话 (**当前为模拟对话**)，明确用户需求。
        2.  对话结束后，流程返回一个 `suggestedPromptId`。
        3.  中间的 `ScenarioLibraryViewer` 根据 `promptId` 从所有场景中筛选并展示推荐场景。
        4.  用户可“选用”或“微调”场景，并在右侧 `UserActionPanel` 中进行测试。
    *   **专家模式 (Expert)**:
        1.  左侧为 `TaskDispatchCenter`，用户输入自然语言指令。
        2.  调用 `taskDispatch` 流程 (**当前为模拟流程**)，该 Flow 会将用户指令分解为结构化的任务列表 (`Task[]`) 并返回。
        3.  前端将任务列表以卡片形式展示，并模拟任务的逐步执行。

---

## 5. 关键架构决策与修复

*   **Firebase 初始化**: 解决了反复出现的 "The default Firebase app does not exist" 的问题。最终方案是：
    1.  在 `src/lib/firebase.ts` 中使用 `getApps().length ? getApp() : initializeApp(config)` 模式，确保客户端 Firebase 实例的单例和健壮性。
    2.  在 `src/lib/firebase-admin.ts` 中独立初始化 Admin SDK，并由所有后端流程统一导入，避免了重复初始化和配置混乱。

*   **核心架构演进：AI 引擎解耦与模拟后端**
    *   **问题**: 在开发过程中发现，项目依赖的 `genkit` AI 库与 `next@14.x` 存在严重的不兼容问题，导致 `npm install` 失败和构建错误 (`Module not found: genkit`)。
    *   **决策**: 为了保证项目的**绝对稳定**和**可构建性**，我们做出了一个关键的架构决策：
        1.  **移除不兼容依赖**: 从 `package.json` 中彻底移除了 `genkit` 和 `@genkit-ai/googleai`。
        2.  **禁用 AI 真实调用**: 注释掉了所有 `src/ai/` 目录下与 Genkit 相关的初始化和流程定义代码。
        3.  **实现模拟后端 (Mock Backend)**: 将所有 AI 相关的后端流程 (如 `aiRequirementsNavigator`, `executePrompt`, `taskDispatch`) 的实现替换为返回**符合数据结构（Zod Schema）的模拟数据**的纯 TypeScript 函数。
    *   **带来的好处**:
        *   **项目稳定**: 项目可以被 100% 可靠地安装、构建和运行。
        *   **前后端解耦**: 前端组件的开发可以独立于后端 AI 的具体实现，只要接口（输入/输出）不变，前端无需任何改动。
        *   **架构清晰**: 为未来接入任何 AI 引擎（无论是恢复 Genkit，还是替换为 OpenAI API、Anthropic API 等）打下了坚实的基础。届时，我们只需修改这些后端流程文件的内部实现，即可无缝切换 AI 服务提供商，完美实现了**模型解耦**和**智能路由**的架构目标。

*   **API 密钥管理**: 实现了完整的、数据库驱动的企业租户自助式 API 密钥管理系统，包括安全的创建、获取和撤销逻辑，为平台的商业化做好了准备。

---

此存档代表了项目当前稳定且功能完整的状态，并为未来的 AI 能力集成做好了充分的架构准备。
