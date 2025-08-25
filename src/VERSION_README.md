# AI 任务流平台 - 版本存档 (V3.0)

**日期**: 2025-08-12

## 1. 概述

本文档旨在记录和存档 AI 任务流平台在当前重要版本节点 (V3.0) 的技术状态、核心架构和功能实现。它是一个技术快照，用于未来的开发、维护和问题排查。

---

## 2. 技术栈与核心依赖

*   **框架**: Next.js 14.2.3 (App Router)
*   **语言**: TypeScript
*   **UI 组件库**: shadcn/ui
*   **样式**: Tailwind CSS
*   **表单处理**: React Hook Form with Zod for validation
*   **AI/GenAI**: Genkit with Google AI (Gemini 1.5 Flash)
*   **后端服务/数据库**: Firebase (Authentication & Firestore)
*   **核心依赖**:
    *   `react`: ^18.3.1
    *   `next`: 14.2.3
    *   `genkit`: ^1.0.3
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
├── ai/                   # AI/Genkit 相关逻辑
│   ├── flows/            # Genkit 流程 (后端服务逻辑)
│   └── genkit.ts         # Genkit 初始化与配置
├── components/           # React 组件
│   ├── app/              # 应用核心业务组件
│   └── ui/               # shadcn/ui 自动生成的组件
├── hooks/                # 自定义 React Hooks
├── lib/                  # 辅助函数与库配置
│   ├── data-types.ts     # Zod schemas 和核心 TypeScript 类型
│   ├── firebase.ts       # Firebase 客户端初始化
│   └── firebase-admin.ts # Firebase Admin SDK 初始化
└── ...
`

---

## 4. 核心功能模块实现

### 4.1. 用户认证 (Authentication)

*   **流程**: 采用客户端优先的认证模式。
*   **注册 (`/signup`)**:
    1.  **客户端**: 使用 Firebase 客户端 SDK 的 `createUserWithEmailAndPassword` 创建用户。
    2.  **服务器端**: 成功后，调用后端 Genkit Flow `createUserRecord`，将用户的 UID、角色、姓名等附加信息存入 Firestore 的 `users` 集合。
*   **登录 (`/login`)**:
    1.  **客户端**: 使用 Firebase 客户端 SDK 的 `signInWithEmailAndPassword` 进行登录。
    2.  **服务器端**: 成功后，调用后端 Genkit Flow `loginUser`，根据 UID 从 Firestore `users` 集合中获取用户角色等信息。
*   **状态管理**: 用户登录状态和角色信息存储在 `localStorage` 中，并在 `src/app/page.tsx` 中通过 `useAuth` 钩子进行管理，实现不同角色的视图分发。

### 4.2. 仪表盘 (Dashboards)

*   **管理员仪表盘 (`AdminDashboard`)**:
    *   **数据获取**: 通过 `getTenantsAndUsers` Flow 从 Firestore 加载所有租户和用户信息。
    *   **核心功能**: 提供对租户和用户的增删改查 (CRUD) 操作，所有操作均通过独立的 Genkit Flow (`saveTenant`, `deleteUser` 等) 与后端交互，保证了前端界面的简洁性。
    *   **UI**: 采用对话框 (`Dialog`) 进行表单操作，主界面通过卡片和表格展示数据。
*   **企业租户仪表盘 (`TenantDashboard`)**:
    *   **功能**: 这是一个模拟的功能丰富的仪表盘，包含概览、集采市场、我的订单、成员管理和资源权限配置等标签页。
    *   **实现**: UI 完全由客户端组件构成，数据为静态模拟数据。所有交互（如创建预购单、邀请用户）都在组件内部处理状态，并通过 `toast` 提示用户操作结果。这是一个纯前端的演示模块。
*   **提示词工程师工作台 (`PromptEngineerWorkbench`)**:
    *   **三栏布局**: 左侧为提示词库，中间为编辑器，右侧为测试和元数据分析。
    *   **提示词库 (`PromptLibrary`)**:
        1.  启动时调用 `getPrompts` Flow 加载所有未归档的提示词。
        2.  支持搜索、选用和删除（逻辑删除，调用 `deletePrompt` Flow）。
    *   **编辑器 (`PromptEditor`)**:
        1.  结构化表单，对应 `Prompt` 数据结构。
        2.  点击“保存”时，调用 `handleSavePrompt` 函数。
    *   **保存流程**:
        1.  `handleSavePrompt` 首先调用 `analyzePromptMetadata` Flow，让 AI 分析提示词并生成元数据。
        2.  然后将提示词内容和AI生成的元数据一起传递给 `savePrompt` Flow，在 Firestore 中创建或更新记录。
    *   **测试 (`PromptTestbed`)**: 调用 `executePrompt` Flow，支持传入动态变量和 `temperature` 参数。

### 4.3. AI 工作台 (用户视图 - `AIWorkbench`)

*   **双模式设计**:
    *   **引导模式 (Guide)**:
        1.  左侧为 `RequirementsNavigator`，通过 `aiRequirementsNavigator` Flow 与 AI 对话，明确用户需求。
        2.  对话结束后，Flow 返回一个 `suggestedPromptId`。
        3.  中间的 `ScenarioLibraryViewer` 根据 `promptId` 从所有场景中筛选并展示推荐场景。
        4.  用户可“选用”或“微调”场景，并在右侧 `UserActionPanel` 中进行测试。
    *   **专家模式 (Expert)**:
        1.  左侧为 `TaskDispatchCenter`，用户输入自然语言指令。
        2.  调用 `taskDispatch` Flow，该 Flow 会将用户指令分解为结构化的任务列表 (`Task[]`) 并返回。
        3.  前端将任务列表以卡片形式展示，并模拟任务的逐步执行。
*   **数据流**: 所有与 AI 的交互都通过封装好的 Genkit Flows 进行，前端组件只负责展示和用户输入，实现了前后端逻辑的清晰分离。
*   **模型解耦**: 所有核心 AI 流程（如 `aiRequirementsNavigator`, `taskDispatch`）均已进行重构，将模型选择（例如 `gemini-1.5-flash`）从业务逻辑中解耦，为未来接入多模型和实现智能路由奠定了架构基础。

---

## 5. 关键修复与决策

*   **Firebase 初始化**: 解决了反复出现的 "The default Firebase app does not exist" 的问题。最终方案是：
    1.  在 `src/lib/firebase.ts` 中使用 `getApps().length ? getApp() : initializeApp(config)` 模式，确保客户端 Firebase 实例的单例和健壮性。
    2.  在 `src/lib/firebase-admin.ts` 中独立初始化 Admin SDK，并由所有后端 Flow 统一导入，避免了重复初始化和配置混乱。
*   **环境变量加载**: 解决了 "Module not found: 'dotenv'" 的问题。通过在 `package.json` 中添加 `dotenv` 依赖，并在核心入口文件 (`src/ai/genkit.ts`) 的顶部进行加载，确保了环境变量在整个应用生命周期中可用。
*   **Firestore 查询索引**: 解决了因缺少复合索引而导致的提示词库加载失败问题。通过将 `.orderBy()` 从数据库查询中移除，改为在获取数据后于后端代码中进行排序，绕过了对特定索引的依赖。

---

此存档代表了项目当前稳定且功能完整的状态。
