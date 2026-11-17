import { test } from '@playwright/test';
import { buildCustomer } from '../../data/factories';
import { RegisterPage } from '../../pages/RegisterPage';

test('diagnostic: capture the complete registration fixture flow', async ({ page }, testInfo) => {
  const customer = buildCustomer();
  const register = new RegisterPage(page);

  await page.evaluate(() => {
    type CapturedEvent = {
      type: string;
      targetName: string;
      targetValue: string;
      targetArea: string;
      activeName: string;
      activeValue: string;
      url: string;
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

          const active = document.activeElement;
          const activeInput = active instanceof HTMLInputElement ? active : null;
          captured.push({
            type: eventType,
            targetName: target.name,
            targetValue: target.value,
            targetArea: target.closest('#loginPanel') ? 'loginPanel' :
              target.closest('#rightPanel') ? 'rightPanel' : 'other',
            activeName: activeInput?.name ?? '',
            activeValue: activeInput?.value ?? '',
            url: location.href,
          });
        },
        true,
      );
    }
  });

  let failure: string | null = null;
  try {
    // Same page-object call used by fixtures/index.ts for the customer fixture.
    await register.register(customer);
  } catch (error) {
    failure = error instanceof Error ? error.stack ?? error.message : String(error);
    throw error;
  } finally {
    const evidence = await page.evaluate(() => {
      type CapturedEvent = {
        type: string;
        targetName: string;
        targetValue: string;
        targetArea: string;
        activeName: string;
        activeValue: string;
        url: string;
      };
      const diagnosticWindow = window as Window & {
        __registrationEvents?: CapturedEvent[];
      };

      return {
        url: location.href,
        inputs: Array.from(document.querySelectorAll<HTMLInputElement>('input')).map((input) => ({
          name: input.name,
          value: input.value,
          area: input.closest('#loginPanel') ? 'loginPanel' :
            input.closest('#rightPanel') ? 'rightPanel' : 'other',
          focused: input === document.activeElement,
        })),
        activeElement: document.activeElement instanceof HTMLInputElement
          ? {
              name: document.activeElement.name,
              value: document.activeElement.value,
              area: document.activeElement.closest('#loginPanel') ? 'loginPanel' :
                document.activeElement.closest('#rightPanel') ? 'rightPanel' : 'other',
            }
          : {
              tagName: document.activeElement?.tagName ?? '',
              id: (document.activeElement as HTMLElement | null)?.id ?? '',
            },
        events: diagnosticWindow.__registrationEvents ?? [],
      };
    }).catch((error) => ({ evidenceReadError: String(error) }));

    await testInfo.attach('complete-registration-diagnostic.json', {
      body: Buffer.from(JSON.stringify({ customer, failure, evidence }, null, 2)),
      contentType: 'application/json',
    });
  }
});
