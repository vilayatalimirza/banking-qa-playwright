import { expect, test } from '@playwright/test';
import { RegisterPage } from '../../pages/RegisterPage';

test('diagnostic: capture where the registration first-name fill goes', async ({ page }, testInfo) => {
  await new RegisterPage(page).open();

  const field = page.locator('#rightPanel input[name="customer.firstName"]');
  await expect(field).toHaveCount(1);
  await expect(field).toBeVisible();
  await expect(field).toBeEditable();

  await page.evaluate(() => {
    type CapturedEvent = {
      type: string;
      id: string;
      name: string;
      value: string;
      activeElementId: string;
    };

    const diagnosticWindow = window as Window & {
      __registrationEvents?: CapturedEvent[];
    };
    const captured: CapturedEvent[] = [];
    diagnosticWindow.__registrationEvents = captured;

    for (const eventType of ['focus', 'blur', 'input', 'change'] as const) {
      document.addEventListener(
        eventType,
        (event: Event) => {
          const target = event.target;
          if (!(target instanceof HTMLInputElement)) return;

          if (
            target.id === 'customer.firstName' ||
            target.name === 'customer.firstName' ||
            target.name === 'username'
          ) {
            captured.push({
              type: eventType,
              id: target.id,
              name: target.name,
              value: target.value,
              activeElementId: (document.activeElement as HTMLElement | null)?.id ?? '',
            });
          }
        },
        true,
      );
    }
  });

  const readState = async () =>
    page.evaluate(() => {
      const readInput = (selector: string) => {
        const element = document.querySelector<HTMLInputElement>(selector);
        const rect = element?.getBoundingClientRect();
        const centerHit = rect
          ? document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2)
          : null;

        return {
          found: Boolean(element),
          html: element?.outerHTML ?? null,
          value: element?.value ?? null,
          focused: element === document.activeElement,
          disabled: element?.disabled ?? null,
          readOnly: element?.readOnly ?? null,
          rect: rect
            ? { x: rect.x, y: rect.y, width: rect.width, height: rect.height }
            : null,
          elementAtCenter: centerHit?.outerHTML ?? null,
        };
      });

      const active = document.activeElement;
      return {
        url: location.href,
        title: document.title,
        registrationFirstName: readInput('#rightPanel input[name="customer.firstName"]'),
        loginUsername: readInput('#loginPanel input[name="username"]'),
        activeElement: active
          ? {
              tagName: active.tagName,
              id: (active as HTMLElement).id ?? '',
              name: (active as HTMLInputElement).name ?? '',
              html: active instanceof Element ? active.outerHTML : '',
            }
          : null,
        bodyText: document.body.innerText.replace(/\\s+/g, ' ').slice(0, 500),
      };
    });

  const before = await readState();
  console.log('[registration-diagnostic] BEFORE:', JSON.stringify(before));

  let fillError: string | null = null;
  try {
    await field.fill('QA', { timeout: 5000 });
  } catch (error) {
    fillError = error instanceof Error ? error.message : String(error);
  }

  const afterFill = await readState();
  console.log('[registration-diagnostic] AFTER FILL:', JSON.stringify(afterFill));

  await page.waitForTimeout(250);
  const afterSettle = await readState();
  const events = await page.evaluate(() => {
    type CapturedEvent = {
      type: string;
      id: string;
      name: string;
      value: string;
      activeElementId: string;
    };
    const diagnosticWindow = window as Window & {
      __registrationEvents?: CapturedEvent[];
    };
    return diagnosticWindow.__registrationEvents ?? [];
  });

  const evidence = { fillError, before, afterFill, afterSettle, events };
  console.log('[registration-diagnostic] EVENTS:', JSON.stringify(events));
  console.log('[registration-diagnostic] FINAL:', JSON.stringify(evidence));

  await testInfo.attach('registration-first-name-diagnostic.json', {
    body: Buffer.from(JSON.stringify(evidence, null, 2)),
    contentType: 'application/json',
  });

  expect(fillError, 'Playwright fill should complete without an interaction error').toBeNull();
  expect(afterSettle.registrationFirstName.value, 'the registration field should retain QA').toBe('QA');
});
