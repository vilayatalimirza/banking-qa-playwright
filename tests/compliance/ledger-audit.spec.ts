import { test } from '../../fixtures/api';
import { Checks } from '../../utils/checks';
import { observe } from '../../utils/findings';
import { toDecimalInput } from '../../utils/format';

// Ledger and audit-trail checks. ParaBank has no general ledger we can read, so we test what a customer-facing
// bank must still guarantee: every movement is a balanced debit/credit pair, history is never rewritten,
// and each entry is identifiable. See docs/BANKING-CONCEPTS.md.

const AMOUNT = 2500; // $25.00

test('double entry: a transfer books equal debits and credits across the account pair', { tag: ['@compliance', '@api'] }, async ({ api, session }) => {
  const savings = await api.createAccount(session.customerId, 'SAVINGS', session.sourceId);
  const before = { src: await api.transactions(session.sourceId), dst: await api.transactions(savings.id) };

  await api.transfer(session.sourceId, savings.id, toDecimalInput(AMOUNT));

  const after = { src: await api.transactions(session.sourceId), dst: await api.transactions(savings.id) };
  const seen = new Set([...before.src, ...before.dst].map((t) => `${t.id}`));
  const fresh = [...after.src, ...after.dst].filter((t) => !seen.has(t.id));
  const debits = fresh.filter((t) => t.type === 'Debit').reduce((sum, t) => sum + t.amountCents, 0);
  const credits = fresh.filter((t) => t.type === 'Credit').reduce((sum, t) => sum + t.amountCents, 0);

  const checks = new Checks();
  checks.check('INVARIANT', 'new debits equal new credits (double entry)', debits === credits, `debits ${debits}, credits ${credits}`);
  checks.check('REQUIREMENT', 'exactly one debit and one credit were booked', fresh.length === 2, `${fresh.length} new entries`);
  checks.check('REQUIREMENT', 'the booked amount is the transferred amount', debits === AMOUNT, `debit ${debits}, expected ${AMOUNT}`);
  observe('ledger-double-entry', { newEntries: fresh.length, debits, credits, verdict: checks.verdict });
});

test('append-only: earlier statement entries are unchanged after a later transaction', { tag: ['@compliance', '@api'] }, async ({ api, session }) => {
  const savings = await api.createAccount(session.customerId, 'SAVINGS', session.sourceId);
  const before = await api.transactions(session.sourceId);

  await api.transfer(session.sourceId, savings.id, toDecimalInput(AMOUNT));

  const after = await api.transactions(session.sourceId);
  const byId = new Map(after.map((t) => [t.id, t]));
  const altered = before.filter((old) => {
    const now = byId.get(old.id);
    return !now || now.amountCents !== old.amountCents || now.type !== old.type || now.description !== old.description;
  });

  const checks = new Checks();
  checks.check('INVARIANT', 'no earlier entry was changed or removed', altered.length === 0, `${altered.length} of ${before.length} altered`);
  observe('ledger-append-only', { before: before.length, after: after.length, altered: altered.length, verdict: checks.verdict });
});

test('every ledger entry has a unique id, a type, an amount and a description', { tag: ['@compliance', '@api'] }, async ({ api, session }) => {
  const savings = await api.createAccount(session.customerId, 'SAVINGS', session.sourceId);
  await api.transfer(session.sourceId, savings.id, toDecimalInput(AMOUNT));
  const entries = [...(await api.transactions(session.sourceId)), ...(await api.transactions(savings.id))];

  const ids = new Set(entries.map((t) => t.id));
  const checks = new Checks();
  checks.check('INVARIANT', 'entry ids are unique', ids.size === entries.length, `${ids.size} unique of ${entries.length}`);
  checks.check('REQUIREMENT', 'each entry is a Debit or a Credit', entries.every((t) => t.type === 'Debit' || t.type === 'Credit'), entries.map((t) => t.type).join(','));
  checks.check('REQUIREMENT', 'each entry has a positive amount', entries.every((t) => t.amountCents > 0), 'amounts');
  checks.check('REQUIREMENT', 'each entry has a description', entries.every((t) => t.description.trim() !== ''), 'descriptions');
  observe('ledger-entry-fields', { entries: entries.length, verdict: checks.verdict });
});
