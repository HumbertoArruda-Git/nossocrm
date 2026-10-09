# Security Checklist

Checklist operacional reutilizável para desenvolvimento, auditoria, staging, produção e proteção de dados pessoais.

> Use junto do `SECURITY_PLAYBOOK.md` e, para executar a auditoria, do `SECURITY_AUDIT_RUNBOOK.md`. Marcar uma caixa exige evidência: link para diff, configuração, teste, log, relatório ou decisão registrada. Este checklist não substitui análise jurídica especializada, DPO/encarregado ou requisitos setoriais.

## Controle do documento

- [ ] Projeto, ambiente e versão/commit foram registrados.
- [ ] Responsável técnico, responsável pelo produto e responsável por privacidade foram identificados.
- [ ] Escopo, exclusões e limitações foram documentados.
- [ ] Dados reais foram excluídos do material de auditoria quando não necessários.
- [ ] Evidências foram armazenadas em local com acesso controlado.

---

# FASE A - Antes de desenvolver

## A1. Governança e requisitos

- [ ] Objetivos de confidencialidade, integridade, disponibilidade, autenticidade e rastreabilidade foram definidos.
- [ ] Requisitos de segurança foram escritos como requisitos verificáveis.
- [ ] Requisitos de privacidade e LGPD foram identificados com jurídico/DPO quando aplicável.
- [ ] Requisitos setoriais, contratuais e de órgão público foram levantados quando aplicável.
- [ ] Critérios de `SECURITY_GATE = PASS` foram definidos.
- [ ] Criticidade dos ativos e impactos de indisponibilidade foram registrados.
- [ ] Processo de incidentes e contatos de escalonamento foram definidos.

## A2. Threat model

- [ ] Ativos foram inventariados.
- [ ] Usuários, administradores, service accounts, workers e agentes de IA foram listados.
- [ ] Perfis, roles e permissões foram definidos.
- [ ] Trust boundaries foram desenhadas.
- [ ] Superfícies de ataque foram listadas.
- [ ] Fluxos de dados foram mapeados.
- [ ] Integrações externas e efeitos colaterais foram registrados.
- [ ] Ameaças de autenticação, autorização, IDOR/BOLA e elevação de privilégio foram consideradas.
- [ ] Ameaças de tenant crossing foram consideradas.
- [ ] Ameaças de upload, exportação, webhook e replay foram consideradas.
- [ ] Ameaças específicas de IA, prompt injection e tool injection foram consideradas.
- [ ] Cada ameaça tem impacto, probabilidade, controle e teste.

## A3. Data map e LGPD

- [ ] Cada dado foi associado a uma finalidade específica.
- [ ] Origem, armazenamento, acesso, compartilhamento, retenção e exclusão foram registrados.
- [ ] Dados pessoais foram identificados.
- [ ] Dados pessoais sensíveis foram identificados.
- [ ] Crianças e adolescentes foram considerados quando aplicável.
- [ ] Base legal foi documentada ou encaminhada para validação jurídica.
- [ ] Controlador, operador, suboperadores e encarregado/DPO foram avaliados.
- [ ] Transferência internacional foi identificada e encaminhada para análise quando aplicável.
- [ ] Campos desnecessários foram removidos ou tornados opcionais.
- [ ] Cópias em logs, cache, backup, Storage, exports e IA foram incluídas no mapa.

## A4. Modelo de identidade e tenant

- [ ] Fluxos de signup, login, invite, reset e logout foram definidos.
- [ ] MFA foi avaliado para perfis privilegiados.
- [ ] RBAC, ABAC ou combinação foram documentados.
- [ ] Roles não podem ser criadas ou alteradas por metadata controlável pelo usuário.
- [ ] Tenant é derivado de contexto confiável.
- [ ] Relações indiretas de tenant foram identificadas.
- [ ] Admins, service accounts e owners têm escopos explícitos.
- [ ] Operações privilegiadas exigem autenticação e autorização separadas.
- [ ] Casos de impersonação e suporte foram definidos e auditáveis.
- [ ] Todas as portas de criação de usuário (signup, convite, setup, instalador, importação) foram listadas; papel e tenant vêm só de fonte controlada pelo servidor (ex.: `app_metadata`), nunca de `user_metadata`.
- [ ] Cadastro público fica desligado até o isolamento por tenant estar provado no ambiente onde ele será ligado.

## A5. Arquitetura e dependências

- [ ] Fronteiras entre frontend, backend, banco e integrações foram definidas.
- [ ] Dados e segredos não são enviados a componentes que não precisam deles.
- [ ] APIs têm autorização por objeto, não apenas autenticação.
- [ ] Storage é privado por padrão.
- [ ] Webhooks são autenticados e idempotentes.
- [ ] Jobs e filas têm deduplicação, retry e dead-letter definidos.
- [ ] Agentes de IA têm allowlist de ferramentas e privilégios mínimos.
- [ ] Estratégia de backup e restore foi definida.
- [ ] Estratégia de rollback foi definida.
- [ ] Dependências e lockfiles foram planejados.
- [ ] Segredos de integração (chaves de IA, tokens de bots, credenciais de canais) ficam em tabela própria acessível só pelo servidor, e não numa tabela de configurações que membros comuns leem.

## A6. Secrets

- [ ] Secret manager ou mecanismo protegido foi escolhido.
- [ ] Secrets são separados por ambiente.
- [ ] `service_role`, tokens e chaves não serão enviados ao frontend.
- [ ] Variáveis públicas foram distinguidas de segredos.
- [ ] Rotação e revogação foram planejadas.
- [ ] Logs, erros e ferramentas de IA não receberão secrets completos.
- [ ] Cada consumidor (produção, preview, automação) tem sua própria chave, com nome que diz onde é usada (ex.: `vercel_production`), revogável sem afetar os outros.
- [ ] Chaves legadas que não expiram (ex.: JWT `anon`/`service_role` antigos do Supabase) têm plano de migração para o formato novo e de desligamento.
- [ ] Pessoas não colam senhas em chat, prompt de comando visível ou histórico de terminal: scripts pedem senha oculta. Senha exposta é trocada na hora.

## A7. Contas de plataforma

- [ ] GitHub, hosting (ex.: Vercel), banco (ex.: Supabase), registrador de domínio/DNS, e-mail e provedores de IA foram inventariados.
- [ ] MFA está ativo em todas essas contas, preferencialmente com chave de segurança ou app autenticador.
- [ ] Membros e papéis de cada plataforma são os mínimos necessários.
- [ ] Tokens pessoais, deploy hooks, integrações OAuth e chaves de API das plataformas foram listados, têm escopo mínimo e expiração.
- [ ] Recuperação de conta (e-mail, telefone, códigos de backup) está sob controle do responsável.
- [ ] O domínio tem renovação automática e bloqueio de transferência.
- [ ] Branch principal protegida por regra (sem apagar, sem force push, só via PR). No GitHub gratuito isso só existe em repositório público; repositório privado exige plano pago. Fork não pode ser tornado privado: seria preciso um repositório novo.
- [ ] Workflows de CI que o projeto não usa (deploy duplicado, release) ficam desligados; o CI que roda testes está ligado e passou ao menos uma vez.

---

# FASE B - Durante desenvolvimento

## B1. Autenticação

- [ ] Sessões são expiradas e revogáveis conforme o risco.
- [ ] Refresh tokens são protegidos e rotacionados quando aplicável.
- [ ] Reset de senha não permite enumeração de contas.
- [ ] Magic links possuem expiração e uso controlado.
- [ ] Signup e invite não permitem escolher role privilegiada.
- [ ] MFA e recovery foram testados.
- [ ] Mudança de senha, e-mail ou dispositivo gera controles e auditoria adequados.
- [ ] Metadados editáveis pelo usuário não controlam autorização.
- [ ] O gatilho que cria o perfil no signup lê papel e tenant só de `app_metadata` (ou equivalente do servidor) e, sem ele, cria usuário comum.

## B2. Autorização

- [ ] Cada endpoint valida autenticação e autorização.
- [ ] Cada objeto é autorizado no backend/banco.
- [ ] Tenant não é confiado somente a parâmetro do cliente.
- [ ] Campos privilegiados são protegidos contra mass assignment.
- [ ] Ownership e estado do objeto são verificados.
- [ ] Acesso de admin é separado de acesso comum.
- [ ] Service accounts possuem escopos mínimos.
- [ ] Casos de usuário de outro tenant foram testados.
- [ ] Erros de autorização não expõem dados.

## B3. PostgreSQL/Supabase/RLS

- [ ] RLS está habilitado nas tabelas expostas.
- [ ] `FORCE ROW LEVEL SECURITY` foi avaliado.
- [ ] Policies `SELECT`, `INSERT`, `UPDATE` e `DELETE` existem conforme o modelo.
- [ ] `USING` e `WITH CHECK` foram revisados.
- [ ] `TO authenticated` não é o único controle de autorização.
- [ ] `auth.uid()` ou equivalente é usado corretamente.
- [ ] UPDATE não permite reatribuir ownership ou tenant.
- [ ] Grants para `PUBLIC`, `anon`, `authenticated` e roles técnicas foram revisados.
- [ ] Privilégios por coluna foram usados quando necessários.
- [ ] Views não bypassam RLS de forma não intencional.
- [ ] RPCs foram auditadas como endpoints públicos ou internos.
- [ ] Triggers, funções e jobs foram incluídos na análise.
- [ ] Realtime e Storage foram avaliados separadamente.
- [ ] Nenhum `service_role` é usado em cliente público.
- [ ] Nenhuma policy de tabela exposta usa `USING (true)` ou `WITH CHECK (true)` para `anon`/`authenticated` sem justificativa registrada.
- [ ] Toda função, inclusive de trigger, tem `search_path` fixo e objetos qualificados (não só as `SECURITY DEFINER`).
- [ ] Funções chamadas com `search_path` vazio foram testadas junto com os triggers que disparam.
- [ ] Views expostas usam `security_invoker` ou estão fora do schema exposto; materialized views expostas foram justificadas.
- [ ] Roles com `BYPASSRLS` e o uso de `service_role` no código foram inventariados.
- [ ] Tabelas publicadas no Realtime foram revisadas contra as policies de `SELECT`.
- [ ] Jobs agendados (ex.: `pg_cron`) e Edge Functions foram incluídos na análise de privilégio.
- [ ] O Security Advisor/linter do provedor não tem alertas `ERROR`/`WARN` sem decisão registrada.
- [ ] Toda função nova recebe `REVOKE EXECUTE ... FROM PUBLIC, anon` e `GRANT` explícito só para quem precisa (o padrão do PostgreSQL é `EXECUTE` para `PUBLIC`).
- [ ] O efeito de todo `REVOKE` foi conferido com `has_function_privilege`/`has_table_privilege`: revogar um privilégio concedido por outro papel (ex.: `supabase_admin`) não tem efeito e não dá erro.
- [ ] Colunas privilegiadas do perfil (papel, tenant) não recebem `UPDATE` do cliente: `REVOKE UPDATE` na tabela e `GRANT UPDATE (colunas pessoais)`; um gatilho de guarda é a segunda barreira.
- [ ] A função que resolve o tenant do usuário nas policies é `SECURITY DEFINER`, `STABLE`, com `search_path = ''` e sem `EXECUTE` para `anon`.
- [ ] Privilégio por coluna foi avaliado junto com o código: grant por coluna faz `select('*')` falhar. Prefira tirar segredos da tabela.
- [ ] Extensões ficam fora do schema exposto. Quando não for possível (grants da plataforma), foi confirmado que o schema da extensão não é alcançável pela API.

## B4. APIs

- [ ] Schema e tipos de entrada são validados.
- [ ] Payloads têm limites de tamanho e profundidade.
- [ ] Paginação é obrigatória onde há coleções.
- [ ] Campos retornados são minimizados.
- [ ] Mass assignment foi testado.
- [ ] IDOR/BOLA foi testado com IDs de outro tenant.
- [ ] Rate limiting e proteção contra abuso foram configurados.
- [ ] CORS é restritivo.
- [ ] CSRF foi avaliado quando há cookies e mutações.
- [ ] SSRF foi avaliado para URLs fornecidas pelo usuário.
- [ ] Injeções SQL, comando, template e prompt foram consideradas.
- [ ] Erros não exibem stack trace, secrets ou dados internos.
- [ ] Mutação importante é idempotente ou protegida contra replay.
- [ ] Redirecionamentos com destino vindo do usuário usam allowlist (sem open redirect).
- [ ] Endpoints públicos (login, reset, formulários, IA) têm limite contra abuso e contra custo ("denial of wallet").

## B4.1 Web, framework e cache

- [ ] Cabeçalhos de segurança configurados: CSP, HSTS, `frame-ancestors`/`X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`, `X-Content-Type-Options`.
- [ ] Cookies de sessão têm `HttpOnly`, `Secure` e `SameSite` adequados.
- [ ] Server Actions e Route Handlers (Next.js) verificam autenticação e autorização no próprio handler; são endpoints públicos.
- [ ] Middleware/proxy não é a única barreira de autenticação.
- [ ] Módulos com segredo importam `server-only` ou equivalente e não chegam ao bundle do cliente.
- [ ] Service worker, CDN e cache do framework não armazenam respostas autenticadas, de API ou do banco.
- [ ] Logout limpa caches locais e estado persistido com dados do usuário.
- [ ] Arquivos públicos necessários ao app (ex.: `sw.js`, `manifest`) são servidos sem depender de sessão e sem expor dados.
- [ ] O filtro (matcher) do proxy/middleware de autenticação exclui todos os estáticos de `public/` (scripts, imagens, manifest), e não só imagens.
- [ ] CSP de produção sem `'unsafe-eval'` (conferido procurando `eval`/`new Function` nos chunks do build); `'unsafe-inline'` só com justificativa registrada, porque trocá-lo por nonce torna toda página dinâmica.

## B5. Storage

- [ ] Buckets são privados por padrão.
- [ ] Policies restringem usuário e tenant.
- [ ] Policies de `storage.objects` conferem o dono pelo caminho do arquivo (ex.: a primeira pasta é o ID de um objeto do tenant, ou o nome do arquivo é o ID do usuário), e não só o `bucket_id`.
- [ ] Signed URLs expiram e têm escopo mínimo.
- [ ] MIME real, extensão, tamanho e conteúdo são validados.
- [ ] Path traversal e nomes maliciosos foram testados.
- [ ] Upload de conteúdo ativo foi avaliado.
- [ ] Malware scanning foi avaliado.
- [ ] Download, exportação e compartilhamento são auditáveis.
- [ ] Cópias temporárias e exclusão foram incluídas na retenção.

## B6. Secrets e código

- [ ] Nenhum secret está no repositório.
- [ ] Arquivos de ambiente reais estão ignorados e protegidos.
- [ ] Chaves são separadas por ambiente.
- [ ] Tokens têm escopo, expiração e rotação.
- [ ] Dependências estão em lockfile.
- [ ] Scripts de instalação e build foram revisados.
- [ ] SAST, dependency scan e secret scan foram executados.
- [ ] Secret scan cobriu o histórico completo do Git, não só a versão atual.
- [ ] Alertas de dependência (ex.: Dependabot) estão ativos e triados.
- [ ] GitHub Actions de terceiros estão fixadas por SHA e o `GITHUB_TOKEN` tem permissões mínimas.
- [ ] Source maps e mensagens de erro não expõem informação indevida.
- [ ] Alertas de dependências transitivas são corrigidos com overrides do gerenciador de pacotes (ex.: `pnpm.overrides`) sem trocar versão principal; bibliotecas só de teste (ex.: faker) ficam em `devDependencies`.
- [ ] Em repositório público, mensagens de commit e descrições de PR não detalham vulnerabilidades ainda abertas; relatórios de auditoria ficam fora do repositório.

## B7. Logging

- [ ] Falhas de login e autorização são registradas de forma segura.
- [ ] Ações administrativas são auditáveis.
- [ ] Alterações de role, tenant, exportação e exclusão são registradas.
- [ ] Logs possuem timestamp e correlação.
- [ ] Passwords, tokens, chaves e cartões completos não são registrados.
- [ ] Dados pessoais são minimizados ou mascarados.
- [ ] Acesso aos logs é restrito.
- [ ] Retenção de logs foi definida.

## B8. IA e automação

- [ ] O modelo recebe somente os dados necessários.
- [ ] Ferramentas disponíveis são allowlisted.
- [ ] Argumentos são validados fora do modelo.
- [ ] O modelo não decide sozinho sua própria autorização.
- [ ] Ações destrutivas exigem aprovação humana ou controle equivalente.
- [ ] Prompt injection e tool injection foram testadas.
- [ ] Memória, embeddings e retrieval têm isolamento por tenant.
- [ ] Credenciais do agente são mínimas.
- [ ] Retries são idempotentes.
- [ ] Execuções duplicadas são detectadas.
- [ ] Logs do workflow não expõem dados pessoais desnecessários.
- [ ] Provedor, retenção, treinamento e subprocessadores foram avaliados.
- [ ] Riscos do OWASP Top 10 for LLM Applications foram mapeados para o sistema.
- [ ] Injeção indireta foi considerada: dados armazenados, páginas raspadas, e-mails e mensagens de terceiros chegam ao modelo delimitados como dados, nunca como instrução.
- [ ] Saída do modelo é tratada como não confiável ao ser renderizada (HTML/Markdown/links) ou usada em consultas e comandos.
- [ ] Chaves de provedores de IA guardadas no banco ficam fora do alcance de membros comuns (tabela só do servidor), são lidas no servidor com chave de serviço e filtro de tenant, e não retornam ao cliente. Se o sistema lê a chave com a sessão do usuário, bloquear só no banco quebra a IA: o conserto exige mudança de código.
- [ ] Há limite de custo e volume por tenant/usuário para chamadas de IA.

---

# FASE C - Pré-staging

## C1. Auditoria estática

- [ ] Diff foi revisado por escopo e por autorização.
- [ ] Nenhum arquivo fora do escopo foi alterado sem justificativa.
- [ ] Não há Critical aberto.
- [ ] Não há High sem aceitação formal.
- [ ] Findings Medium têm decisão e prazo.
- [ ] Código, configurações, migrations, policies, functions e infraestrutura foram incluídos.
- [ ] Mudanças destrutivas foram identificadas.
- [ ] Secrets scan está limpo.
- [ ] Links e referências usadas no relatório foram verificados.
- [ ] Os checks automáticos realmente executaram (CI ativo, não apenas preview de deploy).

## C2. Migrations e banco

- [ ] Replay desde zero foi executado.
- [ ] Replay sobre schema acumulado foi executado.
- [ ] Primeira falha foi registrada, quando houver.
- [ ] Migrations estão em ordem.
- [ ] Functions, triggers, views e extensões foram validadas.
- [ ] Grants e ACLs após a migration foram revisados.
- [ ] Policies e RLS foram revisados.
- [ ] Idempotência e retry foram avaliados.
- [ ] Locks e duração foram estimados.
- [ ] Rollback ou procedimento de recuperação foi definido.
- [ ] Drift verificado: definições de funções, `proconfig`, triggers, policies, grants e histórico de migrations do ambiente de destino batem com o repositório e com o staging.
- [ ] Histórico de migrations do destino foi conferido antes de qualquer ferramenta que aplique "todas as pendentes".
- [ ] Toda migration de segurança tem teste antes/depois no staging: o teste roda antes (e mostra a falha) e depois (e passa), em transação com `ROLLBACK`, simulando cada papel com `SET LOCAL ROLE` e as claims do JWT.
- [ ] O SQL de rollback foi gerado do estado real do destino (ex.: `pg_policies` de produção), e não do repositório, e foi validado em transação desfeita.
- [ ] Migrations são aplicadas uma por vez (API do provedor ou SQL), nunca com "aplicar todas as pendentes" em banco cujo histórico diverge do repositório.
- [ ] Colunas que o código lê existem em todos os ambientes (produção com schema reduzido quebra consultas com lista explícita de colunas).

## C3. Ambiente isolado

- [ ] Staging possui banco separado.
- [ ] Staging possui Auth separado.
- [ ] Staging possui Storage separado.
- [ ] Webhooks e filas são de teste.
- [ ] Secrets são de staging.
- [ ] Provedores externos estão em sandbox, mock ou escopo controlado.
- [ ] Dados são sintéticos, mascarados ou anonimizados com autorização.
- [ ] Preview não consegue escrever em produção.
- [ ] Variáveis de ambiente de Preview são distintas das de Production (conferido no bundle publicado, não só no painel).
- [ ] O valor de cada variável foi conferido, não só o nome: uma variável `..._PUBLISHABLE_KEY` pode conter a chave legada `anon` (`eyJ...`). Procure o prefixo no bundle publicado.
- [ ] Variáveis com escopo por branch (ex.: `Preview` + branch específica) foram revisadas: elas sobrepõem as gerais e costumam ser esquecidas.
- [ ] O projeto de staging no hosting realmente serve o app (e não só a landing); o endereço de teste está documentado.
- [ ] Deploys de preview têm proteção de acesso (ex.: Vercel Deployment Protection) quando expõem dados ou funcionalidades internas.
- [ ] Domínio e configurações identificam claramente o ambiente.
- [ ] Ponto de backup/recovery foi estabelecido.

## C4. Efeitos externos

- [ ] Google Sheets, e-mail, WhatsApp, pagamentos e terceiros estão isolados.
- [ ] Envio automático está desabilitado ou mockado.
- [ ] POST/PATCH/DELETE de teste não alcança dados reais.
- [ ] Jobs não serão executados automaticamente contra produção.
- [ ] Limites de custo e volume estão configurados.
- [ ] Kill switch está disponível.

---

# FASE D - Staging

## D1. Tenant e autorização

- [ ] User A / Org A só acessa dados de Org A.
- [ ] User B / Org B não acessa dados de Org A.
- [ ] Admin A não acessa Org B sem autorização explícita.
- [ ] Service Account só acessa seu escopo.
- [ ] SELECT cross-tenant falha.
- [ ] INSERT com tenant forjado falha.
- [ ] UPDATE com tenant/owner forjado falha.
- [ ] DELETE cross-tenant falha.
- [ ] RPC cross-tenant falha.
- [ ] Storage cross-tenant falha.
- [ ] Exportação cross-tenant falha.
- [ ] Filtros, busca e paginação não atravessam tenant.

## D2. API e frontend

- [ ] Endpoints sem sessão falham corretamente.
- [ ] Endpoints autenticados sem permissão falham corretamente.
- [ ] IDs de outros objetos não permitem acesso.
- [ ] Campos privilegiados não aceitam mass assignment.
- [ ] Erros não expõem dados de terceiros.
- [ ] CORS, CSRF e rate limiting foram testados.
- [ ] Upload e download obedecem a policies.
- [ ] UI não é a única barreira de autorização.
- [ ] Não há segredo no bundle ou nas variáveis públicas.

## D3. Banco e RPC

- [ ] Policies de cada operação foram exercitadas.
- [ ] `WITH CHECK` bloqueia reatribuição de tenant/owner.
- [ ] Views e funções não bypassam RLS sem controle.
- [ ] `SECURITY DEFINER` possui search path e ACL seguros.
- [ ] `EXECUTE` de funções privilegiadas foi revisado.
- [ ] Triggers funcionam em INSERT, UPDATE e DELETE conforme esperado.
- [ ] Realtime não vaza eventos entre tenants.

## D4. Auth e contas

- [ ] Login, logout e expiração funcionam.
- [ ] Reset não enumera usuários.
- [ ] Invite não permite escolha de role indevida.
- [ ] MFA de admin foi testado.
- [ ] Revogação de sessão foi testada.
- [ ] Alteração de role gera auditoria.
- [ ] Alteração de e-mail e senha possui proteção apropriada.

## D5. IA e agentes

- [ ] Prompt injection não amplia ferramentas.
- [ ] Tool injection não altera destinatário, tenant ou objetivo sem validação.
- [ ] Dados de um tenant não aparecem no retrieval de outro.
- [ ] Agente não acessa secrets diretamente.
- [ ] Agente não executa ações críticas sem aprovação.
- [ ] Saídas são validadas antes de escrita ou envio.
- [ ] Logs não contêm dados pessoais desnecessários.
- [ ] Retry não duplica efeitos externos.
- [ ] Fail-safe e kill switch funcionam.

## D6. LGPD e vazamento

- [ ] Respostas não incluem campos além da finalidade.
- [ ] Dados sensíveis estão mascarados quando possível.
- [ ] URLs não carregam dados pessoais desnecessários.
- [ ] Logs, analytics e APM foram revisados.
- [ ] Exports têm escopo, expiração e auditoria.
- [ ] Dados sintéticos estão confirmados.
- [ ] Fluxo de acesso/correção/exclusão foi exercitado.
- [ ] Retenção e exclusão de arquivos foram testadas.
- [ ] Compartilhamento com terceiros está documentado.

## D7. Observabilidade e recuperação

- [ ] Logs de segurança aparecem com correlação.
- [ ] Alertas para falhas relevantes estão ativos.
- [ ] Backup de staging foi restaurado em ambiente isolado.
- [ ] RPO e RTO foram medidos ou assumidos explicitamente.
- [ ] Runbook de incidente foi simulado.
- [ ] Rollback foi ensaiado quando o risco justificar.

---

# FASE E - Pré-produção

- [ ] Revisão independente foi concluída.
- [ ] Findings Critical estão zerados.
- [ ] Findings High estão resolvidos ou formalmente aceitos.
- [ ] Security Gate foi preenchido e aprovado.
- [ ] Backup foi criado **antes** de qualquer mudança de RLS, auth, grants ou migration de segurança, e não depois.
- [ ] O plano contratado do provedor realmente inclui backup/PITR; se não incluir, há cópia própria ou rollback testado registrado como controle compensatório.
- [ ] Antes de desligar chaves legadas, os logs de acesso do provedor mostram quais clientes ainda as usam (papel da chave, prefixo e origem por requisição, em janela de dias), e cada um foi migrado.
- [ ] Domínio que não envia e-mail pela raiz publica `v=spf1 -all`; o DMARC sobe em etapas (`none` → `quarantine` → `reject`) depois de conferir SPF, DKIM e DMARC com `PASS` num e-mail real ("Mostrar original" no Gmail).
- [ ] Restore foi verificado, não apenas o backup.
- [ ] Plano de rollback está executável.
- [ ] Migration foi revisada e ordenada.
- [ ] Secrets de produção foram conferidos sem serem expostos.
- [ ] DNS e domínios estão corretos.
- [ ] Não há registros DNS órfãos apontando para serviços desativados (subdomain takeover).
- [ ] SPF, DKIM e DMARC estão configurados para os domínios que enviam e-mail.
- [ ] Variáveis de ambiente foram revisadas por ambiente.
- [ ] Integrações externas estão apontando para os destinos corretos.
- [ ] Efeitos externos estão autorizados e limitados.
- [ ] Janela de mudança foi definida.
- [ ] Monitoramento e responsáveis estão disponíveis.
- [ ] Autorização explícita para produção foi registrada.

## Modelo de Security Gate

```text
CRITICAL_OPEN: 0
HIGH_OPEN: 0
MEDIUM_OPEN: 0
BACKUP_BEFORE_CHANGE: true
RESTORE_VERIFIED: true
STAGING_VALIDATED: true
INDEPENDENT_REVIEW_COMPLETE: true
RUNTIME_TESTS_COMPLETE: true
ROLLBACK_READY: true
EXPLICIT_AUTHORIZATION: true
SECURITY_GATE: PASS
```

---

# FASE F - Produção

- [ ] Deploy foi iniciado pelo fluxo controlado aprovado.
- [ ] Commit/artefato implantado foi registrado.
- [ ] Migration aplicada no ambiente correto.
- [ ] Nenhuma migration manual fora do processo foi executada.
- [ ] Smoke test foi realizado.
- [ ] Login e autorização básica foram verificados.
- [ ] Isolamento de tenant foi retestado.
- [ ] Validação read-only depois de cada migration: objetos esperados existem (policies, grants, funções) e o usuário real continua vendo 100% dos próprios dados (simulação com o papel dele, em transação desfeita).
- [ ] Storage e integrações críticas foram verificadas.
- [ ] Logs e alertas estão recebendo eventos.
- [ ] Não houve envio ou escrita inesperada.
- [ ] Métricas de erro e disponibilidade foram observadas.
- [ ] Resultado e horário foram registrados.

---

# FASE G - Pós-produção

- [ ] Reteste de segurança foi executado.
- [ ] Alterações privilegiadas foram auditadas.
- [ ] Monitoramento permaneceu ativo após a janela.
- [ ] Incidentes e quase-incidentes foram registrados.
- [ ] Backup e restore continuam verificáveis.
- [ ] Acesso de usuários e service accounts foi revisado.
- [ ] Dependências foram atualizadas conforme política.
- [ ] Threat model foi atualizado para mudanças relevantes.
- [ ] Findings antigos foram reavaliados.
- [ ] Auditoria periódica foi agendada.
- [ ] Retenção e exclusão foram conferidas.
- [ ] Custos e consumo de terceiros foram revisados.

---

# FASE H - LGPD

## H1. Governança e inventário

- [ ] Controlador, operador e encarregado/DPO foram identificados quando aplicável.
- [ ] Data map foi aprovado pelo responsável.
- [ ] Cada tratamento tem finalidade definida.
- [ ] Base legal está registrada ou encaminhada para validação.
- [ ] Categorias de titulares foram identificadas.
- [ ] Dados pessoais comuns e sensíveis foram classificados.
- [ ] Crianças/adolescentes foram avaliados.
- [ ] Compartilhamentos e suboperadores estão listados.
- [ ] Transferências internacionais foram avaliadas.
- [ ] RIPD/relatório de impacto foi avaliado quando o risco justificar.

## H2. Minimização e privacidade

- [ ] Nenhum campo é coletado somente por utilidade futura.
- [ ] Campos opcionais são realmente opcionais.
- [ ] Dados são separados por necessidade e classificação.
- [ ] Respostas de API são minimizadas.
- [ ] URLs não contêm dados pessoais desnecessários.
- [ ] Logs e analytics minimizam dados pessoais.
- [ ] Defaults são privados.
- [ ] Exports são restritos.
- [ ] Dados pessoais não são enviados à IA sem necessidade e controle.

## H3. Segurança de dados

- [ ] TLS está ativo.
- [ ] Encryption at rest foi avaliada.
- [ ] Campos de maior risco têm proteção adicional quando necessário.
- [ ] Chaves são separadas e rotacionáveis.
- [ ] Acesso é baseado em need-to-know.
- [ ] Dados sensíveis têm logging e mascaramento adequados.
- [ ] Buckets e links são privados por padrão.
- [ ] Backups e cópias temporárias estão incluídos.

## H4. Titulares

- [ ] Canal para solicitações foi definido.
- [ ] Identidade do solicitante é verificada.
- [ ] Acesso aos próprios dados foi testado.
- [ ] Correção foi testada.
- [ ] Anonimização/bloqueio foi avaliada.
- [ ] Eliminação foi testada quando aplicável.
- [ ] Portabilidade foi avaliada quando aplicável.
- [ ] Compartilhamentos podem ser informados conforme o contexto.
- [ ] Revogação de consentimento foi avaliada.
- [ ] Decisões automatizadas relevantes foram identificadas.
- [ ] Exceções e retenções legais são documentadas.

## H5. Retenção e exclusão

- [ ] Retenção por categoria está aprovada.
- [ ] Soft delete não é tratado automaticamente como exclusão definitiva.
- [ ] Hard delete ou anonimização foi implementado quando necessário.
- [ ] Backups, caches, índices, Storage, filas e terceiros foram incluídos.
- [ ] Exports temporários expiram.
- [ ] Evidência de exclusão é registrada sem reter dados desnecessários.

## H6. Incidentes

- [ ] Critérios de incidente foram definidos.
- [ ] Preservação de evidências foi prevista.
- [ ] Revogação e rotação estão documentadas.
- [ ] Escopo de dados e titulares pode ser determinado.
- [ ] Jurídico/DPO/encarregado pode ser acionado.
- [ ] Procedimento de comunicação à autoridade foi conferido na norma vigente.
- [ ] Comunicação aos titulares foi avaliada quando aplicável.
- [ ] Postmortem e medidas preventivas estão previstos.

---

## Fontes de referência

- [Lei nº 13.709/2018 - LGPD](https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm)
- [ANPD - Guia de Segurança da Informação](https://www.gov.br/anpd/pt-br/centrais-de-conteudo/materiais-educativos-e-publicacoes/processo-guia-orientativo-sobre-seguranca-da-informacao-para-agentes-de-tratamento-de-pequeno-porte.pdf)
- [ANPD - Direitos dos titulares](https://www.gov.br/anpd/pt-br/assuntos/titular-de-dados-1/direito-dos-titulares)
- [ANPD - Comunicação de incidente](https://www.gov.br/anpd/pt-br/assuntos/incidente-de-seguranca)
- [OWASP ASVS](https://owasp.org/www-project-application-security-verification-standard/)
- [OWASP API Security Top 10](https://owasp.org/API-Security/)
- [OWASP Top 10 for LLM Applications](https://genai.owasp.org/llm-top-10/)
- [OWASP Secure Headers Project](https://owasp.org/www-project-secure-headers/)
- [NIST SSDF](https://csrc.nist.gov/projects/ssdf)
- [PostgreSQL RLS](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [Supabase RLS](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Supabase Database Advisors](https://supabase.com/docs/guides/database/database-advisors)
- [Vercel Deployment Protection](https://vercel.com/docs/deployment-protection)
