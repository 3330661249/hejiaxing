import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { SiteHeader } from './SiteHeader';

function renderHeader() {
  return render(
    <>
      <SiteHeader mainId="main-content" />
      <main id="main-content">
        <a href="#background">背景链接</a>
      </main>
    </>,
  );
}

afterEach(() => {
  cleanup();
  document.body.style.overflow = '';
  Object.defineProperty(window, 'scrollY', {
    configurable: true,
    value: 0,
  });
});

describe('SiteHeader', () => {
  it('renders the approved anchor navigation and authorized PDF download', () => {
    renderHeader();

    expect(
      screen.getByRole('link', { name: '何佳兴 · AI PRODUCT MANAGER' }),
    ).toHaveAttribute('href', '#top');

    const navigation = screen.getByRole('navigation', { name: '主要导航' });
    expect(
      within(navigation)
        .getAllByRole('link')
        .map((link) => [link.textContent, link.getAttribute('href')]),
    ).toEqual([
      ['核心项目', '#selected-work'],
      ['工作经历', '#experience'],
      ['个人实践', '#ai-lab'],
      ['关于我', '#about'],
    ]);
    expect(screen.getByRole('link', { name: '下载简历' })).toHaveAttribute(
      'href',
      './he-jiaxing-ai-product-manager-resume.pdf',
    );
    expect(screen.getByRole('link', { name: '下载简历' })).toHaveAttribute(
      'download',
      '何佳兴_AI产品经理_简历.pdf',
    );
    expect(screen.getByRole('button', { name: '打开导航菜单' })).toHaveAttribute(
      'aria-expanded',
      'false',
    );
    expect(screen.getByRole('button', { name: '打开导航菜单' })).toHaveAttribute(
      'aria-controls',
      'mobile-navigation',
    );
  });

  it('moves focus into the menu, makes main inert, and closes on link click', async () => {
    renderHeader();
    const trigger = screen.getByRole('button', { name: '打开导航菜单' });
    const main = screen.getByRole('main');

    fireEvent.click(trigger);

    const menu = screen.getByRole('dialog', { name: '导航菜单' });
    const firstLink = within(menu).getByRole('link', { name: '核心项目' });
    await waitFor(() => expect(firstLink).toHaveFocus());
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(main).toHaveAttribute('inert');
    expect(document.body.style.overflow).toBe('hidden');

    fireEvent.click(firstLink);

    expect(screen.queryByRole('dialog', { name: '导航菜单' })).not.toBeInTheDocument();
    expect(main).not.toHaveAttribute('inert');
    expect(document.body.style.overflow).toBe('');
  });

  it('closes on Escape and returns focus to the menu trigger', async () => {
    renderHeader();
    const trigger = screen.getByRole('button', { name: '打开导航菜单' });

    fireEvent.click(trigger);
    await waitFor(() =>
      expect(
        within(screen.getByRole('dialog', { name: '导航菜单' })).getByRole(
          'link',
          { name: '核心项目' },
        ),
      ).toHaveFocus(),
    );

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(screen.queryByRole('dialog', { name: '导航菜单' })).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it('cycles Tab and Shift+Tab inside the open menu', async () => {
    renderHeader();
    fireEvent.click(screen.getByRole('button', { name: '打开导航菜单' }));

    const menu = screen.getByRole('dialog', { name: '导航菜单' });
    const first = within(menu).getByRole('link', { name: '核心项目' });
    const last = within(menu).getByRole('button', { name: '关闭导航菜单' });
    await waitFor(() => expect(first).toHaveFocus());

    last.focus();
    fireEvent.keyDown(document, { key: 'Tab' });
    expect(first).toHaveFocus();

    first.focus();
    fireEvent.keyDown(document, { key: 'Tab', shiftKey: true });
    expect(last).toHaveFocus();
  });

  it('uses the scrolled surface only after passing 24 pixels', () => {
    renderHeader();
    const header = screen.getByRole('banner');

    Object.defineProperty(window, 'scrollY', {
      configurable: true,
      value: 25,
    });
    fireEvent.scroll(window);
    expect(header).toHaveAttribute('data-scrolled', 'true');

    Object.defineProperty(window, 'scrollY', {
      configurable: true,
      value: 24,
    });
    fireEvent.scroll(window);
    expect(header).toHaveAttribute('data-scrolled', 'false');
  });
});
