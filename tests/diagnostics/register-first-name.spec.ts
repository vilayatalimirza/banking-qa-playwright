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

const test = base.extend({
  page: async ({ page }, use) => {
    const nodeEvents: RegistrationEvent[] = [];

    page.on('console', (message) => {
      const prefix = 'REG_DIAG_EVENT ';
      const value = message.text();
      if (!value.startsWith(prefix)) return;
      try {
        nodeEvents.push(JSON.parse(value.slice(prefix.length)) as RegistrationEvent);
      } catch {
        // Ignore malformed diagnostic messages.
      }
    });

    await page.addInitScript(() => {
      const key = '__pw_registration_fixture_events__';
      const safeValue = (input: HTMLInputElement) =>
        input.type === 'password' ? '[redacted]' : input.value;

      const record = (event: Event) => {
        const target = event.target;
        if (!(target instanceof HTMLInputElement)) return;

        const area = target.closest('#loginPanel') ? 'loginPanel' :
          target.closest('#rightPanel') ? 'rightPanel' : 'other';

        // Capture every registration field plus the login username field across each sequential repeat.
        if (area !== 'rightPanel' && !(area === 'loginPanel' && target.name === 'username')) return;

        const active = document.activeElement;
        const activeInput = active instanceof HTMLInputElement ? active : null;
        const entry = {
          type: event.type,
          targetName: target.name,
          targetId: target.id,
          targetValue: safeValue(target),
          targetArea: area,
          activeName: activeInput?.name ?? '',
          activeId: activeInput?.id ?? '',
          activeValue: activeInput ? safeValue(activeInput) : '',
          url: location.href,
          timestamp: Date.now(),
        };

        try {
          const events = JSON.parse(sessionStorage.getItem(key) ?? '[]') as RegistrationEvent[];
          events.push(entry);
          sessionStorage.setItem(key, JSON.stringify(events));
        } catch {
          // Session storage may be unavailable on an error document.
        }

        console.info('REG_DIAG_EVENT ' + JSON.stringify(entry));
      };

      for (const eventType of ['focus', 'blur', 'input', 'change'] as const) {
        document.addEventListener(eventType, record, true);
      }
    });

    try {
      await use(page);
    } finally {
      const finalState = await page.evaluate((key) => {
        const inputs = Array.from(document.querySelectorAll<HTMLInputElement>('input'));
        let events: RegistrationEvent[] = [];
        try {
          events = JSON.parse(sessionStorage.getItem(key) ?? '[]') as RegistrationEvent[];
        } catch {
          // The final URL may not expose session storage.
        }

        return {
          url: location.href,
          title: document.title,
          inputs: inputs.map((input) => ({
            name: input.name,
            id: input.id,
            value: input.type === 'password' ? '[redacted]' : input.value,
            area: input.closest('#loginPanel') ? 'loginPanel' :
              input.closest('#rightPanel') ? 'rightPanel' : 'other',
            focused: input === document.activeElement,
          })),
          events,
        };
      }, STORAGE_KEY).catch((error) => ({ captureError: String(error) }));

      console.log('REG_DIAG_FINAL ' + JSON.stringify({
        eventsFromConsole: nodeEvents,
        finalState,
      }));

      await page.waitForTimeout(6000).catch(() => undefined);
    }
  },
});

test('diagnostic: trace every registration input in the shared customer fixture', async ({ customer }) => {
  expect(customer.firstName).toBe('QA');
  expect(customer.username).toMatch(/^qa_[a-f0-9]{8}$/);
});
