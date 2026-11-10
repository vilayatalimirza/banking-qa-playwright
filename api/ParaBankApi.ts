import type { APIRequestContext } from '@playwright/test';
import type { Payee } from '../data/factories';
import { parseMoney } from '../utils/money';

/** What the server answered, with nothing hidden: tests decide what is acceptable. */
export interface ApiResult {
  status: number;
  ok: boolean;
  text: string;
  /** Parsed body when it is JSON, otherwise null. */
  json: unknown;
}

export interface ApiAccount {
  id: string;
  customerId: string;
  type: string;
  balanceCents: number;
}

export interface ApiTransaction {
  id: string;
  type: string; // "Debit" or "Credit"
  amountCents: number;
  description: string;
}

const enc = encodeURIComponent;

/** JSON numbers like 415.5 or 19.99 become integer cents without float surprises. */
export function apiMoneyToCents(value: unknown): number {
  if (typeof value !== 'number' && typeof value !== 'string') {
    throw new TypeError(`Not a money value: ${JSON.stringify(value)}`);
  }
  return parseMoney(Number(value).toFixed(2));
}

/** ParaBank answers a list either as a bare array or wrapped in an object (e.g. { account: [...] }). */
function asList(json: unknown, key: string): unknown[] {
  if (Array.isArray(json)) {
    return json;
  }
  if (json !== null && typeof json === 'object' && key in json) {
    const inner = (json as Record<string, unknown>)[key];
    return Array.isArray(inner) ? inner : [inner];
  }
  return [];
}

function parseAccount(raw: unknown): ApiAccount {
  // A single account may arrive wrapped as { account: {...} }: unwrap it.
  if (raw !== null && typeof raw === 'object' && !('id' in raw) && 'account' in raw) {
    return parseAccount((raw as Record<string, unknown>).account);
  }
  if (raw === null || typeof raw !== 'object' || !('id' in raw)) {
    throw new Error(`Unexpected account payload: ${JSON.stringify(raw)}`);
  }
  const r = raw as Record<string, unknown>;
  return {
    id: String(r.id),
    customerId: String(r.customerId),
    type: String(r.type),
    balanceCents: apiMoneyToCents(r.balance),
  };
}

/**
 * Thin client for ParaBank's REST API (services/bank/*).
 * "Raw" methods return the full ApiResult (use them for negative and tampering tests).
 * Typed helpers throw a readable error when the server does not answer as expected.
 */
export class ParaBankApi {
  constructor(private readonly ctx: APIRequestContext) {}

  async call(
    method: 'GET' | 'POST',
    path: string,
    options: { params?: Record<string, string>; data?: unknown } = {},
  ): Promise<ApiResult> {
    const response = await this.ctx.fetch(`services/bank/${path}`, {
      method,
      params: options.params,
      data: options.data,
      headers: { Accept: 'application/json' },
      failOnStatusCode: false,
    });
    const text = await response.text();
    let json: unknown = null;
    try {
      json = JSON.parse(text);
    } catch {
      // Not JSON (ParaBank answers some calls with plain text): leave json as null.
    }
    return { status: response.status(), ok: response.ok(), text, json };
  }

  private static need(result: ApiResult, what: string): ApiResult {
    if (!result.ok) {
      throw new Error(`${what} failed: HTTP ${result.status} ${result.text.slice(0, 200)}`);
    }
    return result;
  }

  // ---- raw calls (never throw on HTTP errors) ----
  login(username: string, password: string): Promise<ApiResult> {
    return this.call('GET', `login/${enc(username)}/${enc(password)}`);
  }

  getAccountRaw(accountId: string): Promise<ApiResult> {
    return this.call('GET', `accounts/${enc(accountId)}`);
  }

  transfer(fromId: string, toId: string, amountText: string): Promise<ApiResult> {
    return this.call('POST', 'transfer', {
      params: { fromAccountId: fromId, toAccountId: toId, amount: amountText },
    });
  }

  billPay(accountId: string, amountText: string, payee: Payee): Promise<ApiResult> {
    return this.call('POST', 'billpay', {
      params: { accountId, amount: amountText },
      data: {
        name: payee.name,
        address: { street: payee.address, city: payee.city, state: payee.state, zipCode: payee.zipCode },
        phoneNumber: payee.phone,
        accountNumber: payee.accountNumber,
      },
    });
  }

  createAccountRaw(customerId: number, type: 'CHECKING' | 'SAVINGS', fromId: string): Promise<ApiResult> {
    return this.call('POST', 'createAccount', {
      params: {
        customerId: String(customerId),
        newAccountType: type === 'CHECKING' ? '0' : '1',
        fromAccountId: fromId,
      },
    });
  }

  // ---- typed helpers (throw with status and body when the call fails) ----
  async customerIdFor(username: string, password: string): Promise<number> {
    const result = ParaBankApi.need(await this.login(username, password), 'API login');
    const id = (result.json as Record<string, unknown> | null)?.id;
    if (typeof id !== 'number') {
      throw new Error(`API login returned no numeric customer id: ${result.text.slice(0, 200)}`);
    }
    return id;
  }

  async accountsOf(customerId: number): Promise<ApiAccount[]> {
    const result = ParaBankApi.need(await this.call('GET', `customers/${customerId}/accounts`), 'List accounts');
    return asList(result.json, 'account').map(parseAccount);
  }

  async account(accountId: string): Promise<ApiAccount> {
    return parseAccount(ParaBankApi.need(await this.getAccountRaw(accountId), 'Get account').json);
  }

  async balanceCents(accountId: string): Promise<number> {
    return (await this.account(accountId)).balanceCents;
  }

  /** The balance exactly as the server sent it (a JSON number), for precision checks. */
  async rawBalance(accountId: string): Promise<number> {
    const json = ParaBankApi.need(await this.getAccountRaw(accountId), 'Get account').json;
    return Number((json as Record<string, unknown>).balance);
  }

  async createAccount(customerId: number, type: 'CHECKING' | 'SAVINGS', fromId: string): Promise<ApiAccount> {
    return parseAccount(
      ParaBankApi.need(await this.createAccountRaw(customerId, type, fromId), 'Create account').json,
    );
  }

  async transactions(accountId: string): Promise<ApiTransaction[]> {
    const result = ParaBankApi.need(await this.call('GET', `accounts/${enc(accountId)}/transactions`), 'List transactions');
    return asList(result.json, 'transaction').map((raw) => {
      const r = raw as Record<string, unknown>;
      return {
        id: String(r.id),
        type: String(r.type),
        amountCents: apiMoneyToCents(r.amount),
        description: String(r.description ?? ''),
      };
    });
  }
}
