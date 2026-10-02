# Segurança

## Como reportar

Encontrou uma vulnerabilidade ou um número publicado incorretamente? Abra um
[relatório privado de vulnerabilidade](https://github.com/gabriel-leao-git/portaldash/security/advisories/new)
no GitHub. Não abra issue pública com detalhes de exploração.

Inclua: o que encontrou, como reproduzir, impacto e, se possível, sugestão de
correção. Não realize testes que degradem o serviço, acessem dados de terceiros
ou ataquem as fontes governamentais consultadas pelo portal.

## Escopo

O portal é público e somente leitura: não há contas, senhas de usuários nem
dados pessoais de visitantes. Os ativos protegidos são a integridade dos
números, a disponibilidade, o banco de dados, as credenciais de deploy e a
cadeia de build.

## Política

- Vulnerabilidade crítica ou alta aplicável e não mitigada, exploração
  conhecida aplicável ou falha de integridade financeira bloqueia release.
- Exceções exigem decisão explícita do responsável pelo projeto, com
  justificativa, responsável e prazo.
- Achados e mitigação: [docs/security/findings.md](docs/security/findings.md).
  Modelo de ameaças e controles: [docs/security/](docs/security/).
- Relatório sem achados não prova ausência de vulnerabilidades.
