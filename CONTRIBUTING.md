# Como contribuir

1. Leia o [AGENTS.md](AGENTS.md): ele traz os gatilhos obrigatórios antes de
   qualquer mudança e as regras de dados que não podem ser quebradas.
2. Crie um branch a partir de `main` e faça commits pequenos e coerentes.
3. Rode `pnpm check` antes de abrir o pull request.
4. Preencha o modelo de PR: problema, mudança, validação, impacto em dados e
   segurança, compatibilidade e evidência visual quando houver.
5. Atualize `CHANGELOG.md` (`[Unreleased]`) e a documentação afetada.

## Mensagens de commit

```
tipo(escopo): resumo objetivo

Motivo:
[problema e razão da mudança]

Alterações:
[comportamentos e decisões importantes]

Validação:
[comandos realmente executados e resultados]

Impacto:
[compatibilidade, dados, migrations ou segurança, quando relevante]
```

Tipos: `feat`, `fix`, `refactor`, `perf`, `test`, `docs`, `chore`, `ci`,
`build`. Quebra de contrato: `!` no título e `BREAKING CHANGE` no corpo.

## Não faça

- `eslint-disable`, `@ts-ignore`, `any`, teste removido ou `audit` ignorado
  para esconder problema.
- Comentários narrativos no código ou código comentado.
- Commits com segredos, `.env`, dados brutos grandes ou alterações alheias.
- Testes que consultam a fonte real (use as fixtures de `tests/fixtures`).
