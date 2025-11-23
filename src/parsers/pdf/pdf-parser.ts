import pdfParse from 'pdf-parse';
import { IParser } from '../../types/parser.interface';
import { ParseOptions, ParseResult, StatementFormat, BankCode } from '../../types';
import { ParseError } from '../../types/errors';
import { BankPdfProcessor, PdfProcessorDetectionInput } from './bank-pdf-processor';
import { CarrefourPdfProcessor } from './banks/carrefour/carrefour-pdf-processor';

/**
 * Parser para extratos em formato PDF
 */
export class PDFParser implements IParser {
  private readonly processors: BankPdfProcessor[];

  constructor(processors: BankPdfProcessor[] = [new CarrefourPdfProcessor()]) {
    this.processors = processors;
  }

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

  async parse(content: Buffer | string, options: ParseOptions = {}): Promise<ParseResult> {
    try {
      const text = await this.tryExtractPdfText(content);
      if (!text) {
        return this.buildFallbackResult(options, [
          'Não foi possível extrair o texto do PDF fornecido',
          'Parser PDF em desenvolvimento - nenhum driver processou o arquivo',
        ]);
      }

      const detectionInput: PdfProcessorDetectionInput = {
        fileName: options.fileName,
        text,
      };

      for (const processor of this.processors) {
        if (!processor.canProcess(detectionInput)) {
          continue;
        }

        const transactions = processor.parseTransactions(text, {
          fileName: options.fileName,
        });

        return {
          format: StatementFormat.PDF,
          account: {
            bankCode: processor.getBankCode(),
            bankName: processor.getBankName(),
          },
          transactions,
        };
      }

      return this.buildFallbackResult(options, [
        'Nenhum driver PDF reconheceu o conteúdo do arquivo',
      ]);
    } catch (error) {
      throw new ParseError(
        `Erro ao fazer parsing do arquivo PDF: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  private async tryExtractPdfText(content: Buffer | string): Promise<string | null> {
    if (typeof content === 'string' && !content.startsWith('%PDF')) {
      return content;
    }

    const buffer = typeof content === 'string' ? Buffer.from(content, 'binary') : content;

    try {
      const parsed = await pdfParse(buffer);
      return parsed.text;
    } catch {
      return null;
    }
  }

  private buildFallbackResult(options: ParseOptions, warnings: string[]): ParseResult {
    return {
      format: StatementFormat.PDF,
      account: {
        bankCode: options.bankCode || BankCode.UNKNOWN,
      },
      transactions: [],
      warnings,
    };
  }
}
