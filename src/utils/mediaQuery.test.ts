import { describe, expect, it, vi } from 'vitest';
import { subscribeToMediaQuery } from './mediaQuery';

describe('subscribeToMediaQuery', () => {
  it('deactivates a listener even when browser cleanup throws', () => {
    const listenerRef: { current: (() => void) | null } = { current: null };
    const query = {
      matches: true,
      media: '(hover: hover) and (pointer: fine)',
      onchange: null,
      addEventListener: vi.fn(
        (_type: string, listener: EventListenerOrEventListenerObject) => {
          listenerRef.current =
            typeof listener === 'function'
              ? () => listener(new Event('change'))
              : () => listener.handleEvent(new Event('change'));
        },
      ),
      removeEventListener: vi.fn(() => {
        throw new Error('listener removal unavailable');
      }),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(() => true),
    } as unknown as MediaQueryList;
    const onChange = vi.fn();

    const unsubscribe = subscribeToMediaQuery(query, onChange);
    expect(unsubscribe).not.toBeNull();

    unsubscribe?.();
    listenerRef.current?.();

    expect(onChange).not.toHaveBeenCalled();
  });
});
