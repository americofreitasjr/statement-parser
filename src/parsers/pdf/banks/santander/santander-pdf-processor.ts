import { BankCode, Transaction, TransactionType } from '../../../../types';
import {
  BankPdfProcessor,
  PdfParserContext,
  PdfProcessorDetectionInput,
} from '../../bank-pdf-processor';

interface StatementPeriod {
  statementYear: number;
  statementMonth?: number;
}

interface DateExtraction {
  date: Date;
  rest: string;
}

const MONTHS: Record<string, number> = {
  janeiro: 1,
  fevereiro: 2,
  marco: 3,
  março: 3,
  abril: 4,
  maio: 5,
  junho: 6,
  julho: 7,
  agosto: 8,
  setembro: 9,
  outubro: 10,
  novembro: 11,
  dezembro: 12,
};

export class SantanderPdfProcessor implements BankPdfProcessor {
  canProcess({ fileName, text }: PdfProcessorDetectionInput): boolean {
    const normalizedName = (fileName ?? '').toLowerCase();
    const normalizedText = text.toLowerCase();

    if (normalizedName.includes('santander')) {
      return true;
    }

    return (
      normalizedText.includes('santander van gogh') ||
      normalizedText.includes('extrato consolidado') ||
      normalizedText.includes('plataforma de atendimento gerencial')
    );
  }

  getBankName(): string {
    return 'Santander';
  }

  getBankCode(): BankCode {
    return BankCode.SANTANDER;
  }

  parseTransactions(text: string, context: PdfParserContext = {}): Transaction[] {
    const lines = text
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    const period = this.resolveStatementPeriod(context, text);
    const sectionLines = this.extractTransactionSection(lines);
    if (sectionLines.length === 0) {
      return [];
    }

    const transactions: Transaction[] = [];
    let lastDate: Date | null = null;
    let currentEntry: { date: Date; description: string[] } | null = null;

    for (let idx = 0; idx < sectionLines.length; idx += 1) {
      const line = sectionLines[idx];

      if (this.isHeaderLine(line)) {
        continue;
      }

      const saldoDate = this.extractSaldoDate(line, period);
      if (saldoDate) {
        lastDate = saldoDate;
        currentEntry = null;
        continue;
      }

      const dateInfo = this.extractDateFromLine(line, period);
      if (dateInfo) {
        lastDate = dateInfo.date;
        currentEntry = { date: dateInfo.date, description: [] };
        const rest = dateInfo.rest.trim();
        if (rest.length > 0) {
          const consumed = this.consumeContentSegment({
            segment: rest,
            nextLine: sectionLines[idx + 1],
            entry: currentEntry,
            transactions,
          });
          if (consumed.consumedNextLine) {
            idx += 1;
          }
          if (consumed.closedEntry) {
            currentEntry = null;
          }
        }
        continue;
      }

      const isDashLine = line === '-';
      if (!currentEntry) {
        if (!lastDate || this.isBalanceOnlyLine(line) || isDashLine) {
          continue;
        }
        currentEntry = { date: lastDate, description: [] };
      }

      const consumed = this.consumeContentSegment({
        segment: line,
        nextLine: sectionLines[idx + 1],
        entry: currentEntry,
        transactions,
      });

      if (consumed.consumedNextLine) {
        idx += 1;
      }

      if (consumed.closedEntry) {
        currentEntry = null;
      }
    }

    return transactions;
  }

  private consumeContentSegment({
    segment,
    nextLine,
    entry,
    transactions,
  }: {
    segment: string;
    nextLine?: string;
    entry: { date: Date; description: string[] };
    transactions: Transaction[];
  }): { consumedNextLine: boolean; closedEntry: boolean } {
    if (segment === '-' || this.isSaldoLabel(segment)) {
      return { consumedNextLine: false, closedEntry: false };
    }

    const amountInfo = this.extractAmount(segment);
    if (!amountInfo) {
      const normalized = this.normalizeDescriptionPart(segment);
      if (normalized && !/^\d+$/.test(normalized)) {
        entry.description.push(normalized);
      }
      return { consumedNextLine: false, closedEntry: false };
    }

    const prefix = amountInfo.prefix;
    if (prefix && !/^\d+$/.test(prefix)) {
      entry.description.push(prefix);
    }

    let amountValue = amountInfo.value;
    let consumedNextLine = false;
    const following = nextLine?.trim();

    if (amountValue >= 0 && (amountInfo.trailingMinus || following === '-')) {
      amountValue = -Math.abs(amountValue);
      if (following === '-') {
        consumedNextLine = true;
      }
    }

    transactions.push({
      date: entry.date,
      description: this.mergeDescription(entry.description),
      amount: Number(amountValue.toFixed(2)),
      type: amountValue >= 0 ? TransactionType.CREDIT : TransactionType.DEBIT,
      currency: 'BRL',
    });

    return { consumedNextLine, closedEntry: true };
  }

  private mergeDescription(parts: string[]): string {
    const text = parts.join(' ').replace(/\s+/g, ' ').trim();
    return text.length > 0 ? text : 'Movimentação Conta Santander';
  }

  private extractTransactionSection(lines: string[]): string[] {
    const headerIdx = lines.findIndex(
      (line, idx) =>
        line === 'Conta Corrente' &&
        lines[idx + 1]?.toLowerCase() === 'movimentação' &&
        (lines[idx + 2]?.replace(/\s/g, '') ?? '').startsWith('DataDescrição')
    );

    if (headerIdx === -1) {
      return [];
    }

    const start = headerIdx + 3;
    let end = lines.findIndex(
      (line, idx) =>
        idx > start &&
        (line.startsWith('Saldos por Período') ||
          line.startsWith('Investimentos') ||
          line.startsWith('Pacote de Serviços'))
    );

    if (end === -1) {
      end = lines.length;
    }

    return lines.slice(start, end);
  }

  private isHeaderLine(line: string): boolean {
    if (!line) {
      return true;
    }

    const normalized = line.replace(/\s+/g, '').toLowerCase();
    return (
      normalized === 'contacorrente' ||
      normalized === 'movimentação' ||
      normalized.startsWith('datadescrição') ||
      normalized.startsWith('salarmovimentação')
    );
  }

  private extractSaldoDate(line: string, period: StatementPeriod): Date | null {
    const match = line.replace(/\s+/g, '').match(/^SALDOEM(\d{2})\/(\d{2})/i);
    if (!match) {
      return null;
    }
    return this.buildDate(parseInt(match[1], 10), parseInt(match[2], 10), period);
  }

  private extractDateFromLine(line: string, period: StatementPeriod): DateExtraction | null {
    const normalized = line.replace(/^(\d{2})\/(\d{2})/, (_, day, month) => `__DATE__${day}/${month}`);
    if (!normalized.startsWith('__DATE__')) {
      return null;
    }

    const [, dayStr, monthStr, rest] = /^__DATE__(\d{2})\/(\d{2})(.*)$/.exec(normalized) ?? [];
    if (!dayStr || !monthStr) {
      return null;
    }

    const date = this.buildDate(parseInt(dayStr, 10), parseInt(monthStr, 10), period);
    return date ? { date, rest: rest ?? '' } : null;
  }

  private extractAmount(line: string): { value: number; prefix?: string; trailingMinus: boolean } | null {
    let workingLine = line.trim();

    workingLine = workingLine
      .replace(/^(\d{6})(?=\d)/, '')
      .replace(/(?<=\p{L})-(?=\d)/gu, ' ')
      .replace(/(,\d{2})(?=\d)/g, '$1 ');

    const amountRegex = /-?\d{1,3}(?:\.\d{3})*,\d{2}/g;
    const matches = [...workingLine.matchAll(amountRegex)];
    if (matches.length === 0) {
      return null;
    }

    const match = matches[0];
    const raw = match[0];
    const prefixSegment = workingLine.slice(0, match.index ?? 0).trim();
    const tail = workingLine.slice((match.index ?? 0) + raw.length).trim();
    const trailingMinus = tail.startsWith('-');

    const normalizedValue = parseFloat(raw.replace(/\./g, '').replace(',', '.'));
    const value = raw.startsWith('-') ? normalizedValue : Math.abs(normalizedValue);

    const prefix = prefixSegment.length > 0 ? prefixSegment : undefined;

    return { value, prefix, trailingMinus };
  }
  private resolveStatementPeriod(context: PdfParserContext, text: string): StatementPeriod {
    let statementYear = context.statementYear;
    let statementMonth = context.statementMonth;

    if (!statementYear || !statementMonth) {
      const lower = text.toLowerCase();
      const match =
        lower.match(/resumo\s*-\s*([a-zçã]+)\/(\d{4})/) ||
        lower.match(/extrato consolidado(?: inteligente)?\s*([a-zçã]+)\/(\d{4})/);

      if (match) {
        const monthName = match[1].normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        statementMonth = MONTHS[monthName] ?? statementMonth;
        statementYear = parseInt(match[2], 10);
      }
    }

    if (!statementYear) {
      statementYear = new Date().getFullYear();
    }

    return { statementYear, statementMonth };
  }

  private buildDate(day: number, month: number, period: StatementPeriod): Date | null {
    if (!period.statementYear) {
      return null;
    }

    let year = period.statementYear;
    if (period.statementMonth && month > period.statementMonth) {
      year -= 1;
    }

    const date = new Date(year, month - 1, day);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  private normalizeDescriptionPart(text: string): string {
    return text.replace(/\s+/g, ' ').trim();
  }

  private isSaldoLabel(line: string): boolean {
    return /^SALDO EM/i.test(line.replace(/\s+/g, ''));
  }

  private isBalanceOnlyLine(line: string): boolean {
    return /^-?\d{1,3}(?:\.\d{3})*,\d{2}$/.test(line);
  }
}
