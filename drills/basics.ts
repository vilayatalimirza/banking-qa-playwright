import { parseMoney } from '../utils/money';

export interface Transaction {
  id: string;
  amountCents: number; // always positive; the direction comes from `type`
  type: 'DEBIT' | 'CREDIT';
  status: 'PENDING' | 'POSTED';
}

/** Net effect of POSTED transactions only, in cents (debits subtract, credits add). */
export function sumPostedTransactions(transactions: Transaction[]): number {
  return transactions
    .filter((transaction) => transaction.status === 'POSTED')
    .reduce((total, transaction) => total + (transaction.type === 'DEBIT' ? -transaction.amountCents : transaction.amountCents), 0);
}

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export async function comparePromiseTimings(): Promise<{ sequentialMs: number; parallelMs: number }> {
  const sequentialStart = performance.now();
  await sleep(1000);
  await sleep(1000);
  const sequentialMs = Math.round(performance.now() - sequentialStart);

  const parallelStart = performance.now();
  await Promise.all([sleep(1000), sleep(1000)]);
  const parallelMs = Math.round(performance.now() - parallelStart);

  return { sequentialMs, parallelMs };
}

async function main(): Promise<void> {
  console.log('0.1 + 0.2 =', 0.1 + 0.2);
  console.log('19.99 * 100 =', 19.99 * 100);
  console.log('parseMoney("$1,234.50") =', parseMoney('$1,234.50'));

  const txs: Transaction[] = [
    { id: '1', amountCents: 10000, type: 'CREDIT', status: 'POSTED' },
    { id: '2', amountCents: 2500, type: 'DEBIT', status: 'POSTED' },
    { id: '3', amountCents: 9900, type: 'DEBIT', status: 'PENDING' },
  ];
  console.log('Posted net cents (expect 7500):', sumPostedTransactions(txs));

  console.log('Timings:', await comparePromiseTimings());
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
