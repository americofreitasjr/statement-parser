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

- Novos bancos e produtos entram por meio de novos adapters (abra uma issue/PR com seus PDFs/OFX).
- Mantenha seus arquivos reais em `input/` (gitignored) e gere fixtures + expected antes de enviar PRs.

## Roadmap

### 1. Suporte por Formato
O projeto é dividido em camadas:

- **Core (TypeScript)**: pipeline central, tipagens e motores de IO.
- **Modelo de dados unificado**: entidade única de transação para todas as contas.
- **Interfaces de parsers**: contratos para plug de parsers OFX/PDF.
- **Normalização**: datas, valores, tipo de operação, saldo, moeda e metadados.

#### OFX (Fase 1)
- Parser genérico OFX (FEBRABAN/OFX 1.x).
- Ajustes específicos apenas quando bancos fogem do padrão.
- Metas: timezone coerente, moeda, saldos inicial/final e agrupamento por conta.

#### PDF (Fase 2)
- Uso de bibliotecas de extração de texto/estrutura (pdf.js, pdf-parse, etc.).
- Parsers específicos por layout com validação de colunas e múltiplas páginas.
- Adapters plugáveis por instituição, permitindo evolução independente.

### 2. Roadmap por Banco
Para OFX, teremos um parser comum com pequenos ajustes por banco. Para PDF, cada layout vira um módulo dedicado.

#### OFX
| Banco | Status | Principais desafios | Marco da primeira versão | Prioridade |
| --- | --- | --- | --- | --- |
| Nubank | Em desenvolvimento | Campos customizados de categoria e cartão | MVP: data, descrição, valor e saldo de conta corrente | Alta |
| Itaú | Em desenvolvimento | Tags proprietárias e múltiplas contas em um arquivo | MVP: leitura segmentada por conta e operação | Alta |
| Bradesco | Em pesquisa | Variações por agência e multi-moeda | MVP: normalização de moeda e tipo de lançamento | Alta |
| Banco do Brasil | Em pesquisa | Campos opcionais e descrições truncadas | MVP: reconstrução de descrição completa e NSU | Alta |
| Santander | Planejado | OFX com saldo projetado e timezone instável | MVP: alinhamento de datas com TZ correto | Média |
| Caixa Econômica Federal | Planejado | Compatibilidade parcial com OFX 1.0 | MVP: leitura básica de conta corrente | Média |
| Banco Inter | Em pesquisa | Tags proprietárias com saldo diário | MVP: normalização de saldo diário vs final | Média |
| C6 Bank | Planejado | Multicontas no mesmo OFX em ordem variável | MVP: segmentação automática por conta | Média |
| BTG Pactual | Planejado | Campos de investimento acoplados | MVP: filtrar apenas conta corrente | Baixa |
| Sicredi | Planejado | Layout regionalizado | MVP: normalização de datas dd/MM | Baixa |
| Sicoob | Planejado | OFX parcial sem saldo final | MVP: cálculo de saldo via transações | Baixa |

#### PDF
| Banco | Status | Principais desafios | Marco da primeira versão | Prioridade |
| --- | --- | --- | --- | --- |
| Nubank | Em desenvolvimento | Colunas dinâmicas e múltiplas páginas | MVP: extração de data, descrição, valor e saldo consolidado | Alta |
| Itaú | Em desenvolvimento | Layouts diferentes por produto (PF/PJ) | MVP: parser PF com coluna de saldo | Alta |
| Bradesco | Em pesquisa | Linhas agrupadas e resumos intermediários | MVP: separar movimentos reais do resumo | Alta |
| Banco do Brasil | Em pesquisa | Cabeçalhos complexos e campos duplicados | MVP: leitura confiável de data, histórico e valor | Alta |
| Carrefour (Banco CSF) | ✅ MVP disponível | Parcelas usam data da compra e não do período; múltiplos cartões na mesma fatura | MVP: normalizar parcelas, enriquecer metadata com vencimento e cartão | Alta |
| Santander | Planejado | Notas de rodapé interferindo no fluxo | MVP: descarte inteligente de rodapés | Média |
| Caixa Econômica Federal | Planejado | Layout em grid com caixas posicionais | MVP: mapear colunas e saldo final | Média |
| Banco Inter | Em pesquisa | Colunas de saldo parcial a cada linha | MVP: reconciliar saldo após cada lançamento | Média |
| C6 Bank | Planejado | Blocos múltiplos por página | MVP: identificar blocos e consolidar transações | Média |
| BTG Pactual | Planejado | Mistura de operações de investimento | MVP: isolar transações de conta corrente | Baixa |
| Sicredi | Planejado | Layout cooperativo com campos localizados | MVP: padronizar tipos de operação | Baixa |
| Sicoob | Planejado | PDFs escaneados em alguns canais | MVP: parser para versão digital nativa | Baixa |

### 3. Extensões Futuras
- Suporte a PIX (identificação de chaves/NSU na descrição).
- Integração com Open Finance via agregadores (Pluggy, Belvo, Klavi, etc.).
- Enriquecimento de dados com categorias, tags e mapeamento de estabelecimentos.
- Classificação automática baseada em regras declarativas.
- Export para CSV, JSONL, Parquet e streams.
- CLI `statement-parser` para processar lotes.
- Integrações com ferramentas de BI e data pipelines.

## Como contribuir
Abra issues com amostras de extratos, descreva desafios específicos e envie PRs com parsers, fixtures e testes. Precisamos de ajuda para cobrir novos bancos, revisar normalizações e evoluir o roadmap de forma transparente—participe, proponha ideias e mantenha o Statement Parser pulsando.

### Adapters PDF atuais

- **Carrefour (Banco CSF)**: driver em `src/parsers/pdf/banks/carrefour`. Ele:
  - Ajusta o campo `date` de parcelas para o dia **01** do mês vigente da fatura.
  - Mantém `metadata.originalPurchaseDate` com a data real da compra, além das chaves `currentInstallment`, `totalInstallments`, `invoiceDueDate` e `cardLastFour`.
  - Usa fixtures reais em `fixtures/pdf/carrefour/*.txt` e expected outputs em `.expected.json`. Gere novos expected usando o próprio driver (por exemplo, lendo os PDFs em `input/` e salvando o JSON gerado) para garantir que os testes (`tests/pdf/carrefour-pdf-processor.test.ts`) cubram cada mês.
  - Os PDFs reais ficam fora do versionamento dentro de `input/` (listado no `.gitignore`).
  - Para reduzir exposição de PII, apenas a amostra anonimizada `carrefour-202407` permanece versionada; mantenha seus demais fixtures/expected (reais) localmente e gere-os quando necessário.
