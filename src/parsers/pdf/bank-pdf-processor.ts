import { AccountProduct, BankCode, Transaction } from '../../types';

export interface PdfProcessorDetectionInput {
  fileName?: string;
  text: string;
  productType?: AccountProduct;
}

export interface PdfParserContext {
  fileName?: string;
  statementYear?: number;
  statementMonth?: number;
  productType?: AccountProduct;
}

/**
 * Contrato para drivers específicos de faturas PDF por banco/produto.
 */
export interface BankPdfProcessor {
  canProcess(input: PdfProcessorDetectionInput): boolean;
  getBankName(): string;
  getBankCode(): BankCode;
  parseTransactions(text: string, context?: PdfParserContext): Transaction[];
}
