import { useEffect, useMemo, useRef, useState } from 'react';
import { navigation } from '../content/resume';

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

type SiteHeaderProps = {
  mainId: string;
};

export function SiteHeader({ mainId }: SiteHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const anchorItems = useMemo(
    () =>
      navigation.filter(
        (item) => item.kind === 'anchor' && item.href !== '#top',
      ),
    [],
  );

  useEffect(() => {
    const updateScrolledState = () => setIsScrolled(window.scrollY > 24);
    updateScrolledState();
    window.addEventListener('scroll', updateScrolledState, { passive: true });
    return () => window.removeEventListener('scroll', updateScrolledState);
  }, []);

  useEffect(() => {
    if (typeof window.matchMedia !== 'function') {
      return undefined;
    }

    const desktopQuery = window.matchMedia('(min-width: 901px)');
    const closeMenuAtDesktop = () => {
      if (desktopQuery.matches) {
        setMenuOpen(false);
      }
    };

    desktopQuery.addEventListener('change', closeMenuAtDesktop);
    return () => desktopQuery.removeEventListener('change', closeMenuAtDesktop);
  }, []);

  useEffect(() => {
    if (!menuOpen) {
      return undefined;
    }

    const main = document.getElementById(mainId);
    const previousOverflow = document.body.style.overflow;
    if (main) {
      main.inert = true;
      main.setAttribute('inert', '');
    }
    document.body.style.overflow = 'hidden';

    const focusFirstControl = window.setTimeout(() => {
      const firstControl = menuRef.current?.querySelector<HTMLElement>(
        FOCUSABLE_SELECTOR,
      );
      firstControl?.focus();
    }, 0);

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setMenuOpen(false);
        window.setTimeout(() => triggerRef.current?.focus(), 0);
        return;
      }

      if (event.key !== 'Tab') {
        return;
      }

      const controls = Array.from(
        menuRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR) ?? [],
      );
      if (controls.length === 0) {
        event.preventDefault();
        return;
      }

      const first = controls[0];
      const last = controls[controls.length - 1];
      const active = document.activeElement;

      if (event.shiftKey && (active === first || !menuRef.current?.contains(active))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      window.clearTimeout(focusFirstControl);
      document.removeEventListener('keydown', handleKeyDown);
      if (main) {
        main.inert = false;
        main.removeAttribute('inert');
      }
      document.body.style.overflow = previousOverflow;
    };
  }, [mainId, menuOpen]);

  const closeAndRestoreFocus = () => {
    setMenuOpen(false);
    window.setTimeout(() => triggerRef.current?.focus(), 0);
  };

  return (
    <header
      className="site-header"
      data-scrolled={isScrolled ? 'true' : 'false'}
    >
      <div className="content-frame header-inner">
        <a className="site-brand" href="#top">
          何佳兴 <span>· AI PRODUCT MANAGER</span>
        </a>

        <nav className="desktop-nav" aria-label="主要导航">
          {anchorItems.map((item) => (
            <a key={item.href} href={item.href}>
              {item.label}
            </a>
          ))}
        </nav>

        <button
          ref={triggerRef}
          className="mobile-menu-trigger"
          type="button"
          aria-expanded={menuOpen}
          aria-controls="mobile-navigation"
          aria-label={menuOpen ? '关闭导航菜单' : '打开导航菜单'}
          onClick={() => setMenuOpen((open) => !open)}
        >
          <span />
          <span />
        </button>
      </div>

      {menuOpen ? (
        <div
          ref={menuRef}
          className="mobile-menu"
          role="dialog"
          aria-modal="true"
          aria-label="导航菜单"
        >
          <div className="mobile-menu-inner">
            <p className="section-eyebrow">NAVIGATION</p>
            <nav id="mobile-navigation" aria-label="移动导航">
              {anchorItems.map((item, index) => (
                <a
                  key={item.href}
                  href={item.href}
                  aria-label={item.label}
                  onClick={() => setMenuOpen(false)}
                >
                  <span aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
                  <strong>{item.label}</strong>
                  <span aria-hidden="true">↘</span>
                </a>
              ))}
            </nav>
            <button
              className="mobile-menu-close"
              type="button"
              onClick={closeAndRestoreFocus}
            >
              关闭导航菜单
            </button>
          </div>
        </div>
      ) : null}
    </header>
  );
}
