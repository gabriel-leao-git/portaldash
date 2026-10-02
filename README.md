# PortalDash

> O dinheiro é público. A cobrança também.

Portal público, informativo e crítico sobre despesas públicas brasileiras. Sem
cadastro, login ou comentários. Cada número tem fonte, data e metodologia.

**Estado atual (0.1.0, não publicado):** dashboard Brasil com a União e os 27
estados lado a lado (sem soma), página estadual reutilizável, API pública
somente leitura e ingestão validada do Siconfi.

## Como funciona

```
Siconfi (Tesouro) ──► ingestão (processo separado, ≤ 1 req/1,5 s)
                         │ valida identidades, guarda o bruto, versiona
                         ▼
                    PostgreSQL ──► Next.js (páginas + /api/v1, só leitura)
```

O navegador nunca consulta a fonte oficial. Detalhes em
[docs/architecture.md](docs/architecture.md).

## Indicador

**Despesas pagas no exercício, acumuladas até o bimestre, exceto
intraorçamentárias** (RREO, Anexo 1, coluna "Despesas pagas até o bimestre"). A
escolha da linha principal é provisória até decisão editorial. Veja
[docs/methodology.md](docs/methodology.md) e o registro de validação
[docs/validacao-fonte-siconfi-2026-10.md](docs/validacao-fonte-siconfi-2026-10.md).

## Rodando localmente

Requisitos: Node.js 24 (>= 24.21.0) e pnpm 11 (o `packageManager` do
`package.json` fixa a versão). Docker não é necessário.

```bash
pnpm install
cp .env.example .env.local       # DATABASE_URL e INGEST_DATABASE_URL apontando para o banco local
pnpm db:dev                      # terminal 1: PostgreSQL local (porta 54329)
pnpm db:migrate                  # terminal 2
pnpm ingest --exercicios=2026 --entes=1,RJ   # coleta pequena (~10 requisições)
pnpm dev
```

Os scripts (`db:dev`, `db:migrate`, `ingest`) leem o `.env.local`
automaticamente. Para o banco local, use nas duas variáveis
`postgresql://postgres:portaldash@127.0.0.1:54329/portaldash`.

No Windows, mantenha o repositório num caminho curto (ex.: `C:\Users\voce\portaldash`):
o PostgreSQL embutido usado em `db:dev` e nos testes falha quando o caminho
completo dos seus arquivos passa de 260 caracteres.

## Qualidade

| Comando | O que faz |
| --- | --- |
| `pnpm lint` | ESLint (Next, React, TypeScript, acessibilidade) sem avisos |
| `pnpm typecheck` | gera os tipos de rota e roda `tsc --noEmit` |
| `pnpm test` | Vitest com PostgreSQL real (embutido ou `TEST_DATABASE_URL`) |
| `pnpm build` | build de produção |
| `pnpm check` | tudo acima, na ordem |

A CI (`.github/workflows/ci.yml`) roda a mesma sequência, mais `pnpm audit` e
varredura de segredos.

## API pública

`GET /api/v1/brasil`, `/api/v1/estados`, `/api/v1/estados/{uf}`,
`/api/v1/fontes`, `/api/v1/health`. Parâmetros: `ano`, `bimestre` (1–6) e
`conceito` (`pago`). Valores monetários vêm como string decimal. Contrato em
[docs/data-contract.md](docs/data-contract.md).

## Deploy (Railway)

Projeto "portal dash" no Railway: serviço web (só leitura), serviço cron de
ingestão (que também aplica as migrations) e PostgreSQL 18 com major fixo. As
configurações de cada serviço estão em
[docs/architecture.md](docs/architecture.md#deploy-no-railway).

## Documentação

- [AGENTS.md](AGENTS.md): regras de trabalho para pessoas e IAs
- [docs/](docs/): arquitetura, contrato de dados, metodologia, diretrizes
  editoriais, critérios de aceitação e segurança
- [CHANGELOG.md](CHANGELOG.md), [SECURITY.md](SECURITY.md),
  [CONTRIBUTING.md](CONTRIBUTING.md)
