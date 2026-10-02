# Changelog

Todas as mudanças relevantes do PortalDash ficam registradas aqui.

O formato segue o [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/) e
o projeto usa [Versionamento Semântico](https://semver.org/lang/pt-BR/).

Política durante a fase 0.x: PATCH para correções compatíveis; MINOR para
funcionalidades novas ou quebras de contrato, sempre destacadas aqui. O
contrato público é a API `/api/v1`, o significado dos indicadores e as
exportações. A versão da metodologia é independente da versão do software. A
1.0.0 só sai quando o contrato público for considerado estável.

## [Unreleased]

Impacto SemVer proposto para a primeira release: 0.1.0 (primeira
funcionalidade pública). Metodologia 0.1.0.

### Added

- Ingestão do Siconfi (RREO Anexo 1 e extrato de entregas) para União, 26
  estados e DF: cliente com host fixo, intervalo mínimo de 1,5 s entre
  requisições, desaceleração ao receber HTTP 429, limite de tamanho e números
  lidos sem passar por float.
- Armazenamento versionado: resposta bruta, histórico de status das entregas,
  uma versão ativa por declaração com troca transacional; versões que falham
  nas verificações ficam rejeitadas e a anterior continua publicada.
- Metodologia 0.1.0: despesas pagas no exercício, acumuladas até o bimestre,
  exceto intraorçamentárias, com composição por grupo de natureza (oculta se
  os grupos não conferirem com o total). Linha principal provisória até
  decisão editorial.
- Retificações: mudança de status no extrato dispara nova coleta; com
  conteúdo igual, a declaração continua sendo conferida por 10 dias antes de
  aceitar o novo status.
- API pública somente leitura: `/api/v1/brasil`, `/api/v1/estados`,
  `/api/v1/estados/{uf}`, `/api/v1/fontes` e `/api/v1/health`, com quatro
  situações explícitas de ausência de dado (nunca zero).
- Páginas: dashboard Brasil, lista e página de cada estado, metodologia, fontes
  e sobre, com períodos na URL, tabelas alternativas aos gráficos e estados de
  vazio, erro e dados parciais.
- Segurança: CSP com nonce, cabeçalhos de segurança, papel de banco somente
  leitura para o site (provisionado pelas migrations) além da sessão somente
  leitura, migrations só no serviço de ingestão, CI com auditoria de
  dependências e varredura de segredos (gitleaks 8.30.1, histórico completo).
- Deploy: configuração dos serviços do Railway documentada em
  `docs/architecture.md` (sem `railway.json`, descontinuado pelo Railway),
  com deploy automático do `main` só depois da CI.
- Documentação: arquitetura, contrato de dados, metodologia, diretrizes
  editoriais, critérios de aceitação, registro da validação da fonte com
  evidências e documentos de segurança.
