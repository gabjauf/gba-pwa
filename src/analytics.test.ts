/** @vitest-environment jsdom */
import { afterEach, describe, expect, it } from 'vitest';
import { loadAnalytics } from './analytics';

const setOnline = (value: boolean) =>
  Object.defineProperty(navigator, 'onLine', { value, configurable: true });

const umamiTag = () =>
  document.head.querySelector<HTMLScriptElement>('script[data-website-id]');

afterEach(() => {
  document.head.innerHTML = '';
});

describe('loadAnalytics', () => {
  it('injects the Umami tag when online', () => {
    setOnline(true);
    loadAnalytics();
    expect(umamiTag()?.src).toBe('https://cloud.umami.is/script.js');
  });

  it('stays off the boot path when offline', () => {
    setOnline(false);
    loadAnalytics();
    expect(umamiTag()).toBeNull();
  });
});
