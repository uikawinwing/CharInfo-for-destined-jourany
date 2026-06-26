# AGENTS.md

本仓库用于编写 Tavern Helper / SillyTavern 的前端界面与脚本。这里放的是给 Codex / Agent 的入口规则；项目细节以 `.cursor/rules/` 和目标目录附近代码为准。

## 回复与协作

- 始终用**中文**回复，称呼用户为 Master。
- 语气直接、可靠、亲近；少套话，少空泛总结，先给结果或下一步。
- 需求清楚时直接做；只有缺失信息会明显改变方案或带来风险时才提问。
- 多步骤任务先发一句简短进度说明，再读上下文和动手。
- 不扩写需求，不顺手加无关功能，不为了“更完整”做大重构。
- 发现用户方案有风险时直接指出，并给出可执行替代方案。

## 开始前必须读

任何代码修改、调试、重构、排错前，先读：

- `README.md`
- `.cursor/rules/项目基本概念.mdc`
- `.cursor/rules/mcp.mdc`
- `.cursor/rules/酒馆变量.mdc`
- `.cursor/rules/酒馆助手接口.mdc`

再按任务类型补读：

- 前端界面、状态栏、楼层 UI、Vue、HTML、CSS、样式：`.cursor/rules/前端界面.mdc`
- 后台脚本、事件监听、按钮、操作酒馆页面 DOM：`.cursor/rules/脚本.mdc`
- MVU、变量结构、`schema.ts`、`stat_data`、MVU 角色卡：`.cursor/rules/mvu变量框架.mdc`
- MVU 角色卡文件夹、角色卡脚本 / 界面 / 世界书：`.cursor/rules/mvu角色卡.mdc`

读完规则后，再读目标目录附近的实现、模板和类型定义。不要凭通用前端经验直接写。

## 项目判断

- `src/<name>/index.ts` + `src/<name>/index.html` 是前端界面项目。
- 只有 `src/<name>/index.ts` 是脚本项目。
- `示例/` 是参考实现，`初始模板/` 是新建模板。
- `@types/` 是 Tavern Helper、SillyTavern、MVU 等全局接口类型。
- `util/` 是本项目封装工具，优先复用。
- 目标不明确时，用 `rg --files` 查找相近文件和命名模式，再选择最小修改范围。

## 开发原则

- 使用 TypeScript，不新建 JavaScript 脚本。
- 运行环境是浏览器，不使用 Node.js 专用库。
- 优先使用 `package.json` 已有依赖，不随意新增 dependency。
- 优先使用 Tavern Helper 接口和 `@types/function/*`、`@types/iframe/*` 类型。
- 不优先使用低层级 `SillyTavern` 原生接口。
- 不优先使用 STScript；只有没有合适接口时，才通过 `triggerSlash` 调用 `slash_command.txt` 中的命令。
- 酒馆助手接口在运行环境中可直接使用，通常不需要导入或自行声明。
- 修改前看同目录已有写法，保持项目风格。

## 加载、卸载与状态

- 不用 `DOMContentLoaded` 初始化。使用 `$(() => { errorCatched(init)(); });`。
- 卸载用 `pagehide`，不用 `unload`。
- 注册事件监听、挂载 Vue、插入 DOM、复制样式、启动定时器后，必须在 `pagehide` 清理。
- 持久化数据优先用 `getVariables` / `replaceVariables`。
- 脚本配置使用脚本变量：`{ type: 'script', script_id: getScriptId() }`。
- Vue reactive/ref 写回酒馆变量前，用 `klona()` 去掉 proxy。
- 需要响应式读写时，优先使用 Pinia + Zod；Zod 使用本项目 Zod 4 写法。

## 前端界面规则

- `index.html` 只写静态 `<body>` 内容，通常只放 `<div id="app"></div>`。
- 不在 `index.html` 写 `<script src="./index.ts">` 或本地 `<link>`。
- 不写空的 `<img src="">`。
- 样式通过 TypeScript 导入，或写在 Vue 组件中。
- 优先使用 Vue 组件、Pinia、Zod。
- Vue Router 在 iframe 中使用 `createMemoryHistory()`。
- iframe 高度不要依赖 `vh`。
- 页面整体用宽度和 `aspect-ratio` 适配，不产生横向滚动条。
- 主体内容不要完全脱离文档流，避免宿主楼层无法正确计算高度。

## 脚本规则

- 脚本默认在后台 iframe 中运行，没有自己的可见界面。
- 脚本中的 jQuery 会作用于整个酒馆页面，不只作用于脚本 iframe。
- 需要挂载 Vue 到酒馆页面时，用 jQuery 创建挂载点，并在 `pagehide` 卸载。
- 需要沿用酒馆网页样式时，挂载到父页面 DOM，并用 `teleportStyle()` 复制样式；这种场景不要使用 Tailwind class，避免类名冲突。
- 独立悬浮窗或独立 UI 优先用 `createScriptIdIframe()` 创建隔离 iframe，再挂载 Vue。
- 添加脚本按钮时使用 `appendInexistentScriptButtons`，按钮事件用 `eventOn(getButtonEvent(...), ...)`。

## MVU

- 只有用户明确提到 MVU、变量结构、`schema.ts`、`stat_data`、MVU 角色卡时，才进入 MVU 专项规则。
- 使用 MVU 前先 `await waitGlobalInitialized('Mvu')`。
- 前端界面读取楼层 MVU 变量前，要等待消息楼层变量准备好。
- MVU 数据通常位于 `stat_data`。
- 优先查找并复用同目录或角色卡目录中的 `schema.ts`。
- `schema.ts` 只导出 `export const Schema`，不要混入注册副作用。
- 如果用户给的是“变量结构脚本”，去掉 `registerMvuSchema` 的导入与 `$(() => registerMvuSchema(...))` 包装，只保留 schema。
- MVU 角色卡脚本、界面、世界书参考 `初始模板/角色卡` 与 `示例/角色卡示例`。

## 调试与验证

- SillyTavern 地址以 `.vscode/launch.json` 为准，目前是 `http://localhost:8000`。
- Chrome DevTools MCP 固定连接 `http://127.0.0.1:9222`。
- 需要操作页面时，优先连接用户已经打开并操作到当前状态的 SillyTavern 页面；不要重新打开首页后猜测状态。
- 连接页面后检查 `#extensions_settings` 中“酒馆助手-实时监听-允许监听”是否启用。
- 若实时监听已启用，代码改动会热重载到酒馆页面；通常不需要刷新页面，也不需要为了同步而手动完整 build。
- 验证优先级：目标行为检查、类型 / lint、构建、必要的页面 smoke test。
- 常用命令：`pnpm run build:dev`、`pnpm run build`、`pnpm run watch`、`pnpm run format`、`pnpm run lint`、`pnpm run lint:fix`。
- 最终回复前扫描 diff，检查是否有症状补丁、重复逻辑、隐藏 fallback、吞错、死代码、未说明的行为变化、弱验证和安全回退。

## Windows 与文件操作

- 默认使用 PowerShell 7：`pwsh.exe`。
- 读写中文路径或中文内容时，在命令内显式设置 UTF-8：

```powershell
$OutputEncoding = [Console]::InputEncoding = [Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false)
```

- 搜索优先用 `rg` / `rg --files`。
- 手动编辑文件优先用 `apply_patch`。
- 不要为了写文件创建临时 writer 脚本。
- 递归删除或移动前，必须确认解析后的路径仍在当前工作区内。

## 发布与 tag

- `.github/workflows/bundle.yaml` 会在 `main` / `master` 收到非 `dist/**` 的 push 后自动重建 `dist`、提交 `[bot] bundle`、创建下一个 `vX.Y.Z` tag。
- 发布时不要手动创建或推送 tag，除非用户明确要求。
- 推荐只 push `main`，等待 GitHub Actions 创建 tag 后再 fetch tags 验证。
- 若用户要求手动 tag，先提醒自动 workflow 可能继续 bump 下一个版本。

## Superpowers 本地覆写

- 轻量任务不进入完整 brainstorming / writing-plans / using-git-worktrees / subagentdriven-development 链路。
- 轻量任务定义：单文件或小范围修改、明确 bug 修复、配置调整、文案修改、小测试补充。
- 轻量任务默认直接分析代码并实现；只有遇到关键不确定性时才提问，且首次最多问 1 个问题。
- 如果项目上下文、AGENTS.md、现有代码已经能回答的问题，不要重复提问。
- 非用户明确要求时，不要默认创建 worktree。
- 非用户明确要求时，不要默认把 spec / plan 提交到 git。
- 在 Codex 环境中，默认优先使用 executing-plans，而不是 subagent-driven-development。
- 只有在任务明确适合并行、且平台对子代理支持良好时，才使用 subagent-driven-development。
- 需要确认时，优先一次性给出 2 到 3 个可选方案和推荐，不要把确认拆成过多轮。
- 以下操作仍然必须确认：删除文件、大规模重构、修改 git 历史、推送远程、改环境配置、改 CI、数据库变更。
