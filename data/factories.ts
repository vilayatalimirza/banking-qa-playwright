import { randomUUID } from 'node:crypto';

// Synthetic data only. Never put real personal or financial details in test data.

export interface Customer {
  firstName: string;
  lastName: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  phone: string;
  ssn: string;
  username: string;
  password: string;
}

/** A valid new customer. Override any field to build a deliberately invalid one. */
export function buildCustomer(overrides: Partial<Customer> = {}): Customer {
  return {
    firstName: 'QA',
    lastName: 'Tester',
    address: '123 Test Street',
    city: 'Testville',
    state: 'CA',
    zipCode: '90210',
    phone: '5551234567',
    ssn: '123456789',
    // Random suffix: safe even when parallel workers register in the same millisecond.
    username: `qa_${randomUUID().slice(0, 8)}`,
    password: 'TestPass123',
    ...overrides,
  };
}

export interface Payee {
  name: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  phone: string;
  accountNumber: string;
}

export function buildPayee(overrides: Partial<Payee> = {}): Payee {
  return {
    name: `Test Utilities ${randomUUID().slice(0, 4)}`,
    address: '1 Utility Road',
    city: 'Billtown',
    state: 'NY',
    zipCode: '10001',
    phone: '5559876543',
    accountNumber: '54321',
    ...overrides,
  };
}
