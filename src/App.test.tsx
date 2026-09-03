import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import App from './App';

afterEach(cleanup);

describe('complete resume site', () => {
  it('renders the requested hero and every main resume section', () => {
    render(<App />);

    expect(
      screen.getByRole('heading', { level: 1, name: '何佳兴' }),
    ).toBeInTheDocument();
    expect(screen.getByText('连接 AI 技术与用户真实需求')).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 2, name: '核心项目' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 2, name: '工作经历' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 2, name: '个人实践' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 2, name: '能力与教育' }),
    ).toBeInTheDocument();
    expect(screen.getByText('c007xin@163.com')).toBeInTheDocument();
    expect(screen.getByText('内部任务成功率达到 82%。')).toBeInTheDocument();
    expect(
      screen.getByText('项目准召率达到 97%，查询效率提升约 85%。'),
    ).toBeInTheDocument();
    expect(screen.queryByText(/按简历|口径|不扩写/)).not.toBeInTheDocument();
  });

  it('uses the local seamless video without exposing a resume download', () => {
    const { container } = render(<App />);
    const video = container.querySelector('video');

    expect(video).toHaveAttribute('src', './background-loop.mp4');
    expect(video).toHaveAttribute('preload', 'auto');
    expect(video).toHaveAttribute('aria-hidden', 'true');
    expect((video as HTMLVideoElement).autoplay).toBe(true);
    expect((video as HTMLVideoElement).muted).toBe(true);
    expect((video as HTMLVideoElement).loop).toBe(true);

    expect(
      screen.queryByRole('link', { name: '下载简历' }),
    ).not.toBeInTheDocument();
  });
});
