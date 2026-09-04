import { createHash } from 'node:crypto';
import { expect, test, type Page } from '@playwright/test';

const VIDEO_HOST = 'https://d8j0ntlcm91z4.cloudfront.net/';
const FONT_HOST = 'https://db.onlinewebfonts.com/';
const LOCAL_ORIGIN = 'http://127.0.0.1:4173';
const LOCAL_VIDEO_URL = `${LOCAL_ORIGIN}/media/background-loop.mp4`;
const LOCAL_VIDEO_PATTERN = '**/media/background-loop.mp4';
const PDF_HREF = './he-jiaxing-ai-product-manager-resume.pdf';
const PDF_PATH = '/he-jiaxing-ai-product-manager-resume.pdf';
const DOWNLOAD_NAME = '何佳兴_AI产品经理_简历.pdf';
const PDF_SHA256 =
  '6280d953796220e2fa7092b3814fd64444db84774da700f6f941c90569c45189';
const SECTION_IDS = [
  'top',
  'selected-work',
  'project-crm-agent',
  'project-voice-assistant',
  'experience',
  'ai-lab',
  'about',
] as const;

async function isolateExternalMedia(page: Page) {
  await page.route(`${VIDEO_HOST}**`, (route) => route.abort());
  await page.route(LOCAL_VIDEO_PATTERN, (route) => route.abort());
  await page.route(`${FONT_HOST}**`, (route) => route.abort());
}

function observeApplicationFailures(page: Page) {
  const applicationErrors: string[] = [];
  const sameOriginErrors: string[] = [];

  page.on('pageerror', (error) => applicationErrors.push(error.message));
  page.on('console', (message) => {
    if (message.type() !== 'error') {
      return;
    }

    const sourceUrl = message.location().url;
    const messageText = message.text();
    const belongsToExpectedMediaFailure = [
      VIDEO_HOST,
      FONT_HOST,
      LOCAL_VIDEO_URL,
    ].some(
      (resource) =>
        sourceUrl.startsWith(resource) || messageText.includes(resource),
    );
    if (!belongsToExpectedMediaFailure) {
      applicationErrors.push(messageText);
    }
  });
  page.on('response', (response) => {
    const url = new URL(response.url());
    if (url.origin === LOCAL_ORIGIN && response.status() >= 400) {
      sameOriginErrors.push(`${response.status()} ${response.url()}`);
    }
  });

  return { applicationErrors, sameOriginErrors };
}

async function expectAnchorClearOfHeader(page: Page, id: string) {
  const placement = await page.evaluate((targetId) => {
    const header = document.querySelector('header');
    const target = document.getElementById(targetId);
    if (!header || !target) {
      return null;
    }

    return {
      headerBottom: header.getBoundingClientRect().bottom,
      targetTop: target.getBoundingClientRect().top,
    };
  }, id);

  expect(placement).not.toBeNull();
  expect(placement?.targetTop).toBeGreaterThanOrEqual(
    (placement?.headerBottom ?? 0) - 1,
  );
  expect((placement?.targetTop ?? 0) - (placement?.headerBottom ?? 0)).toBeLessThanOrEqual(
    64,
  );
}

async function expectNoHorizontalOverflow(page: Page) {
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
}

async function readBackgroundMotion(page: Page) {
  return page.evaluate(() => {
    const video = document.querySelector<HTMLVideoElement>('.background-video');
    const overlay = document.querySelector<HTMLElement>(
      '[data-background-overlay]',
    );
    const content = document.querySelector<HTMLElement>('.site-content');

    if (!video || !overlay || !content) {
      return null;
    }

    const lensStyle = getComputedStyle(overlay, '::after');

    return {
      pointerMotion: video.dataset.pointerMotion ?? null,
      shiftX: video.style.getPropertyValue('--background-shift-x'),
      shiftY: video.style.getPropertyValue('--background-shift-y'),
      lensX: overlay.style.getPropertyValue('--background-lens-x'),
      lensY: overlay.style.getPropertyValue('--background-lens-y'),
      lensOpacity: overlay.style.getPropertyValue(
        '--background-lens-opacity',
      ),
      motionEnergy: overlay.style.getPropertyValue(
        '--background-motion-energy',
      ),
      lensRenderedOpacity: lensStyle.opacity,
      lensMaskImage: lensStyle.maskImage || lensStyle.webkitMaskImage,
      lensDisplay: lensStyle.display,
      videoTransform: getComputedStyle(video).transform,
      videoWillChange: getComputedStyle(video).willChange,
      contentTransform: getComputedStyle(content).transform,
    };
  });
}

async function readVideoTranslation(page: Page) {
  return page.locator('.background-video').evaluate((element) => {
    const transform = getComputedStyle(element).transform;
    if (transform === 'none') {
      return { x: 0, y: 0 };
    }

    const matrix = new DOMMatrixReadOnly(transform);
    return { x: matrix.m41, y: matrix.m42 };
  });
}

async function expectVideoCoversViewport(page: Page) {
  const coverage = await page.locator('.background-video').evaluate((element) => {
    const rect = element.getBoundingClientRect();
    return {
      left: rect.left,
      top: rect.top,
      right: rect.right,
      bottom: rect.bottom,
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
    };
  });

  expect(coverage.left).toBeLessThanOrEqual(0);
  expect(coverage.top).toBeLessThanOrEqual(0);
  expect(coverage.right).toBeGreaterThanOrEqual(coverage.viewportWidth);
  expect(coverage.bottom).toBeGreaterThanOrEqual(coverage.viewportHeight);
}

async function waitForAnimationFrame(page: Page) {
  await page.evaluate(
    () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve())),
  );
}

test.beforeEach(async ({ page }) => {
  await isolateExternalMedia(page);
});

test('renders the complete transparent resume, metadata, and authorized PDF', async ({
  page,
}) => {
  const failures = observeApplicationFailures(page);
  await page.goto('/', { waitUntil: 'domcontentloaded' });

  await expect(page).toHaveTitle('何佳兴｜AI 产品经理');
  await expect(page.locator('html')).toHaveAttribute('lang', 'zh-CN');
  const description =
    '何佳兴的个人简历网站，关注 RAG、Agent、语音交互、AI 产品评测与交付。';
  await expect(page.locator('meta[name="description"]')).toHaveAttribute(
    'content',
    description,
  );
  await expect(page.locator('meta[property="og:title"]')).toHaveAttribute(
    'content',
    '何佳兴｜AI 产品经理',
  );
  await expect(page.locator('meta[property="og:description"]')).toHaveAttribute(
    'content',
    description,
  );
  await expect(page.locator('meta[name="twitter:title"]')).toHaveAttribute(
    'content',
    '何佳兴｜AI 产品经理',
  );
  await expect(page.locator('meta[name="twitter:description"]')).toHaveAttribute(
    'content',
    description,
  );

  await expect(page.locator('video')).toHaveCount(1);
  await expect(page.locator('[data-background-overlay]')).toHaveCount(1);
  const fixedLayers = await page.evaluate(() => {
    const video = document.querySelector('video');
    const overlay = document.querySelector('[data-background-overlay]');
    if (!video || !overlay) {
      return null;
    }
    const videoStyle = getComputedStyle(video);
    const overlayStyle = getComputedStyle(overlay);
    return {
      videoPosition: videoStyle.position,
      videoZIndex: videoStyle.zIndex,
      videoObjectFit: videoStyle.objectFit,
      overlayPosition: overlayStyle.position,
      overlayZIndex: overlayStyle.zIndex,
      videoPointerEvents: videoStyle.pointerEvents,
      overlayPointerEvents: overlayStyle.pointerEvents,
    };
  });
  expect(fixedLayers).toEqual({
    videoPosition: 'fixed',
    videoZIndex: '0',
    videoObjectFit: 'cover',
    overlayPosition: 'fixed',
    overlayZIndex: '1',
    videoPointerEvents: 'none',
    overlayPointerEvents: 'none',
  });

  await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
  await expect(
    page.getByRole('heading', {
      level: 1,
      name: '我把复杂业务，做成可评测、可交付的 AI 产品。',
    }),
  ).toBeVisible();
  expect(
    await page.locator('main > section').evaluateAll((sections) =>
      sections.map((section) => section.id),
    ),
  ).toEqual(SECTION_IDS);
  await expect(page.locator('footer#contact')).toBeVisible();

  const sectionBackgrounds = await page
    .locator('main > section, footer#contact')
    .evaluateAll((sections) =>
      sections.map((section) => getComputedStyle(section).backgroundColor),
    );
  expect(sectionBackgrounds.every((value) => value === 'rgba(0, 0, 0, 0)')).toBe(
    true,
  );

  const downloads = page.getByRole('link', { name: '下载简历' });
  await expect(downloads).toHaveCount(3);
  await expect(
    page.locator('header').getByRole('link', { name: '下载简历' }),
  ).toHaveCount(1);
  await expect(
    page.locator('#top').getByRole('link', { name: '下载简历' }),
  ).toHaveCount(1);
  await expect(
    page.locator('#contact').getByRole('link', { name: '下载简历' }),
  ).toHaveCount(1);
  for (const link of await downloads.all()) {
    await expect(link).toHaveAttribute('href', PDF_HREF);
    await expect(link).toHaveJSProperty('href', `${LOCAL_ORIGIN}${PDF_PATH}`);
    await expect(link).toHaveAttribute('download', DOWNLOAD_NAME);
  }

  const pdfResponse = await page.request.get(PDF_PATH);
  expect(pdfResponse.status()).toBe(200);
  expect(pdfResponse.headers()['content-type']).toContain('application/pdf');
  const pdfBody = await pdfResponse.body();
  expect(pdfBody.byteLength).toBeGreaterThan(1_000_000);
  expect(pdfBody.subarray(0, 5).toString()).toBe('%PDF-');
  expect(createHash('sha256').update(pdfBody).digest('hex')).toBe(PDF_SHA256);

  const downloadEvent = page.waitForEvent('download');
  await page.locator('#top').getByRole('link', { name: '下载简历' }).click();
  expect((await downloadEvent).suggestedFilename()).toBe(DOWNLOAD_NAME);

  await expect(page.getByRole('link', { name: 'c007xin@163.com' })).toHaveAttribute(
    'href',
    'mailto:c007xin@163.com',
  );
  expect(await page.locator('body').innerText()).not.toMatch(
    /(?:\+?86[-\s]?)?1[3-9]\d{9}/,
  );
  expect(
    await page
      .locator('a')
      .evaluateAll((links) => links.map((link) => link.getAttribute('href'))),
  ).not.toEqual(expect.arrayContaining([expect.stringMatching(/1[3-9]\d{9}/)]));

  expect(failures.applicationErrors).toEqual([]);
  expect(failures.sameOriginErrors).toEqual([]);
});

test('enhances the fixed video without filtering the transparent resume content', async ({
  page,
}, testInfo) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' });

  const visualState = await page.evaluate(() => {
    const video = document.querySelector<HTMLVideoElement>('.background-video');
    const overlay = document.querySelector<HTMLElement>(
      '[data-background-overlay]',
    );
    const content = document.querySelector<HTMLElement>('.site-content');

    if (!video || !overlay || !content) {
      return null;
    }

    const videoStyle = getComputedStyle(video);
    const overlayStyle = getComputedStyle(overlay);
    const contentStyle = getComputedStyle(content);

    return {
      videoFilter: videoStyle.filter,
      overlayBackgroundColor: overlayStyle.backgroundColor,
      overlayBackgroundImage: overlayStyle.backgroundImage,
      contentFilter: contentStyle.filter,
      sectionBackgrounds: Array.from(
        document.querySelectorAll('main > section, footer#contact'),
        (element) => getComputedStyle(element).backgroundColor,
      ),
    };
  });

  expect(visualState).not.toBeNull();
  expect(visualState?.videoFilter).toMatch(/brightness\(/);
  expect(visualState?.videoFilter).toMatch(/contrast\(/);
  expect(visualState?.videoFilter).toMatch(/saturate\(/);
  expect(visualState?.contentFilter).toBe('none');
  expect(
    visualState?.sectionBackgrounds.every(
      (background) => background === 'rgba(0, 0, 0, 0)',
    ),
  ).toBe(true);

  if (testInfo.project.name === 'chromium-mobile') {
    expect(visualState?.overlayBackgroundColor).toBe('rgba(0, 0, 0, 0.64)');
    expect(visualState?.overlayBackgroundImage).toBe('none');
  } else {
    expect(visualState?.overlayBackgroundImage).not.toBe('none');
  }
});

test('moves only the background within the approved parallax bounds for a fine desktop pointer', async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium-desktop');
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/', { waitUntil: 'domcontentloaded' });

  const video = page.locator('.background-video');
  await expect(video).toHaveAttribute('data-media-state', 'failed');
  await video.dispatchEvent('loadeddata');
  await expect(video).toHaveAttribute('data-media-state', 'ready');

  const before = await readBackgroundMotion(page);
  await expect(video).toHaveAttribute('data-pointer-motion', 'enabled');

  await page.mouse.move(1439, 1);
  await expect
    .poll(async () =>
      Number.parseFloat((await readBackgroundMotion(page))?.shiftX ?? 'NaN'),
    )
    .toBeLessThanOrEqual(-29);
  await expect
    .poll(async () =>
      Number.parseFloat((await readBackgroundMotion(page))?.shiftY ?? 'NaN'),
    )
    .toBeGreaterThanOrEqual(15);
  await expect
    .poll(async () => (await readBackgroundMotion(page))?.videoTransform)
    .not.toBe(before?.videoTransform);

  const after = await readBackgroundMotion(page);
  const shiftX = Number.parseFloat(after?.shiftX ?? 'NaN');
  const shiftY = Number.parseFloat(after?.shiftY ?? 'NaN');

  expect(shiftX).toBeLessThan(0);
  expect(shiftY).toBeGreaterThan(0);
  expect(Math.abs(shiftX)).toBeLessThanOrEqual(30);
  expect(Math.abs(shiftY)).toBeLessThanOrEqual(16);
  expect(after?.contentTransform).toBe(before?.contentTransform);
});

test('eases the background toward the pointer and smoothly recenters after it leaves', async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium-desktop');
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/', { waitUntil: 'domcontentloaded' });

  const video = page.locator('.background-video');
  await video.dispatchEvent('loadeddata');
  await page.evaluate(() => {
    window.dispatchEvent(
      new PointerEvent('pointermove', {
        pointerType: 'mouse',
        clientX: 1439,
        clientY: 1,
      }),
    );
  });
  await waitForAnimationFrame(page);

  const firstApproach = Number.parseFloat(
    (await readBackgroundMotion(page))?.shiftX ?? 'NaN',
  );
  expect(firstApproach).toBeLessThan(-1);
  expect(firstApproach).toBeGreaterThan(-29);
  await expect
    .poll(async () =>
      Number.parseFloat((await readBackgroundMotion(page))?.shiftX ?? 'NaN'),
    )
    .toBeLessThanOrEqual(-29);

  await page.evaluate(() => {
    window.dispatchEvent(
      new PointerEvent('pointerout', {
        pointerType: 'mouse',
        relatedTarget: null,
      }),
    );
  });
  await waitForAnimationFrame(page);

  const firstReturn = Number.parseFloat(
    (await readBackgroundMotion(page))?.shiftX ?? 'NaN',
  );
  expect(firstReturn).toBeLessThan(-1);
  await expect
    .poll(async () =>
      Number.parseFloat((await readBackgroundMotion(page))?.shiftX ?? 'NaN'),
    )
    .toBe(0);
});

test('preserves the active background motion when the video becomes ready', async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium-desktop');
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/', { waitUntil: 'domcontentloaded' });

  const video = page.locator('.background-video');
  await expect(video).toHaveAttribute('data-pointer-motion', 'enabled');
  await page.mouse.move(1439, 1);
  await expect
    .poll(async () =>
      Number.parseFloat((await readBackgroundMotion(page))?.shiftX ?? 'NaN'),
    )
    .toBeLessThan(-20);

  await video.dispatchEvent('loadeddata');
  await expect(video).toHaveAttribute('data-media-state', 'ready');
  await waitForAnimationFrame(page);

  expect(
    Number.parseFloat((await readBackgroundMotion(page))?.shiftX ?? 'NaN'),
  ).toBeLessThan(-1);
});

test('keeps visible background motion in a narrow fine-pointer browser pane', async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium-desktop');
  await page.setViewportSize({ width: 440, height: 785 });
  await page.goto('/', { waitUntil: 'domcontentloaded' });

  const video = page.locator('.background-video');
  await video.dispatchEvent('loadeddata');
  await expect(video).toHaveAttribute('data-pointer-motion', 'enabled');

  await page.mouse.move(439, 1);
  await expect
    .poll(async () => (await readVideoTranslation(page)).x)
    .toBeLessThanOrEqual(-20);
  await expect
    .poll(async () => (await readVideoTranslation(page)).y)
    .toBeGreaterThanOrEqual(10);
  await expectVideoCoversViewport(page);

  await page.mouse.move(1, 784);
  await expect
    .poll(async () => (await readVideoTranslation(page)).x)
    .toBeGreaterThanOrEqual(20);
  await expect
    .poll(async () => (await readVideoTranslation(page)).y)
    .toBeLessThanOrEqual(-10);
  await expectVideoCoversViewport(page);
});

test('shows a custom cursor whose ring visibly trails the mouse and grows over actions', async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium-desktop');
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/', { waitUntil: 'domcontentloaded' });

  const cursor = page.locator('[data-custom-cursor-layer]');
  await expect(cursor).toHaveCount(1);
  await expect(cursor).toHaveAttribute('aria-hidden', 'true');
  await expect(cursor).toHaveAttribute('data-enabled', 'true');
  await expect(cursor).toHaveAttribute('data-visible', 'false');
  expect(
    await cursor.evaluate((element) => getComputedStyle(element).pointerEvents),
  ).toBe('none');
  expect(
    await cursor.locator('[data-cursor-dot]').evaluate((element) =>
      element.getBoundingClientRect().width,
    ),
  ).toBe(6);
  expect(
    await cursor.locator('[data-cursor-ring]').evaluate((element) =>
      element.getBoundingClientRect().width,
    ),
  ).toBe(34);

  await page.evaluate(() => {
    window.dispatchEvent(
      new PointerEvent('pointermove', {
        pointerType: 'mouse',
        clientX: 120,
        clientY: 120,
      }),
    );
  });
  await expect(cursor).toHaveAttribute('data-visible', 'true');
  await expect
    .poll(() =>
      cursor.evaluate((element) => ({
        x: Number.parseFloat(
          element.style.getPropertyValue('--cursor-ring-x'),
        ),
        y: Number.parseFloat(
          element.style.getPropertyValue('--cursor-ring-y'),
        ),
      })),
    )
    .toEqual({ x: 120, y: 120 });

  const immediateMove = await page.evaluate(() => {
    window.dispatchEvent(
      new PointerEvent('pointermove', {
        pointerType: 'mouse',
        clientX: 1200,
        clientY: 680,
      }),
    );

    const element = document.querySelector<HTMLElement>(
      '[data-custom-cursor-layer]',
    );
    if (!element) {
      return null;
    }

    return {
      dotX: Number.parseFloat(element.style.getPropertyValue('--cursor-x')),
      dotY: Number.parseFloat(element.style.getPropertyValue('--cursor-y')),
      ringX: Number.parseFloat(
        element.style.getPropertyValue('--cursor-ring-x'),
      ),
      ringY: Number.parseFloat(
        element.style.getPropertyValue('--cursor-ring-y'),
      ),
    };
  });

  expect(immediateMove).not.toBeNull();
  expect(immediateMove?.dotX).toBe(1200);
  expect(immediateMove?.dotY).toBe(680);
  expect(immediateMove?.ringX).toBeLessThan(1000);
  expect(immediateMove?.ringY).toBeLessThan(600);

  await expect
    .poll(() =>
      cursor.evaluate((element) => ({
        x: Number.parseFloat(
          element.style.getPropertyValue('--cursor-ring-x'),
        ),
        y: Number.parseFloat(
          element.style.getPropertyValue('--cursor-ring-y'),
        ),
      })),
    )
    .toEqual({ x: 1200, y: 680 });

  const primaryAction = page.getByRole('link', { name: '查看核心项目' });
  await primaryAction.hover();
  await expect(cursor).toHaveAttribute('data-interactive', 'true');
  await expect
    .poll(() =>
      cursor.locator('[data-cursor-ring]').evaluate((element) =>
        element.getBoundingClientRect().width,
      ),
    )
    .toBe(54);
  expect(
    await page.locator('body').evaluate((element) => getComputedStyle(element).cursor),
  ).toBe('none');
  await primaryAction.click();
  await expect(page).toHaveURL(/#selected-work$/);

  await page.evaluate(() => {
    window.dispatchEvent(
      new PointerEvent('pointerout', {
        pointerType: 'mouse',
        relatedTarget: null,
      }),
    );
  });
  await expect(cursor).toHaveAttribute('data-visible', 'false');

  await page.mouse.move(320, 320);
  await expect(cursor).toHaveAttribute('data-visible', 'true');
  await page.evaluate(() => window.dispatchEvent(new Event('blur')));
  await expect(cursor).toHaveAttribute('data-visible', 'false');
});

test('keeps the native cursor until the custom cursor is visible and restores it on exit', async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium-desktop');
  await page.goto('/', { waitUntil: 'domcontentloaded' });

  const cursor = page.locator('[data-custom-cursor-layer]');
  const bodyCursor = () =>
    page.locator('body').evaluate((element) => getComputedStyle(element).cursor);

  await expect(cursor).toHaveAttribute('data-enabled', 'true');
  await expect(cursor).toHaveAttribute('data-visible', 'false');
  await expect(page.locator('html')).not.toHaveAttribute(
    'data-custom-cursor',
    'ready',
  );
  expect(await bodyCursor()).not.toBe('none');

  await page.mouse.move(320, 240);
  await expect(cursor).toHaveAttribute('data-visible', 'true');
  await expect(page.locator('html')).toHaveAttribute(
    'data-custom-cursor',
    'ready',
  );
  expect(await bodyCursor()).toBe('none');

  await page.evaluate(() => {
    window.dispatchEvent(
      new PointerEvent('pointerout', {
        pointerType: 'mouse',
        relatedTarget: null,
      }),
    );
  });
  await expect(cursor).toHaveAttribute('data-visible', 'false');
  await expect(page.locator('html')).not.toHaveAttribute(
    'data-custom-cursor',
    'ready',
  );
  expect(await bodyCursor()).not.toBe('none');
});

test('keeps a softer aura visibly behind the cursor ring during fast movement', async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium-desktop');
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/', { waitUntil: 'domcontentloaded' });

  const cursor = page.locator('[data-custom-cursor-layer]');
  const aura = cursor.locator('[data-cursor-aura]');
  await expect(aura).toHaveCount(1);

  await page.evaluate(() => {
    window.dispatchEvent(
      new PointerEvent('pointermove', {
        pointerType: 'mouse',
        clientX: 120,
        clientY: 120,
      }),
    );
    window.dispatchEvent(
      new PointerEvent('pointermove', {
        pointerType: 'mouse',
        clientX: 1200,
        clientY: 680,
      }),
    );
  });
  await waitForAnimationFrame(page);

  const trail = await cursor.evaluate((element) => ({
    auraX: Number.parseFloat(
      element.style.getPropertyValue('--cursor-aura-x'),
    ),
    auraY: Number.parseFloat(
      element.style.getPropertyValue('--cursor-aura-y'),
    ),
    ringX: Number.parseFloat(
      element.style.getPropertyValue('--cursor-ring-x'),
    ),
    ringY: Number.parseFloat(
      element.style.getPropertyValue('--cursor-ring-y'),
    ),
  }));

  expect(trail.auraX).toBeGreaterThan(120);
  expect(trail.auraY).toBeGreaterThan(120);
  expect(trail.auraX).toBeLessThan(trail.ringX);
  expect(trail.auraY).toBeLessThan(trail.ringY);
  const renderedAura = await aura.evaluate((element) => {
    const rect = element.getBoundingClientRect();
    const cursorLayer = element.parentElement as HTMLElement;
    return {
      centerX: rect.left + rect.width / 2,
      centerY: rect.top + rect.height / 2,
      positionedX: Number.parseFloat(
        cursorLayer.style.getPropertyValue('--cursor-aura-x'),
      ),
      positionedY: Number.parseFloat(
        cursorLayer.style.getPropertyValue('--cursor-aura-y'),
      ),
      opacity: Number.parseFloat(getComputedStyle(element).opacity),
    };
  });
  expect(renderedAura.centerX).toBeCloseTo(renderedAura.positionedX, 0);
  expect(renderedAura.centerY).toBeCloseTo(renderedAura.positionedY, 0);
  expect(renderedAura.opacity).toBeGreaterThan(0.5);
});

test('stretches the cursor ring in the movement direction and settles back to a circle', async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium-desktop');
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/', { waitUntil: 'domcontentloaded' });

  const cursor = page.locator('[data-custom-cursor-layer]');
  await page.evaluate(() => {
    window.dispatchEvent(
      new PointerEvent('pointermove', {
        pointerType: 'mouse',
        clientX: 120,
        clientY: 120,
      }),
    );
    window.dispatchEvent(
      new PointerEvent('pointermove', {
        pointerType: 'mouse',
        clientX: 1200,
        clientY: 680,
      }),
    );
  });
  await waitForAnimationFrame(page);

  const movingShape = await cursor.evaluate((element) => ({
    moving: element.getAttribute('data-moving'),
    stretchX: Number.parseFloat(
      element.style.getPropertyValue('--cursor-ring-stretch-x'),
    ),
    stretchY: Number.parseFloat(
      element.style.getPropertyValue('--cursor-ring-stretch-y'),
    ),
    rotation: Number.parseFloat(
      element.style.getPropertyValue('--cursor-ring-rotation'),
    ),
    renderedWidth:
      element
        .querySelector('[data-cursor-ring]')
        ?.getBoundingClientRect().width ?? 0,
    renderedTransform: getComputedStyle(
      element.querySelector('[data-cursor-ring]') as Element,
    ).transform,
  }));

  expect(movingShape.moving).toBe('true');
  expect(movingShape.stretchX).toBeGreaterThan(1.1);
  expect(movingShape.stretchY).toBeLessThan(1);
  expect(movingShape.rotation).toBeGreaterThan(20);
  expect(movingShape.rotation).toBeLessThan(35);
  expect(movingShape.renderedWidth).toBeGreaterThan(34);
  expect(movingShape.renderedTransform).not.toBe('none');

  await expect
    .poll(() =>
      cursor.evaluate((element) => ({
        moving: element.getAttribute('data-moving'),
        stretchX: Number.parseFloat(
          element.style.getPropertyValue('--cursor-ring-stretch-x'),
        ),
        stretchY: Number.parseFloat(
          element.style.getPropertyValue('--cursor-ring-stretch-y'),
        ),
      })),
    )
    .toEqual({ moving: 'false', stretchX: 1, stretchY: 1 });
});

test('deepens cursor feedback over actions and compresses it while pressed', async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium-desktop');
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/', { waitUntil: 'domcontentloaded' });

  const cursor = page.locator('[data-custom-cursor-layer]');
  const ring = cursor.locator('[data-cursor-ring]');
  const dot = cursor.locator('[data-cursor-dot]');
  const primaryAction = page.getByRole('link', { name: '查看核心项目' });

  await primaryAction.hover();
  await expect(cursor).toHaveAttribute('data-interactive', 'true');
  await expect
    .poll(() => ring.evaluate((element) => element.getBoundingClientRect().width))
    .toBe(54);
  await expect
    .poll(() => dot.evaluate((element) => getComputedStyle(element).backgroundColor))
    .toBe('rgb(17, 17, 17)');

  await page.mouse.down();
  await expect(cursor).toHaveAttribute('data-pressed', 'true');
  await expect
    .poll(() => ring.evaluate((element) => element.getBoundingClientRect().width))
    .toBeLessThan(48);

  await page.mouse.up();
  await expect(cursor).toHaveAttribute('data-pressed', 'false');
  await expect
    .poll(() => ring.evaluate((element) => element.getBoundingClientRect().width))
    .toBe(54);
});

test('disables cursor and background motion when reduced motion changes after load', async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium-desktop');
  await page.addInitScript(() => {
    const state = window as typeof window & {
      __videoPauseCalls?: number;
      __videoPlayCalls?: number;
    };
    state.__videoPauseCalls = 0;
    state.__videoPlayCalls = 0;
    const originalPause = HTMLMediaElement.prototype.pause;
    const originalPlay = HTMLMediaElement.prototype.play;
    HTMLMediaElement.prototype.pause = function pauseWithObservation() {
      state.__videoPauseCalls = (state.__videoPauseCalls ?? 0) + 1;
      return originalPause.call(this);
    };
    HTMLMediaElement.prototype.play = function playWithObservation() {
      state.__videoPlayCalls = (state.__videoPlayCalls ?? 0) + 1;
      return originalPlay.call(this);
    };
  });
  await page.goto('/', { waitUntil: 'domcontentloaded' });

  const video = page.locator('.background-video');
  const cursor = page.locator('[data-custom-cursor-layer]');
  await video.dispatchEvent('loadeddata');
  await expect(video).toHaveAttribute('data-pointer-motion', 'enabled');
  await expect(cursor).toHaveAttribute('data-enabled', 'true');

  await page.mouse.move(1296, 180);
  await expect(cursor).toHaveAttribute('data-visible', 'true');
  await expect
    .poll(async () =>
      Number.parseFloat((await readBackgroundMotion(page))?.shiftX ?? 'NaN'),
    )
    .toBeLessThan(0);
  const pauseCallsBeforeReduce = await page.evaluate(
    () =>
      (window as typeof window & { __videoPauseCalls?: number })
        .__videoPauseCalls ?? 0,
  );

  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(video).toHaveAttribute('data-pointer-motion', 'disabled');
  await expect(cursor).toHaveAttribute('data-enabled', 'false');
  await expect(cursor).toBeHidden();
  await expect(page.locator('html')).not.toHaveAttribute(
    'data-custom-cursor',
    'ready',
  );
  expect(
    await page.locator('body').evaluate((element) => getComputedStyle(element).cursor),
  ).not.toBe('none');
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          (window as typeof window & { __videoPauseCalls?: number })
            .__videoPauseCalls ?? 0,
      ),
    )
    .toBeGreaterThan(pauseCallsBeforeReduce);
  await expect
    .poll(async () => await readBackgroundMotion(page))
    .toMatchObject({
      shiftX: '0px',
      shiftY: '0px',
      lensOpacity: '0',
      videoTransform: 'none',
      videoWillChange: 'auto',
      lensDisplay: 'none',
    });

  const reducedState = await readBackgroundMotion(page);
  await page.mouse.move(1439, 1);
  await waitForAnimationFrame(page);
  expect(await readBackgroundMotion(page)).toEqual(reducedState);

  const playCallsBeforeRestore = await page.evaluate(
    () =>
      (window as typeof window & { __videoPlayCalls?: number })
        .__videoPlayCalls ?? 0,
  );
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await expect(video).toHaveAttribute('data-pointer-motion', 'enabled');
  await expect(cursor).toHaveAttribute('data-enabled', 'true');
  await expect(page.locator('html')).not.toHaveAttribute(
    'data-custom-cursor',
    'ready',
  );
  expect(
    await page.locator('body').evaluate((element) => getComputedStyle(element).cursor),
  ).not.toBe('none');
  await page.mouse.move(1200, 200);
  await expect(page.locator('html')).toHaveAttribute(
    'data-custom-cursor',
    'ready',
  );
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          (window as typeof window & { __videoPlayCalls?: number })
            .__videoPlayCalls ?? 0,
      ),
    )
    .toBeGreaterThan(playCallsBeforeRestore);
});

test('keeps the native cursor when pointer media-query listeners are unavailable', async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium-desktop');
  await page.addInitScript(() => {
    const originalMatchMedia = window.matchMedia.bind(window);
    window.matchMedia = (query: string) => {
      if (query !== '(hover: hover) and (pointer: fine)') {
        return originalMatchMedia(query);
      }

      return {
        matches: true,
        media: query,
      } as MediaQueryList;
    };
  });
  const failures = observeApplicationFailures(page);
  await page.goto('/', { waitUntil: 'domcontentloaded' });

  const cursor = page.locator('[data-custom-cursor-layer]');
  await expect(cursor).toHaveAttribute('data-enabled', 'false');
  await expect(cursor).toBeHidden();
  await expect(page.locator('html')).not.toHaveAttribute(
    'data-custom-cursor',
    'ready',
  );
  expect(
    await page.locator('body').evaluate((element) => getComputedStyle(element).cursor),
  ).not.toBe('none');
  await expect(page.locator('.background-video')).toHaveAttribute(
    'data-pointer-motion',
    'disabled',
  );
  expect(failures.applicationErrors).toEqual([]);
  expect(failures.sameOriginErrors).toEqual([]);
});

test('reveals video detail only when the pointer is outside the main reading column', async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium-desktop');
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/', { waitUntil: 'domcontentloaded' });

  await page.locator('.background-video').dispatchEvent('loadeddata');
  await expect(page.locator('.background-video')).toHaveAttribute(
    'data-media-state',
    'ready',
  );

  await page.mouse.move(1296, 180);
  await expect
    .poll(async () =>
      Number.parseFloat(
        (await readBackgroundMotion(page))?.lensOpacity ?? 'NaN',
      ),
    )
    .toBeCloseTo(0.78, 2);
  await expect
    .poll(async () =>
      Number.parseFloat(
        (await readBackgroundMotion(page))?.lensRenderedOpacity ?? 'NaN',
      ),
    )
    .toBeCloseTo(0.78, 2);
  expect((await readBackgroundMotion(page))?.lensMaskImage).not.toBe('none');
  expect(Number.parseFloat((await readBackgroundMotion(page))?.lensX ?? '0')).toBe(
    90,
  );

  await page.mouse.move(936, 180);
  await expect
    .poll(async () =>
      Number.parseFloat(
        (await readBackgroundMotion(page))?.lensOpacity ?? 'NaN',
      ),
    )
    .toBeGreaterThan(0);
  expect(
    Number.parseFloat(
      (await readBackgroundMotion(page))?.lensOpacity ?? 'NaN',
    ),
  ).toBeLessThan(1);

  await page.mouse.move(288, 180);
  await expect
    .poll(async () => (await readBackgroundMotion(page))?.lensOpacity)
    .toBe('0');
  await expect
    .poll(async () =>
      Number.parseFloat(
        (await readBackgroundMotion(page))?.lensRenderedOpacity ?? 'NaN',
      ),
    )
    .toBe(0);
});

test('briefly boosts the detail lens during fast pointer movement and then relaxes', async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium-desktop');
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/', { waitUntil: 'domcontentloaded' });

  const video = page.locator('.background-video');
  await video.dispatchEvent('loadeddata');
  await expect(video).toHaveAttribute('data-media-state', 'ready');

  const measuredEnergy = await page.evaluate(() => {
    const overlay = document.querySelector<HTMLElement>(
      '[data-background-overlay]',
    );
    const dispatchMove = (x: number, timestamp: number) => {
      const event = new PointerEvent('pointermove', {
        pointerType: 'mouse',
        clientX: x,
        clientY: 450,
      });
      Object.defineProperty(event, 'timeStamp', { value: timestamp });
      window.dispatchEvent(event);
      return Number.parseFloat(
        overlay?.style.getPropertyValue('--background-motion-energy') ??
          'NaN',
      );
    };
    const reset = () =>
      window.dispatchEvent(
        new PointerEvent('pointerout', {
          pointerType: 'mouse',
          relatedTarget: null,
        }),
      );

    dispatchMove(720, 1_000);
    const fast = dispatchMove(800, 1_010);
    reset();
    dispatchMove(720, 2_000);
    const slow = dispatchMove(800, 2_500);
    reset();
    return { fast, slow };
  });

  expect(measuredEnergy.fast).toBeGreaterThan(0.8);
  expect(measuredEnergy.slow).toBeLessThan(0.2);

  await page.mouse.move(1296, 180);
  await expect
    .poll(async () =>
      Number.parseFloat(
        (await readBackgroundMotion(page))?.motionEnergy ?? 'NaN',
      ),
    )
    .toBe(0);
  await expect
    .poll(async () =>
      Number.parseFloat(
        (await readBackgroundMotion(page))?.lensOpacity ?? 'NaN',
      ),
    )
    .toBeCloseTo(0.78, 2);
});

test('recenters the background and hides the detail lens when the pointer leaves', async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium-desktop');
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/', { waitUntil: 'domcontentloaded' });

  await page.locator('.background-video').dispatchEvent('loadeddata');
  await page.mouse.move(1296, 180);
  await expect
    .poll(async () =>
      Number.parseFloat((await readBackgroundMotion(page))?.shiftX ?? 'NaN'),
    )
    .toBeLessThan(0);

  await page.evaluate(() => {
    window.dispatchEvent(
      new PointerEvent('pointerout', { pointerType: 'mouse', relatedTarget: null }),
    );
  });
  await expect
    .poll(async () => await readBackgroundMotion(page))
    .toMatchObject({
      shiftX: '0px',
      shiftY: '0px',
      lensX: '50%',
      lensY: '50%',
      lensOpacity: '0',
    });
});

test('ignores touch pointer events on mixed-input desktop devices', async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium-desktop');
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/', { waitUntil: 'domcontentloaded' });

  await expect(page.locator('.background-video')).toHaveAttribute(
    'data-pointer-motion',
    'enabled',
  );
  const before = await readBackgroundMotion(page);

  await page.evaluate(() => {
    window.dispatchEvent(
      new PointerEvent('pointermove', {
        pointerType: 'touch',
        clientX: 1439,
        clientY: 1,
      }),
    );
  });
  await waitForAnimationFrame(page);

  expect(await readBackgroundMotion(page)).toEqual(before);
});

test('keeps pointer motion disabled in the coarse-pointer mobile context', async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium-mobile');
  await page.goto('/', { waitUntil: 'domcontentloaded' });

  await expect(page.locator('.background-video')).toHaveAttribute(
    'data-pointer-motion',
    'disabled',
  );
  const before = await readBackgroundMotion(page);
  await page.mouse.move(
    Math.max(1, (await page.evaluate(() => window.innerWidth)) - 1),
    1,
  );
  await waitForAnimationFrame(page);
  expect(await readBackgroundMotion(page)).toEqual(before);

  const cursor = page.locator('[data-custom-cursor-layer]');
  await expect(cursor).toHaveCount(1);
  await expect(cursor).toHaveAttribute('data-enabled', 'false');
  await expect(cursor).toBeHidden();
  await expect(page.locator('html')).not.toHaveAttribute(
    'data-custom-cursor',
    'ready',
  );
  expect(
    await page.locator('body').evaluate((element) => getComputedStyle(element).cursor),
  ).not.toBe('none');
});

test('switches navigation responsively and never overflows horizontally', async ({
  page,
}, testInfo) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' });

  const isMobile = testInfo.project.name === 'chromium-mobile';
  const desktopNav = page.getByRole('navigation', { name: '主要导航' });
  const menuTrigger = page.getByRole('button', { name: '打开导航菜单' });
  const headerDownload = page.locator('header').getByRole('link', {
    name: '下载简历',
  });

  if (isMobile) {
    await expect(desktopNav).toBeHidden();
    await expect(menuTrigger).toBeVisible();
  } else {
    await expect(desktopNav).toBeVisible();
    await expect(desktopNav.getByRole('link')).toHaveCount(4);
    await expect(menuTrigger).toBeHidden();
  }
  await expect(headerDownload).toBeVisible();

  const dimensions = await page.evaluate(() => ({
    viewportWidth: window.innerWidth,
    pageWidth: document.documentElement.scrollWidth,
  }));
  expect(dimensions.pageWidth).toBeLessThanOrEqual(dimensions.viewportWidth);
});

test('honors the exact 900 and 640 pixel breakpoint boundaries', async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium-desktop');
  await page.goto('/', { waitUntil: 'domcontentloaded' });

  await page.setViewportSize({ width: 901, height: 900 });
  await expect(page.getByRole('navigation', { name: '主要导航' })).toBeVisible();
  await expect(page.getByRole('button', { name: '打开导航菜单' })).toBeHidden();
  await expectNoHorizontalOverflow(page);

  await page.setViewportSize({ width: 900, height: 900 });
  await expect(page.getByRole('navigation', { name: '主要导航' })).toBeHidden();
  await expect(page.getByRole('button', { name: '打开导航菜单' })).toBeVisible();
  await expectNoHorizontalOverflow(page);

  const firstProjectTag = page.locator('.project-index-tag').first();
  await page.setViewportSize({ width: 641, height: 900 });
  await expect(firstProjectTag).toBeVisible();
  await expect(
    page
      .locator('#selected-work')
      .getByRole('link', { name: '园区获客智能管理系统' }),
  ).toBeVisible();
  await expectNoHorizontalOverflow(page);
  await page.setViewportSize({ width: 640, height: 900 });
  await expect(firstProjectTag).toBeHidden();
  await expect(
    page
      .locator('#selected-work')
      .getByRole('link', { name: '园区获客智能管理系统' }),
  ).toBeVisible();
  await expectNoHorizontalOverflow(page);
});

test('closes an open mobile menu when the viewport crosses into desktop', async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium-desktop');
  await page.setViewportSize({ width: 900, height: 844 });
  await page.goto('/', { waitUntil: 'domcontentloaded' });

  await page.getByRole('button', { name: '打开导航菜单' }).click();
  await expect(page.getByRole('dialog', { name: '导航菜单' })).toBeVisible();
  await expect(page.locator('main')).toHaveAttribute('inert', '');
  expect(await page.locator('body').evaluate((element) => element.style.overflow)).toBe(
    'hidden',
  );

  await page.setViewportSize({ width: 901, height: 844 });

  await expect(page.getByRole('dialog', { name: '导航菜单' })).toHaveCount(0);
  await expect(page.getByRole('navigation', { name: '主要导航' })).toBeVisible();
  await expect(page.locator('main')).not.toHaveAttribute('inert', '');
  expect(await page.locator('body').evaluate((element) => element.style.overflow)).toBe(
    '',
  );
});

test('uses approved high-contrast white for desktop navigation and project tags', async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium-desktop');
  await page.goto('/', { waitUntil: 'domcontentloaded' });

  const colors = await page
    .locator('.desktop-nav a, .project-index-tag')
    .evaluateAll((elements) =>
      elements.map((element) => getComputedStyle(element).color),
    );

  expect(colors).toHaveLength(6);
  expect(colors.every((color) => color === 'rgb(255, 255, 255)')).toBe(true);
});

test('keeps desktop copy in the dark video region and strengthens mobile metadata', async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium-desktop');
  await page.goto('/', { waitUntil: 'domcontentloaded' });

  const readLayout = () =>
    page.evaluate(() => {
      const textStyles = (selector: string) =>
        Array.from(document.querySelectorAll(selector), (element) => {
          const style = getComputedStyle(element);
          return { color: style.color, maxWidth: style.maxWidth };
        });

      return {
        projectMargins: Array.from(
          document.querySelectorAll('.project-details'),
          (element) => getComputedStyle(element).marginLeft,
        ),
        projectCopy: textStyles('.project-detail-row dd > p:first-child'),
        projectMetaColors: Array.from(
          document.querySelectorAll('.project-meta'),
          (element) => getComputedStyle(element).color,
        ),
        experienceCopy: textStyles('.experience-summary'),
        practiceCopy: textStyles('.practice-row > div > p:last-child'),
        auxiliaryColors: Array.from(
          document.querySelectorAll(
            '.result-note, .experience-dates, .experience-role, .practice-number',
          ),
          (element) => getComputedStyle(element).color,
        ),
      };
    });

  for (const width of [1440, 901]) {
    await page.setViewportSize({ width, height: 900 });
    const layout = await readLayout();

    expect(layout.projectMargins).toEqual(['96px', '96px']);
    expect(layout.projectCopy).toHaveLength(8);
    expect(
      layout.projectCopy.every(
        ({ color, maxWidth }) =>
          color === 'rgb(255, 255, 255)' && maxWidth === '440px',
      ),
    ).toBe(true);
    expect(layout.projectMetaColors).toEqual([
      'rgb(255, 255, 255)',
      'rgb(255, 255, 255)',
    ]);
    for (const copy of [layout.experienceCopy, layout.practiceCopy]) {
      expect(copy).toHaveLength(2);
      expect(
        copy.every(
          ({ color, maxWidth }) =>
            color === 'rgb(255, 255, 255)' && maxWidth === '520px',
        ),
      ).toBe(true);
    }
    expect(layout.auxiliaryColors).toHaveLength(8);
    expect(
      layout.auxiliaryColors.every(
        (color) => color === 'rgba(255, 255, 255, 0.62)',
      ),
    ).toBe(true);
  }

  for (const width of [900, 390]) {
    await page.setViewportSize({ width, height: 900 });
    const layout = await readLayout();

    expect(layout.projectMargins).toEqual(['0px', '0px']);
    expect(layout.projectCopy).toHaveLength(8);
    expect(
      layout.projectCopy.every(
        ({ color, maxWidth }) =>
          color === 'rgba(255, 255, 255, 0.82)' && maxWidth === '720px',
      ),
    ).toBe(true);
    expect(layout.projectMetaColors).toEqual([
      'rgba(255, 255, 255, 0.78)',
      'rgba(255, 255, 255, 0.78)',
    ]);
    for (const copy of [layout.experienceCopy, layout.practiceCopy]) {
      expect(copy).toHaveLength(2);
      expect(
        copy.every(
          ({ color, maxWidth }) =>
            color === 'rgba(255, 255, 255, 0.82)' && maxWidth === '680px',
        ),
      ).toBe(true);
    }
    expect(layout.auxiliaryColors).toHaveLength(8);
    expect(
      layout.auxiliaryColors.every(
        (color) => color === 'rgba(255, 255, 255, 0.78)',
      ),
    ).toBe(true);
    await expectNoHorizontalOverflow(page);
  }
});

test('keeps anchor targets below the fixed header', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/', { waitUntil: 'domcontentloaded' });

  await page.getByRole('link', { name: '查看核心项目' }).click();
  await expect(page).toHaveURL(/#selected-work$/);
  await expectAnchorClearOfHeader(page, 'selected-work');

  await page
    .locator('#selected-work')
    .getByRole('link', { name: '园区获客智能管理系统' })
    .click();
  await expect(page).toHaveURL(/#project-crm-agent$/);
  await expectAnchorClearOfHeader(page, 'project-crm-agent');

  await page
    .locator('#selected-work')
    .getByRole('link', { name: '企业智能语音助手' })
    .click();
  await expect(page).toHaveURL(/#project-voice-assistant$/);
  await expectAnchorClearOfHeader(page, 'project-voice-assistant');
});

test('keeps content readable when media and motion are unavailable', async ({
  page,
}) => {
  const failures = observeApplicationFailures(page);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.addInitScript(() => {
    const state = window as typeof window & { __videoPauseCalls?: number };
    state.__videoPauseCalls = 0;
    const originalPause = HTMLMediaElement.prototype.pause;
    HTMLMediaElement.prototype.pause = function pauseWithObservation() {
      state.__videoPauseCalls = (state.__videoPauseCalls ?? 0) + 1;
      return originalPause.call(this);
    };
  });
  await page.goto('/', { waitUntil: 'domcontentloaded' });

  const video = page.locator('video');
  await expect(video).toHaveAttribute('data-media-state', 'failed');
  await expect(video).toBeHidden();
  expect(await video.evaluate((element) => (element as HTMLVideoElement).paused)).toBe(
    true,
  );
  expect(
    await page.evaluate(
      () =>
        (window as typeof window & { __videoPauseCalls?: number })
          .__videoPauseCalls ?? 0,
    ),
  ).toBeGreaterThan(0);
  await expect(video).toHaveAttribute('data-pointer-motion', 'disabled');
  const cursor = page.locator('[data-custom-cursor-layer]');
  await expect(cursor).toHaveCount(1);
  await expect(cursor).toHaveAttribute('data-enabled', 'false');
  await expect(cursor).toBeHidden();
  await expect(page.locator('html')).not.toHaveAttribute(
    'data-custom-cursor',
    'ready',
  );
  expect(
    await page.locator('body').evaluate((element) => getComputedStyle(element).cursor),
  ).not.toBe('none');
  const motionBeforePointer = await readBackgroundMotion(page);
  await page.mouse.move(1439, 1);
  await waitForAnimationFrame(page);
  expect(await readBackgroundMotion(page)).toEqual(motionBeforePointer);
  expect(await readBackgroundMotion(page)).toMatchObject({
    videoTransform: 'none',
    videoWillChange: 'auto',
    lensDisplay: 'none',
  });
  expect(
    await page.locator('body').evaluate((element) => getComputedStyle(element).backgroundColor),
  ).toBe('rgb(0, 0, 0)');

  const importantCopy = page.locator(
    'h1, h2, h3, .hero-description, .project-detail-row dd, .experience-summary',
  );
  await expect(importantCopy.first()).toBeVisible();
  expect(
    await importantCopy.evaluateAll((elements) =>
      elements.every((element) => {
        const style = getComputedStyle(element);
        return style.opacity === '1' && style.visibility === 'visible';
      }),
    ),
  ).toBe(true);

  const fontFamily = await page.locator('body').evaluate(
    (element) => getComputedStyle(element).fontFamily,
  );
  for (const family of [
    'Helvetica Now Var',
    'Helvetica Neue',
    'Helvetica',
    'Arial',
    'PingFang SC',
    'Microsoft YaHei',
    'sans-serif',
  ]) {
    expect(fontFamily).toContain(family);
  }
  expect(failures.applicationErrors).toEqual([]);
  expect(failures.sameOriginErrors).toEqual([]);
});

test('traps keyboard focus in the mobile menu and restores it on Escape', async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium-mobile');
  await page.goto('/', { waitUntil: 'domcontentloaded' });

  const trigger = page.getByRole('button', { name: '打开导航菜单' });
  await trigger.click();
  const menu = page.getByRole('dialog', { name: '导航菜单' });
  const firstLink = menu.getByRole('link', { name: '核心项目' });
  const closeButton = menu.getByRole('button', { name: '关闭导航菜单' });

  await expect(menu).toBeVisible();
  await expect(firstLink).toBeFocused();
  await expect(page.locator('main')).toHaveAttribute('inert', '');
  expect(await page.locator('body').evaluate((element) => element.style.overflow)).toBe(
    'hidden',
  );

  await page.keyboard.press('Shift+Tab');
  await expect(closeButton).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(firstLink).toBeFocused();

  await page.keyboard.press('Escape');
  await expect(menu).toHaveCount(0);
  await expect(page.getByRole('button', { name: '打开导航菜单' })).toBeFocused();
  await expect(page.locator('main')).not.toHaveAttribute('inert', '');
  expect(await page.locator('body').evaluate((element) => element.style.overflow)).toBe(
    '',
  );
});
