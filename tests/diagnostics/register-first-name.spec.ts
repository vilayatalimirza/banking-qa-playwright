import { expect, test } from '@playwright/test';
import { buildCustomer } from '../../data/factories';
import { RegisterPage } from '../../pages/RegisterPage';

test('diagnostic: capture registration field events during the fixture flow', async ({ page }, testInfo) => {
  const customer = buildCustomer();
  const register = new RegisterPage(page);

  // Match the shared customer fixture, but pause after navigation to install event listeners.
  await register.open();

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

  let fillFailure: string | null = null;
  try {
    await register.fillForm(customer);
  } catch (error) {
    fillFailure = error instanceof Error ? error.stack ?? error.message : String(error);
  }

  const afterFill = await page.evaluate(() => {
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
    const inputs = Array.from(document.querySelectorAll<HTMLInputElement>('input'));

    return {
      url: location.href,
      inputs: inputs.map((input) => ({
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
  });

  let submitFailure: string | null = null;
  if (!fillFailure) {
    try {
      await register.submit();
      await expect(
        page.getByRole('heading', { name: `Welcome ${customer.username}`, exact: true }),
      ).toBeVisible();
    } catch (error) {
      submitFailure = error instanceof Error ? error.stack ?? error.message : String(error);
    }
  }

  const afterSubmit = await page.evaluate(() => ({
    url: location.href,
    title: document.title,
    bodyText: document.body.innerText.replace(/\\s+/g, ' ').slice(0, 700),
    inputs: Array.from(document.querySelectorAll<HTMLInputElement>('input')).map((input) => ({
      name: input.name,
      value: input.value,
    })),
  }));

  const evidence = {
    customer: { ...customer, password: '[redacted]' },
    fillFailure,
    afterFill,
    submitFailure,
    afterSubmit,
  };

  await testInfo.attach('complete-registration-diagnostic.json', {
    body: Buffer.from(JSON.stringify(evidence, null, 2)),
    contentType: 'application/json',
  });

  expect(fillFailure, 'all registration fields should retain their values during fillForm').toBeNull();
  expect(submitFailure, 'registration should complete and show the welcome heading').toBeNull();
});
