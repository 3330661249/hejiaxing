export const FINE_POINTER_QUERY = '(hover: hover) and (pointer: fine)';
export const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

export function subscribeToMediaQuery(
  query: MediaQueryList,
  listener: () => void,
) {
  const register = (
    add: (handleChange: () => void) => void,
    remove: (handleChange: () => void) => void,
  ) => {
    let active = true;
    const handleChange = () => {
      if (active) {
        listener();
      }
    };

    try {
      add(handleChange);
    } catch {
      active = false;
      return null;
    }

    return () => {
      active = false;
      try {
        remove(handleChange);
      } catch {
        // The inert callback is safe even if an older browser cannot remove it.
      }
    };
  };

  if (
    typeof query.addEventListener === 'function' &&
    typeof query.removeEventListener === 'function'
  ) {
    const unsubscribe = register(
      (handleChange) => query.addEventListener('change', handleChange),
      (handleChange) => query.removeEventListener('change', handleChange),
    );
    if (unsubscribe) {
      return unsubscribe;
    }
  }

  if (
    typeof query.addListener === 'function' &&
    typeof query.removeListener === 'function'
  ) {
    return register(
      (handleChange) => query.addListener(handleChange),
      (handleChange) => query.removeListener(handleChange),
    );
  }

  return null;
}
