import * as fs from 'fs';
import * as path from 'path';
import { SantanderPdfProcessor } from '../../src/parsers/pdf/banks/santander/santander-pdf-processor';
import { Transaction } from '../../src/types';

const FIXTURE_DIR = path.join(__dirname, '..', '..', 'fixtures', 'pdf', 'santander');

const normalizeTransactions = (transactions: Transaction[]) =>
  transactions.map((tx) => ({
    date: tx.date.toISOString().slice(0, 10),
    description: tx.description,
    amount: Number(tx.amount.toFixed(2)),
    type: tx.type,
    currency: tx.currency,
  }));

const loadFixture = (name: string) => {
  const text = fs.readFileSync(path.join(FIXTURE_DIR, `${name}.txt`), 'utf8');
  const expected = JSON.parse(
    fs.readFileSync(path.join(FIXTURE_DIR, `${name}.expected.json`), 'utf8')
  );

  return { text, expected };
};

describe('SantanderPdfProcessor', () => {
  const processor = new SantanderPdfProcessor();

  it('detects Santander PDFs by nome do arquivo e conteúdo', () => {
    expect(processor.canProcess({ fileName: 'santander-extrato.pdf', text: '' })).toBe(true);
    expect(
      processor.canProcess({
        fileName: 'extrato.pdf',
        text: 'Plataforma de Atendimento Gerencial Santander Van Gogh',
      })
    ).toBe(true);
  });

  it('não processa PDFs desconhecidos', () => {
    expect(
      processor.canProcess({
        fileName: 'extrato-desconhecido.pdf',
        text: 'Relatório consolidado Banco XPTO',
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
