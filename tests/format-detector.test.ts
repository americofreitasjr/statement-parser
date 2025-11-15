import { FormatDetector } from '../src/core/format-detector';
import { StatementFormat } from '../src/types';

describe('FormatDetector', () => {
  describe('OFX detection', () => {
    it('should detect OFX format with OFXHEADER', () => {
      const content = 'OFXHEADER:100\nDATA:OFXSGML\n<OFX>...</OFX>';
      expect(FormatDetector.detect(content)).toBe(StatementFormat.OFX);
    });

    it('should detect OFX format with OFX tag', () => {
      const content = '<OFX><BANKMSGSRSV1>...</BANKMSGSRSV1></OFX>';
      expect(FormatDetector.detect(content)).toBe(StatementFormat.OFX);
    });
  });

  describe('PDF detection', () => {
    it('should detect PDF format from string', () => {
      const content = '%PDF-1.4\n%content here';
      expect(FormatDetector.detect(content)).toBe(StatementFormat.PDF);
    });

    it('should detect PDF format from Buffer', () => {
      const content = Buffer.from([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34]);
      expect(FormatDetector.detect(content)).toBe(StatementFormat.PDF);
    });
  });

  describe('Unknown format', () => {
    it('should return UNKNOWN for invalid content', () => {
      const content = 'This is just plain text';
      expect(FormatDetector.detect(content)).toBe(StatementFormat.UNKNOWN);
    });
  });
});
