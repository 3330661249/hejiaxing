import { useEffect, useRef } from 'react';
import { useReducedMotion } from 'framer-motion';

const POINTER_CAPABILITY_QUERY = '(hover: hover) and (pointer: fine)';
const INTERACTIVE_SELECTOR =
  'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), summary, [role="button"], [data-cursor-interactive]';
const RING_FOLLOW_RATE = 0.18;
const RING_SETTLE_DISTANCE = 0.2;

function formatPosition(value: number) {
  return `${Number(value.toFixed(2))}px`;
}

function isInteractiveTarget(target: EventTarget | null) {
  return target instanceof Element && target.closest(INTERACTIVE_SELECTOR) !== null;
}

export function CustomCursor() {
  const cursorRef = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    const cursor = cursorRef.current;

    if (!cursor || typeof window.matchMedia !== 'function') {
      return;
    }

    const pointerCapability = window.matchMedia(POINTER_CAPABILITY_QUERY);
    let animationFrame: number | null = null;
    let hasPosition = false;
    let targetX = 0;
    let targetY = 0;
    let ringX = 0;
    let ringY = 0;

    const canUseCustomCursor = () =>
      pointerCapability.matches && !shouldReduceMotion;

    const applyRingPosition = () => {
      cursor.style.setProperty('--cursor-ring-x', formatPosition(ringX));
      cursor.style.setProperty('--cursor-ring-y', formatPosition(ringY));
    };

    const stopRingAnimation = () => {
      if (animationFrame !== null) {
        window.cancelAnimationFrame(animationFrame);
        animationFrame = null;
      }
    };

    const animateRing = () => {
      const deltaX = targetX - ringX;
      const deltaY = targetY - ringY;

      if (
        Math.abs(deltaX) <= RING_SETTLE_DISTANCE &&
        Math.abs(deltaY) <= RING_SETTLE_DISTANCE
      ) {
        ringX = targetX;
        ringY = targetY;
        applyRingPosition();
        animationFrame = null;
        return;
      }

      ringX += deltaX * RING_FOLLOW_RATE;
      ringY += deltaY * RING_FOLLOW_RATE;
      applyRingPosition();
      animationFrame = window.requestAnimationFrame(animateRing);
    };

    const scheduleRingAnimation = () => {
      if (animationFrame === null) {
        animationFrame = window.requestAnimationFrame(animateRing);
      }
    };

    const hideCursor = () => {
      stopRingAnimation();
      hasPosition = false;
      cursor.dataset.visible = 'false';
      cursor.dataset.interactive = 'false';
    };

    const syncPointerCapability = () => {
      const isEnabled = canUseCustomCursor();
      cursor.dataset.enabled = String(isEnabled);

      if (isEnabled) {
        document.documentElement.dataset.customCursor = 'ready';
        return;
      }

      hideCursor();
      delete document.documentElement.dataset.customCursor;
    };

    const handlePointerMove = (event: PointerEvent) => {
      if (event.pointerType !== 'mouse' || !canUseCustomCursor()) {
        return;
      }

      targetX = event.clientX;
      targetY = event.clientY;
      cursor.style.setProperty('--cursor-x', formatPosition(targetX));
      cursor.style.setProperty('--cursor-y', formatPosition(targetY));
      cursor.dataset.visible = 'true';
      cursor.dataset.interactive = String(isInteractiveTarget(event.target));

      if (!hasPosition) {
        hasPosition = true;
        ringX = targetX;
        ringY = targetY;
        applyRingPosition();
        return;
      }

      scheduleRingAnimation();
    };

    const handlePointerOut = (event: PointerEvent) => {
      if (event.relatedTarget === null) {
        hideCursor();
      }
    };

    syncPointerCapability();
    pointerCapability.addEventListener('change', syncPointerCapability);
    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    window.addEventListener('pointerout', handlePointerOut);
    window.addEventListener('blur', hideCursor);

    return () => {
      stopRingAnimation();
      pointerCapability.removeEventListener('change', syncPointerCapability);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerout', handlePointerOut);
      window.removeEventListener('blur', hideCursor);
      delete document.documentElement.dataset.customCursor;
    };
  }, [shouldReduceMotion]);

  return (
    <div
      ref={cursorRef}
      className="custom-cursor"
      data-custom-cursor=""
      data-enabled="false"
      data-interactive="false"
      data-visible="false"
      aria-hidden="true"
    >
      <span className="custom-cursor-dot" data-cursor-dot="" />
      <span className="custom-cursor-ring" data-cursor-ring="" />
    </div>
  );
}
