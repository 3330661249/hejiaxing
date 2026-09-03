import '@testing-library/jest-dom/vitest';

class IntersectionObserverStub {
  readonly root = null;
  readonly rootMargin = '0px';
  readonly thresholds = [0];

  disconnect() {}
  observe() {}
  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }
  unobserve() {}
}

Object.defineProperty(globalThis, 'IntersectionObserver', {
  configurable: true,
  writable: true,
  value: IntersectionObserverStub,
});
