import { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'framer-motion';
import { VIDEO_SOURCE } from '../content/resume';

const POINTER_MOTION_QUERY =
  '(min-width: 901px) and (hover: hover) and (pointer: fine)';

type VisualState = {
  shiftX: number;
  shiftY: number;
  lensX: number;
  lensY: number;
  lensOpacity: number;
};

const CENTERED_STATE: VisualState = {
  shiftX: 0,
  shiftY: 0,
  lensX: 50,
  lensY: 50,
  lensOpacity: 0,
};

const easeToward = (current: number, target: number, rate: number) =>
  current + (target - current) * rate;

export function BackgroundVideo() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const [mediaState, setMediaState] = useState<'loading' | 'ready' | 'failed'>(
    'loading',
  );
  const [pointerMotionEnabled, setPointerMotionEnabled] = useState(false);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    if (shouldReduceMotion) {
      videoRef.current?.pause();
    }
  }, [shouldReduceMotion]);

  useEffect(() => {
    const video = videoRef.current;
    const overlay = overlayRef.current;

    if (!video || !overlay || typeof window.matchMedia !== 'function') {
      return undefined;
    }

    const pointerQuery = window.matchMedia(POINTER_MOTION_QUERY);
    let current = { ...CENTERED_STATE };
    let target = { ...CENTERED_STATE };
    let animationFrame: number | null = null;

    const apply = () => {
      video.style.setProperty('--background-shift-x', `${current.shiftX.toFixed(2)}px`);
      video.style.setProperty('--background-shift-y', `${current.shiftY.toFixed(2)}px`);
      overlay.style.setProperty('--background-lens-x', `${current.lensX.toFixed(2)}%`);
      overlay.style.setProperty('--background-lens-y', `${current.lensY.toFixed(2)}%`);
      overlay.style.setProperty(
        '--background-lens-opacity',
        current.lensOpacity.toFixed(3),
      );
    };

    const tick = () => {
      current = {
        shiftX: easeToward(current.shiftX, target.shiftX, 0.075),
        shiftY: easeToward(current.shiftY, target.shiftY, 0.075),
        lensX: easeToward(current.lensX, target.lensX, 0.09),
        lensY: easeToward(current.lensY, target.lensY, 0.09),
        lensOpacity: easeToward(current.lensOpacity, target.lensOpacity, 0.08),
      };
      apply();

      const remaining =
        Math.abs(current.shiftX - target.shiftX) +
        Math.abs(current.shiftY - target.shiftY) +
        Math.abs(current.lensX - target.lensX) +
        Math.abs(current.lensY - target.lensY) +
        Math.abs(current.lensOpacity - target.lensOpacity);

      if (remaining > 0.04) {
        animationFrame = window.requestAnimationFrame(tick);
      } else {
        current = { ...target };
        apply();
        animationFrame = null;
      }
    };

    const schedule = () => {
      if (animationFrame === null) {
        animationFrame = window.requestAnimationFrame(tick);
      }
    };

    const canMove = () => pointerQuery.matches && !shouldReduceMotion;

    const syncCapability = () => {
      const enabled = canMove();
      setPointerMotionEnabled(enabled);
      if (!enabled) {
        target = { ...CENTERED_STATE };
        schedule();
      }
    };

    const handlePointerMove = (event: PointerEvent) => {
      if (!canMove() || event.pointerType !== 'mouse') {
        return;
      }

      const x = Math.min(1, Math.max(0, event.clientX / Math.max(window.innerWidth, 1)));
      const y = Math.min(1, Math.max(0, event.clientY / Math.max(window.innerHeight, 1)));
      target = {
        shiftX: (0.5 - x) * 60,
        shiftY: (0.5 - y) * 32,
        lensX: x * 100,
        lensY: y * 100,
        lensOpacity: mediaState === 'ready' ? 0.92 : 0,
      };
      schedule();
    };

    const reset = () => {
      target = { ...CENTERED_STATE };
      schedule();
    };

    const handlePointerOut = (event: PointerEvent) => {
      if (event.relatedTarget === null) {
        reset();
      }
    };

    apply();
    syncCapability();
    pointerQuery.addEventListener('change', syncCapability);
    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    window.addEventListener('pointerout', handlePointerOut);
    window.addEventListener('blur', reset);

    return () => {
      if (animationFrame !== null) {
        window.cancelAnimationFrame(animationFrame);
      }
      pointerQuery.removeEventListener('change', syncCapability);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerout', handlePointerOut);
      window.removeEventListener('blur', reset);
    };
  }, [mediaState, shouldReduceMotion]);

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
        onCanPlay={() => setMediaState('ready')}
        onError={() => setMediaState('failed')}
      />
      <div
        ref={overlayRef}
        className="background-overlay"
        data-background-overlay=""
        data-media-state={mediaState}
        aria-hidden="true"
      />
    </>
  );
}
