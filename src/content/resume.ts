export type NavigationItem = {
  label: string;
  href: string;
  kind: 'anchor' | 'download';
};

export type ProjectDetail = {
  label: '项目背景' | '我的工作' | '产品方案' | '项目结果';
  text: string;
};

export type ResumeProject = {
  id: 'project-crm-agent' | 'project-voice-assistant';
  index: '01' | '02';
  indexTag: string;
  title: string;
  meta: string;
  sections: readonly ProjectDetail[];
  resultNote: string;
};

export type Experience = {
  company: string;
  role: string;
  dates: string;
  summary: string;
  projectHref: `#${ResumeProject['id']}`;
  projectLabel: string;
};

export type Practice = {
  title: string;
  text: string;
};

export const backgroundMedia = {
  poster: './media/background-orb-poster.webp',
  intro: './media/background-intro.mp4',
  loop: './media/background-orbit-loop.mp4',
} as const;

export const resumeDownload = {
  href: './he-jiaxing-ai-product-manager-resume.pdf',
  downloadName: '何佳兴_AI产品经理_简历.pdf',
} as const;

export const navigation = [
  {
    label: '何佳兴 · AI PRODUCT MANAGER',
    href: '#top',
    kind: 'anchor',
  },
  { label: '核心项目', href: '#selected-work', kind: 'anchor' },
  { label: '工作经历', href: '#experience', kind: 'anchor' },
  { label: '个人实践', href: '#ai-lab', kind: 'anchor' },
  { label: '关于我', href: '#about', kind: 'anchor' },
  {
    label: '下载简历',
    href: resumeDownload.href,
    kind: 'download',
  },
] as const satisfies readonly NavigationItem[];

export const profile = {
  eyebrow: 'HE JIAXING / AI PRODUCT MANAGER',
  title: '我把复杂业务，做成可评测、可交付的 AI 产品。',
  titleWords: [
    '我把',
    '复杂业务，',
    '做成',
    '可评测、',
    '可交付的',
    ' ',
    'AI',
    ' ',
    '产品。',
  ],
  description:
    '关注 RAG、Agent 与语音交互，连接业务调研、方案设计、模型评测和产品交付。',
  primaryAction: { label: '查看核心项目', href: '#selected-work' },
} as const;

export const projects = [
  {
    id: 'project-crm-agent',
    index: '01',
    indexTag: 'CRM · Agent · 评测闭环',
    title: '园区获客智能管理系统',
    meta:
      '杭州嘀哒房地产中介服务有限公司 · AI 产品经理 · 2025.09—2026.08',
    sections: [
      {
        label: '项目背景',
        text: '面向工业地产中介的园区获客、客户管理与带看跟进流程，调研一线业务并梳理 CRM 智能化改造机会。',
      },
      {
        label: '我的工作',
        text: '负责产品侧需求分析、业务流程和 Agent 应用层方案，梳理意图识别、数据调用、任务执行与异常兜底，并协同研发、算法、测试和业务团队推进交付。',
      },
      {
        label: '产品方案',
        text: '使用 Dify 完成 Agent 编排与验证，沉淀架构图、业务流程、功能脑图、PRD、功能清单、权限矩阵和字段说明；结合评测集与 Bad Case 推进迭代。',
      },
      {
        label: '项目结果',
        text: '按简历现有口径，内部任务成功率约 82%。',
      },
    ],
    resultNote:
      '该结果为简历中的项目口径，不扩写为个人独立开发或未经核验的生产指标。',
  },
  {
    id: 'project-voice-assistant',
    index: '02',
    indexTag: 'Voice · RAG · 实时业务查询',
    title: '企业智能语音助手',
    meta:
      '科大讯飞股份有限公司（湘江新区中南总部）· AI 产品助理 · 2025.02—2025.08',
    sections: [
      {
        label: '项目背景',
        text: '面向企业物资管理中的制度、库存、订单与计划查询，参与梳理语音入口、知识问答和实时业务数据查询的产品边界。',
      },
      {
        label: '我的工作',
        text: '参与语音交互链路、参数确认、澄清追问和异常兜底设计，协同 RAG 知识问答方案、交互原型、联调验收与交付文档。',
      },
      {
        label: '产品方案',
        text: '围绕 STT、Chunk、Embedding、混合检索、Rerank、引用溯源和权限机制梳理产品方案，并参与评测和交付迭代。',
      },
      {
        label: '项目结果',
        text: '按简历现有口径，项目记录的“准召率”为 97%，查询效率提升约 85%。',
      },
    ],
    resultNote:
      '“准召率”保持简历原文，不解释为特定算法口径；两项结果不扩写为个人独立成果。',
  },
] as const satisfies readonly ResumeProject[];

export const experiences = [
  {
    company: '杭州嘀哒房地产中介服务有限公司',
    role: 'AI 产品经理',
    dates: '2025.09—2026.08',
    summary:
      '负责园区获客系统 CRM 智能化升级的产品工作，覆盖业务研究、需求分析、AI 场景规划、Agent 应用链路、评测、版本交付与迭代协同。',
    projectHref: '#project-crm-agent',
    projectLabel: '园区获客智能管理系统',
  },
  {
    company: '科大讯飞股份有限公司（湘江新区中南总部）',
    role: 'AI 产品助理',
    dates: '2025.02—2025.08',
    summary:
      '参与客户访谈、需求梳理、语音与 RAG 方案边界、原型确认、联调验收和交付材料沉淀。',
    projectHref: '#project-voice-assistant',
    projectLabel: '企业智能语音助手',
  },
] as const satisfies readonly Experience[];

export const practices = [
  {
    title: 'Cordis 模块化 AI 工作台',
    text: '基于 DeepSeek Harness 的 Cordis 可插拔架构，组合 15+ 自研 Skills，用于个人学习和产品设计实践。',
  },
  {
    title: 'AI 信息采集 Agent',
    text: '自动采集、整理 AI 信息，并沉淀至 Obsidian 个人知识库。',
  },
] as const satisfies readonly Practice[];

export const capabilities = [
  'RAG 与 Agent 产品设计',
  '需求分析与业务流程梳理',
  '模型评测与 Bad Case 闭环',
  'Vibe Coding',
  '跨团队产品交付',
] as const;

export const education = {
  school: '邵阳学院',
  major: '能源与动力工程',
  degree: '本科',
  dates: '2022.09—2026.07',
} as const;

export const contact = {
  text: '如果你正在寻找一名关注 AI 产品落地的产品经理，我们可以聊聊。',
  email: 'c007xin@163.com',
  mailto: 'mailto:c007xin@163.com',
} as const;
