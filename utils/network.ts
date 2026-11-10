
import { expect, type Page, type Request } from '@playwright/test';

/**
 * One POST request observed by the tracker.
 *
 * status:
 *   HTTP response status, or null if no HTTP response was received.
 *
 * failure:
 *   Network-level failure description, or null if the request completed.
 */
export interface TrackedPost {
  method: string;
  url: string;
  status: number | null;
  failure: string | null;
}

/** Internal version whose response details can be updated as events arrive. */
interface MutableTrackedPost extends TrackedPost {}

/** Controls how long the tracker waits for requests to become quiet. */
interface SettledOptions {
  quietMs?: number;
  timeoutMs?: number;
}

/**
 * Counts matching POST requests and captures their HTTP outcomes.
 *
 * Example:
 *   const posts = trackPosts(page, /transfer/i);
 *   await pages.transfer.submitTwice();
 *   await posts.settled();
 *
 * The quiet period helps catch closely spaced duplicate requests.
 * It cannot prove that no future request will ever arrive.
 */
export function trackPosts(page: Page, urlPattern: RegExp) {
  const records: MutableTrackedPost[] = [];
  const requests = new Map<Request, MutableTrackedPost>();
  const inFlight = new Set<Request>();

  // Start the quiet-period clock when tracking begins.
  let lastActivityAt = Date.now();

  /**
   * Matches POST requests against the supplied URL pattern.
   * Reset lastIndex so global or sticky regular expressions work reliably.
   */
  const matches = (request: Request): boolean => {
    urlPattern.lastIndex = 0;

    return (
      request.method() === 'POST' &&
      urlPattern.test(request.url())
    );
  };

  // Event 1: a matching request has been sent.
  page.on('request', (request) => {
    if (!matches(request)) {
      return;
    }

    const record: MutableTrackedPost = {
      method: request.method(),
      url: request.url(),
      status: null,
      failure: null,
    };

    records.push(record);
    requests.set(request, record);
    inFlight.add(request);
    lastActivityAt = Date.now();
  });

  // Event 2: an HTTP response has arrived.
  page.on('response', (response) => {
    const record = requests.get(response.request());

    if (!record) {
      return;
    }

    record.status = response.status();
    lastActivityAt = Date.now();
  });

  // Event 3: a request completed and its response body was downloaded.
  const onRequestFinished = (request: Request): void => {
    if (!requests.has(request)) {
      return;
    }

    inFlight.delete(request);
    lastActivityAt = Date.now();
  };

  // Event 4: a request failed at the network level.
  const onRequestFailed = (request: Request): void => {
    const record = requests.get(request);

    if (!record) {
      return;
    }

    record.failure =
      request.failure()?.errorText ?? 'Unknown network failure';

    inFlight.delete(request);
    lastActivityAt = Date.now();
  };

  page.on('requestfinished', onRequestFinished);
  page.on('requestfailed', onRequestFailed);

  return {
    /** Total number of matching POST requests observed. */
    get sent(): number {
      return records.length;
    },

    /** Number of matching requests that have not finished or failed. */
    get inFlight(): number {
      return inFlight.size;
    },

    /**
     * Returns a snapshot of the observed requests.
     * The returned objects cannot modify the tracker's internal records.
     */
    get records(): readonly TrackedPost[] {
      return records.map((record) => ({ ...record }));
    },

    /**
     * Waits until no tracked request is in flight and the tracker
     * has observed no new activity for the quiet period.
     *
     * Defaults:
     *   quietMs: 500
     *   timeoutMs: 10000
     */
    async settled({
      quietMs = 500,
      timeoutMs = 10_000,
    }: SettledOptions = {}): Promise<void> {
      if (!Number.isInteger(quietMs) || quietMs < 0) {
        throw new RangeError('quietMs must be a non-negative integer');
      }

      if (!Number.isInteger(timeoutMs) || timeoutMs <= 0) {
        throw new RangeError('timeoutMs must be a positive integer');
      }

      await expect
        .poll(
          () =>
            inFlight.size === 0 &&
            Date.now() - lastActivityAt >= quietMs,
          {
            timeout: timeoutMs,
            message:
              'Tracked POST requests did not become idle within the expected time',
          },
        )
        .toBe(true);
    },
  };
}
