import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { FadeUp } from './FadeUp';

afterEach(cleanup);

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
});
