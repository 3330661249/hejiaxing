# Fixed Video Hero Design

Date: 2026-09-02

## Objective

Create a local, single-route React site whose only visible experience is one full-viewport, transparent hero section over a fixed background video. The implementation must reproduce the supplied copy, layout, typography, motion timings, breakpoint, and video behavior without adding navigation, controls, overlays, gradients, decorative elements, or additional sections.

## Scope

The repository is currently empty apart from Git metadata, so the work includes initializing the requested frontend toolchain and implementing the page from scratch.

Included:

- React 18 with TypeScript and Vite.
- Tailwind CSS 3 for layout and responsive utility classes.
- Framer Motion 12 for the reusable `FadeUp` component and viewport-triggered animation.
- A single fixed background video using the exact supplied source URL.
- A single transparent, full-viewport foreground section containing the supplied heading and paragraph.
- Automated component tests, production-build verification, and desktop/mobile browser acceptance checks.
- A local development preview.

Excluded:

- Additional routes, navigation, calls to action, forms, or content sections.
- Video controls, audio, overlays, gradients, tint layers, posters, or replacement media.
- Analytics, data persistence, APIs, authentication, or client-side state.
- Remote repository creation, pushing, pull requests, deployment, or hosting.

## Technical Approach

Use a small component-based Vite application:

- `src/main.tsx` mounts the React application.
- `src/App.tsx` owns the page structure, video element, content wrapper, heading word mapping, and paragraph.
- `src/components/FadeUp.tsx` implements the reusable Framer Motion wrapper with the exact API and defaults supplied in the request.
- `src/index.css` contains the font import, Tailwind directives, box-sizing/reset rules, page fallback color, and any small global rules that are clearer in CSS than in utility classes.
- Tailwind arbitrary-value utilities express the exact viewport dimensions, padding, typography, width constraints, stacking, and `900px` responsive breakpoint.

The manifest must constrain `react` and `react-dom` to major version 18, `tailwindcss` to major version 3, and `framer-motion` to major version 12. The npm lockfile is committed so a clean install resolves the same dependency graph.

The application has no runtime data flow or mutable state. Static content is rendered immediately. Framer Motion observes each `FadeUp` instance and starts its animation when the element enters the viewport.

## Page Structure

The application root renders two sibling elements in this order:

1. A decorative `<video>` element fixed behind the page.
2. A semantic `<section>` containing the foreground content.

The video uses:

- Source: `https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260514_135830_bb6491d1-9b66-4aec-9722-13b4dfe3fb46.mp4`
- `autoPlay`
- `muted`
- `loop`
- `playsInline`
- `aria-hidden="true"`
- `position: fixed`
- `top: 0`
- `left: 0`
- `width: 100%`
- `height: 100vh`
- `object-fit: cover`
- `z-index: 0`

No controls are rendered. The video is excluded from the accessibility tree because it is decorative and has no information that is not also present in the foreground content.

The foreground section uses:

- `position: relative`
- `z-index: 1`
- `display: flex`
- `flex-direction: column`
- `justify-content: center`
- `height: 100vh`
- `padding: 70px 32px 32px`
- No background declaration of any kind

Global `box-sizing: border-box` ensures the section remains exactly one viewport high after padding is applied.

At viewport widths of `900px` or less, the section padding becomes `90px 18px 32px`.

## Content and Typography

The section contains one wrapper with:

- `display: flex`
- `flex-direction: column`
- `align-items: flex-start`
- `max-width: 720px`

The `<h2>` text is:

`WE BUILD END-TO-END AI AUTOMATION SYSTEMS.`

It is split into these six word spans in this exact order:

1. `WE`
2. `BUILD`
3. `END-TO-END`
4. `AI`
5. `AUTOMATION`
6. `SYSTEMS.`

Literal whitespace text nodes are rendered between adjacent word spans. They do not create visible flex items, so visual spacing continues to come from `gap: 0.25em`, while the heading's DOM text and accessible name remain the exact sentence with spaces. Component tests assert both the six span values and the complete heading text.

The heading uses:

- `display: flex`
- `flex-wrap: wrap`
- `gap: 0.25em`
- `font-size: clamp(26px, 3vw, 42px)`
- `font-weight: 700`
- `line-height: 1.08`
- `letter-spacing: -0.01em`
- `text-transform: uppercase`
- `color: #fff`
- `margin: 0`

The paragraph text is:

`We provide all-in-one AI automation services in one place.`

It uses:

- `margin-top: 24px`
- `font-size: 14px`
- `line-height: 1.65`
- `color: rgba(255, 255, 255, 0.85)`
- `max-width: 260px`
- Default paragraph margins removed except for the requested top margin

The global font stack is:

```css
@import url('https://db.onlinewebfonts.com/c/e66905e07608167a84e6ad52f638c3c6?family=Helvetica+Now+Var');

* {
  font-family: 'Helvetica Now Var', 'Helvetica Neue', Helvetica, Arial, sans-serif;
}
```

The page and application root occupy the full available width and height. The browser's default body margin is removed. The page bottom layer may use black as a fallback when the remote video cannot be decoded or loaded; the foreground section remains transparent.

## Animation

`FadeUp` accepts the exact supplied props:

- `children`
- `delay`
- `duration`
- `y`
- `className`
- `style`
- `as`
- `once`

The public TypeScript contract remains exactly:

```tsx
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
```

The component resolves the requested semantic tag through `motion[as]`, forwards `className` and `style` directly to the motion element, and renders `children` unchanged. It does not add ref forwarding or arbitrary HTML-attribute forwarding because those capabilities are absent from the supplied API.

Defaults:

- `delay = 0`
- `duration = 0.7`
- `y = 24`
- `as = 'div'`
- `once = true`

Every animation uses:

- Initial state: `{ opacity: 0, y }`
- `whileInView`: `{ opacity: 1, y: 0 }`
- `viewport`: `{ once, amount: 0.2 }`
- `transition`: `{ duration, delay, ease: [0.22, 1, 0.36, 1] }`

Each heading word uses `FadeUp` rendered as a `span`, `y={32}`, and `duration={0.7}`. Word delay is calculated as:

`0.15 + index * 0.08`

This produces:

- Word 1: `0.15s`
- Word 2: `0.23s`
- Word 3: `0.31s`
- Word 4: `0.39s`
- Word 5: `0.47s`
- Word 6: `0.55s`

The paragraph uses `FadeUp` rendered as a `p`, with `delay={0.9}`, `duration={0.7}`, and the default `y={24}`.

## Error and Fallback Behavior

There is no interactive error state because adding one would alter the supplied composition. If the remote font fails, the browser moves through the declared Helvetica/Arial fallback stack. If the video cannot load or autoplay, the `body` background color remains visible behind the white copy. This fallback is not a layer: it must not be implemented as an overlay, tint, poster, pseudo-element, or section background, and it must never cover a successfully rendered video.

Media availability is external to the application. Verification will therefore distinguish between:

- The application rendering the correct source and playback attributes.
- The remote media successfully loading and advancing in the current browser session.

## Testing Strategy

Implementation follows a red-green-refactor sequence.

Component-level tests will first fail against the empty project, then cover:

- The video element and exact source URL.
- `autoplay`, `muted`, `loop`, and inline-playback properties.
- The section, heading, and paragraph semantic structure.
- The exact heading word order and paragraph copy.
- The six computed word delays.
- The paragraph delay and requested `FadeUp` configuration where it can be asserted without replacing Framer Motion's actual behavior with a mock.
- The manifest's React 18, Tailwind CSS 3, and Framer Motion 12 constraints.

Browser acceptance checks will cover desktop and mobile viewports and verify:

- The video's computed fixed position, viewport dimensions, stacking order, and `object-fit` value.
- The section's computed `100vh` height and transparent background.
- Desktop padding and the `900px` mobile padding switch.
- Heading wrapping without horizontal overflow.
- Wrapper flex direction, start alignment, and `720px` maximum width.
- Heading font size at representative viewport widths, `700` weight, `1.08` line height, `-0.01em` letter spacing, uppercase rendering, white color, zero margin, flex wrapping, and `0.25em` gap.
- Paragraph `24px` top margin, `14px` font size, `1.65` line height, `rgba(255, 255, 255, 0.85)` color, and `260px` maximum width.
- The resolved Helvetica Now Var-first font stack, with the stylesheet import present in the built page.
- Visible final animation state after the in-view transitions complete.
- Absence of console errors caused by the application.
- Remote video readiness and advancing `currentTime`, reported separately from deterministic application tests.

Final verification consists of the complete component test command, the production build, dependency-tree inspection, lockfile presence, and the browser acceptance checks. No completion claim will be made solely from configuration or build output.

## Acceptance Criteria

The feature is accepted when all of the following are true:

1. The local application starts and renders a single full-viewport hero.
2. The specified video is fixed behind all foreground content and configured to autoplay muted, loop, and play inline.
3. The foreground section has no background and remains exactly one viewport high at desktop and mobile sizes.
4. All heading and paragraph content, typography values, widths, spacing, and colors match the supplied specification.
5. All six heading words animate independently with the specified stagger, duration, movement, easing, and once-only viewport trigger.
6. The paragraph animates with its specified delay and movement.
7. The mobile padding changes at a maximum width of `900px`.
8. Automated tests and the production build pass from a clean project state.
9. Browser acceptance confirms the computed layout and final animation state; remote playback status is reported based on direct observation.
10. The manifest and resolved dependency tree use React 18, Tailwind CSS 3, and Framer Motion 12, and the repository contains the npm lockfile.
