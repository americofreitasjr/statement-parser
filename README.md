# Statement Parser
Biblioteca Node.js/TypeScript para transformar extratos bancários brasileiros em dados estruturados e confiáveis, prontos para ERPs, CRMs, ferramentas de conciliação e dashboards.

## Manifesto

### Visão
Dar aos devs brasileiros uma base sólida para interpretar qualquer extrato nacional e integrá-lo a produtos digitais sem gambiarras nem planilhas manuais.

### Propósito
Remover o trabalho repetitivo de “parsear extrato na unha”, oferecendo uma API única que lê PDF e OFX, normaliza e devolve transações consistentes.

### Por que existimos
Todo time que precisa ler extratos enfrenta o mesmo inferno: formatos proprietários, colunas que mudam por agência, datas localizadas, zero libs mantidas em Node/TypeScript. Statement Parser nasce para extinguir esse ciclo de scripts descartáveis.

### Problema que resolvemos
- PDFs proprietários com layouts imprevisíveis.
- Falta de padrão entre bancos e inexistência de uma lib que trate PDF + OFX em TypeScript.
- Normalização manual de datas, valores, saldos e tipos de operação a cada projeto.

### Princípios
- **Developer-first**: API clara, tipada e com exemplos reais.
- **Simplicidade**: um entrypoint para enviar arquivo + metadados e receber transações normalizadas.
- **Extensibilidade**: adaptadores por banco/format conectados via contratos explícitos.
- **Modularidade**: OFX, PDF e normalização evoluem em módulos independentes.
- **Precisão testável**: fixtures reais e suites dedicadas por banco.

### Estado atual do mercado
Hoje só existem scripts isolados dentro de squads, abandonados a cada reformulação de extrato. Não há pacote mantido, testado e aberto em TypeScript que resolva o problema ponta a ponta. Statement Parser alinha esforços e cria padrões.

### Chamado à comunidade
Precisamos de PRs, issues, fixtures, exemplos, novos bancos e novos formatos. Contribua com adaptadores, documentação e cenários reais para manter o ecossistema vivo para todo dev que já precisou “parsear extrato” em produção.

## Get Started

### Instalação

```bash
npm install @americofreitasjr/statement-parser
# ou
yarn add @americofreitasjr/statement-parser
```

### Exemplo (PDF Carrefour)

```typescript
import {
  StatementParser,
  StatementFormat,
  BankCode,
  AccountProduct,
} from '@americofreitasjr/statement-parser';
import * as fs from 'node:fs';

async function main() {
  const buffer = fs.readFileSync('./input/carrefour-202409.pdf');
  const parser = new StatementParser();

  const result = await parser.parse(buffer, {
    format: StatementFormat.PDF,
    bankCode: BankCode.CARREFOUR,
    productType: AccountProduct.CREDIT_CARD,
    fileName: 'carrefour-202409.pdf',
  });

  console.log(result.account);
  console.log(result.transactions[0]);
}

main();
/*
{
  bankCode: '368',
  bankName: 'Carrefour',
  productType: 'credit_card'
}
{
  date: 2024-09-01T00:00:00.000Z,
  description: 'CRF 2 RJB RIO BARRA - 9/20',
  amount: -190,
  type: 'debit',
  currency: 'BRL',
  metadata: {
    cardLastFour: '6745',
    invoiceDueDate: 2024-10-11T00:00:00.000Z,
    originalPurchaseDate: 2024-01-27T00:00:00.000Z,
    currentInstallment: 9,
    totalInstallments: 20
  }
}
*/
```

> 💡 `format`, `bankCode`, `productType` e `fileName` ajudam o parser a selecionar o adapter correto e a inferir datas/parcelas com mais precisão. Para outros produtos/bancos basta informar o enum correspondente.
> ⚠️ `StatementParser.parse` sempre exige `format`, `bankCode` e `productType` preenchidos; o parser lança `ParseError` se qualquer um estiver ausente ou como `UNKNOWN`.

### Usando buffers de outras fontes (ex.: S3)

`StatementParser.parse` aceita tanto `Buffer` quanto `string`. Se o PDF estiver no S3 (ou qualquer storage), basta encaminhar o `Buffer` que você já possui:

```typescript
import {
  StatementParser,
  StatementFormat,
  BankCode,
  AccountProduct,
} from '@americofreitasjr/statement-parser';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';

const parser = new StatementParser();
const s3 = new S3Client({ region: 'sa-east-1' });

const { Body } = await s3.send(
  new GetObjectCommand({ Bucket: 'extratos', Key: 'carrefour-202409.pdf' })
);
const byteArray = await Body?.transformToByteArray();

if (!byteArray) throw new Error('PDF não encontrado');

const result = await parser.parse(Buffer.from(byteArray), {
  format: StatementFormat.PDF,
  bankCode: BankCode.CARREFOUR,
  productType: AccountProduct.CREDIT_CARD,
  fileName: 'carrefour-202409.pdf',
});
```

### Suporte atual

| Banco | Produto | Formato | Status | Detalhes |
| --- | --- | --- | --- | --- |
| Carrefour (Banco CSF) | Cartão de crédito | PDF | ✅ MVP disponível | Driver lê “LANÇAMENTOS NO BRASIL”, normaliza parcelas para o dia 01, expõe `invoiceDueDate`, `originalPurchaseDate`, `currentInstallment`, `totalInstallments` e `cardLastFour`. |
| Santander | Conta corrente PF | PDF | ✅ MVP disponível | Driver interpreta o bloco “Conta Corrente / Movimentação”, trata doc number + valor na mesma linha e normaliza PIX/REMUNERAÇÃO/aplicações para transações básicas. |

- Novos bancos e produtos entram por meio de novos adapters (abra uma issue/PR com seus PDFs/OFX).
- Mantenha seus arquivos reais em `input/` (gitignored) e gere fixtures + expected antes de enviar PRs.

## Como contribuir
Abra issues com amostras de extratos, descreva desafios específicos e envie PRs com parsers, fixtures e testes. Precisamos de ajuda para cobrir novos bancos, revisar normalizações e evoluir o roadmap de forma transparente—participe, proponha ideias e mantenha o Statement Parser pulsando.
