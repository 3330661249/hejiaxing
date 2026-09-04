import { describe, expect, it } from 'vitest';
import {
  capabilities,
  contact,
  education,
  experiences,
  navigation,
  practices,
  profile,
  projects,
  resumeDownload,
  VIDEO_SOURCE,
} from './resume';

const metricLocations = (needle: string) => {
  const fields = {
    profile: JSON.stringify(profile),
    navigation: JSON.stringify(navigation),
    projectIndex: JSON.stringify(
      projects.map(({ index, title, indexTag }) => ({
        index,
        title,
        indexTag,
      })),
    ),
    crmResult: projects[0].sections[3].text,
    voiceResult: projects[1].sections[3].text,
    practices: JSON.stringify(practices),
  };

  return Object.entries(fields)
    .filter(([, value]) => value.includes(needle))
    .map(([key]) => key);
};

describe('approved resume content', () => {
  it('resolves public assets inside the GitHub Pages project path', () => {
    const pagesUrl = new URL('https://3330661249.github.io/hejiaxing/');

    expect(new URL(VIDEO_SOURCE, pagesUrl).pathname).toBe(
      '/hejiaxing/media/background-loop.mp4',
    );
    expect(new URL(resumeDownload.href, pagesUrl).pathname).toBe(
      '/hejiaxing/he-jiaxing-ai-product-manager-resume.pdf',
    );
  });

  it('keeps navigation order and exact destinations', () => {
    expect(navigation.map(({ label, href }) => [label, href])).toEqual([
      ['何佳兴 · AI PRODUCT MANAGER', '#top'],
      ['核心项目', '#selected-work'],
      ['工作经历', '#experience'],
      ['个人实践', '#ai-lab'],
      ['关于我', '#about'],
      ['下载简历', './he-jiaxing-ai-product-manager-resume.pdf'],
    ]);
    expect(resumeDownload).toEqual({
      href: './he-jiaxing-ai-product-manager-resume.pdf',
      downloadName: '何佳兴_AI产品经理_简历.pdf',
    });
  });

  it('keeps project order, four-layer structure, and metric locations', () => {
    expect(profile.titleWords.join('')).toBe(profile.title);
    expect(projects.map(({ id, index }) => [id, index])).toEqual([
      ['project-crm-agent', '01'],
      ['project-voice-assistant', '02'],
    ]);
    expect(
      projects.map((project) =>
        project.sections.map(({ label }) => label),
      ),
    ).toEqual([
      ['项目背景', '我的工作', '产品方案', '项目结果'],
      ['项目背景', '我的工作', '产品方案', '项目结果'],
    ]);
    expect(metricLocations('82%')).toEqual(['crmResult']);
    expect(metricLocations('97%')).toEqual(['voiceResult']);
    expect(metricLocations('85%')).toEqual(['voiceResult']);
    expect(metricLocations('15+')).toEqual(['practices']);
  });

  it('preserves ownership boundaries and excludes phone numbers', () => {
    const visibleContent = JSON.stringify({
      navigation,
      profile,
      projects,
      experiences,
      practices,
      capabilities,
      education,
      contact,
    });
    const voiceContent = JSON.stringify({
      project: projects[1],
      experience: experiences[1],
    });

    expect(voiceContent).toContain('参与');
    expect(voiceContent).toContain('协同');
    expect(voiceContent).not.toMatch(/主导|独立负责|独立实现/);
    expect(visibleContent).not.toMatch(/(?:\+?86[-\s]?)?1[3-9]\d{9}/);
    expect(contact.email).toBe('c007xin@163.com');
    expect(contact.mailto).toBe('mailto:c007xin@163.com');
  });
});
