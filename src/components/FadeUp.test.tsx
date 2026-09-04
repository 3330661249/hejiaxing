import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { FadeUp } from './FadeUp';

const motionPreference = vi.hoisted(() => ({ reduced: false }));

vi.mock('framer-motion', async (importOriginal) => {
  const actual = await importOriginal<typeof import('framer-motion')>();
  return {
    ...actual,
    useReducedMotion: () => motionPreference.reduced,
  };
});

afterEach(() => {
  cleanup();
  motionPreference.reduced = false;
});

describe('FadeUp', () => {
  it('renders children with the default semantic element and forwarded presentation props', () => {
    render(
      <FadeUp className="probe" style={{ color: '#ff0000' }}>
        Default motion
      </FadeUp>,
    );

    const element = screen.getByText('Default motion');
    expect(element.tagName).toBe('DIV');
    expect(element).toHaveClass('probe');
    expect(element).toHaveStyle('color: rgb(255, 0, 0)');
    expect(element).toHaveStyle({ opacity: '0' });
    expect(element).toHaveStyle({ transform: 'translateY(24px)' });
  });

  it('supports polymorphic semantic overrides while rendering children', () => {
    render(
      <FadeUp
        as="p"
        y={32}
        className="override"
        style={{ color: '#0000ff' }}
      >
        Override motion
      </FadeUp>,
    );

    const element = screen.getByText('Override motion');
    expect(element.tagName).toBe('P');
    expect(element).toHaveClass('override');
    expect(element).toHaveStyle('color: rgb(0, 0, 255)');
    expect(element).toHaveStyle({ opacity: '0' });
    expect(element).toHaveStyle({ transform: 'translateY(32px)' });
  });

  it('keeps content immediately visible when reduced motion is requested', () => {
    motionPreference.reduced = true;

    render(<FadeUp>Reduced motion content</FadeUp>);

    const element = screen.getByText('Reduced motion content');
    expect(element).not.toHaveStyle({ opacity: '0' });
    expect(element).not.toHaveStyle({ transform: 'translateY(24px)' });
  });
});
