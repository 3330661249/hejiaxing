import { useEffect, useRef, useState } from 'react';
import { VIDEO_SOURCE } from '../content/resume';
import {
  FINE_POINTER_QUERY,
  REDUCED_MOTION_QUERY,
  subscribeToMediaQuery,
} from '../utils/mediaQuery';

const HORIZONTAL_SHIFT_RANGE = 60;
const VERTICAL_SHIFT_RANGE = 32;
const LENS_FADE_START = 0.48;
const LENS_FADE_END = 0.82;
const SHIFT_FOLLOW_RATE = 0.18;
const LENS_FOLLOW_RATE = 0.22;
const OPACITY_FOLLOW_RATE = 0.16;
const LENS_RESTING_STRENGTH = 0.78;
const LENS_MOTION_BOOST = 1 - LENS_RESTING_STRENGTH;
const FULL_MOTION_SPEED = 1.6;
const MOTION_ENERGY_DECAY_PER_MS = 1 / 360;
const DEFAULT_FRAME_DURATION = 1000 / 60;
const MAX_FRAME_DURATION = 32;

function smoothstep(start: number, end: number, value: number) {
  const progress = Math.min(1, Math.max(0, (value - start) / (end - start)));
  return progress * progress * (3 - 2 * progress);
}

function easeToward(
  current: number,
  target: number,
  rate: number,
  settleDistance: number,
) {
  const distance = target - current;
  return Math.abs(distance) <= settleDistance
    ? target
    : current + distance * rate;
}

type BackgroundVisualState = {
  shiftX: number;
  shiftY: number;
  lensX: number;
  lensY: number;
  lensOpacity: number;
};

const CENTERED_VISUAL_STATE: BackgroundVisualState = {
  shiftX: 0,
  shiftY: 0,
  lensX: 50,
  lensY: 50,
  lensOpacity: 0,
};

export function BackgroundVideo() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const mediaStateRef = useRef<'loading' | 'ready' | 'failed'>('loading');
  const [mediaState, setMediaState] = useState<'loading' | 'ready' | 'failed'>(
    'loading',
  );
  const [pointerMotionEnabled, setPointerMotionEnabled] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    const overlay = overlayRef.current;

    if (!video || !overlay) {
      return;
    }

    let animationFrame: number | null = null;
    let currentState = { ...CENTERED_VISUAL_STATE };
    let targetState = { ...CENTERED_VISUAL_STATE };
    let lensBaseOpacity = 0;
    let motionEnergy = 0;
    let lastPointerX: number | null = null;
    let lastPointerY: number | null = null;
    let lastPointerTime: number | null = null;
    let lastAnimationTime: number | null = null;

    const formatUnit = (value: number, unit: 'px' | '%') =>
      `${Number(value.toFixed(2))}${unit}`;

    const applyVisualState = (state: BackgroundVisualState) => {
      video.style.setProperty(
        '--background-shift-x',
        formatUnit(state.shiftX, 'px'),
      );
      video.style.setProperty(
        '--background-shift-y',
        formatUnit(state.shiftY, 'px'),
      );
      overlay.style.setProperty(
        '--background-lens-x',
        formatUnit(state.lensX, '%'),
      );
      overlay.style.setProperty(
        '--background-lens-y',
        formatUnit(state.lensY, '%'),
      );
      overlay.style.setProperty(
        '--background-lens-opacity',
        String(state.lensOpacity),
      );
    };

    const applyMotionEnergy = () => {
      overlay.style.setProperty(
        '--background-motion-energy',
        String(Number(motionEnergy.toFixed(3))),
      );
    };

    const clearMotionEnergy = () => {
      motionEnergy = 0;
      lastPointerX = null;
      lastPointerY = null;
      lastPointerTime = null;
      applyMotionEnergy();
    };

    const animateVisualState = (timestamp: number) => {
      const elapsed =
        lastAnimationTime === null
          ? DEFAULT_FRAME_DURATION
          : Math.min(
              MAX_FRAME_DURATION,
              Math.max(0, timestamp - lastAnimationTime),
            );
      lastAnimationTime = timestamp;
      currentState = {
        shiftX: easeToward(
          currentState.shiftX,
          targetState.shiftX,
          SHIFT_FOLLOW_RATE,
          0.04,
        ),
        shiftY: easeToward(
          currentState.shiftY,
          targetState.shiftY,
          SHIFT_FOLLOW_RATE,
          0.04,
        ),
        lensX: easeToward(
          currentState.lensX,
          targetState.lensX,
          LENS_FOLLOW_RATE,
          0.04,
        ),
        lensY: easeToward(
          currentState.lensY,
          targetState.lensY,
          LENS_FOLLOW_RATE,
          0.04,
        ),
        lensOpacity: easeToward(
          currentState.lensOpacity,
          targetState.lensOpacity,
          OPACITY_FOLLOW_RATE,
          0.002,
        ),
      };
      applyVisualState(currentState);

      if (motionEnergy > 0) {
        motionEnergy = Math.max(
          0,
          motionEnergy - MOTION_ENERGY_DECAY_PER_MS * elapsed,
        );
        applyMotionEnergy();
        targetState = {
          ...targetState,
          lensOpacity:
            lensBaseOpacity *
            (LENS_RESTING_STRENGTH + LENS_MOTION_BOOST * motionEnergy),
        };
      }

      const isSettled =
        currentState.shiftX === targetState.shiftX &&
        currentState.shiftY === targetState.shiftY &&
        currentState.lensX === targetState.lensX &&
        currentState.lensY === targetState.lensY &&
        currentState.lensOpacity === targetState.lensOpacity &&
        motionEnergy === 0;

      if (isSettled) {
        animationFrame = null;
        lastAnimationTime = null;
      } else {
        animationFrame = window.requestAnimationFrame(animateVisualState);
      }
    };

    const scheduleVisualState = (state: BackgroundVisualState) => {
      targetState = state;
      if (animationFrame === null) {
        lastAnimationTime = null;
        animationFrame = window.requestAnimationFrame(animateVisualState);
      }
    };

    applyVisualState(CENTERED_VISUAL_STATE);
    applyMotionEnergy();

    if (typeof window.matchMedia !== 'function') {
      setPointerMotionEnabled(false);
      return;
    }

    const pointerMotionQuery = window.matchMedia(FINE_POINTER_QUERY);
    const reducedMotionQuery = window.matchMedia(REDUCED_MOTION_QUERY);
    let wasReducedMotion = reducedMotionQuery.matches;
    const canUsePointerMotion = () =>
      pointerMotionQuery.matches && !reducedMotionQuery.matches;

    const syncPointerCapability = () => {
      const isReducedMotion = reducedMotionQuery.matches;
      const isEnabled = canUsePointerMotion();
      setPointerMotionEnabled(isEnabled);
      if (isReducedMotion) {
        video.pause();
      } else if (wasReducedMotion) {
        try {
          void video.play().catch(() => undefined);
        } catch {
          // Autoplay can be unavailable; the static poster remains usable.
        }
      }
      wasReducedMotion = isReducedMotion;
      if (!isEnabled) {
        lensBaseOpacity = 0;
        clearMotionEnergy();
        scheduleVisualState(CENTERED_VISUAL_STATE);
      }
    };

    const handlePointerMove = (event: PointerEvent) => {
      if (event.pointerType !== 'mouse' || !canUsePointerMotion()) {
        return;
      }

      const width = Math.max(window.innerWidth, 1);
      const height = Math.max(window.innerHeight, 1);
      const horizontalProgress = Math.min(
        1,
        Math.max(0, event.clientX / width),
      );
      const verticalProgress = Math.min(
        1,
        Math.max(0, event.clientY / height),
      );
      if (
        lastPointerX !== null &&
        lastPointerY !== null &&
        lastPointerTime !== null
      ) {
        const travelDistance = Math.hypot(
          event.clientX - lastPointerX,
          event.clientY - lastPointerY,
        );
        const elapsedSincePointer = event.timeStamp - lastPointerTime;
        if (elapsedSincePointer > 0) {
          const pointerSpeed =
            travelDistance / Math.max(8, elapsedSincePointer);
          motionEnergy = Math.max(
            motionEnergy,
            Math.min(1, pointerSpeed / FULL_MOTION_SPEED),
          );
        }
      }
      lastPointerX = event.clientX;
      lastPointerY = event.clientY;
      lastPointerTime = event.timeStamp;
      applyMotionEnergy();
      lensBaseOpacity =
        mediaStateRef.current === 'ready'
          ? smoothstep(LENS_FADE_START, LENS_FADE_END, horizontalProgress)
          : 0;

      scheduleVisualState({
        shiftX: (0.5 - horizontalProgress) * HORIZONTAL_SHIFT_RANGE,
        shiftY: (0.5 - verticalProgress) * VERTICAL_SHIFT_RANGE,
        lensX: horizontalProgress * 100,
        lensY: verticalProgress * 100,
        lensOpacity:
          lensBaseOpacity *
          (LENS_RESTING_STRENGTH + LENS_MOTION_BOOST * motionEnergy),
      });
    };

    const resetPointerMotion = () => {
      if (canUsePointerMotion()) {
        lensBaseOpacity = 0;
        clearMotionEnergy();
        scheduleVisualState(CENTERED_VISUAL_STATE);
      }
    };

    const handlePointerOut = (event: PointerEvent) => {
      if (event.relatedTarget === null) {
        resetPointerMotion();
      }
    };

    const unsubscribePointerMotion = subscribeToMediaQuery(
      pointerMotionQuery,
      syncPointerCapability,
    );
    const unsubscribeReducedMotion = subscribeToMediaQuery(
      reducedMotionQuery,
      syncPointerCapability,
    );

    if (!unsubscribePointerMotion || !unsubscribeReducedMotion) {
      unsubscribePointerMotion?.();
      unsubscribeReducedMotion?.();
      setPointerMotionEnabled(false);
      lensBaseOpacity = 0;
      clearMotionEnergy();
      applyVisualState(CENTERED_VISUAL_STATE);
      if (reducedMotionQuery.matches) {
        video.pause();
      }
      return () => {
        if (animationFrame !== null) {
          window.cancelAnimationFrame(animationFrame);
        }
      };
    }

    try {
      window.addEventListener('pointermove', handlePointerMove, {
        passive: true,
      });
      window.addEventListener('pointerout', handlePointerOut);
      window.addEventListener('blur', resetPointerMotion);
    } catch {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerout', handlePointerOut);
      window.removeEventListener('blur', resetPointerMotion);
      unsubscribePointerMotion();
      unsubscribeReducedMotion();
      setPointerMotionEnabled(false);
      lensBaseOpacity = 0;
      clearMotionEnergy();
      applyVisualState(CENTERED_VISUAL_STATE);
      return;
    }

    syncPointerCapability();

    return () => {
      if (animationFrame !== null) {
        window.cancelAnimationFrame(animationFrame);
      }
      unsubscribePointerMotion();
      unsubscribeReducedMotion();
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerout', handlePointerOut);
      window.removeEventListener('blur', resetPointerMotion);
    };
  }, []);

  return (
    <>
      <video
        ref={videoRef}
        className="background-video"
        src={VIDEO_SOURCE}
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        aria-hidden="true"
        data-media-state={mediaState}
        data-pointer-motion={pointerMotionEnabled ? 'enabled' : 'disabled'}
        hidden={mediaState === 'failed'}
        onLoadedData={() => {
          mediaStateRef.current = 'ready';
          setMediaState('ready');
        }}
        onError={() => {
          mediaStateRef.current = 'failed';
          setMediaState('failed');
        }}
      />
      <div
        ref={overlayRef}
        className="background-overlay"
        data-background-overlay=""
        aria-hidden="true"
      />
    </>
  );
}
