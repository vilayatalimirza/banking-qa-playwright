import { expect, test as base } from '../../fixtures';

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

// This override installs instrumentation before the inherited customer fixture uses page.goto().
const test = base.extend({
  page: async ({ page }, use) => {
    await page.addInitScript(() => {
      const key = '__pw_registration_fixture_events__';

      if (location.protocol !== 'http:' && location.protocol !== 'https:') return;

      const record = (event: Event) => {
        const target = event.target;
        if (!(target instanceof HTMLInputElement)) return;

        try {
          const events = JSON.parse(sessionStorage.getItem(key) ?? '[]') as RegistrationEvent[];
          const active = document.activeElement;
          const activeInput = active instanceof HTMLInputElement ? active : null;

          events.push({
            type: event.type,
            targetName: target.name,
            targetId: target.id,
            targetValue: target.value,
            targetArea: target.closest('#loginPanel') ? 'loginPanel' :
              target.closest('#rightPanel') ? 'rightPanel' : 'other',
            activeName: activeInput?.name ?? '',
            activeId: activeInput?.id ?? '',
            activeValue: activeInput?.value ?? '',
            url: location.href,
            timestamp: Date.now(),
          });

          sessionStorage.setItem(key, JSON.stringify(events));
        } catch {
          // Keep diagnostics from changing or breaking the application under test.
        }
      };

      for (const eventType of ['focus', 'blur', 'input', 'change'] as const) {
        document.addEventListener(eventType, record, true);
      }
    });

    await use(page);
  },
});

test('diagnostic: capture the actual shared customer fixture registration', async ({ page, customer }, testInfo) => {
  const events = await page.evaluate((key) => {
    try {
      return JSON.parse(sessionStorage.getItem(key) ?? '[]') as RegistrationEvent[];
    } catch {
      return [];
    }
  }, STORAGE_KEY);

  const evidence = {
    customer: {
      firstName: customer.firstName,
      username: customer.username,
      password: '[redacted]',
    },
    finalUrl: page.url(),
    welcomeHeading: await page.getByRole('heading', {
      name: `Welcome ${customer.username}`,
      exact: true,
    }).isVisible().catch(() => false),
    eventCount: events.length,
    registrationFirstNameEvents: events.filter((event) =>
      event.targetName === 'customer.firstName' || event.targetId === 'customer.firstName'
    ),
    loginUsernameEvents: events.filter((event) =>
      event.targetName === 'username' && event.targetArea === 'loginPanel'
    ),
    allEvents: events,
  };

  await testInfo.attach('shared-customer-fixture-events.json', {
    body: Buffer.from(JSON.stringify(evidence, null, 2)),
    contentType: 'application/json',
  });

  expect(evidence.welcomeHeading, 'the shared customer fixture should finish on the logged-in account page')
    .toBe(true);
  expect(
    evidence.registrationFirstNameEvents.some((event) =>
      event.type === 'input' && event.targetValue === customer.firstName
    ),
    'the shared fixture should type the first name into the registration first-name field',
  ).toBe(true);
});
