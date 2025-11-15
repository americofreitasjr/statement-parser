/**
 * Classe base para erros da biblioteca
 */
export class StatementParserError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'StatementParserError';
  }
}

/**
 * Erro quando o formato não é suportado ou não pode ser detectado
 */
export class UnsupportedFormatError extends StatementParserError {
  constructor(message = 'Formato de extrato não suportado ou não detectado') {
    super(message);
    this.name = 'UnsupportedFormatError';
  }
}

/**
 * Erro durante o parsing do conteúdo
 */
export class ParseError extends StatementParserError {
  constructor(message: string) {
    super(message);
    this.name = 'ParseError';
  }
}

/**
 * Erro de validação de dados
 */
export class ValidationError extends StatementParserError {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}
