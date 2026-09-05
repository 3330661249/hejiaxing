import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import App from './App';

afterEach(cleanup);

describe('resume site', () => {
  it('renders the approved hero and semantic section order', () => {
    render(<App />);

    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(
      screen.getByRole('heading', {
        level: 1,
        name: '我把复杂业务，做成可评测、可交付的 AI 产品。',
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        '关注 RAG、Agent 与语音交互，连接业务调研、方案设计、模型评测和产品交付。',
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '查看核心项目' })).toHaveAttribute(
      'href',
      '#selected-work',
    );

    const main = screen.getByRole('main');
    expect(
      Array.from(main.querySelectorAll(':scope > section')).map(
        (section) => section.id,
      ),
    ).toEqual([
      'top',
      'selected-work',
      'project-crm-agent',
      'project-voice-assistant',
      'experience',
      'ai-lab',
      'about',
    ]);
    expect(document.querySelector('footer#contact')).toBeInTheDocument();
  });

  it('renders the project index and exact four-layer project narratives', () => {
    render(<App />);

    const index = document.querySelector('#selected-work') as HTMLElement;
    expect(
      within(index).getByRole('link', { name: /园区获客智能管理系统/ }),
    ).toHaveAttribute('href', '#project-crm-agent');
    expect(
      within(index).getByRole('link', { name: /企业智能语音助手/ }),
    ).toHaveAttribute('href', '#project-voice-assistant');

    const crm = document.querySelector('#project-crm-agent') as HTMLElement;
    const voice = document.querySelector(
      '#project-voice-assistant',
    ) as HTMLElement;
    const labels = ['项目背景', '我的工作', '产品方案', '项目结果'];

    expect(
      within(crm)
        .getAllByRole('term')
        .map((element) => element.textContent),
    ).toEqual(labels);
    expect(
      within(voice)
        .getAllByRole('term')
        .map((element) => element.textContent),
    ).toEqual(labels);
    expect(within(crm).getByText(/82%/)).toBeInTheDocument();
    expect(within(voice).getByText(/97%/)).toBeInTheDocument();
    expect(within(voice).getByText(/85%/)).toBeInTheDocument();
    expect(within(voice).getByText(/参与语音交互链路/)).toBeInTheDocument();
    expect(within(voice).getByText(/并参与评测和交付迭代/)).toBeInTheDocument();
  });

  it('keeps experience, personal practice, capabilities, and education distinct', () => {
    render(<App />);

    const experience = document.querySelector('#experience') as HTMLElement;
    const companies = within(experience).getAllByRole('heading', { level: 3 });
    expect(companies.map((heading) => heading.textContent)).toEqual([
      '杭州嘀哒房地产中介服务有限公司',
      '科大讯飞股份有限公司（湘江新区中南总部）',
    ]);

    const aiLab = document.querySelector('#ai-lab') as HTMLElement;
    expect(
      within(aiLab).getByText('Cordis 模块化 AI 工作台'),
    ).toBeInTheDocument();
    expect(within(aiLab).getByText('AI 信息采集 Agent')).toBeInTheDocument();
    expect(within(aiLab).getByText(/15\+/)).toBeInTheDocument();

    const about = document.querySelector('#about') as HTMLElement;
    expect(within(about).getAllByRole('listitem')).toHaveLength(5);
    expect(within(about).getByText('邵阳学院')).toBeInTheDocument();
    expect(within(about).getByText('能源与动力工程')).toBeInTheDocument();
    expect(within(about).getByText('本科')).toBeInTheDocument();
    expect(within(about).getByText('2022.09—2026.07')).toBeInTheDocument();
  });

  it('offers direct contact and three authorized resume downloads without exposing a phone', () => {
    const { container } = render(<App />);

    expect(screen.getByRole('link', { name: 'c007xin@163.com' })).toHaveAttribute(
      'href',
      'mailto:c007xin@163.com',
    );
    expect(screen.getByRole('link', { name: '返回顶部' })).toHaveAttribute(
      'href',
      '#top',
    );
    const downloads = screen.getAllByRole('link', { name: '下载简历' });
    expect(downloads).toHaveLength(3);
    downloads.forEach((link) => {
      expect(link).toHaveAttribute(
        'href',
        './he-jiaxing-ai-product-manager-resume.pdf',
      );
      expect(link).toHaveAttribute('download', '何佳兴_AI产品经理_简历.pdf');
    });
    expect(container.textContent).not.toMatch(/(?:\+?86[-\s]?)?1[3-9]\d{9}/);
    expect(container.querySelectorAll('[data-background-stage]')).toHaveLength(
      1,
    );
    expect(container.querySelectorAll('video')).toHaveLength(2);
    expect(
      container.querySelectorAll('[data-background-layer="intro"]'),
    ).toHaveLength(1);
    expect(
      container.querySelectorAll('[data-background-layer="loop"]'),
    ).toHaveLength(1);
    expect(container.querySelectorAll('[data-background-overlay]')).toHaveLength(
      1,
    );
  });
});
