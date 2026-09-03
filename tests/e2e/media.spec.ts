import { expect, test } from '@playwright/test';

test('@external local background video loads and advances', async ({ page }) => {
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
      readyState: media.readyState,
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
  expect(observation.readyState).toBeGreaterThanOrEqual(2);
  expect(observation.playError).toBeNull();
  expect(observation.mediaError).toBeNull();
  expect(observation.paused).toBe(false);
  expect(
    observation.after > observation.before + 0.05 ||
      (observation.before > 0.5 && observation.after < observation.before),
  ).toBe(true);
});
