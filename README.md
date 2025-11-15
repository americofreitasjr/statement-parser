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
