import { ParseOptions, ParseResult } from '../types';

/**
 * Interface base para todos os parsers
 */
export interface IParser {
  /**
   * Verifica se o parser pode processar o conteúdo fornecido
   */
  canParse(content: Buffer | string): boolean;

  /**
   * Faz o parsing do conteúdo e retorna as transações normalizadas
   */
  parse(content: Buffer | string, options: ParseOptions): Promise<ParseResult>;
}
