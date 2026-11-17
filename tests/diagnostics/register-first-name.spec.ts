import { expect, test as base } from '../../fixtures';
import type { Page } from '@playwright/test';

interface RegistrationEvent {
  type: string;
  targetName: string;
  targetId: string;
  targetValue: string;
  targetArea: string;
  activeName: string;
  activeId: string;
  activeValue: string;
  url: string;
  timestamp: number;
}

const STORAGE_KEY = '__pw_registration_fixture_events__';

// The page wrapper runs before the normal customer fixture navigates to ParaBank.
// Its teardown also runs when customer fixture setup fails, preserving failure evidence.
const test = base.extend({
  page: async ({ page }, use, testInfo) => {
    await page.addInitScript(() => {
      const key = '__pw_registration_fixture_events__';

      const safeValue = (input: HTMLInputElement) =>
        input.type === 'password' ? '[redacted]' : input.value;

      const record = (event: Event) => {
        const target = event.target;
        if (!(target instanceof HTMLInputElement)) return;

        const targetArea = target.closest('#loginPanel') ? 'loginPanel' :
          target.closest('#rightPanel') ? 'rightPanel' : 'other';

        const relevant =
          target.name === 'customer.firstName' ||
          target.id === 'customer.firstName' ||
          target.name === 'customer.username' ||
          (target.name === 'username' && targetArea === 'loginPanel');

        if (!relevant) return;

        try {
          const events = JSON.parse(sessionStorage.getItem(key) ?? '[]') as RegistrationEvent[];
          const active = document.activeElement;
          const activeInput = active instanceof HTMLInputElement ? active : null;

          events.push({
            type: event.type,
            targetName: target.name,
            targetId: target.id,
            targetValue: safeValue(target),
            targetArea,
            activeName: activeInput?.name ?? '',
            activeId: activeInput?.id ?? '',
            activeValue: activeInput ? safeValue(activeInput) : '',
            url: location.href,
            timestamp: Date.now(),
          });

          sessionStorage.setItem(key, JSON.stringify(events));
        } catch {
          // Instrumentation must never change application behaviour.
        }
      };

      for (const eventType of ['focus', 'blur', 'input', 'change'] as const) {
        document.addEventListener(eventType, record, true);
      }
    });

    try {
      await use(page);
    } finally {
      const evidence = await collectEvidence(page, testInfo).catch((error) => ({
        captureError: error instanceof Error ? error.message : String(error),
      }));

      await testInfo.attach('shared-customer-fixture-events.json', {
        body: Buffer.from(JSON.stringify(evidence, null, 2)),
        contentType: 'application/json',
      });

      if (testInfo.status !== testInfo.expectedStatus) {
        const screenshot = await page.screenshot({ fullPage: true, timeout: 5000 }).catch(() => null);
        if (screenshot) {
          await testInfo.attach('shared-customer-fixture-failure.png', {
            body: screenshot,
            contentType: 'image/png',
          });
        }
      }

      // Space out public-demo registrations while keeping attempts strictly sequential.
      if (testInfo.repeatEachIndex < 2) {
        await page.waitForTimeout(6000).catch(() => undefined);
      }
    }
  },
});

async function collectEvidence(page: Page, testInfo: {
  title: string;
  repeatEachIndex: number;
  status: string | undefined;
  expectedStatus: string;
}) {
  const browserState = await page.evaluate((key) => {
    let events: RegistrationEvent[] = [];
    try {
      events = JSON.parse(sessionStorage.getItem(key) ?? '[]') as RegistrationEvent[];
    } catch {
      // The page may have navigated to an error document without session storage.
    }

    const inputs = Array.from(document.querySelectorAll<HTMLInputElement>('input'));
    const describeArea = (input: HTMLInputElement) => input.closest('#loginPanel') ? 'loginPanel' :
      input.closest('#rightPanel') ? 'rightPanel' : 'other';

    return {
      url: location.href,
      title: document.title,
      bodyText: document.body.innerText.replace(/\\s+/g, ' ').slice(0, 700),
      inputs: inputs.map((input) => ({
        name: input.name,
        id: input.id,
        value: input.type === 'password' ? '[redacted]' : input.value,
        area: describeArea(input),
        focused: input === document.activeElement,
      })),
      events,
    };
  }, STORAGE_KEY);

  return {
    testTitle: testInfo.title,
    repeatIndex: testInfo.repeatEachIndex,
    status: testInfo.status,
    expectedStatus: testInfo.expectedStatus,
    ...browserState,
  };
}

test('diagnostic: reproduce registration through the shared customer fixture', async ({ customer }) => {
  // Registration and login have already happened in fixtures/index.ts before this body starts.
  expect(customer.firstName).toBe('QA');
  expect(customer.username).toMatch(/^qa_[a-f0-9]{8}$/);
});
