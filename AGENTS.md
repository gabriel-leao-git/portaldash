<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# PortalDash — regras operacionais para pessoas e IAs

Portal público, sem login, sobre despesas públicas brasileiras. Gabriel define
direção e prioridades. Antes de qualquer mudança, leia este arquivo, o
[README](README.md), [docs/architecture.md](docs/architecture.md),
[docs/data-contract.md](docs/data-contract.md) e
[docs/methodology.md](docs/methodology.md).

## Gatilho obrigatório antes de alterar qualquer coisa

1. Leia os documentos acima e os arquivos que serão tocados.
2. Rode `git status` e preserve alterações de outras pessoas. Nada de reset
   destrutivo nem reescrita de histórico compartilhado.
3. Leia o `CHANGELOG.md` (seção `[Unreleased]`), a versão no `package.json` e o
   lockfile.
4. Declare objetivo, escopo e critérios observáveis de aceitação
   (modelo em [docs/acceptance.md](docs/acceptance.md)).
5. Identifique impacto em rotas, banco, metodologia, segurança e compatibilidade.
6. Escolha o menor incremento útil; não amplie para refatorações gerais.
7. Defina quais testes e checks cobrem o risco real.
8. Dependência nova ou atualizada: documentação, licença, advisories e
   quarentena de 24 h do pnpm (`minimumReleaseAge`).
9. Registre o impacto esperado no versionamento (sem publicar versão por tarefa).

## Gatilhos específicos

| Mudança | Exigências |
| --- | --- |
| Rota nova | Validar entrada por allowlist, só GET, resposta limitada, consulta parametrizada; testar válido, inválido e indisponível; nunca expor ingestão por HTTP. |
| Integração nova | Host e protocolo fixos; URL nunca derivada do visitante; timeout, limite de tamanho, redirect tratado como erro, retentativas limitadas; payload validado como entrada não confiável; testar duplicidade, retificação, fonte indisponível e lote incompleto; respeitar o limite da fonte. |
| Cálculo ou metodologia | Nova versão em `src/server/methodology/indicador.ts` e `docs/methodology.md`; reconciliar com a fonte; testar precisão, acumulados e dupla contagem; registrar correção se mudar número publicado. |
| Migration | `pnpm db:generate`, revisar o SQL, testar em banco descartável (`pnpm test`); mudança destrutiva só com plano de backup e autorização. |
| Dependência | Justificar, conferir licença e advisories, versão exata no `package.json`, lockfile atualizado, sem `--force`, repetir os checks. |
| Visual | Conferir 390 px e desktop, teclado, contraste, estados vazio/erro/parcial; não usar atributo `style` (o CSP bloqueia); gráfico sempre com tabela. |
| Pré-release | `pnpm check`, `pnpm audit`, varredura de segredos, changelog e versão, dados reconciliados, plano de recuperação. Não publicar sem autorização. |

## Regras de dados (não negociáveis)

- Valor monetário nunca vira float: texto exato da fonte → `src/lib/decimal.ts`
  ou `NUMERIC` no PostgreSQL. `parseFloat` é bloqueado pelo lint.
- Acumulados bimestrais não se somam; linha total não se soma com subcategorias.
- União, estados e municípios não se somam como "total do Brasil".
- Ausência de dado não é zero.
- Ingestão idempotente; falha da fonte não apaga a última versão válida;
  só versões que passam nas verificações ficam ativas.
- Não invente contrato, campo, valor, CVE, data ou conformidade.

## Comandos

```bash
pnpm install          # pelo lockfile
pnpm db:dev           # PostgreSQL local sem Docker (porta 54329)
pnpm db:migrate       # aplica migrations
pnpm ingest --exercicios=2026 --entes=1,RJ   # coleta controlada
pnpm dev              # site em http://localhost:3000
pnpm check            # lint + typecheck + test + build
```

## Commits

Mensagem explicativa (`tipo(escopo): resumo` + Motivo, Alterações, Validação,
Impacto). Sem comentários narrativos no código. Push, merge, tag e deploy só
com autorização explícita de Gabriel.
