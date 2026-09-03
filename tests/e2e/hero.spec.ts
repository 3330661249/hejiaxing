import { expect, test } from '@playwright/test';

test('renders the revised hero on desktop and mobile', async ({ page }) => {
  const applicationErrors: string[] = [];
  const failedLocalResponses: string[] = [];

  page.on('pageerror', (error) => applicationErrors.push(error.message));
  page.on('response', (response) => {
    if (
      response.url().startsWith('http://127.0.0.1:4173') &&
      response.status() >= 400
    ) {
      failedLocalResponses.push(`${response.status()} ${response.url()}`);
    }
  });

  await page.goto('/', { waitUntil: 'domcontentloaded' });

  await expect(page).toHaveTitle('何佳兴｜AI 产品经理');
  await expect(
    page.getByRole('heading', { level: 1, name: '何佳兴' }),
  ).toBeVisible();
  await expect(page.getByText('连接 AI 技术与用户真实需求')).toBeVisible();

  const video = page.locator('video');
  await expect(video).toHaveAttribute('src', './background-loop.mp4');
  await expect(video).toHaveAttribute('preload', 'auto');
  await expect(video).toHaveAttribute('aria-hidden', 'true');

  const layout = await page.evaluate(() => {
    const media = document.querySelector('video') as HTMLVideoElement;
    const heading = document.querySelector('h1') as HTMLHeadingElement;
    const mediaRect = media.getBoundingClientRect();

    return {
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
      scrollWidth: document.documentElement.scrollWidth,
      videoPosition: getComputedStyle(media).position,
      videoWidth: mediaRect.width,
      videoHeight: mediaRect.height,
      headingSize: Number.parseFloat(getComputedStyle(heading).fontSize),
    };
  });

  expect(layout.videoPosition).toBe('fixed');
  expect(layout.videoWidth).toBeGreaterThan(layout.viewportWidth);
  expect(layout.videoHeight).toBeGreaterThan(layout.viewportHeight);
  expect(layout.headingSize).toBeGreaterThanOrEqual(72);
  expect(layout.scrollWidth).toBeLessThanOrEqual(layout.viewportWidth);
  expect(failedLocalResponses).toEqual([]);
  expect(applicationErrors).toEqual([]);
});
