import { ParseOptions, ParseResult, StatementFormat } from '../types';
import { IParser } from '../types/parser.interface';
import { UnsupportedFormatError } from '../types/errors';
import { FormatDetector } from './format-detector';
import { OFXParser } from '../parsers/ofx/ofx-parser';
import { PDFParser } from '../parsers/pdf/pdf-parser';

/**
 * Parser principal que detecta o formato e delega para o parser apropriado
 */
export class StatementParser {
  private parsers: Map<StatementFormat, IParser>;

  constructor() {
    this.parsers = new Map();
    this.registerDefaultParsers();
  }

  /**
   * Registra os parsers padrão
   */
  private registerDefaultParsers(): void {
    this.parsers.set(StatementFormat.OFX, new OFXParser());
    this.parsers.set(StatementFormat.PDF, new PDFParser());
  }

  /**
   * Registra um parser customizado para um formato específico
   */
  registerParser(format: StatementFormat, parser: IParser): void {
    this.parsers.set(format, parser);
  }

  /**
   * Faz o parsing de um extrato bancário
   * @param content Conteúdo do extrato (Buffer ou string)
   * @param options Opções de parsing
   * @returns Resultado do parsing com transações normalizadas
   */
  async parse(content: Buffer | string, options: ParseOptions = {}): Promise<ParseResult> {
    // Detecta o formato se não foi especificado
    const format = options.format || FormatDetector.detect(content);

    if (format === StatementFormat.UNKNOWN) {
      throw new UnsupportedFormatError();
    }

    // Obtém o parser apropriado
    const parser = this.parsers.get(format);
    if (!parser) {
      throw new UnsupportedFormatError(`Parser não encontrado para o formato: ${format}`);
    }

    // Valida se o parser pode processar o conteúdo
    if (!parser.canParse(content)) {
      throw new UnsupportedFormatError(
        `O parser ${format} não conseguiu processar o conteúdo fornecido`
      );
    }

    // Executa o parsing
    return parser.parse(content, options);
  }
}
