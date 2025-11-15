import { IParser } from '../../types/parser.interface';
import { ParseOptions, ParseResult, StatementFormat, BankCode } from '../../types';
import { ParseError } from '../../types/errors';

/**
 * Parser para extratos em formato PDF
 */
export class PDFParser implements IParser {
  canParse(content: Buffer | string): boolean {
    if (typeof content === 'string') {
      return content.startsWith('%PDF');
    }

    // Verifica os magic bytes do PDF
    return (
      content.length >= 4 &&
      content[0] === 0x25 && // %
      content[1] === 0x50 && // P
      content[2] === 0x44 && // D
      content[3] === 0x46 // F
    );
  }

  async parse(_content: Buffer | string, options: ParseOptions = {}): Promise<ParseResult> {
    try {
      // TODO: Implementar parsing real de PDF usando pdf-parse ou similar
      // Por enquanto, retorna estrutura básica

      const result: ParseResult = {
        format: StatementFormat.PDF,
        account: {
          bankCode: options.bankCode || BankCode.UNKNOWN,
        },
        transactions: [],
        warnings: [
          'Parser PDF em desenvolvimento - retornando dados de exemplo',
          'Parsing de PDF requer análise de layout específica por banco',
        ],
      };

      return result;
    } catch (error) {
      throw new ParseError(
        `Erro ao fazer parsing do arquivo PDF: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
}
