# Security Audit Runbook

Roteiro de execução de uma auditoria de segurança. O `SECURITY_PLAYBOOK.md` explica **o que** proteger e **por quê**; o `SECURITY_CHECKLIST.md` lista **o que** conferir; este runbook diz **como** conduzir a auditoria, em que ordem, com quais consultas read-only e o que entregar.

> As consultas deste documento são somente leitura. Mesmo assim, rode primeiro no staging, confirme o projeto/ambiente antes de cada execução em produção e registre a saída relevante (mascarada) como evidência.

---

## 1. Antes de começar: regras de engajamento

Registre por escrito, antes de qualquer consulta:

```text
PROJETO:
AMBIENTES NO ESCOPO: (ex.: staging = <ref>, produção = <ref>)
FORA DE ESCOPO:
VERSÃO/COMMIT AUDITADO:
JANELA DE EXECUÇÃO:
MODO: read-only | testes ativos em staging | testes ativos em produção (exige autorização)
CONTAS DE TESTE: (sintéticas, uma por perfil e por tenant)
AÇÕES PROIBIDAS: escrita em produção, envio de mensagens/e-mails, execução de workflows,
  exports, DoS/carga, engenharia social, acesso a dados reais além do mínimo
CONDIÇÕES DE PARADA: dado real exposto, efeito externo inesperado, sinal de incidente ativo,
  isolamento de ambiente não comprovado
ONDE FICAM AS EVIDÊNCIAS:
RESPONSÁVEL PELA AUTORIZAÇÃO:
```

Pré-requisitos:

- [ ] Duas organizações/tenants sintéticos no staging, cada um com pelo menos um usuário comum e um admin.
- [ ] Acesso read-only às plataformas (banco, hosting, repositório). Se só houver acesso de escrita, registre a limitação e opere com cuidado redobrado.
- [ ] Confirmação de qual projeto/ref é produção e qual é staging (conferir no bundle publicado ou na configuração do hosting, não só no `.env` local).

Se encontrar um problema grave durante a auditoria (segredo exposto, dado acessível publicamente), **pare, registre e escale** antes de continuar investigando.

---

## 2. Ordem de execução

| Fase | Objetivo | Saída |
|---|---|---|
| 0. Inventário | Saber o que existe | lista de ativos, plataformas, integrações, fluxos de dados |
| 1. Plataformas e contas | Quem controla a produção | MFA, membros, tokens, domínio |
| 2. Segredos e repositório | Nada vazado, nada exposto ao cliente | secret scan, `NEXT_PUBLIC_*`, `service_role` |
| 3. Banco (read-only) | RLS, policies, grants, funções, storage | saídas das consultas da seção 4 |
| 4. Aplicação | Endpoints, autorização, cache, cabeçalhos | mapa de endpoints com a verificação de cada um |
| 5. Integrações e IA | Webhooks, automações, agentes | fluxo de dados externo, controles de injeção e custo |
| 6. Ambientes e drift | Staging ≠ produção? Repositório = banco? | comparação de fingerprints (seção 4.8) |
| 7. Testes ativos (staging) | Provar isolamento e autorização | matriz cross-tenant preenchida |
| 8. Recuperação | Backup, restore, rollback | evidência de restore ou risco registrado |
| 9. Relatório | Decisão | Audit report + Security Gate |
| 10. Remediação | Corrigir sem quebrar | uma branch por finding, teste antes/depois, rollback, validação em produção (seção 10) |

Não pule para a fase 7 sem as fases 3 e 4: os testes ativos devem confirmar hipóteses levantadas na análise, não substituí-la.

---

## 3. Plataformas e contas (fase 1)

Para cada plataforma (repositório, hosting, banco, DNS/registrador, e-mail, provedores de IA, mensageria, automação):

- [ ] MFA ativo para todos os membros.
- [ ] Lista de membros e papéis exportada e revisada.
- [ ] Tokens de API, deploy hooks, apps OAuth e integrações listados; os sem uso revogados.
- [ ] Recuperação de conta sob controle do responsável.
- [ ] Repositório: branch principal protegida, CI **executando de fato** (em forks o GitHub Actions vem desabilitado), secret scanning e alertas de dependência ativos.
- [ ] Hosting: variáveis por ambiente (Production ≠ Preview ≠ Development), proteção de previews, domínios e redirecionamentos.
- [ ] Banco: plano inclui backup/PITR? Quem tem acesso ao painel? Security Advisor revisado.
- [ ] DNS: sem registros órfãos; SPF, DKIM e DMARC nos domínios que enviam e-mail.

---

## 4. Banco PostgreSQL/Supabase: consultas read-only (fase 3)

Troque `public` pelo(s) schema(s) exposto(s) na API. Rode cada consulta separadamente.

### 4.1 RLS e exposição por tabela

```sql
SELECT c.relname AS tabela, c.relrowsecurity AS rls, c.relforcerowsecurity AS force_rls,
  has_table_privilege('anon', c.oid, 'SELECT') AS anon_select,
  has_table_privilege('authenticated', c.oid, 'SELECT') AS auth_select
FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' AND c.relkind IN ('r', 'p')
ORDER BY c.relrowsecurity, c.relname;
```

Finding: tabela com `rls = false` e privilégio para `anon`/`authenticated`.

### 4.2 Policies permissivas

```sql
SELECT tablename, policyname, cmd, roles, qual, with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND (qual = 'true' OR with_check = 'true')
  AND roles && ARRAY['anon', 'authenticated', 'public']::name[]
ORDER BY tablename, cmd;
```

Finding (em geral HIGH em sistema multi-tenant): `USING (true)`/`WITH CHECK (true)` em tabela com dados de tenant. Exceções legítimas (catálogos realmente públicos) devem ser justificadas. Revise também as policies restantes: o filtro de tenant deve vir de fonte confiável (ex.: tabela de perfis), nunca de metadata editável pelo usuário.

### 4.3 Grants de escrita para `anon`

```sql
SELECT table_name, string_agg(privilege_type, ', ' ORDER BY privilege_type) AS privilegios
FROM information_schema.role_table_grants
WHERE table_schema = 'public' AND grantee = 'anon'
  AND privilege_type IN ('INSERT', 'UPDATE', 'DELETE', 'TRUNCATE')
GROUP BY table_name ORDER BY table_name;
```

No Supabase os grants padrão são amplos e a proteção real é o RLS. Grant de escrita para `anon` só é aceitável se o RLS da tabela bloquear `anon` de forma comprovada. Considere revogar o que não for usado.

### 4.4 Funções sem `search_path` fixo

```sql
SELECT p.oid::regprocedure AS funcao,
  p.prosecdef AS security_definer,
  coalesce(array_to_string(p.proconfig, ', '), '(sem search_path)') AS config,
  has_function_privilege('anon', p.oid, 'EXECUTE') AS anon_executa,
  has_function_privilege('authenticated', p.oid, 'EXECUTE') AS auth_executa,
  EXISTS (SELECT 1 FROM pg_trigger t WHERE t.tgfoid = p.oid) AS usada_em_trigger
FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public' AND p.prokind = 'f'
  AND NOT EXISTS (SELECT 1 FROM unnest(coalesce(p.proconfig, '{}')) cfg WHERE cfg LIKE 'search_path=%')
ORDER BY p.prosecdef DESC, usada_em_trigger DESC, 1;
```

Prioridade: `SECURITY DEFINER` sem `search_path` (risco de segurança) > funções de trigger sem `search_path` (quebram quando chamadas por RPC com `search_path` vazio) > demais. Funções de extensões instaladas no schema exposto também aparecem aqui; nesse caso o finding é a extensão estar no schema exposto.

### 4.5 Funções `SECURITY DEFINER` e quem pode executá-las

```sql
SELECT p.oid::regprocedure AS funcao, array_to_string(p.proconfig, ', ') AS config,
  has_function_privilege('anon', p.oid, 'EXECUTE') AS anon_executa,
  has_function_privilege('authenticated', p.oid, 'EXECUTE') AS auth_executa,
  p.proacl::text AS acl
FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public' AND p.prosecdef
ORDER BY anon_executa DESC, 1;
```

Para cada linha, leia o corpo (`pg_get_functiondef(oid)`) e confirme: valida o chamador (`auth.uid()`), impõe o tenant, qualifica objetos, não usa SQL dinâmico inseguro. `anon_executa = true` numa função que escreve ou lê dados de tenant é finding. Lembre: funções novas recebem `EXECUTE` para `PUBLIC` por padrão.

### 4.6 Views que podem ignorar RLS

```sql
SELECT c.relname AS view, c.relkind, c.reloptions,
  has_table_privilege('anon', c.oid, 'SELECT') AS anon_select,
  has_table_privilege('authenticated', c.oid, 'SELECT') AS auth_select
FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' AND c.relkind IN ('v', 'm')
  AND NOT EXISTS (SELECT 1 FROM unnest(coalesce(c.reloptions, '{}')) o
                  WHERE o IN ('security_invoker=true', 'security_invoker=on', 'security_invoker=1'))
ORDER BY 1;
```

View sem `security_invoker` roda com os privilégios do dono e pode ignorar o RLS das tabelas base. Materialized views (`relkind = m`) não têm RLS: se expostas, tudo nelas é visível para quem tem `SELECT`.

### 4.7 Storage, Realtime, roles e extensões

```sql
SELECT
  (SELECT json_agg(json_build_object('id', id, 'public', public, 'limit', file_size_limit, 'mime', allowed_mime_types)) FROM storage.buckets) AS buckets,
  (SELECT json_agg(rolname) FROM pg_roles WHERE rolbypassrls) AS bypassrls_roles,
  (SELECT json_agg(schemaname || '.' || tablename) FROM pg_publication_tables WHERE pubname = 'supabase_realtime') AS realtime_tables,
  (SELECT json_agg(extname || '@' || n.nspname) FROM pg_extension e JOIN pg_namespace n ON n.oid = e.extnamespace WHERE n.nspname = 'public') AS extensions_in_public;
```

- Bucket `public = true`: qualquer pessoa com a URL baixa o arquivo, sem policy. Aceitável só para conteúdo realmente público.
- Tabelas no Realtime: eventos respeitam as policies de `SELECT`; se a policy for `USING (true)`, todos os assinantes recebem as mudanças de todos os tenants.
- Revise as policies de `storage.objects` (`SELECT * FROM pg_policies WHERE schemaname = 'storage'`).
- Se `pg_cron` existir: `SELECT jobname, schedule, command FROM cron.job;` e confira o que cada job faz e com qual role.

### 4.8 Fingerprint para comparar ambientes (drift)

Rode a mesma consulta no staging e na produção, exporte e compare (diff). Qualquer diferença em objeto tocado por uma mudança invalida a validação feita no outro ambiente.

```sql
SELECT 'function' AS tipo, p.oid::regprocedure::text AS objeto,
  md5(replace(p.prosrc, E'\r', '')) || ' cfg=' || coalesce(array_to_string(p.proconfig, ','), '-')
    || ' definer=' || p.prosecdef || ' acl=' || coalesce(p.proacl::text, '-') AS assinatura
FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace WHERE n.nspname = 'public'
UNION ALL
SELECT 'trigger', t.tgrelid::regclass::text || '.' || t.tgname,
  md5(pg_get_triggerdef(t.oid)) || ' enabled=' || t.tgenabled::text
FROM pg_trigger t JOIN pg_class c ON c.oid = t.tgrelid JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE NOT t.tgisinternal AND n.nspname = 'public'
UNION ALL
SELECT 'policy', tablename || '.' || policyname, md5(concat_ws('|', cmd, roles::text, qual, with_check))
FROM pg_policies WHERE schemaname = 'public'
UNION ALL
SELECT 'grant', table_name || ':' || grantee, string_agg(privilege_type, ',' ORDER BY privilege_type)
FROM information_schema.role_table_grants WHERE table_schema = 'public' GROUP BY table_name, grantee
ORDER BY 1, 2;
```

Compare também o histórico: `SELECT version, name FROM supabase_migrations.schema_migrations ORDER BY version;` contra os arquivos de migration do repositório.

### 4.9 Configurações que não aparecem em SQL

Conferir no painel do provedor e registrar:

- Auth: cadastro público habilitado ou não; confirmação de e-mail; tamanho mínimo e proteção contra senhas vazadas; MFA; expiração de sessão/JWT; **URLs de redirecionamento permitidas sem curingas amplos** (open redirect).
- API: schemas expostos; limites de linhas por resposta.
- Security Advisor e Performance Advisor: todos os alertas com decisão.
- Rede: restrições de IP para conexão direta ao banco, quando disponíveis.
- Backups/PITR: existência, retenção e último restore testado.

### 4.10 Cadastro e papel do usuário

```sql
-- Funções disparadas em auth.users: leem papel/tenant de metadata do próprio usuário?
SELECT p.oid::regprocedure AS funcao, c.relname AS tabela,
  (p.prosrc ~* 'raw_user_meta_data') AS le_user_metadata,
  (p.prosrc ~* 'raw_app_meta_data') AS le_app_metadata
FROM pg_trigger t JOIN pg_proc p ON p.oid = t.tgfoid JOIN pg_class c ON c.oid = t.tgrelid
WHERE c.relnamespace = 'auth'::regnamespace AND NOT t.tgisinternal;

-- O cliente pode mudar o próprio papel ou tenant?
SELECT grantee, privilege_type, column_name
FROM information_schema.column_privileges
WHERE table_schema = 'public' AND table_name = 'profiles'
  AND column_name IN ('role', 'organization_id') AND grantee IN ('anon', 'authenticated')
  AND privilege_type IN ('INSERT', 'UPDATE');
```

Finding CRITICAL se o cadastro público estiver ligado e a função usar `raw_user_meta_data->>'role'` (ou o tenant) para decidir o papel: qualquer um vira admin. Confirme também o cadastro no painel ou com `GET /auth/v1/settings` (`disable_signup`).

### 4.11 Colunas de segredo legíveis por membros

```sql
SELECT table_name, column_name, grantee
FROM information_schema.column_privileges
WHERE table_schema = 'public' AND grantee IN ('anon', 'authenticated') AND privilege_type = 'SELECT'
  AND column_name ~* '(key|token|secret|password|credential)'
ORDER BY 1, 2;
```

Para cada linha, leia a policy de `SELECT` da tabela: se qualquer membro do tenant lê a linha, ele lê o segredo. Procure também no código quem lê essas colunas com a sessão do usuário: é isso que decide se o conserto cabe só no banco.

### 4.12 Policies de Storage que só conferem o bucket

```sql
SELECT policyname, cmd, roles, coalesce(qual, with_check) AS condicao
FROM pg_policies
WHERE schemaname = 'storage'
  AND coalesce(qual, with_check) ~ '^\(bucket_id = ''[^'']+''::text\)$';
```

Qualquer linha é finding: todo usuário logado lê, sobrescreve ou apaga qualquer arquivo daquele bucket. Compare com o formato de caminho que o código grava, para escrever a policy de dono.

### 4.13 O `REVOKE` teve efeito?

```sql
SELECT p.oid::regprocedure AS funcao, p.proacl::text AS acl,
  has_function_privilege('anon', p.oid, 'EXECUTE') AS anon_executa
FROM pg_proc p WHERE p.pronamespace = 'net'::regnamespace;   -- troque pelo schema/funções revogados
```

No `acl`, o texto depois da barra é quem concedeu (`=X/supabase_admin`). O papel `postgres` não revoga o que o `supabase_admin` concedeu: o comando roda sem erro e nada muda. Nesse caso confirme que o schema não é alcançável pela API:

```bash
curl -s -X POST "$SUPABASE_URL/rest/v1/rpc/http_get" -H "apikey: $PUBLISHABLE_KEY" \
  -H "Content-Profile: net" -H "Content-Type: application/json" -d '{"url":"http://127.0.0.1:9"}'
# Esperado: 406 PGRST106 "Only the following schemas are exposed: public, graphql_public"
```

### 4.14 Quem ainda usa cada chave de API (logs do provedor)

No Supabase, os logs de borda mostram o tipo de chave de cada requisição. Rode por janelas de 24 h cobrindo alguns dias (inclua um dia em que as automações rodaram):

```sql
-- Logs Explorer / query_logs (ClickHouse), fonte edge_logs
select log_attributes['request.sb.jwt.apikey.payload.role'] as chave_legada,
       log_attributes['request.sb.apikey.apikey.prefix'] as chave_nova,
       substring(log_attributes['request.headers.user_agent'], 1, 40) as agente,
       log_attributes['request.headers.x_client_info'] as cliente,
       log_attributes['request.cf.asOrganization'] as origem,
       count() as n, max(timestamp) as ultima
from logs where source = 'edge_logs'
group by chave_legada, chave_nova, agente, cliente, origem order by n desc limit 40
```

Só desligue chaves legadas quando nenhuma origem fora do app (automações, scripts, outros sistemas) aparecer com elas. Depois de desligar, teste: a chave legada deve receber `401 Legacy API keys are disabled`.

---

## 5. Aplicação (fase 4)

### 5.1 Mapa de endpoints

Liste todos os pontos de entrada e, para cada um, registre: autenticação, autorização por objeto, tenant, validação de entrada, limite de taxa, cliente de banco usado (usuário ou `service_role`).

Para Next.js App Router, comandos de apoio (read-only):

```bash
# Route Handlers
rg --files -g "app/**/route.ts" -g "app/**/route.js"
# Server Actions
rg -n "['\"]use server['\"]"
# Uso de chave privilegiada: deve aparecer só em código de servidor
rg -n "service_role|SERVICE_ROLE|SUPABASE_SECRET_KEY" --glob "!*.md"
# Tudo que vai para o navegador
rg -no "NEXT_PUBLIC_[A-Z0-9_]+" | sort -u
# HTML injetado
rg -n "dangerouslySetInnerHTML"
# Redirecionamentos com possível destino do usuário
rg -n "redirect\(|NextResponse\.redirect|router\.push\("
# Requisições server-side com URL possivelmente controlada (SSRF)
rg -n "fetch\(" app lib --glob "!*.test.*"
```

Cada resultado é um ponto a ler, não um finding automático.

### 5.2 Segredos e dependências

```bash
# Histórico completo do Git, não só a versão atual
gitleaks git -v            # versões antigas: gitleaks detect -v | alternativa: trufflehog git file://. --only-verified
# Vulnerabilidades conhecidas
npm audit --omit=dev       # ou pnpm audit / yarn npm audit
```

Confira também o bundle publicado: abra o site, procure nos arquivos JS por chaves (`sk-`, `eyJ` de JWT com role de serviço, `service_role`).

No console do site publicado, descubra qual chave e qual projeto o navegador usa de fato. Isso vale para produção e para cada preview:

```js
const out = { chaveNova: 0, chaveLegada: 0, projetos: new Set() };
for (const s of [...document.scripts].map(s => s.src).filter(Boolean)) {
  const t = await fetch(s).then(r => r.text());
  if (/sb_publishable_[A-Za-z0-9_-]{6}/.test(t)) out.chaveNova++;
  if (/eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9\.eyJpc3MiOiJzdXBhYmFzZSI/.test(t)) out.chaveLegada++;
  (t.match(/https:\/\/[a-z]{20}\.supabase\.co/g) || []).forEach(u => out.projetos.add(u.slice(8, 14)));
}
out.projetos = [...out.projetos]; out;
```

Preview com o ref do projeto de produção é finding HIGH.

Dependências transitivas: corrija com overrides que só sobem o piso dentro da mesma versão principal (ex.: `"hono@<4.13.5": "^4.13.5"`) e rode o `precheck` completo. O que exigir versão principal nova fica registrado como risco residual.

### 5.3 Cabeçalhos, cookies e cache

```bash
curl -sI https://SEU_DOMINIO | grep -iE "strict-transport|content-security|x-frame|frame-ancestors|referrer-policy|permissions-policy|x-content-type|set-cookie|cache-control"
```

No navegador, logado, no console da página:

```js
// O que o service worker guarda: não deve haver API, banco ou outra origem
const out = {};
for (const name of await caches.keys()) {
  const keys = (await (await caches.open(name)).keys()).map(r => r.url);
  out[name] = {
    total: keys.length,
    outraOrigem: keys.filter(u => !u.startsWith(location.origin)),
    apiOuBanco: keys.filter(u => /\/api\/|\/rest\/v1|\/auth\/v1|supabase/.test(u)),
  };
}
out;
```

Depois do logout, repita: não deve sobrar dado de usuário em cache, `localStorage` ou IndexedDB além do necessário.

Arquivos públicos não podem depender de sessão (no domínio de produção, não num preview protegido por SSO):

```bash
for p in /sw.js /manifest.webmanifest /robots.txt /icons/icon.svg; do
  printf "%-24s " "$p"; curl -s -o /dev/null -w "%{http_code} %{redirect_url}\n" "https://SEU_DOMINIO$p"; done
# Esperado: 200. Um 307 para /login indica matcher do proxy abrangente demais.
```

CSP: `'unsafe-eval'` só é necessário se o código do navegador usar `eval`. Depois do build:

```bash
find .next/static -name "*.js" -print0 | xargs -0 grep -lE "eval\(|new Function\(" \
  | while read f; do grep -oE ".{60}(eval\(|new Function\().{40}" "$f" | head -2; done
```

Testes de capacidade em `try/catch` (ex.: Zod) e o fallback `Function("return this")` não impedem remover `'unsafe-eval'`. Remova só em produção, porque o modo de desenvolvimento precisa dele. Depois navegue logado pelas telas principais e leia o console, procurando "violates the following Content Security Policy".

---

## 6. Integrações, automações e IA (fase 5)

Para cada integração (webhook recebido, API chamada, workflow, agente):

- [ ] Autenticação da origem (assinatura + timestamp) e idempotência por ID de evento.
- [ ] Tenant derivado de forma confiável, não do payload.
- [ ] Credencial usada e seu escopo; `service_role` só quando inevitável e com filtro explícito de tenant.
- [ ] Efeitos externos (envio de mensagem, e-mail, cobrança) exigem confirmação ou regra determinística.
- [ ] Dados pessoais enviados a terceiros e a modelos: quais, para quem, retenção do provedor.
- [ ] Injeção indireta: conteúdo de terceiros chega ao modelo delimitado como dado.
- [ ] Saída do modelo validada antes de gravar, renderizar ou acionar ferramenta.
- [ ] Limites de custo e volume por tenant.

Em auditoria read-only, **não execute** workflows, nós, webhooks de teste nem ferramentas de agente contra produção.

---

## 7. Testes ativos no staging (fase 7)

Com as contas sintéticas das duas organizações, preencha a matriz do `SECURITY_PLAYBOOK.md` (seção 6.2). Mínimo por tabela/endpoint sensível:

| Teste | Como | Esperado |
|---|---|---|
| SELECT cross-tenant | usuário da Org B consulta ID da Org A pela API/Data API | 0 linhas ou 404 |
| INSERT com tenant forjado | usuário da Org B envia `organization_id` da Org A | recusado |
| UPDATE reatribuindo tenant/dono | alterar `organization_id`/`owner_id` | recusado |
| DELETE cross-tenant | apagar objeto da Org A | recusado |
| RPC cross-tenant | chamar função com ID da Org A | erro, sem efeito |
| Sem sessão | chamar endpoint sem cookie/token | 401 |
| Mass assignment | enviar campos privilegiados (role, org, status) | ignorados ou recusados |
| Storage | baixar arquivo de path da Org A | recusado |
| Replay | repetir a mesma requisição de escrita | sem duplicar efeito |

Faça testes de escrita dentro de transação com `ROLLBACK` quando executados direto no banco, e verifique depois que nada persistiu.

---

## 8. Recuperação (fase 8)

- [ ] O plano contratado inclui backup/PITR? Qual retenção?
- [ ] Último restore testado: quando, para onde, quanto tempo levou (RTO medido) e quanto dado se perderia (RPO).
- [ ] Existe rollback testado para as últimas mudanças de schema?
- [ ] Se não houver backup: finding de risco (disponibilidade/integridade) com controle compensatório registrado.
- [ ] Antes de qualquer correção (fase 10), existe um backup **novo**, não o da semana passada.

Teste de restore de um dump lógico do Supabase num PostgreSQL local isolado (porta própria, dados em pasta própria):

```bash
initdb -D ./restore/data -U postgres --auth=trust --locale=C
# postgresql.conf: listen_addresses='127.0.0.1', port=55432, wal_level=logical
pg_ctl -D ./restore/data -l ./restore/postgresql.log start
psql -p 55432 -U postgres -c "CREATE ROLE anon NOLOGIN" -c "CREATE ROLE authenticated NOLOGIN" \
  -c "CREATE ROLE service_role NOLOGIN BYPASSRLS" -c "CREATE DATABASE restore_test"
pg_restore -p 55432 -U postgres -d restore_test backup.backup 2> restore.log
```

Criar `anon`, `authenticated` e `service_role` antes faz as policies se materializarem. Os erros restantes esperados são papéis internos da plataforma (`supabase_admin`, `dashboard_user`...) e extensões ausentes (`pg_net`, `supabase_vault`). Compare contagens por tabela, policies, funções e triggers com a produção; simule um usuário real e um estranho para provar que o RLS restaurado funciona. Pare a instância e guarde o log como evidência.

---

## 9. Classificação e relatório (fase 9)

- Classifique cada finding com `SECURITY_SEVERITY` e `OPERATIONAL_SEVERITY` separados (playbook, seção 3).
- Registre a evidência de cada um no **Finding template** e consolide no **Audit report template** (playbook, Parte III).
- Preencha o **Security Gate**.
- Findings `CRITICAL`/`HIGH` passam por revisão independente antes de fechar o relatório.
- Registre as limitações: o que não foi possível verificar vale tanto quanto o que foi verificado.

### Calibração rápida de severidade (orientativa)

| Situação | Severidade típica |
|---|---|
| `service_role`/segredo no bundle ou no repositório | CRITICAL |
| Tabela com dados de tenant sem RLS e acessível por `anon` | CRITICAL |
| `USING (true)` em tabela multi-tenant acessível por `authenticated` | HIGH |
| `SECURITY DEFINER` sem validar chamador/tenant e executável por `anon`/`authenticated` | HIGH |
| Bucket público com dados pessoais | HIGH |
| Cache persistente de respostas autenticadas no dispositivo | MEDIUM (HIGH em dispositivo compartilhado ou dado sensível) |
| `SECURITY DEFINER` sem `search_path` fixo, com validação correta | MEDIUM |
| Função de trigger sem `search_path` (quebra fluxo, sem exploração demonstrada) | LOW de segurança / MEDIUM-HIGH operacional |
| Ausência de cabeçalhos de segurança | LOW a MEDIUM, conforme o que o CSP mitigaria |
| Sem backup/PITR em produção | operacional HIGH; registrar como risco de disponibilidade |
| Cadastro público aberto e papel lido de `user_metadata` | CRITICAL |
| Preview com chave de serviço ou banco de produção | HIGH |
| Policy de Storage que só confere `bucket_id` | MEDIUM (HIGH com dados pessoais) |
| Segredo legível por qualquer membro do tenant | MEDIUM (latente se o tenant tiver um só usuário) |
| Chaves legadas que não expiram, espalhadas em deploys antigos | MEDIUM |
| Extensão no schema exposto sem caminho pela API | LOW |

Ajuste sempre pelo contexto: exposição real, dados envolvidos, pré-condições e alcance.

---

## 10. Remediação (depois do relatório)

Uma correção por branch/worktree, na ordem de severidade. Para cada uma:

1. **Backup novo** confirmado (seção 8).
2. **Migration idempotente** com comentário explicando o finding, sem detalhar falha aberta se o repositório for público.
3. **Teste antes/depois no staging**, em transação que termina em `ROLLBACK`. Rode antes da migration para ver a falha, aplique, rode de novo e veja passar. Modelo:

```sql
BEGIN;
SELECT set_config('t.report', '', true);
-- dados sintéticos: 2 organizações, 1 usuário em cada (tenant em raw_app_meta_data)
SELECT set_config('request.jwt.claim.sub', '<uuid do usuário A>', true);
SELECT set_config('request.jwt.claims', '{"sub":"<uuid do usuário A>","role":"authenticated"}', true);
SET LOCAL ROLE authenticated;
DO $$
DECLARE cases text[][] := ARRAY[
  ['lê dado da org B', 'SELECT count(*) FROM public.deals WHERE organization_id = ''<org B>''', 'count', '0'],
  ['altera dado da org B', 'UPDATE public.deals SET title = ''x'' WHERE id = ''<deal B>''', 'dml', 'rows=0']
]; i int; n bigint; r text;
BEGIN
  FOR i IN 1..array_length(cases, 1) LOOP
    BEGIN
      IF cases[i][3] = 'count' THEN EXECUTE cases[i][2] INTO n; r := n::text;
      ELSE EXECUTE cases[i][2]; GET DIAGNOSTICS n = ROW_COUNT; r := 'rows=' || n; END IF;
    EXCEPTION WHEN insufficient_privilege THEN r := 'NEGADO';
              WHEN OTHERS THEN r := 'ERRO ' || SQLSTATE || ' ' || left(SQLERRM, 80); END;
    PERFORM set_config('t.report', current_setting('t.report') || cases[i][1] || ' -> ' || r
      || ' (esperado: ' || cases[i][4] || ')' || E'\n', true);
  END LOOP;
END $$;
RESET ROLE;
SELECT current_setting('t.report') AS report,
  (SELECT count(*) FROM regexp_matches(current_setting('t.report'), '-> ([^\n]*) \(esperado: \1\)', 'g')) AS ok,
  (SELECT count(*) FROM regexp_matches(current_setting('t.report'), E'\n', 'g')) AS total;
ROLLBACK;
```

4. **Regressão:** rode os testes das correções anteriores e o `precheck` do app.
5. **Rollback** gerado do estado real do destino (ex.: `pg_policies` de produção) e validado em transação desfeita.
6. **Teste manual** no app do staging quando a correção mexe em algo que a interface usa.
7. **Produção**, com autorização explícita: consulta read-only antes (o estado bate com o que o rollback restaura?), migration, consulta read-only depois, e simulação do usuário real vendo os próprios dados.
8. **PR e merge**, conferindo que o deploy seguinte ficou pronto. Depois apague a branch e o worktree.

Correções que só existem em código (rotas, proxy, CSP) seguem o mesmo fluxo, com a prévia do hosting no lugar do staging do banco.
