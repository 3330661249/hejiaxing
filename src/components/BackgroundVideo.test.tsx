import {
  act,
  cleanup,
  fireEvent,
  render,
  waitFor,
} from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { REDUCED_MOTION_QUERY } from '../utils/mediaQuery';
import { BackgroundVideo } from './BackgroundVideo';

type MutableMediaQuery = MediaQueryList & { matches: boolean };

function installMatchMedia(initialReducedMotion = false) {
  const queries = new Map<string, MutableMediaQuery>();
  const listeners = new Map<
    string,
    Set<EventListenerOrEventListenerObject>
  >();

  vi.stubGlobal(
    'matchMedia',
    vi.fn((query: string) => {
      const existing = queries.get(query);
      if (existing) {
        return existing;
      }

      const queryListeners = new Set<EventListenerOrEventListenerObject>();
      const mediaQuery = {
        matches:
          query === REDUCED_MOTION_QUERY ? initialReducedMotion : false,
        media: query,
        onchange: null,
        addEventListener: vi.fn(
          (_type: string, listener: EventListenerOrEventListenerObject) => {
            queryListeners.add(listener);
          },
        ),
        removeEventListener: vi.fn(
          (_type: string, listener: EventListenerOrEventListenerObject) => {
            queryListeners.delete(listener);
          },
        ),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(() => true),
      } as unknown as MutableMediaQuery;

      queries.set(query, mediaQuery);
      listeners.set(query, queryListeners);
      return mediaQuery;
    }),
  );

  return {
    setReducedMotion(matches: boolean) {
      const query = queries.get(REDUCED_MOTION_QUERY);
      if (!query) {
        throw new Error('Reduced-motion query was not registered');
      }
      query.matches = matches;
      act(() => {
        listeners.get(REDUCED_MOTION_QUERY)?.forEach((listener) => {
          const event = new Event('change');
          if (typeof listener === 'function') {
            listener(event);
          } else {
            listener.handleEvent(event);
          }
        });
      });
    },
  };
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('BackgroundVideo', () => {
  it('plays the bloom once, then hands off to the looping mature orb without replaying the intro', () => {
    const play = vi
      .spyOn(HTMLMediaElement.prototype, 'play')
      .mockResolvedValue(undefined);
    const { container } = render(<BackgroundVideo />);
    const stage = container.querySelector('[data-background-stage]');
    const intro = container.querySelector(
      '[data-background-layer="intro"]',
    ) as HTMLVideoElement;
    const poster = container.querySelector(
      '[data-background-layer="poster"]',
    ) as HTMLImageElement;
    const loop = container.querySelector(
      '[data-background-layer="loop"]',
    ) as HTMLVideoElement;

    expect(stage).toHaveAttribute('data-background-phase', 'intro');
    expect(container.querySelectorAll('video')).toHaveLength(2);
    expect(container.querySelectorAll('[data-background-overlay]')).toHaveLength(
      1,
    );
    expect(poster).toHaveAttribute(
      'src',
      './media/background-orb-poster.webp',
    );
    expect(intro).toHaveAttribute('src', './media/background-intro.mp4');
    expect(loop).toHaveAttribute('src', './media/background-orbit-loop.mp4');
    expect(intro).toHaveAttribute('aria-hidden', 'true');
    expect(loop).toHaveAttribute('aria-hidden', 'true');
    expect(intro).not.toHaveAttribute('controls');
    expect(loop).not.toHaveAttribute('controls');
    expect(intro.autoplay).toBe(true);
    expect(intro.muted).toBe(true);
    expect(intro.loop).toBe(false);
    expect(intro.playsInline).toBe(true);
    expect(loop.autoplay).toBe(false);
    expect(loop.muted).toBe(true);
    expect(loop.loop).toBe(true);
    expect(loop.playsInline).toBe(true);

    fireEvent.ended(intro);

    expect(stage).toHaveAttribute('data-background-phase', 'handoff');
    expect(stage).toHaveAttribute('data-background-handoff-source', 'intro');
    expect(play).toHaveBeenCalledTimes(2);

    fireEvent.playing(loop);

    expect(stage).toHaveAttribute('data-background-phase', 'loop');

    fireEvent.ended(intro);

    expect(stage).toHaveAttribute('data-background-phase', 'loop');
    expect(play).toHaveBeenCalledTimes(2);
  });

  it('keeps a stable fallback while either video is unavailable', () => {
    vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue(undefined);
    const { container } = render(<BackgroundVideo />);
    const stage = container.querySelector('[data-background-stage]');
    const intro = container.querySelector(
      '[data-background-layer="intro"]',
    ) as HTMLVideoElement;
    const loop = container.querySelector(
      '[data-background-layer="loop"]',
    ) as HTMLVideoElement;
    const poster = container.querySelector(
      '[data-background-layer="poster"]',
    ) as HTMLImageElement;

    fireEvent.error(intro);
    expect(stage).toHaveAttribute('data-background-phase', 'handoff');

    fireEvent.error(loop);
    expect(stage).toHaveAttribute('data-background-phase', 'poster');
    expect(loop).toHaveAttribute('data-media-state', 'failed');
    expect(container.querySelectorAll('[data-background-overlay]')).toHaveLength(
      1,
    );

    fireEvent.error(poster);
    expect(stage).toHaveAttribute('data-background-phase', 'failed');
  });

  it('falls back to the poster when loop playback is rejected', async () => {
    vi.spyOn(HTMLMediaElement.prototype, 'play').mockImplementation(
      function (this: HTMLMediaElement) {
        return this.getAttribute('data-background-layer') === 'loop'
          ? Promise.reject(
              new DOMException('Playback blocked', 'NotAllowedError'),
            )
          : Promise.resolve();
      },
    );
    const { container } = render(<BackgroundVideo />);
    const stage = container.querySelector('[data-background-stage]');
    const intro = container.querySelector(
      '[data-background-layer="intro"]',
    ) as HTMLVideoElement;
    const poster = container.querySelector(
      '[data-background-layer="poster"]',
    ) as HTMLImageElement;

    fireEvent.ended(intro);

    await waitFor(() =>
      expect(stage).toHaveAttribute('data-background-phase', 'poster'),
    );

    fireEvent.error(poster);
    expect(stage).toHaveAttribute('data-background-phase', 'failed');
  });

  it('shows only the mature poster for reduced motion and resumes the loop without replaying the bloom', () => {
    const media = installMatchMedia(true);
    const pause = vi
      .spyOn(HTMLMediaElement.prototype, 'pause')
      .mockImplementation(() => undefined);
    const play = vi
      .spyOn(HTMLMediaElement.prototype, 'play')
      .mockResolvedValue(undefined);
    const { container } = render(<BackgroundVideo />);
    const stage = container.querySelector('[data-background-stage]');
    const intro = container.querySelector(
      '[data-background-layer="intro"]',
    ) as HTMLVideoElement;
    const loop = container.querySelector(
      '[data-background-layer="loop"]',
    ) as HTMLVideoElement;

    expect(stage).toHaveAttribute('data-background-phase', 'poster');
    expect(intro.autoplay).toBe(false);
    expect(pause).toHaveBeenCalledTimes(2);

    media.setReducedMotion(false);

    expect(stage).toHaveAttribute('data-background-phase', 'handoff');
    expect(stage).toHaveAttribute('data-background-handoff-source', 'poster');
    expect(play).toHaveBeenCalledTimes(1);
    fireEvent.playing(loop);
    expect(stage).toHaveAttribute('data-background-phase', 'loop');

    media.setReducedMotion(true);
    expect(stage).toHaveAttribute('data-background-phase', 'poster');
    media.setReducedMotion(false);
    expect(stage).toHaveAttribute('data-background-phase', 'handoff');
    expect(stage).toHaveAttribute('data-background-handoff-source', 'poster');
    fireEvent.playing(loop);
    expect(stage).toHaveAttribute('data-background-phase', 'loop');
    expect(play).toHaveBeenCalledTimes(2);
    expect(intro.autoplay).toBe(false);
  });

  it('abandons an in-progress bloom when reduced motion turns on and never starts it again', () => {
    const media = installMatchMedia(false);
    const pause = vi
      .spyOn(HTMLMediaElement.prototype, 'pause')
      .mockImplementation(() => undefined);
    vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue(undefined);
    const { container } = render(<BackgroundVideo />);
    const stage = container.querySelector('[data-background-stage]');
    const intro = container.querySelector(
      '[data-background-layer="intro"]',
    ) as HTMLVideoElement;
    const loop = container.querySelector(
      '[data-background-layer="loop"]',
    ) as HTMLVideoElement;

    expect(stage).toHaveAttribute('data-background-phase', 'intro');

    media.setReducedMotion(true);

    expect(stage).toHaveAttribute('data-background-phase', 'poster');
    expect(pause).toHaveBeenCalledTimes(2);
    fireEvent.ended(intro);
    expect(stage).toHaveAttribute('data-background-phase', 'poster');

    media.setReducedMotion(false);
    expect(stage).toHaveAttribute('data-background-phase', 'handoff');
    fireEvent.playing(loop);
    expect(stage).toHaveAttribute('data-background-phase', 'loop');
    fireEvent.ended(intro);
    expect(stage).toHaveAttribute('data-background-phase', 'loop');
    expect(intro.autoplay).toBe(false);
  });

  it('ignores a stale loop-play rejection after reduced motion starts a newer attempt', async () => {
    const media = installMatchMedia(false);
    vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(
      () => undefined,
    );
    let rejectFirstLoopAttempt: ((reason?: unknown) => void) | undefined;
    let loopAttempt = 0;
    vi.spyOn(HTMLMediaElement.prototype, 'play').mockImplementation(
      function (this: HTMLMediaElement) {
        if (this.getAttribute('data-background-layer') !== 'loop') {
          return Promise.resolve();
        }

        loopAttempt += 1;
        if (loopAttempt === 1) {
          return new Promise((_resolve, reject) => {
            rejectFirstLoopAttempt = reject;
          });
        }
        return new Promise(() => undefined);
      },
    );
    const { container } = render(<BackgroundVideo />);
    const stage = container.querySelector('[data-background-stage]');
    const intro = container.querySelector(
      '[data-background-layer="intro"]',
    ) as HTMLVideoElement;
    const loop = container.querySelector(
      '[data-background-layer="loop"]',
    ) as HTMLVideoElement;

    fireEvent.ended(intro);
    expect(stage).toHaveAttribute('data-background-phase', 'handoff');

    media.setReducedMotion(true);
    expect(stage).toHaveAttribute('data-background-phase', 'poster');
    media.setReducedMotion(false);
    expect(stage).toHaveAttribute('data-background-phase', 'handoff');

    rejectFirstLoopAttempt?.(new DOMException('stale', 'AbortError'));

    await waitFor(() =>
      expect(stage).toHaveAttribute('data-background-phase', 'handoff'),
    );
    fireEvent.playing(loop);
    expect(stage).toHaveAttribute('data-background-phase', 'loop');
  });

  it('tries the mature loop when the browser rejects intro autoplay', async () => {
    const play = vi
      .spyOn(HTMLMediaElement.prototype, 'play')
      .mockImplementation(function (this: HTMLMediaElement) {
        return this.getAttribute('data-background-layer') === 'intro'
          ? Promise.reject(
              new DOMException('Autoplay blocked', 'NotAllowedError'),
            )
          : Promise.resolve();
      });
    const { container } = render(<BackgroundVideo />);
    const stage = container.querySelector('[data-background-stage]');
    const loop = container.querySelector(
      '[data-background-layer="loop"]',
    ) as HTMLVideoElement;

    await waitFor(() =>
      expect(stage).toHaveAttribute('data-background-phase', 'handoff'),
    );
    expect(play).toHaveBeenCalledTimes(2);
    fireEvent.playing(loop);
    expect(stage).toHaveAttribute('data-background-phase', 'loop');
  });
});
