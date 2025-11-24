import * as fs from 'fs';
import * as path from 'path';
import {
  StatementParser,
  StatementFormat,
  BankCode,
  AccountProduct,
  Transaction,
} from '../../src';

const FIXTURE_DIR = path.join(__dirname, '..', '..', 'fixtures', 'ofx');

const normalizeTransactions = (transactions: Transaction[]) =>
  transactions.map((tx) => ({
    date: tx.date.toISOString().slice(0, 10),
    description: tx.description,
    amount: Number(tx.amount.toFixed(2)),
    type: tx.type,
    currency: tx.currency,
  }));

const loadExpected = (name: string) =>
  JSON.parse(fs.readFileSync(path.join(FIXTURE_DIR, `${name}.expected.json`), 'utf8'));

describe('OFX fixtures', () => {
  const parser = new StatementParser();

  const cases = [
    {
      name: 'bradesco-conta-corrente',
      options: { bankCode: BankCode.BRADESCO, productType: AccountProduct.CHECKING },
    },
    {
      name: 'itau-conta-corrente',
      options: { bankCode: BankCode.ITAU, productType: AccountProduct.CHECKING },
    },
    {
      name: 'nubank-conta-corrente',
      options: { bankCode: BankCode.NUBANK, productType: AccountProduct.CHECKING },
    },
    {
      name: 'nubank-cartao-credito',
      options: { bankCode: BankCode.NUBANK, productType: AccountProduct.CREDIT_CARD },
    },
  ];

  cases.forEach(({ name, options }) => {
    it(`normaliza ${name}`, async () => {
      const buffer = fs.readFileSync(path.join(FIXTURE_DIR, `${name}.ofx`));
      const expected = loadExpected(name);

      const result = await parser.parse(buffer, {
        ...options,
        format: StatementFormat.OFX,
      });

      expect(normalizeTransactions(result.transactions)).toEqual(expected);
    });
  });
});
