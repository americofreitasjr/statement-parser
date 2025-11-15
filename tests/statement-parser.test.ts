import { StatementParser } from '../src/core/statement-parser';
import { StatementFormat, BankCode } from '../src/types';

describe('StatementParser', () => {
  let parser: StatementParser;

  beforeEach(() => {
    parser = new StatementParser();
  });

  describe('OFX parsing', () => {
    it('should detect OFX format', async () => {
      const ofxContent = `OFXHEADER:100
DATA:OFXSGML
VERSION:102
SECURITY:NONE
ENCODING:USASCII
CHARSET:1252
COMPRESSION:NONE
OLDFILEUID:NONE
NEWFILEUID:NONE

<OFX>
<SIGNONMSGSRSV1>
<SONRS>
<STATUS>
<CODE>0
<SEVERITY>INFO
</STATUS>
<DTSERVER>20231101120000
<LANGUAGE>POR
</SONRS>
</SIGNONMSGSRSV1>
<BANKMSGSRSV1>
<STMTTRNRS>
<TRNUID>1
<STATUS>
<CODE>0
<SEVERITY>INFO
</STATUS>
<STMTRS>
<CURDEF>BRL
<BANKACCTFROM>
<BANKID>260
<ACCTID>12345678
<ACCTTYPE>CHECKING
</BANKACCTFROM>
<BANKTRANLIST>
<DTSTART>20231001
<DTEND>20231031
<STMTTRN>
<TRNTYPE>DEBIT
<DTPOSTED>20231015
<TRNAMT>-50.00
<FITID>001
<MEMO>Pagamento Loja XYZ
</STMTTRN>
<STMTTRN>
<TRNTYPE>CREDIT
<DTPOSTED>20231020
<TRNAMT>1000.00
<FITID>002
<MEMO>Salário
</STMTTRN>
</BANKTRANLIST>
<LEDGERBAL>
<BALAMT>950.00
<DTASOF>20231031
</LEDGERBAL>
</STMTRS>
</STMTTRNRS>
</BANKMSGSRSV1>
</OFX>`;

      const result = await parser.parse(ofxContent);

      expect(result.format).toBe(StatementFormat.OFX);
      expect(result.account.bankCode).toBe(BankCode.NUBANK);
      expect(result.transactions.length).toBeGreaterThan(0);
    });
  });

  describe('PDF parsing', () => {
    it('should detect PDF format', async () => {
      const pdfContent = Buffer.from('%PDF-1.4\n%fake pdf content');

      const result = await parser.parse(pdfContent);

      expect(result.format).toBe(StatementFormat.PDF);
      expect(result.warnings).toBeDefined();
      expect(result.warnings?.length).toBeGreaterThan(0);
    });
  });

  describe('Format detection', () => {
    it('should throw error for unknown format', async () => {
      const invalidContent = 'This is not a valid statement format';

      await expect(parser.parse(invalidContent)).rejects.toThrow();
    });
  });
});
