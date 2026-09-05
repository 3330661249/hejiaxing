import { expect, test, type Locator, type Page } from '@playwright/test';

type MediaObservation = {
  loaded: boolean;
  currentSrc: string;
  readyState: number;
  videoWidth: number;
  videoHeight: number;
  duration: number;
  autoplay: boolean;
  loop: boolean;
  paused: boolean;
  ended: boolean;
  before: number;
  after: number;
  playError: string | null;
  mediaError: { code: number; message: string } | null;
};

async function observePlayback(
  video: Locator,
  observationWindow = 1_000,
): Promise<MediaObservation> {
  return video.evaluate(async (element, waitMs) => {
    const media = element as HTMLVideoElement;
    const loaded = await new Promise<boolean>((resolve) => {
      if (media.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
        resolve(true);
        return;
      }

      const timeout = window.setTimeout(() => resolve(false), 15_000);
      media.addEventListener(
        'loadeddata',
        () => {
          window.clearTimeout(timeout);
          resolve(true);
        },
        { once: true },
      );
    });

    let playError: string | null = null;
    if (loaded) {
      try {
        await media.play();
      } catch (error) {
        playError = error instanceof Error ? error.message : String(error);
      }
    }

    const before = media.currentTime;
    await new Promise((resolve) => window.setTimeout(resolve, waitMs));
    const after = media.currentTime;

    return {
      loaded,
      currentSrc: media.currentSrc,
      readyState: media.readyState,
      videoWidth: media.videoWidth,
      videoHeight: media.videoHeight,
      duration: media.duration,
      autoplay: media.autoplay,
      loop: media.loop,
      paused: media.paused,
      ended: media.ended,
      before,
      after,
      playError,
      mediaError: media.error
        ? { code: media.error.code, message: media.error.message }
        : null,
    };
  }, observationWindow);
}

function expectPackagedMedia(
  observation: MediaObservation,
  pageUrl: string,
  pathname: string,
) {
  expect(observation.loaded).toBe(true);
  const mediaUrl = new URL(observation.currentSrc);
  expect(mediaUrl.origin).toBe(new URL(pageUrl).origin);
  expect(mediaUrl.pathname).toBe(pathname);
  expect(observation.readyState).toBeGreaterThanOrEqual(2);
  expect(observation.videoWidth).toBeGreaterThan(0);
  expect(observation.videoHeight).toBeGreaterThan(0);
  expect(Number.isFinite(observation.duration)).toBe(true);
  expect(observation.playError).toBeNull();
  expect(observation.mediaError).toBeNull();
}

async function gateFirstLoopPlayback(page: Page) {
  await page.addInitScript(() => {
    const state = window as typeof window & {
      __releaseBackgroundLoop?: () => void;
    };
    const originalPlay = HTMLMediaElement.prototype.play;
    let shouldGateLoop = true;

    HTMLMediaElement.prototype.play = function gatedPlayback() {
      if (
        shouldGateLoop &&
        this.getAttribute('data-background-layer') === 'loop'
      ) {
        shouldGateLoop = false;
        return new Promise<void>((resolve, reject) => {
          state.__releaseBackgroundLoop = () => {
            state.__releaseBackgroundLoop = undefined;
            originalPlay.call(this).then(resolve, reject);
          };
        });
      }

      return originalPlay.call(this);
    };
  });
}

async function releaseFirstLoopPlayback(page: Page) {
  await page.evaluate(() => {
    const state = window as typeof window & {
      __releaseBackgroundLoop?: () => void;
    };
    const release = state.__releaseBackgroundLoop;
    if (!release) {
      throw new Error('The mature-loop playback gate was not reached');
    }
    release();
  });
}

test('@external packaged bloom intro loads, advances, and does not loop', async ({
  page,
}) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  const stage = page.locator('[data-background-stage]');
  const poster = page.locator('[data-background-layer="poster"]');
  const intro = page.locator('[data-background-layer="intro"]');
  const loop = page.locator('[data-background-layer="loop"]');

  await expect(stage).toHaveCount(1);
  await expect(poster).toHaveCount(1);
  await expect(intro).toHaveCount(1);
  await expect(loop).toHaveCount(1);
  await expect(page.locator('video')).toHaveCount(2);
  await expect(poster).toHaveAttribute(
    'src',
    './media/background-orb-poster.webp',
  );

  const observation = await observePlayback(intro);

  console.info('intro-media-observation', JSON.stringify(observation));
  expectPackagedMedia(
    observation,
    page.url(),
    '/media/background-intro.mp4',
  );
  expect(observation.autoplay).toBe(true);
  expect(observation.loop).toBe(false);
  expect(observation.duration).toBeGreaterThan(1);
  expect(observation.duration).toBeLessThan(3);
  expect(
    observation.after > observation.before + 0.05 || observation.ended,
  ).toBe(true);
});

test('@external packaged mature orb loop loads, advances, and loops', async ({
  page,
}) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  const intro = page.locator('[data-background-layer="intro"]');
  const loop = page.locator('[data-background-layer="loop"]');

  await intro.evaluate((element) => {
    (element as HTMLVideoElement).pause();
  });
  const observation = await observePlayback(loop, 1_500);

  console.info('loop-media-observation', JSON.stringify(observation));
  expectPackagedMedia(
    observation,
    page.url(),
    '/media/background-orbit-loop.mp4',
  );
  expect(observation.autoplay).toBe(false);
  expect(observation.loop).toBe(true);
  expect(observation.duration).toBeGreaterThan(8);
  expect(observation.duration).toBeLessThan(14);
  expect(observation.paused).toBe(false);
  expect(
    observation.after > observation.before + 0.05 ||
      (observation.before > 0.5 && observation.after < observation.before),
  ).toBe(true);
});

test('@external bloom ending hands off to the playing mature orb loop', async ({
  page,
}) => {
  await gateFirstLoopPlayback(page);
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  const stage = page.locator('[data-background-stage]');
  const poster = page.locator('[data-background-layer="poster"]');
  const intro = page.locator('[data-background-layer="intro"]');
  const loop = page.locator('[data-background-layer="loop"]');

  await expect(stage).toHaveAttribute('data-background-phase', 'intro');
  const introEnded = await intro.evaluate(async (element) => {
    const media = element as HTMLVideoElement;
    const loaded = await new Promise<boolean>((resolve) => {
      if (
        media.readyState >= HTMLMediaElement.HAVE_METADATA &&
        Number.isFinite(media.duration)
      ) {
        resolve(true);
        return;
      }

      const timeout = window.setTimeout(() => resolve(false), 15_000);
      media.addEventListener(
        'loadedmetadata',
        () => {
          window.clearTimeout(timeout);
          resolve(true);
        },
        { once: true },
      );
    });

    if (!loaded) {
      return false;
    }

    return new Promise<boolean>((resolve) => {
      const timeout = window.setTimeout(() => resolve(false), 5_000);
      media.addEventListener(
        'ended',
        () => {
          window.clearTimeout(timeout);
          resolve(true);
        },
        { once: true },
      );
      media.currentTime = Math.max(0, media.duration - 0.15);
      void media.play().catch(() => {
        window.clearTimeout(timeout);
        resolve(false);
      });
    });
  });

  expect(introEnded).toBe(true);
  await expect(stage).toHaveAttribute('data-background-phase', 'handoff');
  await expect(stage).toHaveAttribute(
    'data-background-handoff-source',
    'intro',
  );
  await expect(poster).toHaveCSS('opacity', '1');
  await expect(intro).toHaveCSS('opacity', '1');
  await expect(loop).toHaveCSS('opacity', '0');
  await expect(loop).toHaveCSS('transition-duration', '0.26s');

  await page.waitForTimeout(350);
  await expect(stage).toHaveAttribute('data-background-phase', 'handoff');
  await expect(intro).toHaveCSS('opacity', '1');
  await expect(loop).toHaveCSS('opacity', '0');

  await releaseFirstLoopPlayback(page);
  await expect(stage).toHaveAttribute('data-background-phase', 'loop');
  await expect(loop).toHaveAttribute('data-media-state', 'ready');
  await expect(intro).toHaveCSS('opacity', '0');
  await expect(loop).toHaveCSS('opacity', '1');
  await expect
    .poll(() =>
      loop.evaluate((element) => !(element as HTMLVideoElement).paused),
    )
    .toBe(true);

  const boundaryCrossings = await loop.evaluate(async (element) => {
    const media = element as HTMLVideoElement;
    const crossBoundary = async () => {
      media.currentTime = Math.max(0, media.duration - 0.12);
      await media.play();

      return new Promise<boolean>((resolve) => {
        const timeout = window.setTimeout(() => {
          media.removeEventListener('timeupdate', handleTimeUpdate);
          resolve(false);
        }, 2_000);
        const handleTimeUpdate = () => {
          if (media.currentTime < 1) {
            window.clearTimeout(timeout);
            media.removeEventListener('timeupdate', handleTimeUpdate);
            resolve(true);
          }
        };
        media.addEventListener('timeupdate', handleTimeUpdate);
      });
    };

    return [await crossBoundary(), await crossBoundary()];
  });

  expect(boundaryCrossings).toEqual([true, true]);
  await expect(stage).toHaveAttribute('data-background-phase', 'loop');
});

test('@external reduced motion keeps the mature poster and both videos paused', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  const stage = page.locator('[data-background-stage]');
  const poster = page.locator('[data-background-layer="poster"]');
  const videos = page.locator(
    '[data-background-layer="intro"], [data-background-layer="loop"]',
  );

  await expect(stage).toHaveAttribute('data-background-phase', 'poster');
  await expect(poster).toHaveAttribute('data-media-state', 'ready');
  await expect(videos).toHaveCount(2);
  await expect
    .poll(
      () =>
        videos.evaluateAll((elements) =>
          elements.every(
            (element) =>
              (element as HTMLVideoElement).readyState >=
              HTMLMediaElement.HAVE_CURRENT_DATA,
          ),
        ),
      { timeout: 15_000 },
    )
    .toBe(true);
  await expect
    .poll(() =>
      videos.evaluateAll((elements) =>
        elements.every(
          (element) => element.getAttribute('data-media-state') === 'ready',
        ),
      ),
    )
    .toBe(true);

  const before = await videos.evaluateAll((elements) =>
    elements.map((element) => (element as HTMLVideoElement).currentTime),
  );
  await page.waitForTimeout(1_000);
  const observation = await videos.evaluateAll((elements) =>
    elements.map((element) => {
      const media = element as HTMLVideoElement;
      return {
        paused: media.paused,
        currentTime: media.currentTime,
        mediaError: media.error
          ? { code: media.error.code, message: media.error.message }
          : null,
      };
    }),
  );

  console.info(
    'reduced-motion-media-observation',
    JSON.stringify({ before, observation }),
  );
  expect(observation).toHaveLength(2);
  observation.forEach((media, index) => {
    expect(media.mediaError).toBeNull();
    expect(media.paused).toBe(true);
    expect(Math.abs(media.currentTime - before[index])).toBeLessThan(0.02);
  });
});
