import { StatementFormat } from '../types';

/**
 * Detecta o formato de um extrato bancário
 */
export class FormatDetector {
  /**
   * Detecta o formato do conteúdo fornecido
   */
  static detect(content: Buffer | string): StatementFormat {
    const contentStr = typeof content === 'string' ? content : content.toString('utf-8', 0, 1000);

    // Detecta OFX
    if (this.isOFX(contentStr)) {
      return StatementFormat.OFX;
    }

    // Detecta PDF
    if (this.isPDF(content)) {
      return StatementFormat.PDF;
    }

    return StatementFormat.UNKNOWN;
  }

  /**
   * Verifica se o conteúdo é OFX
   */
  private static isOFX(content: string): boolean {
    const ofxPatterns = [/<OFX>/i, /OFXHEADER:/i, /<BANKMSGSRSV1>/i, /<STMTTRNRS>/i];

    return ofxPatterns.some((pattern) => pattern.test(content));
  }

  /**
   * Verifica se o conteúdo é PDF
   */
  private static isPDF(content: Buffer | string): boolean {
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
}
