import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { expect, request, test } from '@playwright/test';
import { ParaBankApi, apiMoneyToCents } from '../../api/ParaBankApi';
import { buildPayee } from '../../data/factories';
import { shapeProblems } from '../../utils/shape';

// Unit tests for the API client against a tiny local fake server (no ParaBank needed).

type Handler = (req: IncomingMessage, res: ServerResponse, body: string) => void;

async function withApi(handler: Handler, run: (api: ParaBankApi) => Promise<void>): Promise<void> {
  const server = createServer((req, res) => {
    let body = '';
    req.on('data', (chunk) => (body += chunk));
    req.on('end', () => handler(req, res, body));
  });
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  const port = typeof address === 'object' && address ? address.port : 0;
  const ctx = await request.newContext({ baseURL: `http://127.0.0.1:${port}/parabank/` });
  try {
    await run(new ParaBankApi(ctx));
  } finally {
    await ctx.dispose();
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
}

const json = (res: ServerResponse, status: number, body: unknown): void => {
  res.writeHead(status, { 'content-type': 'application/json' });
  res.end(JSON.stringify(body));
};

test('apiMoneyToCents converts JSON numbers without float errors', () => {
  expect(apiMoneyToCents(19.99)).toBe(1999);
  expect(apiMoneyToCents(415.5)).toBe(41550);
  expect(apiMoneyToCents(-83.1)).toBe(-8310);
  expect(apiMoneyToCents('100')).toBe(10000);
  expect(() => apiMoneyToCents(null)).toThrow('Not a money value');
});

test('login and account listing work with a bare array and with a wrapped object', async () => {
  await withApi(
    (req, res) => {
      if (req.url === '/parabank/services/bank/login/qa_1/pw') {
        return json(res, 200, { id: 12212, firstName: 'QA' });
      }
      if (req.url === '/parabank/services/bank/customers/12212/accounts') {
        return json(res, 200, [{ id: 1, customerId: 12212, type: 'CHECKING', balance: 415.5 }]);
      }
      return json(res, 200, { account: { id: 2, customerId: 12212, type: 'SAVINGS', balance: 19.99 } });
    },
    async (api) => {
      expect(await api.customerIdFor('qa_1', 'pw')).toBe(12212);
      expect(await api.accountsOf(12212)).toEqual([{ id: '1', customerId: '12212', type: 'CHECKING', balanceCents: 41550 }]);
      expect((await api.account('2')).balanceCents).toBe(1999);
    },
  );
});

test('transfer and bill pay send POSTs with the right parameters', async () => {
  const seen: string[] = [];
  await withApi(
    (req, res, body) => {
      seen.push(`${req.method} ${req.url} ${body}`);
      res.writeHead(200, { 'content-type': 'text/plain' });
      res.end('ok');
    },
    async (api) => {
      const transfer = await api.transfer('11', '22', '5.00');
      expect(transfer).toMatchObject({ status: 200, ok: true, text: 'ok', json: null });
      await api.billPay('11', '7.50', buildPayee({ name: 'Water Co' }));
    },
  );
  expect(seen[0]).toBe('POST /parabank/services/bank/transfer?fromAccountId=11&toAccountId=22&amount=5.00 ');
  expect(seen[1]).toContain('POST /parabank/services/bank/billpay?accountId=11&amount=7.50');
  expect(seen[1]).toContain('"name":"Water Co"');
});

test('typed helpers fail with the status and body when the server refuses', async () => {
  await withApi(
    (_req, res) => json(res, 400, { error: 'bad credentials' }),
    async (api) => {
      await expect(api.customerIdFor('x', 'y')).rejects.toThrow(/HTTP 400.*bad credentials/);
    },
  );
});

test('shapeProblems reports missing and wrongly typed fields', () => {
  expect(shapeProblems({ id: 1, type: 'x' }, { id: 'number', type: 'string' })).toEqual([]);
  expect(shapeProblems({ id: '1' }, { id: 'number', type: 'string' })).toEqual([
    'field "id" should be number but is string',
    'missing field "type"',
  ]);
  expect(shapeProblems([], { id: 'number' })).toEqual(['expected an object but got an array']);
});
