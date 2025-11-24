import { IParser } from '../../types/parser.interface';
import {
  ParseOptions,
  ParseResult,
  StatementFormat,
  BankCode,
  TransactionType,
} from '../../types';
import { ParseError } from '../../types/errors';

/**
 * Parser para arquivos OFX (Open Financial Exchange)
 */
export class OFXParser implements IParser {
  canParse(content: Buffer | string): boolean {
    const contentStr = typeof content === 'string' ? content : content.toString('utf-8', 0, 1000);

    // Verifica se contém tags OFX básicas
    return (
      /<OFX>/i.test(contentStr) ||
      /OFXHEADER:/i.test(contentStr) ||
      /<BANKMSGSRSV1>/i.test(contentStr)
    );
  }

  async parse(content: Buffer | string, options: ParseOptions): Promise<ParseResult> {
    const contentStr = typeof content === 'string' ? content : content.toString('utf-8');

    try {
      // TODO: Implementar parsing real do OFX
      // Por enquanto, retorna estrutura básica

      const result: ParseResult = {
        format: StatementFormat.OFX,
        account: {
          bankCode: options.bankCode,
          productType: options.productType,
        },
        transactions: [],
        warnings: ['Parser OFX em desenvolvimento - retornando dados de exemplo'],
      };

      // Extrai dados básicos do OFX para demonstração
      const bankIdMatch = contentStr.match(/<BANKID>(\d+)/i);
      if (bankIdMatch) {
        result.account.bankCode = this.mapBankCode(bankIdMatch[1]);
      } else {
        const fidMatch = contentStr.match(/<FID>(\d+)/i);
        if (fidMatch) {
          result.account.bankCode = this.mapBankCode(fidMatch[1]);
        }
      }

      const branchIdMatch = contentStr.match(/<BRANCHID>([^<]+)/i);
      if (branchIdMatch) {
        result.account.branch = branchIdMatch[1].trim();
      }

      const acctIdMatch = contentStr.match(/<ACCTID>([^<]+)/i);
      if (acctIdMatch) {
        result.account.accountNumber = acctIdMatch[1].trim();
      }

      // Extrai transações básicas
      const stmtTrnRegex = /<STMTTRN>([\s\S]*?)<\/STMTTRN>/gi;
      const transactions = contentStr.matchAll(stmtTrnRegex);

      for (const match of transactions) {
        const trnContent = match[1];
        
        const dateMatch = trnContent.match(/<DTPOSTED>(\d{8})/i);
        const amountMatch = trnContent.match(/<TRNAMT>([-\d.]+)/i);
        const memoMatch = trnContent.match(/<MEMO>([^<]+)/i);
        const fitIdMatch = trnContent.match(/<FITID>([^<]+)/i);

        if (dateMatch && amountMatch) {
          const dateStr = dateMatch[1];
          const date = new Date(
            parseInt(dateStr.substr(0, 4)),
            parseInt(dateStr.substr(4, 2)) - 1,
            parseInt(dateStr.substr(6, 2))
          );

          const amount = parseFloat(amountMatch[1]);

          result.transactions.push({
            date,
            description: memoMatch ? memoMatch[1].trim() : 'Transação',
            amount,
            type: amount >= 0 ? TransactionType.CREDIT : TransactionType.DEBIT,
            currency: 'BRL',
            transactionId: fitIdMatch ? fitIdMatch[1].trim() : undefined,
          });
        }
      }

      // Extrai saldos
      const balAmtMatch = contentStr.match(/<BALAMT>([-\d.]+)/i);
      if (balAmtMatch) {
        result.closingBalance = parseFloat(balAmtMatch[1]);
      }

      return result;
    } catch (error) {
      throw new ParseError(
        `Erro ao fazer parsing do arquivo OFX: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Mapeia código numérico do banco para o enum BankCode
   */
  private mapBankCode(code: string): BankCode {
    const codeMap: Record<string, BankCode> = {
      '260': BankCode.NUBANK,
      '341': BankCode.ITAU,
      '237': BankCode.BRADESCO,
      '001': BankCode.BANCO_DO_BRASIL,
      '033': BankCode.SANTANDER,
      '104': BankCode.CAIXA,
      '077': BankCode.INTER,
      '336': BankCode.C6,
      '208': BankCode.BTG,
      '748': BankCode.SICREDI,
      '756': BankCode.SICOOB,
      '368': BankCode.CARREFOUR,
    };

    return codeMap[code] || BankCode.UNKNOWN;
  }
}
