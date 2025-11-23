/**
 * Formato do extrato bancário
 */
export enum StatementFormat {
  OFX = 'ofx',
  PDF = 'pdf',
  UNKNOWN = 'unknown',
}

/**
 * Tipo de transação bancária
 */
export enum TransactionType {
  DEBIT = 'debit',
  CREDIT = 'credit',
  TRANSFER = 'transfer',
  PAYMENT = 'payment',
  WITHDRAWAL = 'withdrawal',
  DEPOSIT = 'deposit',
  FEE = 'fee',
  INTEREST = 'interest',
  PIX = 'pix',
  OTHER = 'other',
}

/**
 * Produto/conta suportado pelo parser
 */
export enum AccountProduct {
  CHECKING = 'checking',
  SAVINGS = 'savings',
  CREDIT_CARD = 'credit_card',
  LOAN = 'loan',
  UNKNOWN = 'unknown',
}

/**
 * Instituição bancária
 */
export enum BankCode {
  NUBANK = '260',
  ITAU = '341',
  BRADESCO = '237',
  BANCO_DO_BRASIL = '001',
  SANTANDER = '033',
  CAIXA = '104',
  INTER = '077',
  C6 = '336',
  BTG = '208',
  SICREDI = '748',
  SICOOB = '756',
  CARREFOUR = '368',
  UNKNOWN = '000',
}

/**
 * Representa uma transação bancária normalizada
 */
export interface Transaction {
  /** Data da transação */
  date: Date;
  /** Descrição da transação */
  description: string;
  /** Valor da transação (positivo para crédito, negativo para débito) */
  amount: number;
  /** Tipo da transação */
  type: TransactionType;
  /** Saldo após a transação (opcional) */
  balance?: number;
  /** Moeda (padrão: BRL) */
  currency: string;
  /** ID único da transação (NSU, ID do banco, etc.) */
  transactionId?: string;
  /** Metadados adicionais específicos do banco */
  metadata?: Record<string, unknown>;
}

/**
 * Informações da conta bancária
 */
export interface AccountInfo {
  /** Código do banco */
  bankCode: BankCode;
  /** Nome do banco */
  bankName?: string;
  /** Produto/conta (cartão, corrente, etc.) */
  productType?: AccountProduct;
  /** Número da agência */
  branch?: string;
  /** Número da conta */
  accountNumber?: string;
  /** Tipo de conta (corrente, poupança, etc.) */
  accountType?: string;
  /** Titular da conta */
  holder?: string;
  /** Documento do titular (CPF/CNPJ) */
  document?: string;
}

/**
 * Resultado do parsing de um extrato
 */
export interface ParseResult {
  /** Formato detectado do extrato */
  format: StatementFormat;
  /** Informações da conta */
  account: AccountInfo;
  /** Lista de transações */
  transactions: Transaction[];
  /** Saldo inicial do período */
  openingBalance?: number;
  /** Saldo final do período */
  closingBalance?: number;
  /** Data inicial do período */
  periodStart?: Date;
  /** Data final do período */
  periodEnd?: Date;
  /** Avisos ou observações do parsing */
  warnings?: string[];
}

/**
 * Opções de parsing
 */
export interface ParseOptions {
  /** Formato esperado (se conhecido) */
  format?: StatementFormat;
  /** Código do banco (se conhecido) */
  bankCode?: BankCode;
  /** Produto/conta (cartão, corrente, poupança, etc.) */
  productType?: AccountProduct;
  /** Nome do arquivo original (usado para heurísticas de parsing) */
  fileName?: string;
  /** Timezone para normalização de datas (padrão: America/Sao_Paulo) */
  timezone?: string;
  /** Modo de depuração */
  debug?: boolean;
}
