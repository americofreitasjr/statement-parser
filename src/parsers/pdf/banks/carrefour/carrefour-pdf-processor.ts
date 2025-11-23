import {
  BankCode,
  Transaction,
  TransactionType,
} from '../../../../types';
import {
  BankPdfProcessor,
  PdfParserContext,
  PdfProcessorDetectionInput,
} from '../../bank-pdf-processor';

const DATE_LINE_REGEX = /^(\d{2})\/(\d{2})(.*)$/;
const CARD_NUMBER_REGEX = /\d{6}\*{6}(\d{4})/;

interface AmountParsingResult {
  value: number;
  isCredit: boolean;
}

interface StatementPeriod {
  statementYear: number;
  statementMonth?: number;
}

/**
 * Driver responsável por extrair transações das faturas PDF do Carrefour/Banco CSF.
 */
export class CarrefourPdfProcessor implements BankPdfProcessor {
  canProcess({ fileName, text }: PdfProcessorDetectionInput): boolean {
    const normalizedName = fileName?.toLowerCase() ?? '';
    const normalizedText = text.toLowerCase();

    if (normalizedName.includes('carrefour')) {
      return true;
    }

    return (
      normalizedText.includes('carrefour') ||
      normalizedText.includes('banco csf') ||
      normalizedText.includes('fatura mensal cartão carrefour')
    );
  }

  getBankName(): string {
    return 'Carrefour';
  }

  getBankCode(): BankCode {
    return BankCode.CARREFOUR;
  }

  parseTransactions(text: string, context: PdfParserContext = {}): Transaction[] {
    const lines = text
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    const sectionLines = this.extractTransactionSection(lines);
    if (sectionLines.length === 0) {
      return [];
    }

    const period = this.resolveStatementPeriod(context, text);
    const transactions: Transaction[] = [];
    let currentCardLastFour: string | undefined;
    let index = 0;

    while (index < sectionLines.length) {
      const line = sectionLines[index];

      const cardMatch = line.match(CARD_NUMBER_REGEX);
      if (cardMatch) {
        currentCardLastFour = cardMatch[1];
        index += 1;
        continue;
      }

      if (this.isSectionMarker(line)) {
        index += 1;
        continue;
      }

      const dateInfo = this.extractDateAndDescription(line);
      if (!dateInfo) {
        index += 1;
        continue;
      }

      index += 1;

      const descriptionParts: string[] = dateInfo.description ? [dateInfo.description] : [];

      while (
        index < sectionLines.length &&
        !DATE_LINE_REGEX.test(sectionLines[index]) &&
        !CARD_NUMBER_REGEX.test(sectionLines[index]) &&
        !this.isSectionMarker(sectionLines[index]) &&
        !this.isAmountLine(sectionLines[index])
      ) {
        descriptionParts.push(sectionLines[index]);
        index += 1;
      }

      if (index >= sectionLines.length || !this.isAmountLine(sectionLines[index])) {
        continue;
      }

      const amountLine = sectionLines[index];
      index += 1;

      const parsedAmount = this.parseAmount(amountLine);
      if (!parsedAmount) {
        continue;
      }

      const descriptionText = this.normalizeDescription(descriptionParts.join(' '));
      const date = this.buildTransactionDate(
        dateInfo.day,
        dateInfo.month,
        period.statementYear,
        period.statementMonth
      );

      if (!date) {
        continue;
      }

      const amountValue = parsedAmount.isCredit ? parsedAmount.value : -parsedAmount.value;
      const transactionType = parsedAmount.isCredit ? TransactionType.CREDIT : TransactionType.DEBIT;

      transactions.push({
        date,
        description: descriptionText,
        amount: Number(amountValue.toFixed(2)),
        type: transactionType,
        currency: 'BRL',
        metadata: currentCardLastFour ? { cardLastFour: currentCardLastFour } : undefined,
      });
    }

    return transactions;
  }

  private extractTransactionSection(lines: string[]): string[] {
    const startIndex = lines.findIndex((line) => line.includes('LANÇAMENTOS NO BRASIL'));
    if (startIndex === -1) {
      return [];
    }

    const endIndex = lines.findIndex((line, idx) => {
      if (idx <= startIndex) {
        return false;
      }

      return (
        line.startsWith('RESUMO DA FATURA') ||
        line.startsWith('PREVISÃO PARA FECHAMENTO') ||
        line.startsWith('SALDOS FUTUROS') ||
        line.startsWith('LIMITES EM R$') ||
        line.startsWith('TOTAL DA FATURA') ||
        line.startsWith('TOTAL DA FATURAR')
      );
    });

    if (endIndex === -1) {
      return lines.slice(startIndex + 1);
    }

    return lines.slice(startIndex + 1, endIndex);
  }

  private isSectionMarker(line: string): boolean {
    return (
      line.startsWith('DATADESCRIÇÃO') ||
      line.startsWith('SALDO FATURA ANTERIOR') ||
      line.startsWith('TOTAL DA FATURA') ||
      line.startsWith('TOTAL DA FATURAR') ||
      line.startsWith('Valor total de juros rotativo') ||
      line === '-' ||
      line === 'LANÇAMENTOS NO BRASIL'
    );
  }

  private extractDateAndDescription(line: string):
    | { day: number; month: number; description: string }
    | null {
    const match = DATE_LINE_REGEX.exec(line);
    if (!match) {
      return null;
    }

    return {
      day: parseInt(match[1], 10),
      month: parseInt(match[2], 10),
      description: match[3].trim(),
    };
  }

  private isAmountLine(line: string): boolean {
    const normalized = line.replace(/R\$/gi, '').trim();
    if (normalized === '-' || normalized.length === 0) {
      return true;
    }

    const compact = normalized.replace(/\s+/g, '');
    return /^\d{1,3}(?:\.\d{3})*,\d{2}-?$/.test(compact);
  }

  private parseAmount(line: string): AmountParsingResult | null {
    const normalized = line.replace(/R\$/gi, '').replace(/\s+/g, '');
    if (!normalized || normalized === '-') {
      return null;
    }

    const isCredit = normalized.endsWith('-');
    const numericPart = normalized.replace(/-$/, '');
    if (!/^\d{1,3}(?:\.\d{3})*,\d{2}$/.test(numericPart)) {
      return null;
    }

    const value = parseFloat(numericPart.replace(/\./g, '').replace(',', '.'));
    if (Number.isNaN(value)) {
      return null;
    }

    return { value, isCredit };
  }

  private normalizeDescription(rawDescription: string): string {
    const cleaned = rawDescription.replace(/\s+/g, ' ').trim();
    return cleaned.length > 0 ? cleaned : 'Transação Cartão Carrefour';
  }

  private buildTransactionDate(
    day: number,
    month: number,
    statementYear: number,
    statementMonth?: number
  ): Date | null {
    let year = statementYear;

    if (statementMonth && month > statementMonth) {
      year -= 1;
    }

    const date = new Date(year, month - 1, day);
    if (Number.isNaN(date.getTime())) {
      return null;
    }

    return date;
  }

  private resolveStatementPeriod(context: PdfParserContext, text: string): StatementPeriod {
    let statementYear = context.statementYear;
    let statementMonth = context.statementMonth;

    if ((!statementYear || !statementMonth) && context.fileName) {
      const fileMatch = context.fileName.match(/(\d{4})(\d{2})/);
      if (fileMatch) {
        const inferredYear = parseInt(fileMatch[1], 10);
        const inferredMonth = parseInt(fileMatch[2], 10);
        statementYear = statementYear ?? inferredYear;
        statementMonth = statementMonth ?? inferredMonth;
      }
    }

    if (!statementMonth || !statementYear) {
      const dueDate = this.extractDueDate(text);
      if (dueDate) {
        const dueMonth = dueDate.getMonth() + 1;
        const closingMonth = dueMonth === 1 ? 12 : dueMonth - 1;
        const closingYear = dueMonth === 1 ? dueDate.getFullYear() - 1 : dueDate.getFullYear();

        statementYear = statementYear ?? closingYear;
        statementMonth = statementMonth ?? closingMonth;
      }
    }

    if (!statementYear) {
      statementYear = this.extractYearFromText(text) ?? new Date().getFullYear();
    }

    return { statementYear, statementMonth };
  }

  private extractDueDate(text: string): Date | null {
    const match = text.match(/(\d{2})\/(\d{2})\/(\d{4})/);
    if (!match) {
      return null;
    }

    const day = parseInt(match[1], 10);
    const month = parseInt(match[2], 10) - 1;
    const year = parseInt(match[3], 10);

    const date = new Date(year, month, day);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  private extractYearFromText(text: string): number | null {
    const match = text.match(/(\d{4})/);
    if (!match) {
      return null;
    }

    return parseInt(match[1], 10);
  }
}
