import * as fs from 'fs';
import * as path from 'path';
import { CarrefourPdfProcessor } from '../../src/parsers/pdf/banks/carrefour/carrefour-pdf-processor';
import { Transaction } from '../../src/types';

const FIXTURE_DIR = path.join(__dirname, '..', '..', 'fixtures', 'pdf', 'carrefour');

const normalizeTransactions = (transactions: Transaction[]) =>
  transactions.map((tx) => ({
    date: tx.date.toISOString().slice(0, 10),
    description: tx.description,
    amount: Number(tx.amount.toFixed(2)),
    type: tx.type,
    currency: tx.currency,
    cardLastFour: tx.metadata?.cardLastFour,
  }));

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
    const cases = ['carrefour-202407', 'carrefour-202502', 'carrefour-202508', 'carrefour-202510'];

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
