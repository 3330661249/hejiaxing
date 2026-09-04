import { cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { VIDEO_SOURCE } from '../content/resume';
import { BackgroundVideo } from './BackgroundVideo';

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('BackgroundVideo', () => {
  it('renders one decorative video and one non-interactive overlay', () => {
    const { container } = render(<BackgroundVideo />);
    const videos = container.querySelectorAll('video');
    const overlays = container.querySelectorAll('[data-background-overlay]');
    const video = videos[0] as HTMLVideoElement;

    expect(videos).toHaveLength(1);
    expect(overlays).toHaveLength(1);
    expect(video).toHaveAttribute('src', VIDEO_SOURCE);
    expect(video).toHaveAttribute('aria-hidden', 'true');
    expect(video).not.toHaveAttribute('controls');
    expect(video.autoplay).toBe(true);
    expect(video.muted).toBe(true);
    expect(video.loop).toBe(true);
    expect(video.playsInline).toBe(true);
    expect(video.preload).toBe('auto');
    expect(video).toHaveAttribute('data-media-state', 'loading');

    fireEvent.loadedData(video);

    expect(video).toHaveAttribute('data-media-state', 'ready');
  });

  it('hides a failed video without removing the background overlay', () => {
    const { container } = render(<BackgroundVideo />);
    const video = container.querySelector('video') as HTMLVideoElement;

    fireEvent.error(video);

    expect(video).toHaveAttribute('data-media-state', 'failed');
    expect(video).toHaveAttribute('hidden');
    expect(container.querySelectorAll('[data-background-overlay]')).toHaveLength(
      1,
    );
  });

  it('pauses decorative motion when reduced motion is requested', () => {
    vi.stubGlobal(
      'matchMedia',
      vi.fn((query: string) => ({
        matches: query === '(prefers-reduced-motion: reduce)',
        media: query,
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(() => true),
      })),
    );
    const pause = vi
      .spyOn(HTMLMediaElement.prototype, 'pause')
      .mockImplementation(() => undefined);

    render(<BackgroundVideo />);

    expect(pause).toHaveBeenCalledTimes(1);
  });
});
