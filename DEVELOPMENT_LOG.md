# 开发日志 (Development Log)

本文档旨在记录项目开发过程中遇到的关键技术问题、错误、解决方案和重要决策，作为团队的技术备忘和知识沉淀，以避免重复犯错。

---

## 2025-08-26: `ReferenceError: Component is not defined`

### 1. 问题描述

在实现新功能（如“交易管理”对话框）时，应用在运行时崩溃，浏览器控制台或 Next.js 终端中显示 `ReferenceError: Label is not defined` (或其他组件名)。错误指向代码中一个看起来完全合法的 JSX 标签，例如 `<Label>...</Label>`。

### 2. 根本原因分析

这是一个纯粹的 JavaScript 作用域问题，比之前遇到的 `Element type is invalid` 错误更直接。

*   **错误本质**: `ReferenceError` 的意思是，当代码执行到 `<Label />` 这一行时，JavaScript 引擎在当前文件的作用域中找不到一个叫做 `Label` 的变量或函数。
*   **根本原因**: 几乎总是因为**忘记在文件顶部添加对应的 `import` 语句**。虽然 JSX 看起来像 HTML，但每个组件标签（如 `<Label>`、`<Button>`、`<Card>`）在被编译后，实际上都是对一个 JavaScript 对象或函数的引用。如果这个对象或函数没有被 `import` 进来，它在当前作用域中就是未定义的，从而导致引用错误。

### 3. 与 `Element type is invalid` 的区别

| 错误类型 | `ReferenceError: X is not defined` | `Error: Element type is invalid... got: undefined` |
| :--- | :--- | :--- |
| **问题本质** | **变量未定义** (Not Defined) | **变量已定义，但其值为 `undefined`** (Is Undefined) |
| **常见原因** | 忘记 `import` 组件。 | 1. 错误的导入/导出语法（`default` vs. 命名）。<br>2. 循环依赖（Circular Dependency）。<br>3. 异步导入问题。 |
| **排查难度** | **低**。错误信息直接，解决方案单一。 | **高**。根源通常更隐晦，需要检查依赖链。 |
| **解决方案** | 在文件顶部添加正确的 `import` 语句。 | 重构代码以打破循环依赖，或修正导入/导出语法。 |

### 4. 解决方案与规避措施

1.  **直接解决**: 定位到报错的组件名（如 `Label`），然后在该文件的顶部添加正确的导入语句。
    ```javascript
    import { Label } from "@/components/ui/label";
    ```
2.  **依赖开发工具**:
    *   **自动导入**: 充分利用现代IDE（如VS Code）的自动导入功能。当你输入一个组件名时，通常会有弹窗提示你自动添加 `import`。
    *   **Linter警告**: 配置好 Linter (ESLint) 会在你使用未定义变量时立即给出警告或错误，应将其视为必须解决的问题。
3.  **代码审查**: 在提交代码前，快速浏览一下文件的 `import` 部分，确认所有在 JSX 中使用的组件都已被导入。

---

## 2025-08-25: `useEffect` 语法错误导致构建失败

### 1. 问题描述

在将 `prompt-library.tsx` 组件中的“专家领域”列表从硬编码改为从后端动态加载时，对 `useEffect` 钩子进行了修改。修改后，应用无法正常构建，Next.js 抛出 `Module build failed` 错误，错误信息指向 `<Card>` 组件，提示 `Unexpected token 'Card'. Expected jsx identifier`。

### 2. 根本原因分析

经过回滚和代码审查，最终定位到问题根源是一个非常细微但致命的语法错误：

在 `src/components/app/prompt-library.tsx` 的 `useEffect` 钩子中，为了给 `fetchDomains` 异步函数添加 `try...catch...finally` 结构，修改了原有代码。但是在函数定义的末尾，**遗漏了一个关键的闭合圆括号 `)`**。

**错误代码片段:**
```javascript
useEffect(() => {
    async function fetchDomains() {
        try {
            // ... a lot of code
        } finally {
            setIsLoadingDomains(false);
        }
    } // <--- 错误的函数定义，缺少闭合括号
    fetchDomains();
// <--- 这里缺少了一个 ')' 来闭合 useEffect 的回调函数
}, [toast]);
```

这个遗漏的 `)` 导致 `useEffect` 的回调函数体结构被破坏。因此，当 JSX 解析器继续向下解析到 `return (` 部分的 `<Card>` 标签时，它处于一个非法的语法上下文中，故而抛出了语法错误。

### 3. 教训与规避措施

1.  **细致审查括号匹配**: 在修改任何涉及闭包、回调函数（尤其是像 `useEffect`, `useCallback` 这样的钩子）或复杂逻辑块的代码时，必须将**括号、花括号、方括号的成对匹配**作为首要检查项。
2.  **信任并利用工具**: IDE 的语法高亮和 Linter（如 ESLint）通常能立即发现此类不匹配问题。在提交代码前，必须关注这些工具的警告和错误提示。执行 `npm run typecheck` (`tsc --noEmit`) 也是一个有效的检查步骤。
3.  **小步提交与测试**: 当对现有代码进行重构（例如，为函数添加 `try...catch`）时，应遵循最小化变更原则。完成一个小的、完整的逻辑修改后，应立刻检查应用的运行状态，而不是一次性进行大量修改，这有助于快速定位问题。
