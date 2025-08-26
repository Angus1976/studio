# 稳定配置参考 (V4.0)

本文档概述了此 Next.js 项目在 **2025-08-25** 的稳定工作配置。它旨在作为解决未来构建或启动错误的参考。

## 1. 关键依赖 (`package.json`)

项目的稳定性依赖于特定版本的关键包。

- **Next.js 版本**: 应用在 `next@14.2.3` 上稳定。
  ```json
  "next": "14.2.3",
  ```

- **开发脚本**: `dev` 脚本应保持简洁，以避免与开发环境注入的参数冲突。
  ```json
  "scripts": {
    "dev": "next dev",
    ...
  },
  ```

- **AI/Genkit 依赖**: 所有 `genkit` 和 `@genkit-ai/*` 包已被**移除**。它们与 `next@14.x` 不兼容。AI 功能现在通过**直接调用原生模型 API** 的方式实现，这种方式更稳定且与模型无关。

## 2. Next.js 配置 (`next.config.js`)

配置文件**必须**命名为 `next.config.js` 并使用 CommonJS `module.exports` 语法。

- **正确文件名**: `next.config.js`
- **正确语法**:
  ```javascript
  /** @type {import('next').NextConfig} */
  const nextConfig = {
    /* config options here */
    typescript: {
      ignoreBuildErrors: true,
    },
    eslint: {
      ignoreDuringBuilds: true,
    },
    images: {
      remotePatterns: [
        {
          protocol: 'https',
          hostname: 'placehold.co',
          port: '',
          pathname: '/**',
        },
      ],
    },
  };

  module.exports = nextConfig;
  ```

## 3. 已启用的 AI 功能 (原生 API 调用)

位于 `src/ai/flows/` 的 AI 流程**已完全启用并与后端打通**。

- **实现方式**: 我们没有使用任何特定的 AI SDK（如 Genkit），而是采取了“模型解耦”的策略。核心执行流程 `src/ai/flows/prompt-execution-flow.ts` 会：
    1.  从 Firestore 数据库中根据 `modelId` 查询模型的提供商 (`provider`) 和 `apiKey`。
    2.  使用 `fetch` API 构建符合该模型厂商规范的原生 API 请求。
    3.  直接调用模型 API 并返回结果。

- **优势**:
    - **稳定**: 彻底解决了第三方 SDK 与 Next.js 的兼容性问题。
    - **灵活**: 支持对接任何拥有 API 的大语言模型。要添加新模型，只需在管理员后台的“资产管理”中配置其信息，并在后端执行流程中增加一个新的 `case` 即可。
    - **生产就绪**: 平台现在是一个真正的模型中立（Model-Agnostic）应用。

遵循这些配置，应用将保持稳定运行。
