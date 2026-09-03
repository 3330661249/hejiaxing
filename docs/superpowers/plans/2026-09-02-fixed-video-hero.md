# Fixed Video Hero Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a local React/Vite page containing one transparent full-viewport hero over the exact fixed, autoplaying background video, with the supplied typography and staggered Framer Motion animation.

**Architecture:** A small Vite application mounts one App component. App owns the static video and hero structure, FadeUp owns the reusable viewport animation contract, and heroContent.ts owns immutable copy and delay calculation. Vitest/Testing Library verifies component contracts, while Playwright verifies computed desktop/mobile layout and separately observes external media playback.

**Tech Stack:** React 18, React DOM 18, TypeScript, Vite, Tailwind CSS 3, PostCSS, Framer Motion 12, Vitest, Testing Library, JSDOM, and Playwright Chromium.

**Spec:** docs/superpowers/specs/2026-09-02-fixed-video-hero-design.md

## Global Constraints

- Keep react and react-dom on major version 18, tailwindcss on major version 3, and framer-motion on major version 12; commit package-lock.json.
- Use the exact video source https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260514_135830_bb6491d1-9b66-4aec-9722-13b4dfe3fb46.mp4.
- The video is fixed at top 0, left 0, width 100%, height 100vh, object-fit cover, and z-index 0, with autoPlay, muted, loop, and playsInline.
- The foreground section is transparent, position relative, z-index 1, vertically centered, exactly 100vh, and padded 70px 32px 32px; at widths up to 900px, use 90px 18px 32px.
- Render the exact heading “WE BUILD END-TO-END AI AUTOMATION SYSTEMS.” as six independently animated word spans and the exact paragraph “We provide all-in-one AI automation services in one place.”.
- Heading word delays are 0.15 + index * 0.08 seconds, rounded to two decimals; use y 32, duration 0.7, and easing [0.22, 1, 0.36, 1].
- Paragraph animation uses delay 0.9, y 24, duration 0.7, and the same easing.
- Every FadeUp uses initial, whileInView, and viewport { once: true, amount: 0.2 } exactly as specified.
- Import Helvetica Now Var from the exact supplied URL and retain the exact fallback stack.
- Do not add navigation, calls to action, controls, overlays, gradients, tint layers, posters, decorative elements, extra sections, state, analytics, APIs, deployment, or hosting.
- Keep the section free of any background utility or CSS background declaration. A black body color is allowed only as the non-layered media failure fallback.

---

## File Map

- package.json — package identity, scripts, and direct dependency constraints.
- package-lock.json — reproducible resolved npm dependency graph.
- .gitignore — generated dependencies, build output, browser reports, and local OS files.
- index.html — Vite HTML shell and page title.
- tsconfig.json — strict TypeScript configuration for app, tests, and tooling.
- vite.config.ts — React plugin, Vitest JSDOM environment, setup file, and E2E exclusion.
- tailwind.config.cjs — Tailwind 3 source scanning.
- postcss.config.cjs — Tailwind and Autoprefixer processing.
- playwright.config.ts — local server plus desktop/mobile Chromium projects.
- src/test/setup.ts — Testing Library matchers and IntersectionObserver test stub.
- src/test/framerMotionMock.tsx — test-only motion proxy exposing motion configuration.
- src/components/FadeUp.tsx — reusable polymorphic Framer Motion component.
- src/components/FadeUp.test.tsx — default and override motion-contract tests.
- src/heroContent.ts — immutable video URL, copy, words, and delay calculation.
- src/App.tsx — fixed video and transparent hero structure.
- src/App.test.tsx — video, content, semantic spaces, and animation-wiring tests.
- src/main.tsx — React DOM entry.
- src/index.css — font import, Tailwind layers, global sizing, and fallback.
- tests/toolchain.test.ts — dependency-major, script, and lockfile contract.
- tests/e2e/hero.spec.ts — computed layout, motion-rest, overflow, fixed-position, and console checks.
- tests/e2e/media.spec.ts — external CDN readiness and playback-time diagnostic.

---

### Task 1: Bootstrap the Reproducible Test and Build Toolchain

**Files:**
- Create: package.json
- Create: package-lock.json through npm
- Create: .gitignore
- Create: index.html
- Create: tsconfig.json
- Create: vite.config.ts
- Create: tailwind.config.cjs
- Create: postcss.config.cjs
- Create: src/test/setup.ts
- Create: src/test/framerMotionMock.tsx
- Create: tests/toolchain.test.ts

**Interfaces:**
- Consumes: no application code.
- Produces: npm scripts dev, build, test, test:watch, test:e2e, and test:media; a JSDOM Vitest environment; Tailwind/PostCSS processing; createFramerMotionMock().

- [ ] **Step 1: Create the minimal npm manifest**

Create package.json with configuration only:

~~~json
{
  "name": "fixed-video-hero",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {}
}
~~~

- [ ] **Step 2: Install only the runner needed to express the dependency contract**

Run:

~~~bash
npm install --save-dev vitest typescript @types/node
~~~

Expected: npm creates package-lock.json; React, Tailwind, Framer Motion, Vite, and browser-test dependencies are still absent as direct dependencies.

- [ ] **Step 3: Write the failing dependency and command contract**

Create tests/toolchain.test.ts:

~~~ts
// @vitest-environment node

import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

type PackageManifest = {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  scripts?: Record<string, string>;
};

const packagePath = fileURLToPath(new URL('../package.json', import.meta.url));
const lockPath = fileURLToPath(new URL('../package-lock.json', import.meta.url));
const manifest = JSON.parse(readFileSync(packagePath, 'utf8')) as PackageManifest;
const directDependencies = {
  ...manifest.dependencies,
  ...manifest.devDependencies,
};

function expectMajor(packageName: string, major: number) {
  const version = directDependencies[packageName];
  expect(version, packageName + ' must be a direct dependency').toBeTypeOf('string');
  expect(version).toMatch(new RegExp('^[~^]?' + major + '(?:\\.|$)'));
}

describe('toolchain contract', () => {
  it('pins the required direct dependency majors', () => {
    expectMajor('react', 18);
    expectMajor('react-dom', 18);
    expectMajor('tailwindcss', 3);
    expectMajor('framer-motion', 12);
    expect(directDependencies.vite).toBeTypeOf('string');
    expect(directDependencies['@vitejs/plugin-react']).toBeTypeOf('string');
    expect(directDependencies['@playwright/test']).toBeTypeOf('string');
  });

  it('defines the reproducible project commands', () => {
    expect(manifest.scripts).toMatchObject({
      dev: 'vite --host 127.0.0.1',
      build: 'tsc --noEmit && vite build',
      test: 'vitest run',
      'test:watch': 'vitest',
      'test:e2e': 'playwright test --grep-invert @external',
      'test:media': 'playwright test --grep @external --project=chromium-desktop',
    });
  });

  it('keeps an npm lockfile', () => {
    expect(existsSync(lockPath)).toBe(true);
  });
});
~~~

- [ ] **Step 4: Run the test and verify the intended red state**

Run:

~~~bash
npx vitest run tests/toolchain.test.ts
~~~

Expected: FAIL because react is not a direct dependency. It must be an assertion failure rather than a syntax or runner error.

- [ ] **Step 5: Install the requested runtime and development dependencies**

Run:

~~~bash
npm install react@18 react-dom@18 framer-motion@12
npm install --save-dev vite @vitejs/plugin-react tailwindcss@3 postcss autoprefixer @types/react@18 @types/react-dom@18 @testing-library/react @testing-library/jest-dom jsdom @playwright/test
~~~

- [ ] **Step 6: Add the exact scripts without replacing npm-written versions**

Set the package.json scripts field to:

~~~json
{
  "scripts": {
    "dev": "vite --host 127.0.0.1",
    "build": "tsc --noEmit && vite build",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:e2e": "playwright test --grep-invert @external",
    "test:media": "playwright test --grep @external --project=chromium-desktop"
  }
}
~~~

- [ ] **Step 7: Create the compiler, Vite, and styling configuration**

Create tsconfig.json:

~~~json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "skipLibCheck": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "types": ["vitest/globals", "node"]
  },
  "include": ["src", "tests", "vite.config.ts", "playwright.config.ts"]
}
~~~

Create tailwind.config.cjs:

~~~js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: { extend: {} },
  plugins: [],
};
~~~

Create postcss.config.cjs:

~~~js
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
~~~

Create vite.config.ts:

~~~ts
import react from '@vitejs/plugin-react';
import { configDefaults, defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    css: true,
    exclude: [...configDefaults.exclude, 'tests/e2e/**'],
  },
});
~~~

- [ ] **Step 8: Create the blank Vite shell and ignore generated output**

Create index.html without an application script:

~~~html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>AI Automation Systems</title>
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>
~~~

Create .gitignore:

~~~gitignore
node_modules/
dist/
playwright-report/
test-results/
.DS_Store
~~~

- [ ] **Step 9: Create the reusable test setup**

Create src/test/setup.ts:

~~~ts
import '@testing-library/jest-dom/vitest';

class IntersectionObserverStub {
  readonly root = null;
  readonly rootMargin = '0px';
  readonly thresholds = [0];

  disconnect() {}
  observe() {}
  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }
  unobserve() {}
}

Object.defineProperty(globalThis, 'IntersectionObserver', {
  configurable: true,
  writable: true,
  value: IntersectionObserverStub,
});
~~~

Create src/test/framerMotionMock.tsx:

~~~tsx
import { createElement, type ReactNode } from 'react';

type MotionProbeProps = Record<string, unknown> & {
  children?: ReactNode;
  initial?: unknown;
  whileInView?: unknown;
  viewport?: unknown;
  transition?: unknown;
};

export function createFramerMotionMock() {
  const motion = new Proxy<Record<string, unknown>>({}, {
    get: (_target, tag) =>
      ({
        children,
        initial,
        whileInView,
        viewport,
        transition,
        ...rest
      }: MotionProbeProps) =>
        createElement(
          String(tag),
          {
            ...rest,
            'data-initial': JSON.stringify(initial),
            'data-while-in-view': JSON.stringify(whileInView),
            'data-viewport': JSON.stringify(viewport),
            'data-transition': JSON.stringify(transition),
          },
          children,
        ),
  });

  return { motion };
}
~~~

- [ ] **Step 10: Verify the green toolchain contract**

Run:

~~~bash
npm test -- tests/toolchain.test.ts
npm ls --depth=0 react react-dom framer-motion tailwindcss vite
~~~

Expected: all three tests PASS; npm resolves React/React DOM 18.x, Framer Motion 12.x, Tailwind CSS 3.x, and a direct Vite version without invalid packages.

- [ ] **Step 11: Commit the independently verified toolchain**

Run:

~~~bash
git add package.json package-lock.json .gitignore index.html tsconfig.json vite.config.ts tailwind.config.cjs postcss.config.cjs src/test tests/toolchain.test.ts
git commit -m "chore: initialize React Vite toolchain"
~~~

---

### Task 2: Implement the Reusable FadeUp Contract

**Files:**
- Create: src/components/FadeUp.test.tsx
- Create: src/components/FadeUp.tsx

**Interfaces:**
- Consumes: createFramerMotionMock() from src/test/framerMotionMock.tsx; Framer Motion 12; React CSSProperties and ReactNode.
- Produces: FadeUp(props: FadeUpProps) with as, delay, duration, y, once, className, and style behavior exactly matching the supplied component.

- [ ] **Step 1: Write the failing default and override tests**

Create src/components/FadeUp.test.tsx:

~~~tsx
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { FadeUp } from './FadeUp';

vi.mock('framer-motion', async () => {
  const { createFramerMotionMock } = await import('../test/framerMotionMock');
  return createFramerMotionMock();
});

function readJsonAttribute(element: HTMLElement, name: string) {
  const value = element.getAttribute(name);
  expect(value, name + ' must exist').not.toBeNull();
  return JSON.parse(value as string) as unknown;
}

describe('FadeUp', () => {
  it('uses the exact default viewport motion contract', () => {
    render(
      <FadeUp as="span" className="probe" style={{ color: '#ff0000' }}>
        Default motion
      </FadeUp>,
    );

    const element = screen.getByText('Default motion');
    expect(element.tagName).toBe('SPAN');
    expect(element).toHaveClass('probe');
    expect(element).toHaveStyle('color: rgb(255, 0, 0)');
    expect(readJsonAttribute(element, 'data-initial')).toEqual({
      opacity: 0,
      y: 24,
    });
    expect(readJsonAttribute(element, 'data-while-in-view')).toEqual({
      opacity: 1,
      y: 0,
    });
    expect(readJsonAttribute(element, 'data-viewport')).toEqual({
      once: true,
      amount: 0.2,
    });
    expect(readJsonAttribute(element, 'data-transition')).toEqual({
      duration: 0.7,
      delay: 0,
      ease: [0.22, 1, 0.36, 1],
    });
  });

  it('forwards every supported override', () => {
    render(
      <FadeUp as="p" delay={0.9} duration={1.1} y={32} once={false}>
        Override motion
      </FadeUp>,
    );

    const element = screen.getByText('Override motion');
    expect(element.tagName).toBe('P');
    expect(readJsonAttribute(element, 'data-initial')).toEqual({
      opacity: 0,
      y: 32,
    });
    expect(readJsonAttribute(element, 'data-viewport')).toEqual({
      once: false,
      amount: 0.2,
    });
    expect(readJsonAttribute(element, 'data-transition')).toEqual({
      duration: 1.1,
      delay: 0.9,
      ease: [0.22, 1, 0.36, 1],
    });
  });
});
~~~

- [ ] **Step 2: Run the test and confirm the bootstrap failure**

Run:

~~~bash
npm test -- src/components/FadeUp.test.tsx
~~~

Expected: FAIL because ./FadeUp does not exist. This confirms the intended boundary, but it is not yet the assertion-level red state.

- [ ] **Step 3: Add a compile-only stub and verify the assertion-level red state**

Create src/components/FadeUp.tsx as an incomplete stub:

~~~tsx
import { createElement, type CSSProperties, type ReactNode } from 'react';

type FadeUpProps = {
  children: ReactNode;
  delay?: number;
  duration?: number;
  y?: number;
  className?: string;
  style?: CSSProperties;
  as?: 'div' | 'section' | 'span' | 'h1' | 'h2' | 'h3' | 'p' | 'nav';
  once?: boolean;
};

export function FadeUp({
  children,
  className,
  style,
  as = 'div',
}: FadeUpProps) {
  return createElement(as, { className, style }, children);
}
~~~

Run:

~~~bash
npm test -- src/components/FadeUp.test.tsx
~~~

Expected: FAIL because data-initial is absent. This is the assertion-level red state caused by missing motion behavior.

- [ ] **Step 4: Replace the stub with the exact minimal implementation**

Replace src/components/FadeUp.tsx with:

~~~tsx
import { motion } from 'framer-motion';
import type { CSSProperties, ReactNode } from 'react';

type FadeUpProps = {
  children: ReactNode;
  delay?: number;
  duration?: number;
  y?: number;
  className?: string;
  style?: CSSProperties;
  as?: 'div' | 'section' | 'span' | 'h1' | 'h2' | 'h3' | 'p' | 'nav';
  once?: boolean;
};

export function FadeUp({
  children,
  delay = 0,
  duration = 0.7,
  y = 24,
  className,
  style,
  as = 'div',
  once = true,
}: FadeUpProps) {
  const Tag = motion[as];

  return (
    <Tag
      className={className}
      style={style}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once, amount: 0.2 }}
      transition={{ duration, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </Tag>
  );
}
~~~

- [ ] **Step 5: Run the focused and complete suites**

Run:

~~~bash
npm test -- src/components/FadeUp.test.tsx
npm test
~~~

Expected: the two FadeUp tests and every existing test PASS with no unhandled errors.

- [ ] **Step 6: Commit the animation component**

Run:

~~~bash
git add src/components/FadeUp.tsx src/components/FadeUp.test.tsx
git commit -m "feat: add reusable FadeUp motion"
~~~

---

### Task 3: Implement the Static Video Hero Component

**Files:**
- Create: src/heroContent.ts
- Create: src/App.test.tsx
- Create: src/App.tsx

**Interfaces:**
- Consumes: FadeUp from src/components/FadeUp.tsx.
- Produces: VIDEO_SOURCE, HEADING_WORDS, SUBTEXT, getWordDelay(index: number): number, and the default App component.

- [ ] **Step 1: Write the failing structure and animation-wiring test**

Create src/App.test.tsx:

~~~tsx
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import App from './App';
import {
  getWordDelay,
  HEADING_WORDS,
  SUBTEXT,
  VIDEO_SOURCE,
} from './heroContent';

vi.mock('framer-motion', async () => {
  const { createFramerMotionMock } = await import('./test/framerMotionMock');
  return createFramerMotionMock();
});

function readJsonAttribute(element: Element, name: string) {
  const value = element.getAttribute(name);
  expect(value, name + ' must exist').not.toBeNull();
  return JSON.parse(value as string) as unknown;
}

describe('App', () => {
  it('renders the exact decorative video contract', () => {
    const { container } = render(<App />);
    const video = container.querySelector('video');

    expect(video).not.toBeNull();
    expect(video).toHaveAttribute('src', VIDEO_SOURCE);
    expect(video).toHaveAttribute('aria-hidden', 'true');
    expect(video).not.toHaveAttribute('controls');
    expect((video as HTMLVideoElement).autoplay).toBe(true);
    expect((video as HTMLVideoElement).muted).toBe(true);
    expect((video as HTMLVideoElement).loop).toBe(true);
    expect((video as HTMLVideoElement).playsInline).toBe(true);
  });

  it('preserves the exact heading, word spans, and semantic spaces', () => {
    render(<App />);

    const heading = screen.getByRole('heading', {
      level: 2,
      name: 'WE BUILD END-TO-END AI AUTOMATION SYSTEMS.',
    });
    const wordSpans = Array.from(heading.querySelectorAll(':scope > span'));

    expect(heading.textContent).toBe(
      'WE BUILD END-TO-END AI AUTOMATION SYSTEMS.',
    );
    expect(wordSpans.map((span) => span.textContent)).toEqual(HEADING_WORDS);
  });

  it('wires the exact stagger and paragraph motion configuration', () => {
    render(<App />);

    const heading = screen.getByRole('heading', { level: 2 });
    const wordSpans = Array.from(heading.querySelectorAll(':scope > span'));
    expect(HEADING_WORDS.map((_, index) => getWordDelay(index))).toEqual([
      0.15,
      0.23,
      0.31,
      0.39,
      0.47,
      0.55,
    ]);

    wordSpans.forEach((span, index) => {
      expect(readJsonAttribute(span, 'data-initial')).toEqual({
        opacity: 0,
        y: 32,
      });
      expect(readJsonAttribute(span, 'data-viewport')).toEqual({
        once: true,
        amount: 0.2,
      });
      expect(readJsonAttribute(span, 'data-transition')).toEqual({
        duration: 0.7,
        delay: getWordDelay(index),
        ease: [0.22, 1, 0.36, 1],
      });
    });

    const paragraph = screen.getByText(SUBTEXT);
    expect(paragraph.tagName).toBe('P');
    expect(readJsonAttribute(paragraph, 'data-initial')).toEqual({
      opacity: 0,
      y: 24,
    });
    expect(readJsonAttribute(paragraph, 'data-transition')).toEqual({
      duration: 0.7,
      delay: 0.9,
      ease: [0.22, 1, 0.36, 1],
    });
  });
});
~~~

- [ ] **Step 2: Run the test and confirm the missing-module bootstrap failure**

Run:

~~~bash
npm test -- src/App.test.tsx
~~~

Expected: FAIL because ./App and ./heroContent do not exist. Do not treat this transform error as the final red state.

- [ ] **Step 3: Add compile-only boundaries and verify the correct red state**

Create src/heroContent.ts:

~~~ts
export const VIDEO_SOURCE =
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260514_135830_bb6491d1-9b66-4aec-9722-13b4dfe3fb46.mp4';

export const HEADING_WORDS = [
  'WE',
  'BUILD',
  'END-TO-END',
  'AI',
  'AUTOMATION',
  'SYSTEMS.',
] as const;

export const SUBTEXT =
  'We provide all-in-one AI automation services in one place.';

export function getWordDelay(index: number) {
  return Number((0.15 + index * 0.08).toFixed(2));
}
~~~

Create src/App.tsx as an incomplete rendering stub:

~~~tsx
export default function App() {
  return <main aria-label="hero stub" />;
}
~~~

Run:

~~~bash
npm test -- src/App.test.tsx
~~~

Expected: FAIL at video existence and heading queries. This is the assertion-level red state.

- [ ] **Step 4: Implement the minimal static video and hero structure**

Replace src/App.tsx with:

~~~tsx
import { Fragment } from 'react';
import { FadeUp } from './components/FadeUp';
import {
  getWordDelay,
  HEADING_WORDS,
  SUBTEXT,
  VIDEO_SOURCE,
} from './heroContent';

export default function App() {
  return (
    <>
      <video
        className="fixed left-0 top-0 z-0 h-screen w-full object-cover"
        src={VIDEO_SOURCE}
        autoPlay
        muted
        loop
        playsInline
        aria-hidden="true"
      />

      <section className="relative z-[1] flex h-screen flex-col justify-center px-8 pb-8 pt-[70px] max-[900px]:px-[18px] max-[900px]:pb-8 max-[900px]:pt-[90px]">
        <div className="flex max-w-[720px] flex-col items-start">
          <h2 className="m-0 flex flex-wrap gap-[0.25em] text-[clamp(26px,3vw,42px)] font-bold uppercase leading-[1.08] tracking-[-0.01em] text-white">
            {HEADING_WORDS.map((word, index) => (
              <Fragment key={word}>
                <FadeUp as="span" delay={getWordDelay(index)} y={32}>
                  {word}
                </FadeUp>
                {index < HEADING_WORDS.length - 1 ? ' ' : null}
              </Fragment>
            ))}
          </h2>

          <FadeUp
            as="p"
            delay={0.9}
            className="m-0 mt-6 max-w-[260px] text-sm leading-[1.65] text-white/[0.85]"
          >
            {SUBTEXT}
          </FadeUp>
        </div>
      </section>
    </>
  );
}
~~~

- [ ] **Step 5: Run the focused and complete component suites**

Run:

~~~bash
npm test -- src/App.test.tsx
npm test
~~~

Expected: all three App tests, both FadeUp tests, and all toolchain tests PASS. The video test confirms DOM properties rather than only source text.

- [ ] **Step 6: Commit the tested hero component**

Run:

~~~bash
git add src/App.tsx src/App.test.tsx src/heroContent.ts
git commit -m "feat: add fixed video hero structure"
~~~

---

### Task 4: Wire the Runtime, Exact CSS, and Browser Acceptance

**Files:**
- Modify: index.html
- Create: src/main.tsx
- Create: src/index.css
- Create: playwright.config.ts
- Create: tests/e2e/hero.spec.ts
- Create: tests/e2e/media.spec.ts

**Interfaces:**
- Consumes: default App from src/App.tsx, the npm dev script, and the blank root shell.
- Produces: a browser-renderable local page, deterministic desktop/mobile acceptance, and a separately invoked external media diagnostic.

- [ ] **Step 1: Configure desktop and mobile browser projects**

Create playwright.config.ts:

~~~ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  use: {
    baseURL: 'http://127.0.0.1:4173',
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'npm run dev -- --port 4173',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: false,
    timeout: 120_000,
  },
  projects: [
    {
      name: 'chromium-desktop',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1440, height: 900 },
      },
    },
    {
      name: 'chromium-mobile',
      use: {
        ...devices['Pixel 5'],
        viewport: { width: 390, height: 844 },
      },
    },
  ],
});
~~~

Install the project-local Chromium binary:

~~~bash
npx playwright install chromium
~~~

- [ ] **Step 2: Write the failing computed-layout browser test**

Create tests/e2e/hero.spec.ts:

~~~ts
import { expect, test } from '@playwright/test';

const HEADING = 'WE BUILD END-TO-END AI AUTOMATION SYSTEMS.';
const VIDEO_HOST = 'https://d8j0ntlcm91z4.cloudfront.net/';
const FONT_HOST = 'https://db.onlinewebfonts.com/';

test('matches the fixed video hero contract', async ({ page }, testInfo) => {
  const applicationErrors: string[] = [];
  let videoRequestObserved = false;
  let fontImportObserved = false;
  await page.route(VIDEO_HOST + '**', (route) => {
    videoRequestObserved = true;
    return route.abort();
  });
  await page.route(FONT_HOST + '**', (route) => {
    fontImportObserved = true;
    return route.abort();
  });

  page.on('pageerror', (error) => {
    applicationErrors.push(error.message);
  });
  page.on('console', (message) => {
    if (message.type() === 'error') {
      const sourceUrl = message.location().url;
      const belongsToKnownExternalResource =
        sourceUrl.startsWith(VIDEO_HOST) || sourceUrl.startsWith(FONT_HOST);
      if (!belongsToKnownExternalResource) {
        applicationErrors.push(message.text());
      }
    }
  });

  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await expect(
    page.getByRole('heading', { level: 2, name: HEADING }),
  ).toBeVisible();

  await expect
    .poll(
      () =>
        page.locator('h2 > span, section p').evaluateAll((elements) =>
          elements.every((element) => {
            const style = getComputedStyle(element);
            if (style.opacity !== '1') {
              return false;
            }
            if (style.transform === 'none') {
              return true;
            }
            return Math.abs(new DOMMatrixReadOnly(style.transform).m42) < 0.5;
          }),
        ),
      { timeout: 4_000 },
    )
    .toBe(true);

  const metrics = await page.evaluate(() => {
    const video = document.querySelector('video') as HTMLVideoElement;
    const section = document.querySelector('section') as HTMLElement;
    const wrapper = section.firstElementChild as HTMLElement;
    const heading = document.querySelector('h2') as HTMLElement;
    const paragraph = document.querySelector('section p') as HTMLElement;

    const videoStyle = getComputedStyle(video);
    const sectionStyle = getComputedStyle(section);
    const wrapperStyle = getComputedStyle(wrapper);
    const headingStyle = getComputedStyle(heading);
    const paragraphStyle = getComputedStyle(paragraph);
    const videoRect = video.getBoundingClientRect();
    const sectionRect = section.getBoundingClientRect();

    return {
      viewport: { width: window.innerWidth, height: window.innerHeight },
      documentScrollWidth: document.documentElement.scrollWidth,
      video: {
        position: videoStyle.position,
        top: videoRect.top,
        left: videoRect.left,
        width: videoRect.width,
        height: videoRect.height,
        objectFit: videoStyle.objectFit,
        zIndex: videoStyle.zIndex,
      },
      section: {
        position: sectionStyle.position,
        zIndex: sectionStyle.zIndex,
        display: sectionStyle.display,
        flexDirection: sectionStyle.flexDirection,
        justifyContent: sectionStyle.justifyContent,
        height: sectionRect.height,
        backgroundColor: sectionStyle.backgroundColor,
        paddingTop: sectionStyle.paddingTop,
        paddingRight: sectionStyle.paddingRight,
        paddingBottom: sectionStyle.paddingBottom,
        paddingLeft: sectionStyle.paddingLeft,
      },
      wrapper: {
        display: wrapperStyle.display,
        flexDirection: wrapperStyle.flexDirection,
        alignItems: wrapperStyle.alignItems,
        maxWidth: wrapperStyle.maxWidth,
      },
      heading: {
        display: headingStyle.display,
        flexWrap: headingStyle.flexWrap,
        columnGap: headingStyle.columnGap,
        fontSize: headingStyle.fontSize,
        fontWeight: headingStyle.fontWeight,
        lineHeight: headingStyle.lineHeight,
        letterSpacing: headingStyle.letterSpacing,
        textTransform: headingStyle.textTransform,
        color: headingStyle.color,
        marginTop: headingStyle.marginTop,
        marginRight: headingStyle.marginRight,
        marginBottom: headingStyle.marginBottom,
        marginLeft: headingStyle.marginLeft,
        fontFamily: headingStyle.fontFamily,
      },
      paragraph: {
        marginTop: paragraphStyle.marginTop,
        fontSize: paragraphStyle.fontSize,
        lineHeight: paragraphStyle.lineHeight,
        color: paragraphStyle.color,
        maxWidth: paragraphStyle.maxWidth,
      },
    };
  });

  const isMobile = testInfo.project.name === 'chromium-mobile';
  const expectedHeadingSize = isMobile ? 26 : 42;

  expect(metrics.video.position).toBe('fixed');
  expect(metrics.video.top).toBeCloseTo(0, 1);
  expect(metrics.video.left).toBeCloseTo(0, 1);
  expect(metrics.video.width).toBeCloseTo(metrics.viewport.width, 1);
  expect(metrics.video.height).toBeCloseTo(metrics.viewport.height, 1);
  expect(metrics.video.objectFit).toBe('cover');
  expect(metrics.video.zIndex).toBe('0');

  expect(metrics.section.position).toBe('relative');
  expect(metrics.section.zIndex).toBe('1');
  expect(metrics.section.display).toBe('flex');
  expect(metrics.section.flexDirection).toBe('column');
  expect(metrics.section.justifyContent).toBe('center');
  expect(metrics.section.height).toBeCloseTo(metrics.viewport.height, 1);
  expect(metrics.section.backgroundColor).toBe('rgba(0, 0, 0, 0)');
  expect(metrics.section.paddingTop).toBe(isMobile ? '90px' : '70px');
  expect(metrics.section.paddingRight).toBe(isMobile ? '18px' : '32px');
  expect(metrics.section.paddingBottom).toBe('32px');
  expect(metrics.section.paddingLeft).toBe(isMobile ? '18px' : '32px');

  expect(metrics.wrapper).toEqual({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    maxWidth: '720px',
  });

  expect(metrics.heading.display).toBe('flex');
  expect(metrics.heading.flexWrap).toBe('wrap');
  expect(Number.parseFloat(metrics.heading.fontSize)).toBeCloseTo(
    expectedHeadingSize,
    1,
  );
  expect(Number.parseFloat(metrics.heading.columnGap)).toBeCloseTo(
    expectedHeadingSize * 0.25,
    1,
  );
  expect(metrics.heading.fontWeight).toBe('700');
  expect(Number.parseFloat(metrics.heading.lineHeight)).toBeCloseTo(
    expectedHeadingSize * 1.08,
    1,
  );
  expect(Number.parseFloat(metrics.heading.letterSpacing)).toBeCloseTo(
    expectedHeadingSize * -0.01,
    1,
  );
  expect(metrics.heading.textTransform).toBe('uppercase');
  expect(metrics.heading.color).toBe('rgb(255, 255, 255)');
  expect([
    metrics.heading.marginTop,
    metrics.heading.marginRight,
    metrics.heading.marginBottom,
    metrics.heading.marginLeft,
  ]).toEqual(['0px', '0px', '0px', '0px']);
  expect(metrics.heading.fontFamily).toContain('Helvetica Now Var');

  expect(metrics.paragraph.marginTop).toBe('24px');
  expect(metrics.paragraph.fontSize).toBe('14px');
  expect(Number.parseFloat(metrics.paragraph.lineHeight)).toBeCloseTo(23.1, 1);
  expect(metrics.paragraph.color).toBe('rgba(255, 255, 255, 0.85)');
  expect(metrics.paragraph.maxWidth).toBe('260px');
  expect(metrics.documentScrollWidth).toBeLessThanOrEqual(metrics.viewport.width);
  expect(videoRequestObserved).toBe(true);
  expect(fontImportObserved).toBe(true);

  const beforeScroll = await page.locator('video').boundingBox();
  await page.evaluate(() => {
    const spacer = document.createElement('div');
    spacer.setAttribute('data-test-spacer', '');
    spacer.style.height = '100vh';
    document.body.append(spacer);
    window.scrollTo(0, window.innerHeight);
  });
  const afterScroll = await page.locator('video').boundingBox();

  expect(beforeScroll).not.toBeNull();
  expect(afterScroll).not.toBeNull();
  expect(afterScroll?.x).toBeCloseTo(beforeScroll?.x ?? 0, 1);
  expect(afterScroll?.y).toBeCloseTo(beforeScroll?.y ?? 0, 1);
  expect(afterScroll?.width).toBeCloseTo(beforeScroll?.width ?? 0, 1);
  expect(afterScroll?.height).toBeCloseTo(beforeScroll?.height ?? 0, 1);
  expect(applicationErrors).toEqual([]);
});
~~~

- [ ] **Step 3: Write the separately invoked playback diagnostic**

Create tests/e2e/media.spec.ts before runtime wiring:

~~~ts
import { expect, test } from '@playwright/test';

test('@external remote background video loads and advances', async ({ page }) => {
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
~~~

- [ ] **Step 4: Run the deterministic browser test and verify the red state**

Run:

~~~bash
npm run test:e2e
~~~

Expected: FAIL because the blank Vite shell has no mounted heading or video. The server must start successfully; a server-start timeout is a harness problem to fix before continuing.

- [ ] **Step 5: Add the runtime entry and exact global stylesheet**

Modify the index.html body to:

~~~html
<body>
  <div id="root"></div>
  <script type="module" src="/src/main.tsx"></script>
</body>
~~~

Create src/main.tsx:

~~~tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
~~~

Create src/index.css:

~~~css
@import url('https://db.onlinewebfonts.com/c/e66905e07608167a84e6ad52f638c3c6?family=Helvetica+Now+Var');

@tailwind base;
@tailwind components;
@tailwind utilities;

* {
  box-sizing: border-box;
  font-family: 'Helvetica Now Var', 'Helvetica Neue', Helvetica, Arial, sans-serif;
}

html,
body,
#root {
  width: 100%;
  min-height: 100%;
}

body {
  margin: 0;
  background-color: #000;
}
~~~

- [ ] **Step 6: Run the deterministic browser suite and production build**

Run:

~~~bash
npm run test:e2e
npm run build
~~~

Expected: both browser projects PASS the computed-layout test; the build exits 0 and emits dist without TypeScript errors. If Tailwind omits an arbitrary value, fix the production class and rerun the complete browser command rather than weakening the assertion.

- [ ] **Step 7: Run the external media diagnostic and record the fact**

Run:

~~~bash
npm run test:media
~~~

Expected when the CDN and browser allow playback: PASS with a media-observation showing loaded true, readyState at least 2, paused false, no media/play error, and advancing or looping currentTime.

If the CDN, network, codec, or autoplay environment prevents playback, retain the exact source and attributes. Preserve the failure output for the final report and distinguish “application configuration verified” from “remote playback not observed.”

- [ ] **Step 8: Run the complete deterministic regression**

Run:

~~~bash
npm test
npm run test:e2e
npm run build
~~~

Expected: all deterministic component and browser tests PASS and the build exits 0.

- [ ] **Step 9: Commit runtime, styles, and browser acceptance**

Run:

~~~bash
git add index.html src/main.tsx src/index.css playwright.config.ts tests/e2e
git commit -m "feat: complete animated video hero"
~~~

---

### Task 5: Perform Final Evidence-Based Verification and Local Handoff

**Files:**
- Verify only; no product file changes are expected.

**Interfaces:**
- Consumes: all npm scripts and the completed Vite application.
- Produces: fresh test/build/dependency/browser evidence, a running local preview, and a report separating external playback from deterministic application results.

- [ ] **Step 1: Verify the complete deterministic suite**

Run from the repository root:

~~~bash
npm test
npm run test:e2e
npm run build
~~~

Expected: every Vitest test passes, both Playwright layout projects pass, and the production build exits 0. Read the full output and report exact passed-test counts.

- [ ] **Step 2: Verify dependency majors and the lockfile**

Run:

~~~bash
npm ls --depth=0 react react-dom framer-motion tailwindcss vite
test -s package-lock.json
~~~

Expected: React/React DOM resolve to 18.x, Framer Motion to 12.x, Tailwind CSS to 3.x, Vite resolves directly, and package-lock.json is non-empty.

- [ ] **Step 3: Re-run external media observation separately**

Run:

~~~bash
npm run test:media
~~~

Expected: report the exact observation. A pass proves the remote file loaded and advanced during this run; a failure remains an external-runtime limitation and is not rewritten as a pass.

- [ ] **Step 4: Check repository hygiene and requirement coverage**

Run:

~~~bash
git diff --check
git status --short --branch
~~~

Expected: no whitespace errors and no unexplained source changes. Re-read all ten acceptance criteria in docs/superpowers/specs/2026-09-02-fixed-video-hero-design.md and map each one to fresh command or browser evidence.

- [ ] **Step 5: Start and hand off the local preview**

Start the retained server:

~~~bash
npm run dev -- --port 4173
~~~

From a second command, verify the exact printed URL:

~~~bash
curl --fail --silent --show-error http://127.0.0.1:4173/ --output /dev/null
~~~

Expected: curl exits 0. Open http://127.0.0.1:4173/ in the Codex preview only after compilation and the request succeed. Keep the server running for the user unless teardown is required.

- [ ] **Step 6: Deliver the evidence-backed result**

Report:

- The local preview URL.
- Exact Vitest, Playwright, and build results.
- Resolved React, React DOM, Tailwind, Framer Motion, and Vite versions.
- Whether the remote video loaded and advanced during the final observation.
- Any external limitation without presenting it as application success.
- The key implementation files as clickable absolute paths.
