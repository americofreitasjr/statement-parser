# Statement Parser - Estrutura do Projeto

Este documento descreve a arquitetura e organização do projeto.

## Estrutura de Diretórios

```
statement-parser/
├── src/
│   ├── core/                    # Componentes principais
│   │   ├── statement-parser.ts  # Parser principal com detecção de formato
│   │   └── format-detector.ts   # Detecção automática de formato
│   ├── parsers/                 # Parsers específicos por formato
│   │   ├── ofx/
│   │   │   └── ofx-parser.ts    # Parser OFX genérico
│   │   └── pdf/
│   │       └── pdf-parser.ts    # Parser PDF base
│   ├── normalizers/             # Normalização de dados
│   ├── types/                   # Definições de tipos TypeScript
│   │   ├── index.ts             # Tipos principais (Transaction, ParseResult, etc.)
│   │   ├── parser.interface.ts  # Interface IParser
│   │   └── errors.ts            # Classes de erro customizadas
│   └── index.ts                 # Entry point da biblioteca
├── tests/                       # Testes unitários e de integração
│   ├── statement-parser.test.ts
│   └── format-detector.test.ts
├── fixtures/                    # Exemplos de extratos para testes
├── .github/
│   └── workflows/               # Pipelines CI/CD
│       ├── ci.yml               # Testes e build
│       └── release.yml          # Publicação NPM
└── dist/                        # Build output (gerado)
```

## Arquitetura

### Pipeline Principal

1. **StatementParser** (src/core/statement-parser.ts)
   - Entry point principal
   - Requer `ParseOptions` com `format`, `bankCode` e `productType`
   - Delega para parser apropriado (OFX ou PDF)
   - Retorna ParseResult normalizado

2. **FormatDetector** (src/core/format-detector.ts)
   - Detecta formato do arquivo (OFX, PDF, UNKNOWN)
   - Usa magic bytes e padrões de conteúdo

3. **Parsers Específicos**
   - Implementam interface IParser
   - OFXParser: parsing de arquivos OFX
   - PDFParser: parsing de arquivos PDF

### Tipos e Interfaces

- **Transaction**: Representa uma transação normalizada
- **ParseResult**: Resultado completo do parsing
- **ParseOptions**: Opções de configuração do parsing
- **IParser**: Interface que todos os parsers devem implementar

## Uso Básico

```typescript
import {
  StatementParser,
  StatementFormat,
  BankCode,
  AccountProduct,
} from '@americofreitasjr/statement-parser';

const parser = new StatementParser();
const result = await parser.parse(fileContent, {
  format: StatementFormat.OFX,
  bankCode: BankCode.ITAU,
  productType: AccountProduct.CHECKING,
});

console.log(result.transactions);
```

## Desenvolvimento

### Instalar dependências
```bash
npm install
```

### Rodar testes
```bash
npm test
```

### Build
```bash
npm run build
```

### Linting
```bash
npm run lint
npm run lint:fix
```

## Próximos Passos

1. Implementar parsing real de OFX (atualmente stub)
2. Implementar parsing real de PDF (atualmente stub)
3. Adicionar parsers específicos por banco
4. Implementar normalização avançada
5. Adicionar mais testes com fixtures reais
