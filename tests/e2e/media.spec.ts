import { expect, test } from '@playwright/test';

test('@external packaged seamless background video loads and advances', async ({
  page,
}) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  const video = page.locator('video');
  await expect(video).toHaveCount(1);

  const observation = await video.evaluate(async (element) => {
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
    await new Promise((resolve) => window.setTimeout(resolve, 1_500));
    const after = media.currentTime;

    return {
      loaded,
      currentSrc: media.currentSrc,
      readyState: media.readyState,
      videoWidth: media.videoWidth,
      videoHeight: media.videoHeight,
      duration: media.duration,
      paused: media.paused,
      before,
      after,
      playError,
      mediaError: media.error
        ? { code: media.error.code, message: media.error.message }
        : null,
    };
  });

  console.info('media-observation', JSON.stringify(observation));
  expect(observation.loaded).toBe(true);
  const mediaUrl = new URL(observation.currentSrc);
  expect(mediaUrl.origin).toBe(new URL(page.url()).origin);
  expect(mediaUrl.pathname).toBe('/media/background-loop.mp4');
  expect(observation.readyState).toBeGreaterThanOrEqual(2);
  expect(observation.videoWidth).toBeGreaterThan(0);
  expect(observation.videoHeight).toBeGreaterThan(0);
  expect(Number.isFinite(observation.duration)).toBe(true);
  expect(observation.duration).toBeGreaterThan(8);
  expect(observation.duration).toBeLessThan(9);
  expect(observation.playError).toBeNull();
  expect(observation.mediaError).toBeNull();
  expect(observation.paused).toBe(false);
  expect(
    observation.after > observation.before + 0.05 ||
      (observation.before > 0.5 && observation.after < observation.before),
  ).toBe(true);
});

test('@external reduced motion pauses the playable background video', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  const video = page.locator('video');

  await expect
    .poll(() =>
      video.evaluate((element) => (element as HTMLVideoElement).readyState),
    )
    .toBeGreaterThanOrEqual(2);
  await expect(video).toHaveAttribute('data-media-state', 'ready');

  const before = await video.evaluate(
    (element) => (element as HTMLVideoElement).currentTime,
  );
  await page.waitForTimeout(1_000);
  const observation = await video.evaluate((element) => {
    const media = element as HTMLVideoElement;
    return {
      paused: media.paused,
      currentTime: media.currentTime,
      mediaError: media.error
        ? { code: media.error.code, message: media.error.message }
        : null,
    };
  });

  console.info(
    'reduced-motion-media-observation',
    JSON.stringify({ before, ...observation }),
  );
  expect(observation.mediaError).toBeNull();
  expect(observation.paused).toBe(true);
  expect(Math.abs(observation.currentTime - before)).toBeLessThan(0.02);
});
