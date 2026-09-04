import { useEffect, useRef } from 'react';
import {
  FINE_POINTER_QUERY,
  REDUCED_MOTION_QUERY,
  subscribeToMediaQuery,
} from '../utils/mediaQuery';

const INTERACTIVE_SELECTOR =
  'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), summary, [role="button"], [data-cursor-interactive]';
const RING_FOLLOW_RATE = 0.18;
const AURA_FOLLOW_RATE = 0.08;
const RING_SETTLE_DISTANCE = 0.2;
const FULL_STRETCH_DISTANCE = 360;
const MAX_HORIZONTAL_STRETCH = 0.34;
const MAX_VERTICAL_SQUASH = 0.08;

function formatPosition(value: number) {
  return `${Number(value.toFixed(2))}px`;
}

function formatScale(value: number) {
  return String(Number(value.toFixed(3)));
}

function isInteractiveTarget(target: EventTarget | null) {
  return target instanceof Element && target.closest(INTERACTIVE_SELECTOR) !== null;
}

export function CustomCursor() {
  const cursorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const cursor = cursorRef.current;

    if (!cursor || typeof window.matchMedia !== 'function') {
      return;
    }

    const pointerCapability = window.matchMedia(FINE_POINTER_QUERY);
    const reducedMotionPreference = window.matchMedia(REDUCED_MOTION_QUERY);
    let animationFrame: number | null = null;
    let hasPosition = false;
    let targetX = 0;
    let targetY = 0;
    let ringX = 0;
    let ringY = 0;
    let auraX = 0;
    let auraY = 0;

    const canUseCustomCursor = () =>
      pointerCapability.matches && !reducedMotionPreference.matches;

    const applyRingPosition = () => {
      cursor.style.setProperty('--cursor-ring-x', formatPosition(ringX));
      cursor.style.setProperty('--cursor-ring-y', formatPosition(ringY));
    };

    const applyAuraPosition = () => {
      cursor.style.setProperty('--cursor-aura-x', formatPosition(auraX));
      cursor.style.setProperty('--cursor-aura-y', formatPosition(auraY));
    };

    const applyRingShape = (deltaX = 0, deltaY = 0) => {
      const distance = Math.hypot(deltaX, deltaY);
      const intensity = Math.min(1, distance / FULL_STRETCH_DISTANCE);
      cursor.style.setProperty(
        '--cursor-ring-stretch-x',
        formatScale(1 + intensity * MAX_HORIZONTAL_STRETCH),
      );
      cursor.style.setProperty(
        '--cursor-ring-stretch-y',
        formatScale(1 - intensity * MAX_VERTICAL_SQUASH),
      );
      cursor.style.setProperty(
        '--cursor-ring-rotation',
        `${Number(((Math.atan2(deltaY, deltaX) * 180) / Math.PI).toFixed(2))}deg`,
      );
      cursor.dataset.moving = String(!(
        Math.abs(deltaX) <= RING_SETTLE_DISTANCE &&
        Math.abs(deltaY) <= RING_SETTLE_DISTANCE
      ));
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
      const auraDeltaX = targetX - auraX;
      const auraDeltaY = targetY - auraY;
      const ringIsSettled =
        Math.abs(deltaX) <= RING_SETTLE_DISTANCE &&
        Math.abs(deltaY) <= RING_SETTLE_DISTANCE;
      const auraIsSettled =
        Math.abs(auraDeltaX) <= RING_SETTLE_DISTANCE &&
        Math.abs(auraDeltaY) <= RING_SETTLE_DISTANCE;

      if (ringIsSettled && auraIsSettled) {
        ringX = targetX;
        ringY = targetY;
        auraX = targetX;
        auraY = targetY;
        applyRingPosition();
        applyAuraPosition();
        applyRingShape();
        animationFrame = null;
        return;
      }

      if (!ringIsSettled) {
        ringX += deltaX * RING_FOLLOW_RATE;
        ringY += deltaY * RING_FOLLOW_RATE;
      }
      if (!auraIsSettled) {
        auraX += auraDeltaX * AURA_FOLLOW_RATE;
        auraY += auraDeltaY * AURA_FOLLOW_RATE;
      }
      applyRingPosition();
      applyAuraPosition();
      applyRingShape(
        ringIsSettled ? 0 : targetX - ringX,
        ringIsSettled ? 0 : targetY - ringY,
      );
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
      cursor.dataset.pressed = 'false';
      applyRingShape();
      delete document.documentElement.dataset.customCursor;
    };

    const disableCustomCursor = () => {
      cursor.dataset.enabled = 'false';
      hideCursor();
      delete document.documentElement.dataset.customCursor;
    };

    const syncPointerCapability = () => {
      const isEnabled = canUseCustomCursor();

      if (isEnabled) {
        cursor.dataset.enabled = 'true';
        return;
      }

      disableCustomCursor();
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
      document.documentElement.dataset.customCursor = 'ready';

      if (!hasPosition) {
        hasPosition = true;
        ringX = targetX;
        ringY = targetY;
        auraX = targetX;
        auraY = targetY;
        applyRingPosition();
        applyAuraPosition();
        applyRingShape();
        return;
      }

      scheduleRingAnimation();
    };

    const handlePointerOut = (event: PointerEvent) => {
      if (event.relatedTarget === null) {
        hideCursor();
      }
    };

    const handlePointerDown = (event: PointerEvent) => {
      if (event.pointerType !== 'mouse' || !canUseCustomCursor()) {
        return;
      }

      cursor.dataset.interactive = String(isInteractiveTarget(event.target));
      cursor.dataset.pressed = 'true';
    };

    const handlePointerUp = (event: PointerEvent) => {
      if (event.pointerType === 'mouse') {
        cursor.dataset.pressed = 'false';
      }
    };

    const unsubscribePointerCapability = subscribeToMediaQuery(
      pointerCapability,
      syncPointerCapability,
    );
    const unsubscribeReducedMotion = subscribeToMediaQuery(
      reducedMotionPreference,
      syncPointerCapability,
    );

    if (!unsubscribePointerCapability || !unsubscribeReducedMotion) {
      unsubscribePointerCapability?.();
      unsubscribeReducedMotion?.();
      disableCustomCursor();
      return;
    }

    try {
      window.addEventListener('pointermove', handlePointerMove, {
        passive: true,
      });
      window.addEventListener('pointerout', handlePointerOut);
      window.addEventListener('pointerdown', handlePointerDown);
      window.addEventListener('pointerup', handlePointerUp);
      window.addEventListener('pointercancel', handlePointerUp);
      window.addEventListener('blur', hideCursor);
    } catch {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerout', handlePointerOut);
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);
      window.removeEventListener('blur', hideCursor);
      unsubscribePointerCapability();
      unsubscribeReducedMotion();
      disableCustomCursor();
      return;
    }

    syncPointerCapability();

    return () => {
      stopRingAnimation();
      unsubscribePointerCapability();
      unsubscribeReducedMotion();
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerout', handlePointerOut);
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);
      window.removeEventListener('blur', hideCursor);
      disableCustomCursor();
    };
  }, []);

  return (
    <div
      ref={cursorRef}
      className="custom-cursor"
      data-custom-cursor-layer=""
      data-enabled="false"
      data-interactive="false"
      data-moving="false"
      data-pressed="false"
      data-visible="false"
      aria-hidden="true"
    >
      <span className="custom-cursor-dot" data-cursor-dot="" />
      <span className="custom-cursor-aura" data-cursor-aura="" />
      <span className="custom-cursor-ring" data-cursor-ring="" />
    </div>
  );
}
