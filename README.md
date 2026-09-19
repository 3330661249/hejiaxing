# 何佳兴｜AI 产品经理

面向 AI 产品岗位的个人作品集，展示业务问题分析、AI 应用方案和工程实践。本站是 React 静态网站；其中的工作经历与企业项目介绍不代表相关企业的源代码已公开。

公开访问：[https://3330661249.github.io/hejiaxing/](https://3330661249.github.io/hejiaxing/)

## 从哪里开始

| 想了解什么 | 入口 | 当前边界 |
| --- | --- | --- |
| 产品经历与项目职责 | [在线作品集](https://3330661249.github.io/hejiaxing/) | 项目指标沿用页面标注的简历口径，本仓库不提供生产数据核验 |
| 文档问答实现 | [SmartDocs-RAG](https://github.com/3330661249/smartdocs-rag) | 本地 RAG 原型，查看其 README、测试与已知限制 |
| 研究工作流实现 | [InsightFlow-Agent](https://github.com/3330661249/insightflow-agent) | 单主题研究工作流，真实效果依赖模型及搜索服务 |
| 本站前端实现 | [`src/components`](src/components)、[`src/content/resume.ts`](src/content/resume.ts) | 内容数据与展示组件分离，支持移动端导航及减少动效偏好 |

## 本地复现

使用 Node.js 22（与 CI 一致）及 npm。在独立目录中运行：

```bash
npm ci
npm run dev
```

## 验证

```bash
npm test
npm run build
```

`npm test` 运行 Vitest 组件与内容契约测试；`npm run build` 先检查 TypeScript，再生成 `dist/`。PR 检查会运行这两项，部署工作流也先执行测试再构建。

浏览器回归单独运行：

```bash
npx playwright install chromium
npm run test:e2e
```

`npm run test:media` 包含标记为 `@external` 的媒体检查，需要相应外部资源可访问。单元测试通过不代表视频播放、所有浏览器行为或线上页面已验证。

## 代码导航

- `src/content/resume.ts`：导航、项目说明、经历与资源路径。
- `src/components/BackgroundVideo.tsx`：视频切换、播放失败降级与减少动效处理。
- `src/components/SiteHeader.tsx`：桌面与移动端导航。
- `src/components/ProjectSection.tsx`：项目背景、职责、方案与结果的展示。
- `src/**/*.test.tsx`、`src/**/*.test.ts`：组件及内容契约测试。
- `tests/e2e/`：浏览器回归与媒体检查。
- `.github/workflows/`：PR 验证与 GitHub Pages 部署。

## 展示原则与已知限制

本仓库将工作经历、个人实验与开源实现分别说明。企业项目的职责和数字应结合面试材料核对，不能由前端代码推导出线上效果。个人实验仓库也不等同于企业生产系统。

目前页面中的核心项目以文字介绍为主，完整的脱敏案例、演示与评测报告尚未形成统一入口。后续优先补充这些证据，再扩展视觉功能。`docs/superpowers/` 保存历史设计与实施记录，其中的方案不是当前部署结果。

本站使用的简历与视觉素材不因代码可见而自动获得再分发授权。复用前请核对各资源的来源与许可。
