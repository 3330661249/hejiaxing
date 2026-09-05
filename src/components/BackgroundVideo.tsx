import { useCallback, useEffect, useRef, useState } from 'react';
import { backgroundMedia } from '../content/resume';
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

type BackgroundPhase =
  | 'intro'
  | 'handoff'
  | 'loop'
  | 'poster'
  | 'failed';

type MediaState = 'loading' | 'ready' | 'failed';
type HandoffSource = 'intro' | 'poster';

function prefersReducedMotion() {
  return (
    typeof window.matchMedia === 'function' &&
    window.matchMedia(REDUCED_MOTION_QUERY).matches
  );
}

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
  const initialReducedMotionRef = useRef<boolean | null>(null);
  if (initialReducedMotionRef.current === null) {
    initialReducedMotionRef.current = prefersReducedMotion();
  }

  const stageRef = useRef<HTMLDivElement>(null);
  const introRef = useRef<HTMLVideoElement>(null);
  const loopRef = useRef<HTMLVideoElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const reducedMotionRef = useRef(initialReducedMotionRef.current);
  const introConsumedRef = useRef(initialReducedMotionRef.current);
  const introPlayRequestedRef = useRef(false);
  const loopPlayPendingRef = useRef(false);
  const loopPlayAttemptRef = useRef(0);
  const mountedRef = useRef(true);
  const visibleMediaReadyRef = useRef(false);
  const introStateRef = useRef<MediaState>('loading');
  const loopStateRef = useRef<MediaState>('loading');
  const posterStateRef = useRef<MediaState>('loading');
  const [phase, setPhaseState] = useState<BackgroundPhase>(
    initialReducedMotionRef.current ? 'poster' : 'intro',
  );
  const phaseRef = useRef<BackgroundPhase>(phase);
  const [introState, setIntroState] = useState<MediaState>('loading');
  const [loopState, setLoopState] = useState<MediaState>('loading');
  const [posterState, setPosterState] = useState<MediaState>('loading');
  const [handoffSource, setHandoffSource] =
    useState<HandoffSource>('intro');
  const [pointerMotionEnabled, setPointerMotionEnabled] = useState(false);

  const setPhase = useCallback((nextPhase: BackgroundPhase) => {
    phaseRef.current = nextPhase;
    setPhaseState(nextPhase);
  }, []);

  const showPosterFallback = useCallback(() => {
    loopPlayAttemptRef.current += 1;
    loopPlayPendingRef.current = false;
    visibleMediaReadyRef.current = posterStateRef.current === 'ready';
    setPhase(posterStateRef.current === 'failed' ? 'failed' : 'poster');
  }, [setPhase]);

  const requestLoopPlayback = useCallback((source: HandoffSource) => {
    if (reducedMotionRef.current) {
      showPosterFallback();
      return;
    }

    if (loopStateRef.current === 'failed') {
      showPosterFallback();
      return;
    }

    const loop = loopRef.current;
    if (!loop) {
      showPosterFallback();
      return;
    }

    if (loopPlayPendingRef.current) {
      return;
    }

    const attempt = loopPlayAttemptRef.current + 1;
    loopPlayAttemptRef.current = attempt;
    loopPlayPendingRef.current = true;
    setHandoffSource(source);
    setPhase('handoff');

    try {
      const playback = loop.play();
      void playback?.catch(() => {
        if (
          mountedRef.current &&
          attempt === loopPlayAttemptRef.current &&
          phaseRef.current === 'handoff' &&
          !reducedMotionRef.current
        ) {
          showPosterFallback();
        }
      });
    } catch {
      showPosterFallback();
    }
  }, [setPhase, showPosterFallback]);

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
      loopPlayAttemptRef.current += 1;
      loopPlayPendingRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (typeof window.matchMedia !== 'function') {
      return;
    }

    const reducedMotionQuery = window.matchMedia(REDUCED_MOTION_QUERY);
    let wasReducedMotion = reducedMotionQuery.matches;

    const syncMediaMotion = () => {
      const isReducedMotion = reducedMotionQuery.matches;
      reducedMotionRef.current = isReducedMotion;

      if (isReducedMotion) {
        introConsumedRef.current = true;
        loopPlayAttemptRef.current += 1;
        loopPlayPendingRef.current = false;
        introRef.current?.pause();
        loopRef.current?.pause();
        visibleMediaReadyRef.current = posterStateRef.current === 'ready';
        setPhase(posterStateRef.current === 'failed' ? 'failed' : 'poster');
      } else if (wasReducedMotion) {
        introConsumedRef.current = true;
        requestLoopPlayback('poster');
      }

      wasReducedMotion = isReducedMotion;
    };

    const unsubscribe = subscribeToMediaQuery(
      reducedMotionQuery,
      syncMediaMotion,
    );
    syncMediaMotion();

    return () => unsubscribe?.();
  }, [requestLoopPlayback, setPhase]);

  const handleIntroUnavailable = useCallback(() => {
    introStateRef.current = 'failed';
    setIntroState('failed');
    if (phaseRef.current === 'intro') {
      introConsumedRef.current = true;
      requestLoopPlayback('poster');
    }
  }, [requestLoopPlayback]);

  useEffect(() => {
    if (
      reducedMotionRef.current ||
      phaseRef.current !== 'intro' ||
      introPlayRequestedRef.current
    ) {
      return;
    }

    const intro = introRef.current;
    if (!intro) {
      handleIntroUnavailable();
      return;
    }

    introPlayRequestedRef.current = true;
    try {
      const playback = intro.play();
      void playback?.catch(() => {
        if (
          mountedRef.current &&
          phaseRef.current === 'intro' &&
          !reducedMotionRef.current
        ) {
          handleIntroUnavailable();
        }
      });
    } catch {
      handleIntroUnavailable();
    }
  }, [handleIntroUnavailable]);

  useEffect(() => {
    const stage = stageRef.current;
    const overlay = overlayRef.current;

    if (!stage || !overlay) {
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
      stage.style.setProperty(
        '--background-shift-x',
        formatUnit(state.shiftX, 'px'),
      );
      stage.style.setProperty(
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
    const canUsePointerMotion = () =>
      pointerMotionQuery.matches && !reducedMotionQuery.matches;

    const syncPointerCapability = () => {
      const isEnabled = canUsePointerMotion();
      setPointerMotionEnabled(isEnabled);
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
        visibleMediaReadyRef.current
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
      <div
        ref={stageRef}
        className="background-media-stage"
        data-background-stage=""
        data-background-phase={phase}
        data-background-handoff-source={handoffSource}
        data-pointer-motion={pointerMotionEnabled ? 'enabled' : 'disabled'}
        aria-hidden="true"
      >
        <img
          className="background-media-layer background-media-poster"
          src={backgroundMedia.poster}
          alt=""
          data-background-layer="poster"
          data-media-state={posterState}
          onLoad={() => {
            posterStateRef.current = 'ready';
            setPosterState('ready');
            if (phaseRef.current === 'poster') {
              visibleMediaReadyRef.current = true;
            }
          }}
          onError={() => {
            posterStateRef.current = 'failed';
            setPosterState('failed');
            if (phaseRef.current === 'poster') {
              visibleMediaReadyRef.current = false;
              setPhase('failed');
            }
          }}
        />
        <video
          ref={loopRef}
          className="background-media-layer background-video background-video-loop"
          src={backgroundMedia.loop}
          muted
          loop
          playsInline
          preload="auto"
          aria-hidden="true"
          data-background-layer="loop"
          data-media-state={loopState}
          onLoadedData={() => {
            loopStateRef.current = 'ready';
            setLoopState('ready');
          }}
          onPlaying={() => {
            loopPlayAttemptRef.current += 1;
            loopPlayPendingRef.current = false;
            loopStateRef.current = 'ready';
            setLoopState('ready');
            if (
              phaseRef.current === 'handoff' &&
              introConsumedRef.current &&
              !reducedMotionRef.current
            ) {
              visibleMediaReadyRef.current = true;
              setPhase('loop');
            }
          }}
          onError={() => {
            loopPlayAttemptRef.current += 1;
            loopPlayPendingRef.current = false;
            loopStateRef.current = 'failed';
            setLoopState('failed');
            if (
              phaseRef.current === 'handoff' ||
              phaseRef.current === 'loop'
            ) {
              showPosterFallback();
            }
          }}
        />
        <video
          ref={introRef}
          className="background-media-layer background-video background-video-intro"
          src={backgroundMedia.intro}
          autoPlay={phase === 'intro'}
          muted
          playsInline
          preload="auto"
          aria-hidden="true"
          data-background-layer="intro"
          data-media-state={introState}
          onLoadedData={() => {
            introStateRef.current = 'ready';
            setIntroState('ready');
            if (phaseRef.current === 'intro') {
              visibleMediaReadyRef.current = true;
            }
          }}
          onEnded={() => {
            if (phaseRef.current !== 'intro') {
              return;
            }
            introConsumedRef.current = true;
            requestLoopPlayback('intro');
          }}
          onError={handleIntroUnavailable}
        />
      </div>
      <div
        ref={overlayRef}
        className="background-overlay"
        data-background-overlay=""
        aria-hidden="true"
      />
    </>
  );
}
