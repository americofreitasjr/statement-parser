import * as fs from 'fs';
import * as path from 'path';
import { CarrefourPdfProcessor } from '../../src/parsers/pdf/banks/carrefour/carrefour-pdf-processor';
import { Transaction } from '../../src/types';

const FIXTURE_DIR = path.join(__dirname, '..', '..', 'fixtures', 'pdf', 'carrefour');

const toIsoDate = (value: unknown): string | undefined => {
  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }

  if (typeof value === 'string' && value.length >= 10) {
    return value.slice(0, 10);
  }

  return undefined;
};

const normalizeTransactions = (transactions: Transaction[]) =>
  transactions.map((tx) => {
    const normalized: Record<string, unknown> = {
      date: tx.date.toISOString().slice(0, 10),
      description: tx.description,
      amount: Number(tx.amount.toFixed(2)),
      type: tx.type,
      currency: tx.currency,
    };

    const metadata = tx.metadata as Record<string, unknown> | undefined;

    const cardLastFour = metadata?.['cardLastFour'];
    if (cardLastFour) {
      normalized.cardLastFour = cardLastFour;
    }

    const invoiceDueDate = toIsoDate(metadata?.['invoiceDueDate']);
    if (invoiceDueDate) {
      normalized.invoiceDueDate = invoiceDueDate;
    }

    const originalPurchaseDate = toIsoDate(metadata?.['originalPurchaseDate']);
    if (originalPurchaseDate) {
      normalized.originalPurchaseDate = originalPurchaseDate;
    }

    const currentInstallment =
      typeof metadata?.['currentInstallment'] === 'number'
        ? (metadata?.['currentInstallment'] as number)
        : undefined;
    if (currentInstallment !== undefined) {
      normalized.currentInstallment = currentInstallment;
    }

    const totalInstallments =
      typeof metadata?.['totalInstallments'] === 'number'
        ? (metadata?.['totalInstallments'] as number)
        : undefined;
    if (totalInstallments !== undefined) {
      normalized.totalInstallments = totalInstallments;
    }

    return normalized;
  });

const loadFixture = (name: string) => {
  const text = fs.readFileSync(path.join(FIXTURE_DIR, `${name}.txt`), 'utf8');
  const expected = JSON.parse(
    fs.readFileSync(path.join(FIXTURE_DIR, `${name}.expected.json`), 'utf8')
  );

  return { text, expected };
};

describe('CarrefourPdfProcessor', () => {
  const processor = new CarrefourPdfProcessor();

  it('detects Carrefour PDFs by nome do arquivo e conteúdo', () => {
    expect(processor.canProcess({ fileName: 'meu-cartao-carrefour.pdf', text: '' })).toBe(true);
    expect(
      processor.canProcess({
        fileName: 'extrato.pdf',
        text: 'FATURA MENSAL CARTÃO CARREFOUR emitida pelo BANCO CSF',
      })
    ).toBe(true);
  });

  it('não processa PDFs desconhecidos', () => {
    expect(
      processor.canProcess({
        fileName: 'extrato-desconhecido.pdf',
        text: 'Fatura mensal do banco XPTO',
      })
    ).toBe(false);
  });

  describe('fixtures reais', () => {
    const cases = fs
      .readdirSync(FIXTURE_DIR)
      .filter((file) => file.endsWith('.expected.json'))
      .map((file) => file.replace('.expected.json', ''))
      .sort();

    cases.forEach((fixtureName) => {
      it(`extrai corretamente as transações de ${fixtureName}`, () => {
        const { text, expected } = loadFixture(fixtureName);

        const transactions = processor.parseTransactions(text, {
          fileName: `${fixtureName}.pdf`,
        });

        expect(normalizeTransactions(transactions)).toEqual(expected);
      });
    });
  });
});
