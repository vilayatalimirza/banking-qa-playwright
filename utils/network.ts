import { expect, type Page, type Request } from '@playwright/test';

/**
 * Counts POST requests whose URL matches `urlPattern`, and can wait until all of them finished.
 * Use it to prove how many requests a double click really sent.
 */
export function trackPosts(page: Page, urlPattern: RegExp) {
  let sent = 0;
  let inFlight = 0;

  const matches = (request: Request): boolean =>
    request.method() === 'POST' && urlPattern.test(request.url());

  page.on('request', (request) => {
    if (matches(request)) {
      sent += 1;
      inFlight += 1;
    }
  });
  const finished = (request: Request): void => {
    if (matches(request)) {
      inFlight -= 1;
    }
  };
  page.on('requestfinished', finished);
  page.on('requestfailed', finished);

  return {
    get sent(): number {
      return sent;
    },
    /** Resolves once every tracked request has completed. */
    async settled(): Promise<void> {
      await expect.poll(() => inFlight).toBe(0);
    },
  };
}
