# Security Playbook

## Segurança de Software, Proteção de Dados e LGPD em Projetos com IA

**Versão:** 1.0<br>
**Status:** modelo genérico reutilizável<br>
**Idioma:** português<br>
**Aplicação:** sites, sistemas web, SaaS, CRMs, APIs, aplicações React/Next.js, PostgreSQL/Supabase, sistemas multi-tenant, automações, workers, agentes de IA e soluções para organizações públicas ou privadas.

> Este material é um guia técnico e operacional de segurança e privacidade. Não constitui parecer jurídico e não substitui análise jurídica especializada, orientação do encarregado/DPO, avaliação contratual ou validação regulatória. Base legal, prazos de retenção, comunicação de incidentes, transferências internacionais e atendimento a titulares devem ser confirmados para cada contexto.

## Como usar este playbook

Este documento define uma linha de base. Cada projeto deve transformar as recomendações em decisões registradas, testes reproduzíveis e evidências verificáveis. A ausência de uma tecnologia específica não elimina o controle: substitua o mecanismo, preserve o objetivo de segurança e documente a decisão.

O processo padrão é:

`auditoria read-only → evidência → branch isolada → correção mínima → testes → revisão independente → staging/validação → autorização explícita → produção → reteste`

### Por que cada etapa existe

1. **Auditoria read-only:** reduz o risco de alterar dados ou mascarar a condição original enquanto o problema é compreendido.
2. **Evidência:** transforma opiniões em fatos reproduzíveis: código, configuração, logs, resultados e versões.
3. **Branch isolada:** separa a correção do estado estável e facilita revisão, rollback e comparação.
4. **Correção mínima:** diminui superfície de mudança, regressões e dificuldade de atribuir causa.
5. **Testes:** verificam tanto o controle novo quanto os fluxos legítimos que devem continuar funcionando.
6. **Revisão independente:** reduz o risco de a mesma pessoa ou ferramenta repetir a mesma suposição.
7. **Staging/validação:** permite observar comportamento integrado sem expor produção.
8. **Autorização explícita:** separa conclusão técnica de autorização operacional ou jurídica.
9. **Produção controlada:** limita janela, escopo, privilégios e impacto potencial.
10. **Reteste:** confirma que o controle existe depois do deploy e não foi perdido por configuração, cache, migração ou integração.

---

# Parte I - Metodologia de segurança

## 1. Objetivos de segurança

Todo projeto deve declarar quais propriedades precisa proteger:

| Objetivo | Pergunta prática | Controles típicos |
|---|---|---|
| Confidencialidade | Quem pode ver este dado? | autenticação, autorização, criptografia, RLS, mascaramento |
| Integridade | Quem pode criar, alterar ou excluir? | validação, políticas, constraints, logs, aprovação |
| Disponibilidade | O serviço continua utilizável? | limites, redundância, backups, filas, recuperação |
| Autenticidade | Como sabemos quem está agindo? | MFA, sessão, assinatura, rotação de credenciais |
| Rastreabilidade | O que ocorreu, quando e por quem? | audit trail, IDs de correlação, logs protegidos |
| Isolamento | Um usuário/tenant acessa outro? | autorização por objeto, RLS, separação de ambientes |
| Menor privilégio | Cada componente tem somente o necessário? | escopos mínimos, roles, allowlists, service accounts |
| Defesa em profundidade | Um único erro derruba todo o controle? | camadas independentes e testes de bypass |
| Recuperação | É possível restaurar e provar isso? | backups, restore tests, RPO/RTO, runbooks |
| Privacidade por padrão | A configuração inicial é a mais restritiva? | buckets privados, logs mínimos, exports restritos |

Um controle só deve ser considerado existente quando houver evidência de implementação e, para controles críticos, evidência de execução.

## 2. Threat Modeling

O threat modeling deve ocorrer antes do desenvolvimento relevante, antes de novas integrações e antes de exposição pública. Refaça-o quando mudar o modelo de dados, o fluxo de autorização, os privilégios de uma automação ou a capacidade de um agente de IA.

### 2.1 O que mapear

- **Ativos:** dados pessoais, credenciais, tokens, código, modelos, prompts, arquivos, dinheiro, reputação e disponibilidade.
- **Atores:** visitantes, usuários, administradores, operadores, fornecedores, service accounts, jobs, workers e agentes de IA.
- **Perfis:** capacidades permitidas e proibidas por perfil, tenant, departamento e contexto.
- **Trust boundaries:** navegador/servidor, API/banco, aplicação/provedor externo, usuário/agente, staging/produção.
- **Superfícies de ataque:** login, reset, upload, importação, exportação, APIs, webhooks, RPCs, jobs e ferramentas de IA.
- **Fluxos de dados:** origem, transformação, armazenamento, transmissão, logs, cache, backup e exclusão.
- **Dependências:** bibliotecas, provedores, filas, analytics, e-mail, mensageria, gateways e modelos.
- **Ações administrativas:** alteração de roles, impersonação, exportação, exclusão, configuração de integrações e acesso a dados.

### 2.2 Perguntas mínimas

1. O que aconteceria se este ativo fosse lido, alterado, apagado ou indisponibilizado?
2. Qual é o menor conjunto de usuários e serviços que precisa acessá-lo?
3. O frontend está apenas exibindo uma regra ou o backend realmente a impõe?
4. Um identificador previsível permite trocar o objeto acessado?
5. Alguma integração recebe mais dados ou privilégio do que precisa?
6. O que acontece quando uma requisição é repetida, atrasada, duplicada ou forjada?
7. Que evidência ficará disponível depois de um incidente?

### 2.3 Template de threat model

| Asset | Threat | Attack Path | Impact | Existing Controls | Risk | Mitigation |
|---|---|---|---|---|---|---|
| Exemplo fictício: cadastro de cliente | acesso indevido | usuário troca o identificador na API | exposição de dados pessoais | autenticação | alto | autorização por objeto + teste cross-tenant |
|  |  |  |  |  |  |  |

## 3. Classificação de findings

### 3.1 SECURITY_SEVERITY

| Nível | Critério orientativo |
|---|---|
| **CRITICAL** | exploração provável com comprometimento amplo: bypass de autenticação, acesso massivo a dados sensíveis, execução remota ou alteração administrativa sem barreira efetiva |
| **HIGH** | impacto relevante e caminho de exploração realista: IDOR/BOLA, elevação de privilégio, tenant isolation quebrado, segredo exposto ou escrita não autorizada |
| **MEDIUM** | impacto limitado, pré-condições adicionais ou escopo restrito, mas com efeito de segurança concreto |
| **LOW** | fraqueza de baixo impacto direto, defesa incompleta ou exposição com exploração pouco provável |
| **INFORMATIONAL** | observação, melhoria ou ausência de impacto de segurança demonstrável |

Classifique com base em impacto, probabilidade, pré-condições, alcance, detectabilidade e capacidade de recuperação. Registre a justificativa; não use apenas o nome do bug.

### 3.2 Separar segurança de operação

Sempre registre campos independentes:

- `SECURITY_SEVERITY`: confidencialidade, integridade, disponibilidade por ataque, autenticação, autorização ou privacidade.
- `OPERATIONAL_SEVERITY`: falha de execução, replay, migração, latência, duplicidade ou confiabilidade sem exploração de segurança demonstrada.

Uma migration que falha por ordem incorreta pode ser operacionalmente grave, mas não deve ser chamada automaticamente de vulnerabilidade. O inverso também vale: uma falha de autorização pode existir mesmo quando o sistema continua disponível.

## 4. Security Gate

O gate é uma decisão registrada, não apenas uma impressão do revisor.

### Política mínima

- Qualquer `CRITICAL` aberto: `SECURITY_GATE = FAIL`.
- Qualquer `HIGH` sem aceitação formal de risco: `SECURITY_GATE = FAIL`.
- `MEDIUM`: exige análise de risco, plano e prazo; pode bloquear conforme o contexto.
- `LOW` e `INFORMATIONAL`: devem ser registrados e priorizados.
- Produção somente após gate aprovado, testes previstos e autorização explícita.
- Aceitação de risco deve identificar responsável, justificativa, prazo de expiração e controles compensatórios.

### Exemplos

```text
CRITICAL_OPEN: 0
HIGH_OPEN: 0
MEDIUM_OPEN: 2
RESTORE_VERIFIED: true
STAGING_VALIDATED: true
INDEPENDENT_REVIEW_COMPLETE: true
RUNTIME_TESTS_COMPLETE: true
SECURITY_GATE: PASS
```

```text
CRITICAL_OPEN: 0
HIGH_OPEN: 1
MEDIUM_OPEN: 0
RESTORE_VERIFIED: true
STAGING_VALIDATED: true
INDEPENDENT_REVIEW_COMPLETE: false
RUNTIME_TESTS_COMPLETE: false
SECURITY_GATE: FAIL
```

## 5. Controle de acesso

### 5.1 Autenticação e autorização são controles diferentes

- **Autenticação:** confirma a identidade ou o contexto da sessão.
- **Autorização:** decide se essa identidade pode executar aquela ação sobre aquele objeto, naquele tenant e naquele contexto.

Nunca trate `authenticated` como sinônimo de autorizado. Um usuário autenticado ainda precisa de verificação de ownership, role, permission, tenant, estado do recurso e finalidade.

### 5.2 RBAC e ABAC

- **RBAC:** papéis como leitor, operador, gestor e administrador.
- **ABAC:** atributos como tenant, departamento, estado do objeto, horário, origem, classificação do dado e justificativa.
- Use RBAC para capacidades estáveis e ABAC para decisões contextuais.
- Evite guardar autorização em metadados controláveis pelo usuário.
- Mudanças de role devem ser administrativas, auditadas e resistentes a mass assignment.

### 5.3 Testes de autorização

Para cada endpoint e ação, teste:

- usuário sem sessão;
- usuário autenticado sem permissão;
- usuário do mesmo tenant;
- usuário de outro tenant;
- administrador do tenant;
- administrador global, se existir;
- service account;
- objeto inexistente;
- identificador de outro objeto;
- tentativa de alterar campos protegidos;
- repetição e concorrência.

Procure especificamente IDOR/BOLA, elevação horizontal, elevação vertical, mass assignment e autorização apenas no frontend.

## 6. Multi-tenancy

O isolamento de tenants é um requisito de integridade e confidencialidade. `organization_id` ou `tenant_id` deve ser imposto no servidor, no banco e nas integrações relevantes.

### 6.1 Regras de arquitetura

- Não aceite tenant somente de campo enviado pelo navegador.
- Derive o tenant da sessão, de uma relação autorizada ou de contexto confiável.
- Verifique relações indiretas: usuário → equipe → organização → recurso.
- Aplique filtros no backend e políticas no banco; uma camada não substitui a outra.
- Trate exportação, importação, busca, webhooks, jobs e arquivos como parte do isolamento.
- Documente exceções administrativas e registre cada uso.
- Separe operações de `service_role` e jobs internos de operações de usuário.

### 6.2 Matriz mínima de testes

| Ator | SELECT | INSERT | UPDATE | DELETE | RPC | Storage | Exportação |
|---|---|---|---|---|---|---|---|
| User A / Org A | somente Org A | somente Org A | somente objetos permitidos de Org A | somente objetos permitidos | somente funções autorizadas | somente paths permitidos | somente dados de Org A |
| User B / Org B | não vê Org A | não cria em Org A | não altera Org A | não remove Org A | não atravessa tenant | não lê arquivos de Org A | não exporta Org A |
| Admin A | escopo administrativo de Org A | conforme função | conforme função | conforme função | conforme função | escopo de Org A | escopo de Org A + auditoria |
| Service Account | somente escopo declarado | somente escopo declarado | somente escopo declarado | somente escopo declarado | allowlist | paths declarados | finalidade registrada |

Repita os testes com IDs válidos de outro tenant, IDs inexistentes, filtros vazios, ordenação, paginação, importações e payloads com tenant forjado.

## 7. PostgreSQL, Supabase e RLS

RLS controla linhas; grants controlam acesso a objetos e colunas; a API expõe somente o que a combinação de schema, grants, policies e configuração permitir.

### 7.1 Checklist técnico

- RLS habilitado em toda tabela de schema exposto.
- `FORCE ROW LEVEL SECURITY` avaliado quando o owner ou jobs não devem bypassar RLS.
- Policies separadas e explícitas para `SELECT`, `INSERT`, `UPDATE` e `DELETE`.
- `USING` controla linhas visíveis/atingidas.
- `WITH CHECK` controla o estado resultante em `INSERT` e `UPDATE`.
- `auth.uid()` ou equivalente usado com o contexto correto.
- Policies restringem tenant, ownership e papel; `TO authenticated` sozinho não autoriza o objeto.
- `UPDATE` possui tanto controle da linha lida quanto do novo estado.
- Grants revisados para `PUBLIC`, `anon`, `authenticated`, roles técnicas e service roles.
- Column-level privileges usados quando alguns campos são privilegiados.
- Views avaliadas: views podem alterar a fronteira de RLS; considere `security_invoker` quando suportado ou schema não exposto.
- Funções auxiliares analisadas quanto a `SECURITY DEFINER`, `search_path` e `EXECUTE`.
- Realtime, Storage e RPCs avaliados separadamente.

No Supabase, uma tabela acessível pela Data API precisa de grants compatíveis e RLS coerente. RLS não transforma uma tabela exposta em segura automaticamente. Consulte a [documentação de RLS do Supabase](https://supabase.com/docs/guides/database/postgres/row-level-security) e a [documentação de Row Security Policies do PostgreSQL](https://www.postgresql.org/docs/current/ddl-rowsecurity.html).

### 7.2 Não usar metadata controlável para autorização

Metadados editáveis pelo próprio usuário não devem decidir role, tenant, permissões ou acesso. Prefira uma tabela protegida, `app_metadata` administrado ou uma função segura que derive a autorização de fonte confiável. Tokens podem permanecer desatualizados até serem renovados; trate isso no desenho.

### 7.3 Policies permissivas

`USING (true)` ou `WITH CHECK (true)` em tabela exposta a `anon` ou `authenticated` significa que o banco não isola nada: qualquer usuário autenticado lê ou escreve qualquer linha pela Data API, inclusive de outro tenant, mesmo que a aplicação filtre por `organization_id`. Trate como finding até provar que a tabela não está exposta ou que o dado é realmente público. Filtro na aplicação é defesa em profundidade, não substituto da policy.

### 7.4 `search_path` em todas as funções e triggers

O risco de `search_path` não é exclusivo de `SECURITY DEFINER`:

- Uma função sem `search_path` próprio usa o do chamador. Se o chamador tiver um schema controlável antes de `public`, nomes sem qualificação podem ser desviados.
- **Funções de trigger herdam o `search_path` de quem executou a escrita.** Uma RPC declarada com `SET search_path = ''` que faz `UPDATE` numa tabela dispara triggers que, se usarem `FROM deals` em vez de `FROM public.deals`, falham com `relation "deals" does not exist`. O resultado é indisponibilidade só naquele fluxo, difícil de ver no staging se o staging tiver a versão corrigida da função.

Regra: toda função, inclusive de trigger, com `SET search_path = ''` (ou lista mínima explícita) e objetos totalmente qualificados. Teste RPCs junto com os triggers reais das tabelas que elas alteram. O linter do Supabase aponta isso como `function_search_path_mutable`.

## 8. `SECURITY DEFINER`

`SECURITY DEFINER` executa com os privilégios do proprietário da função. É uma ferramenta de fronteira privilegiada, não um atalho para resolver erro de permissão.

### Padrão recomendado quando realmente necessário

```sql
CREATE OR REPLACE FUNCTION internal.safe_operation(input_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  -- Validar o chamador e o tenant antes da operação.
  -- Referenciar objetos com schema completo.
  NULL;
END;
$function$;

REVOKE EXECUTE ON FUNCTION internal.safe_operation(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION internal.safe_operation(uuid) TO authenticated;
```

### Checklist

- Existe necessidade real de bypassar RLS ou usar privilégios do owner?
- A função está em schema não exposto quando possível?
- `SET search_path = ''` foi aplicado?
- Todas as tabelas, funções e tipos estão totalmente qualificados?
- O chamador é validado no corpo da função?
- Tenant, ownership e finalidade são verificados?
- `EXECUTE` foi revogado de `PUBLIC`?
- Grants explícitos foram concedidos somente às roles necessárias?
- Entradas são validadas e não permitem SQL dinâmico inseguro?
- Função é idempotente e auditável?
- RPC, trigger e job que a chamam têm escopos distintos?

Funções novas podem receber `EXECUTE` para `PUBLIC` por padrão; revise a ACL explicitamente. Consulte a [documentação de privilégios de funções do PostgreSQL](https://www.postgresql.org/docs/current/perm-functions.html).

## 9. Migrations seguras e reproduzíveis

Uma migration é código de produção. Deve funcionar em banco vazio, banco acumulado e ambiente já parcialmente atualizado.

### 9.1 Verificações

- Executar replay desde zero.
- Executar sobre schema acumulado representativo.
- Confirmar ordering e dependências.
- Evitar dependência implícita em dados manuais.
- Avaliar transação, lock, tempo e impacto.
- Revisar `ALTER TABLE`, constraints, índices, views, triggers, functions, extensions e data migrations.
- Definir comportamento em retry e reexecução.
- Validar permissões e ACL depois de criar ou substituir objetos.
- Não corrigir manualmente o banco e declarar a migration resolvida.

### 9.2 `CREATE OR REPLACE FUNCTION`

`CREATE OR REPLACE FUNCTION` pode atualizar o corpo, mas não substitui livremente uma assinatura incompatível. Mudanças em tipo de retorno, parâmetros `OUT` ou `RETURNS TABLE` podem exigir remoção e recriação.

Quando for necessário usar `DROP FUNCTION + CREATE FUNCTION`:

1. confirme dependências;
2. preserve ou restaure grants;
3. restaure comments e configurações relevantes;
4. considere janela e lock;
5. teste views, triggers, RPCs e jobs dependentes;
6. execute replay desde zero e sobre schema acumulado.

### 9.3 Drift entre repositório e ambientes

Ambientes reais divergem do repositório: migrations aplicadas pelo painel, correções manuais, migrations nunca aplicadas em um dos ambientes, versões registradas com timestamps diferentes. Uma validação feita no staging só vale para produção se os objetos envolvidos forem iguais.

Antes de aplicar em produção:

- compare o histórico de migrations do destino com os arquivos do repositório;
- compare, para cada objeto tocado **e para cada objeto que ele aciona** (triggers, funções chamadas, views), o hash do corpo, `proconfig`, `SECURITY DEFINER`, owner e ACL entre staging e produção;
- compare policies e grants das tabelas envolvidas;
- nunca use ferramenta que aplica "todas as migrations pendentes" sem conferir a lista contra o estado real;
- registre o drift encontrado como finding operacional e corrija com migration versionada, não com ajuste manual.

As consultas estão no `SECURITY_AUDIT_RUNBOOK.md`.

## 10. Replay audit

Processo recomendado:

1. criar banco descartável do zero;
2. aplicar migrations em ordem;
3. capturar a primeira falha, não somente a última;
4. não corrigir objetos manualmente;
5. corrigir a migration no código;
6. revisar a correção;
7. recriar o ambiente;
8. repetir até obter replay limpo;
9. comparar schema, grants, policies, triggers e funções com o esperado.

Faça análise estática antes do replay para detectar ciclos entre functions, views, triggers, extensões e grants, reduzindo iterações desnecessárias.

## 11. Staging

Staging deve ser separado de produção em dados, autenticação, segredos e efeitos externos.

- banco/project ref separado;
- domínio separado;
- secrets e OAuth separados;
- Auth separado;
- Storage e buckets separados;
- webhooks apontando para endpoints de teste;
- filas e workers isolados;
- integrações externas em modo sandbox ou mock;
- dados sintéticos;
- logs e observabilidade segregados;
- nenhum segredo de produção reutilizado em Preview/staging;
- produção explicitamente protegida contra chamadas originadas de testes.

## 12. Dados sintéticos

Prefira dados fictícios em local, desenvolvimento, QA, demonstrações e staging.

Use:

- nomes fictícios;
- e-mails em domínios controlados;
- telefones não pertencentes a pessoas reais;
- documentos fictícios e inválidos para produção;
- UUIDs nunca usados em produção;
- organizações e tenants artificiais;
- arquivos sem conteúdo pessoal;
- tokens revogáveis e de curta duração.

Se o uso de dados reais for inevitável, registre necessidade, autorização, minimização, mascaramento, acesso, prazo de expiração e eliminação.

## 13. Secrets e credenciais

Proteja:

- `.env` e arquivos locais;
- chaves de API;
- tokens OAuth e webhooks;
- chaves de banco e Storage;
- `service_role` e equivalentes;
- credenciais de CI/CD;
- chaves de provedores de IA;
- certificados e chaves de assinatura.

Regras:

- nunca commitar secrets;
- usar secret manager quando possível;
- separar por ambiente;
- aplicar menor privilégio e expiração;
- rotacionar após exposição suspeita;
- mascarar logs e relatórios;
- nunca enviar secret completo ao chat, issue ou ferramenta de IA;
- não colocar segredo em `NEXT_PUBLIC_` ou bundle do navegador;
- revogar credenciais antigas depois da rotação.

### 13.1 Contas de plataforma

Quem controla a conta do GitHub, do hosting, do banco, do DNS ou do provedor de IA controla a produção, independentemente da qualidade do código. Para cada plataforma:

- MFA obrigatório, preferencialmente chave de segurança ou app autenticador;
- membros e papéis mínimos, revisados periodicamente;
- tokens pessoais, deploy hooks, apps OAuth e chaves de API inventariados, com escopo e expiração;
- e-mail e telefone de recuperação sob controle do responsável;
- alertas de login e de mudança de configuração ativos quando disponíveis;
- domínio com renovação automática e bloqueio de transferência.

## 14. APIs

Audite cada endpoint por:

- autenticação e sessão;
- autorização por objeto e tenant;
- validação de schema e tipos;
- limite de tamanho;
- rate limiting e abuso;
- paginação segura;
- filtragem de campos retornados;
- prevenção de mass assignment;
- proteção contra excessive data exposure;
- CORS restritivo;
- CSRF quando houver cookies e estado mutável;
- SSRF em URLs fornecidas pelo usuário;
- SQL injection, command injection e template injection;
- mensagens de erro sem dados internos;
- idempotência e replay;
- logs com correlação sem dados excessivos.

Use o [OWASP API Security Top 10](https://owasp.org/API-Security/) e o [OWASP Top 10](https://owasp.org/www-project-top-ten/) como referências de cobertura.

## 15. Storage

- buckets privados por padrão;
- policies testadas por usuário e tenant;
- signed URLs com expiração e escopo mínimo;
- validação de MIME real, extensão e tamanho;
- proteção contra path traversal;
- nomes de arquivo não confiáveis;
- varredura antimalware quando aplicável;
- impedir conteúdo ativo indevido;
- metadata sem dados pessoais desnecessários;
- exclusão alinhada a retenção, caches e backups;
- logs de download e exportação sensíveis;
- testes de acesso cruzado entre tenants.

## 16. Frontend

- tratar todo conteúdo externo como não confiável;
- escapar e sanitizar HTML;
- evitar `dangerouslySetInnerHTML` sem sanitização comprovada;
- usar CSP quando possível;
- nunca colocar segredo em código client-side;
- não armazenar tokens sensíveis em `localStorage` sem análise de risco;
- limitar dados em `sessionStorage`, URLs e estado global;
- não confiar em campos ocultos, disabled ou filtros visuais;
- revisar source maps e mensagens de erro;
- desabilitar logs pessoais em produção;
- validar autorização no backend mesmo que a UI esconda a ação.

### 16.1 Next.js, hosting e cache

- **Server Actions e Route Handlers são endpoints públicos.** Cada um verifica sessão, autorização por objeto e tenant dentro do próprio handler. Consulte [How to Think About Security in Next.js](https://nextjs.org/blog/security-nextjs-server-components-actions).
- **Middleware/proxy não é barreira única.** Já houve bypass de middleware no Next.js (CVE-2025-29927); a verificação precisa existir também no handler e no banco.
- **`NEXT_PUBLIC_*` vai para o navegador.** Confira o bundle publicado, não só o código.
- **Módulos com segredo** importam `server-only` para falhar no build se chegarem ao cliente.
- **Cabeçalhos:** CSP, HSTS, `frame-ancestors`, `Referrer-Policy`, `Permissions-Policy`, `X-Content-Type-Options`. Referência: [OWASP Secure Headers](https://owasp.org/www-project-secure-headers/).
- **Cookies de sessão:** `HttpOnly`, `Secure`, `SameSite`.
- **Cache:** service worker, CDN, cache de dados do framework e proxies não podem guardar respostas autenticadas, de API ou do banco. Um service worker que faz cache de todo `GET` guarda respostas do Supabase: mostra dados velhos depois de escritas e deixa dados de um usuário no dispositivo depois do logout. Cacheie só assets estáticos versionados da própria origem e versione o cache para apagar o anterior.
- **Arquivos públicos do app** (`sw.js`, manifest, ícones) devem ser servidos sem depender de sessão, sem conter dados.
- **Previews:** variáveis de Preview separadas das de Production (confirme no bundle publicado) e proteção de acesso quando o preview expõe funcionalidade interna. Consulte [Vercel Deployment Protection](https://vercel.com/docs/deployment-protection).

## 17. Autenticação

Audite:

- MFA para perfis privilegiados;
- política de senha e proteção contra stuffing;
- magic links e expiração;
- reset de senha sem enumeração de contas;
- expiração e revogação de sessões;
- rotação e armazenamento de refresh tokens;
- signup e invite flows;
- metadata controlável pelo usuário;
- criação e alteração de roles;
- recuperação de conta;
- logout em dispositivos relevantes;
- alertas para mudança de credencial ou privilégio.

## 18. Webhooks e integrações

- verificar assinatura e timestamp;
- usar nonce/event ID e idempotência;
- impedir replay;
- validar origem sem depender somente de IP;
- limitar payload e tempo de processamento;
- separar credenciais por ambiente;
- mapear tenant de forma confiável;
- controlar retries e efeitos externos;
- registrar tentativa, resultado e correlação;
- não reenviar dados além do necessário.

## 19. Automação, n8n, workers e filas

- credenciais com escopo mínimo;
- workflows separados por ambiente;
- inputs tratados como não confiáveis;
- validação antes de chamar APIs;
- proteção contra execução duplicada;
- retries com backoff e limites;
- dead-letter ou fila de falhas;
- idempotência em escrita;
- logs sem tokens e dados pessoais desnecessários;
- aprovação humana antes de efeitos irreversíveis;
- acesso de worker limitado ao tenant/ação exigidos;
- desligamento seguro e recuperação documentada.

## 20. Agentes de IA

Princípio central:

`AI must never have more privilege than required for the task.`

### Controles

- separar modelo, orquestrador, ferramentas e dados;
- allowlist de ferramentas e argumentos;
- validar argumentos fora do modelo;
- nunca tratar texto do modelo como autorização;
- exigir confirmação humana para ações críticas;
- limitar leitura por tenant e finalidade;
- limitar escrita, exclusão, envio, compra e alteração de privilégio;
- proteger prompts, memória, embeddings e logs;
- combater prompt injection e tool injection;
- impedir exfiltração por resposta, arquivo, URL ou ferramenta;
- filtrar dados pessoais antes de enviar ao modelo quando possível;
- registrar modelo, versão, prompt policy, ferramentas e resultado;
- avaliar retenção e treinamento do provedor;
- testar comportamento adversarial e degradação segura;
- criar kill switch e limite de custo/volume.

Não conceda `service_role`, chave de banco ou acesso irrestrito a um agente somente para simplificar a integração.

### 20.1 Riscos específicos de LLM

Use o [OWASP Top 10 for LLM Applications](https://genai.owasp.org/llm-top-10/) como mapa de cobertura. Pontos que costumam faltar:

- **Injeção indireta:** o ataque vem de dados, não do usuário. Páginas raspadas, e-mails, mensagens de leads, documentos e registros do próprio banco chegam ao modelo; delimite-os como dados (tags ou campos estruturados) e nunca os concatene às instruções do sistema.
- **Saída do modelo é input não confiável:** escape ao renderizar Markdown/HTML e links, valide antes de usar em consulta, comando, URL ou chamada de ferramenta.
- **Exfiltração por saída:** imagens e links gerados pelo modelo podem carregar dados para fora; restrinja domínios renderizados.
- **Consumo descontrolado ("denial of wallet"):** limite tokens, chamadas e custo por tenant e por usuário; alerte sobre picos.
- **Chaves de provedores de IA** guardadas no banco: acesso por coluna/role restrito, nunca retornadas ao cliente, rotação documentada.
- **Automação com efeito externo** (envio de mensagem, mudança de etapa, criação de registro): confirmação humana ou regra determinística, com idempotência.

Use, quando aplicável, o [NIST SP 800-218A para desenvolvimento seguro de sistemas de IA](https://csrc.nist.gov/pubs/sp/800/218/a/final).

## 21. Supply chain

- lockfiles versionados;
- versões fixadas ou política explícita de atualização;
- revisão de dependências novas;
- scan de vulnerabilidades e licença;
- atenção a typosquatting;
- remover pacotes sem manutenção;
- revisar scripts de instalação/build;
- proteger extensões e plugins;
- restringir GitHub Actions e tokens;
- verificar provenance quando disponível;
- separar dependência de build de dependência runtime;
- atualizar com teste e rollback.

## 22. CI/CD

- `main` protegida;
- revisão por pull request;
- checks obrigatórios;
- nenhum deploy direto sem gate;
- secrets isolados por ambiente;
- aprovação para produção;
- migration review;
- artefato imutável e identificável por commit;
- rollback praticável;
- logs de deploy preservados;
- permissão de CI mínima;
- branch preview sem acesso a produção;
- confirmar que o CI realmente executa: em forks, o GitHub Actions vem desabilitado e o PR pode mostrar apenas checks de deploy de preview, que não rodam testes;
- Actions de terceiros fixadas por SHA e `permissions:` explícitas no workflow;
- alertas de dependência e secret scanning do repositório ativos.

O NIST descreve o SSDF como práticas organizadas para preparar a organização, proteger o software, produzir software seguro e responder a vulnerabilidades. Consulte o [NIST SSDF](https://csrc.nist.gov/projects/ssdf). O [CIS Controls v8.1](https://www.cisecurity.org/controls) pode complementar a priorização operacional.

## 23. Logging e auditoria

Registre de forma proporcional:

- login bem-sucedido e falho;
- mudança de role e permissões;
- acesso administrativo;
- leitura/exportação de dados sensíveis;
- criação, alteração e exclusão relevantes;
- falhas de autorização;
- uso de RPCs privilegiadas;
- execução de jobs e webhooks;
- decisões e ações de agentes de IA;
- IDs de correlação, timestamp e ambiente.

Não registre em claro:

- senhas;
- tokens;
- chaves de API;
- números completos de cartão;
- dados pessoais desnecessários;
- prompts com dados pessoais sem necessidade;
- payloads completos quando um resumo seguro basta.

Proteja logs contra alteração, limite acesso e defina retenção.

## 24. Backup e restore

`BACKUP EXISTS != RESTORE VERIFIED`

Verifique:

- cópia automática e manual quando necessário;
- checksum ou integridade;
- cópia fora do dispositivo/ambiente principal;
- restauração periódica em ambiente isolado;
- RPO e RTO documentados;
- schema, dados, Auth, Storage, configurações e chaves de recuperação;
- dependências externas e webhooks durante a restauração;
- acesso ao backup tão restrito quanto o acesso aos dados;
- expiração de cópias conforme retenção;
- runbook de recuperação e responsável;
- se o plano do provedor inclui backup de fato: planos gratuitos podem não ter backup nem PITR. Nesse caso, registre o risco e adote cópia própria periódica ou, no mínimo, SQL de rollback testado para cada mudança de schema.

## 25. Incident response

Fluxo mínimo:

`detect → contain → preserve evidence → revoke credentials → investigate → remediate → retest → communicate → postmortem`

O runbook deve definir:

- canal de acionamento;
- papéis e substitutos;
- severidade;
- isolamento sem destruir evidência;
- rotação/revogação;
- escopo de titulares e dados;
- comunicação interna e externa;
- avaliação jurídica/DPO;
- restauração e validação;
- lições aprendidas e prevenção.

Para incidentes envolvendo dados pessoais, consulte o procedimento atual da [ANPD para comunicação de incidentes](https://www.gov.br/anpd/pt-br/assuntos/incidente-de-seguranca). Não copie prazos legais de memória: confirme o regulamento vigente e a orientação jurídica do caso.

## 26. Revisão independente

Findings `CRITICAL` e `HIGH` devem passar por segunda revisão independente. A segunda pessoa ou ferramenta deve receber:

- escopo;
- versão/commit;
- evidência original;
- hipótese de impacto;
- testes executados;
- limitações;
- diff ou configuração relevante.

Claude, ChatGPT, Codex, SAST e scanners podem ampliar cobertura, mas não substituem julgamento, testes de autorização e validação runtime. Uma IA não deve simplesmente revisar a própria alteração sem uma verificação independente.

---

# Parte II - Proteção de Dados Pessoais e LGPD

## Aviso de escopo

Esta parte traduz princípios jurídicos em controles técnicos e operacionais. Não determina a base legal de um projeto, não substitui DPO/encarregado ou advogado e não garante conformidade por si só. A [LGPD no texto oficial consolidado](https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm) deve ser lida junto das normas e orientações atuais da ANPD.

## 27. Conceitos básicos

| Conceito | Definição operacional |
|---|---|
| Dado pessoal | informação relacionada a pessoa natural identificada ou identificável |
| Dado pessoal sensível | dados como origem racial/étnica, religião, opinião política, filiação sindical, saúde, vida sexual, genético ou biométrico, quando vinculados a pessoa natural |
| Titular | pessoa natural a quem os dados se referem |
| Controlador | quem decide sobre o tratamento |
| Operador | quem trata dados em nome do controlador |
| Encarregado/DPO | canal de comunicação e função de orientação conforme o contexto aplicável |
| Tratamento | operações como coleta, acesso, uso, armazenamento, transmissão, compartilhamento e eliminação |
| Anonimização | uso de meios razoáveis para retirar a possibilidade de associação ao titular |
| Pseudonimização | substituição ou separação de identificadores, mantendo possibilidade de reidentificação sob controle |

As definições legais devem ser conferidas no texto vigente e no contexto concreto. A [ANPD mantém orientação sobre agentes de tratamento e encarregado](https://www.gov.br/anpd/pt-br/centrais-de-conteudo/materiais-educativos-e-publicacoes/guia-orientativo-para-definicoes-dos-agentes-de-tratamento-de-dados-pessoais-e-do-encarregado).

## 28. Data Mapping

Antes de desenvolver ou colocar em produção, mapeie:

`Dado → origem → finalidade → base legal → armazenamento → acesso → compartilhamento → retenção → exclusão`

| Dado | Origem | Finalidade | Base legal a validar | Armazenamento | Acessos | Compartilhamento | Retenção | Exclusão |
|---|---|---|---|---|---|---|---|---|
| Exemplo fictício: e-mail | formulário | criar conta | validar juridicamente | banco principal | usuário e suporte autorizado | provedor de e-mail | prazo documentado | rotina de exclusão |
|  |  |  |  |  |  |  |  |  |

Inclua cópias em logs, backups, caches, Storage, analytics, ferramentas de IA, exports e terceiros.

## 29. Data Classification

| Nível | Exemplos | Controles mínimos |
|---|---|---|
| Public | conteúdo publicado e não pessoal | integridade e revisão |
| Internal | informação operacional sem acesso público | autenticação e need-to-know |
| Confidential | contrato, configuração ou informação empresarial | acesso restrito, logs e criptografia conforme risco |
| Personal Data | nome, telefone, e-mail, identificador | finalidade, minimização, acesso e retenção |
| Sensitive Personal Data | saúde, biometria, religião, origem racial/étnica | controles reforçados, segregação e justificativa |
| Highly Restricted | documentos, credenciais, grandes exports, chaves | acesso excepcional, criptografia, auditoria e aprovação |

Exemplos de dados a classificar: nome, CPF, endereço, telefone, e-mail, geolocalização, documento, biometria, saúde, origem racial/étnica, religião, opinião política, filiação sindical e dados de crianças/adolescentes.

## 30. Minimização

`Não coletar um dado porque "pode ser útil no futuro".`

Para cada campo, pergunte:

- é realmente necessário?
- a finalidade está definida?
- pode ser opcional?
- pode ser pseudonimizado?
- pode ser agregado?
- pode ser apagado depois?
- precisa ser enviado a todos os serviços?
- precisa aparecer na resposta, URL ou log?

## 31. Finalidade e base legal

Registre para cada tratamento:

- finalidade específica;
- base legal proposta;
- responsável pela decisão;
- categorias de titulares e dados;
- prazo e critérios de retenção;
- compartilhamentos;
- comunicação ao titular;
- controles de segurança;
- revisão pelo jurídico/DPO.

O sistema pode operacionalizar uma decisão jurídica; não deve inventar ou escolher sozinho uma base legal.

## 32. Privacy by Design

Projete privacidade no schema e na arquitetura:

- separar dados sensíveis;
- limitar `SELECT` e respostas;
- não devolver CPF quando só o nome é necessário;
- mascarar identificadores;
- evitar dados pessoais em URLs;
- excluir dados de analytics quando desnecessários;
- separar tenant e departamento;
- iniciar com acesso privado;
- registrar finalidade e retenção como metadados operacionais;
- tornar exportação e compartilhamento ações explícitas.

## 33. Privacy by Default

Configurações padrão devem ser restritivas:

- bucket privado;
- perfil não público;
- exportação desabilitada ou limitada;
- logs minimizados;
- permissões mínimas;
- notificações sem dados sensíveis;
- links temporários;
- compartilhamento externo desativado;
- consentimentos não presumidos.

## 34. Dados pessoais em logs

Revise backend, browser, error tracking, analytics, APM, webhooks, workflows, banco e prompts de IA.

- remover campos desnecessários;
- mascarar identificadores;
- truncar payloads;
- bloquear tokens;
- limitar acesso;
- definir retenção;
- testar mensagens de erro;
- verificar logs de terceiros;
- impedir que o modo debug seja permanente.

## 35. Dados pessoais em URLs

Evite padrões como:

`/user?cpf=...`

URLs podem aparecer em histórico do navegador, proxies, analytics, CDN, logs e `Referer`. Prefira identificadores não sensíveis, corpo de requisição protegido, POST quando apropriado e políticas de referrer restritivas.

## 36. Exports

CSV, Excel, PDF e relatórios são superfícies críticas.

Audite:

- quem pode exportar;
- quais campos são incluídos;
- se o tenant é imposto;
- limites de volume e frequência;
- aprovação para exportações sensíveis;
- audit log;
- marcação de origem e finalidade;
- expiração de download;
- revogação de links;
- cópias temporárias e exclusão;
- proteção de arquivos baixados.

## 37. Ambientes não produtivos

Proíba o uso automático de dados reais em local, dev, staging, QA e demos.

Quando inevitável, exija autorização, minimização, mascaramento ou anonimização, acesso restrito, tempo curto, logs e eliminação comprovada. Nunca copie produção para um ambiente experimental por conveniência.

## 38. Retenção

Crie política por categoria:

| Categoria | Finalidade | Retenção ativa | Retenção em backup | Critério de exclusão | Responsável |
|---|---|---|---|---|---|
| Exemplo fictício |  |  |  |  |  |

Pergunte:

- por quanto tempo?
- por qual motivo?
- existe obrigação legal ou contratual?
- pode ser removido ou anonimizado antes?
- backups também expiram?
- caches, índices e exports foram incluídos?

## 39. Exclusão

Modele o ciclo completo:

- soft delete;
- hard delete;
- dados derivados;
- backups;
- caches;
- índices de busca;
- Storage;
- filas e dead-letter;
- terceiros;
- logs;
- embeddings e memória de IA.

Soft delete não equivale necessariamente a exclusão. Documente exceções, retenção legal e prazo operacional.

## 40. Direitos dos titulares

Crie capacidade para receber, verificar, atender e registrar solicitações de:

- informação;
- confirmação;
- acesso;
- correção;
- anonimização;
- bloqueio;
- eliminação quando aplicável;
- portabilidade quando aplicável;
- informação sobre compartilhamento;
- revogação de consentimento quando aplicável;
- oposição e revisão de decisões automatizadas quando aplicável.

O fluxo deve validar a identidade do solicitante, evitar exposição a terceiros, respeitar exceções legais e registrar prazo, decisão e evidência. Consulte a [orientação da ANPD sobre direitos dos titulares](https://www.gov.br/anpd/pt-br/assuntos/titular-de-dados-1/direito-dos-titulares).

## 41. Dados sensíveis

Use controles adicionais:

- acesso restrito;
- criptografia em trânsito e repouso;
- field-level encryption quando necessário;
- logging de acesso;
- mascaramento;
- segregação;
- justificativa de uso;
- retenção mínima;
- revisão de terceiros e IA;
- bloqueio de exportação por padrão.

## 42. Crianças e adolescentes

O tratamento desse público exige atenção reforçada, análise do melhor interesse, controles de idade/responsável quando aplicável e avaliação jurídica/DPO. Não implemente conclusões simplistas nem presuma que um checkbox resolve o risco.

## 43. Setor público

Para prefeituras, autarquias, secretarias e órgãos públicos, considere:

- grande volume de dados de cidadãos;
- integração entre secretarias e fornecedores;
- perfis internos e segregação por função/departamento;
- dados sensíveis e grupos vulneráveis;
- transparência versus privacidade;
- rastreabilidade de consulta e exportação;
- acesso de terceiros;
- logs administrativos imutáveis;
- retenção e eliminação compatíveis com deveres públicos;
- bases legais, competência e instrumentos formais;
- continuidade, disponibilidade e prestação de contas.

Use a [LGPD no texto oficial](https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm) e materiais atuais da ANPD sobre tratamento pelo poder público. A solução técnica deve ser revisada pelo órgão responsável, jurídico e encarregado.

## 44. Compartilhamento com terceiros

Mapeie cloud, e-mail, mensageria, analytics, IA, automação, gateways, fornecedores e APIs.

Pergunta obrigatória:

`Que dados pessoais saem do sistema e para qual empresa, com qual finalidade, sob qual controle e por quanto tempo?`

Registre papel de controlador/operador quando aplicável, instruções, contrato, suboperadores, segurança, localização, retenção, retorno e exclusão.

Para transferências internacionais, valide mecanismo aplicável, transparência e garantias segundo a legislação e regulamentação atual da ANPD. Consulte o [Regulamento de Transferência Internacional de Dados](https://www.gov.br/anpd/pt-br/assuntos/assuntos-internacionais/transferencia-internacional-de-dados).

## 45. IA e LGPD

Verifique:

- quais dados pessoais são enviados a modelos;
- se prompts e arquivos ficam retidos;
- embeddings e vector databases;
- logs do provedor;
- uso para treinamento;
- subprocessadores;
- região e transferência internacional;
- redaction e minimização;
- memória persistente;
- direitos de acesso, correção e exclusão;
- uso de dados em avaliação e fine-tuning.

Princípio:

`Não enviar dados pessoais para um modelo de IA sem necessidade, base, controle e conhecimento do fluxo.`

Use dados sintéticos para testes e exija aprovação para ações autônomas que possam produzir efeito jurídico, financeiro, discriminatório ou relevante sobre pessoas.

## 46. Criptografia

- TLS para transporte;
- encryption at rest;
- field-level encryption para campos de alto risco;
- hashing para senhas e verificadores adequados;
- encryption para dados recuperáveis;
- chaves separadas por ambiente;
- rotação e revogação;
- acesso às chaves auditado;
- nunca confundir hashing com encryption;
- avaliar CPF/documentos conforme risco e necessidade.

## 47. Pseudonimização e anonimização

- **Pseudonimização:** reduz exposição direta, mas os dados continuam potencialmente pessoais se houver possibilidade de reidentificação.
- **Anonimização:** exige avaliar meios razoáveis e disponíveis para reidentificação no contexto concreto.

Separe a tabela/chave de reidentificação, limite acesso, controle correlação e teste risco de reidentificação por combinação de campos.

## 48. Data breach

Checklist técnico:

1. identificar e classificar o evento;
2. conter sem destruir evidências;
3. preservar logs, snapshots e timeline;
4. determinar dados e titulares afetados;
5. estimar quantidade, categorias e duração;
6. revogar acessos e rotacionar credenciais;
7. corrigir causa e validar o controle;
8. acionar jurídico/encarregado/DPO e responsáveis;
9. avaliar comunicação conforme LGPD e regulamentação vigente;
10. comunicar titulares quando aplicável;
11. documentar decisão, incertezas e medidas;
12. realizar postmortem.

Não apresente prazo jurídico absoluto sem verificar a norma vigente e a orientação competente. A ANPD mantém um procedimento atualizado para [Comunicação de Incidente de Segurança](https://www.gov.br/anpd/pt-br/assuntos/incidente-de-seguranca).

---

# Parte III - Templates reutilizáveis

## Finding template

```text
FINDING_ID:
TITLE:
CATEGORY:
SECURITY_SEVERITY:
OPERATIONAL_SEVERITY:
STATUS:
AFFECTED_OBJECT:
VERSION_OR_COMMIT:
EVIDENCE:
ATTACK_PATH:
IMPACT:
PRECONDITIONS:
REPRODUCTION:
MINIMAL_REMEDIATION:
TEST_PLAN:
INDEPENDENT_REVIEW:
RUNTIME_VALIDATION:
OWNER:
DUE_DATE:
RESIDUAL_RISK:
```

## Security Gate template

```text
CRITICAL_OPEN:
HIGH_OPEN:
MEDIUM_OPEN:
LOW_OPEN:
RESTORE_VERIFIED:
STAGING_VALIDATED:
INDEPENDENT_REVIEW_COMPLETE:
RUNTIME_TESTS_COMPLETE:
ROLLBACK_READY:
EXPLICIT_AUTHORIZATION:
SECURITY_GATE:
DECISION_OWNER:
DECISION_DATE:
NOTES:
```

## Data inventory template

```text
DATA_FIELD:
CLASSIFICATION:
DATA_SUBJECT:
PURPOSE:
LEGAL_BASIS_TO_VALIDATE:
SOURCE:
STORAGE:
ACCESS_ROLES:
TENANT_SCOPE:
THIRD_PARTIES:
INTERNATIONAL_TRANSFER:
RETENTION:
DELETION_METHOD:
ENCRYPTION:
PSEUDONYMIZATION:
LOGGED:
EXPORTED:
AI_PROCESSING:
OWNER:
```

## Threat model template

```text
ASSET:
ACTOR:
ENTRY_POINT:
TRUST_BOUNDARY:
THREAT:
IMPACT:
LIKELIHOOD:
EXISTING_CONTROL:
RECOMMENDED_CONTROL:
TEST:
EVIDENCE:
OWNER:
```

## Audit report template

```text
1. RESUMO EXECUTIVO
   - Veredito (SECURITY_GATE) e os 3 riscos mais importantes, em linguagem de negócio.
2. ESCOPO
   - Sistemas, ambientes, versão/commit, período, fora de escopo.
3. METODOLOGIA
   - Regras de engajamento, fontes (código, banco, configuração, runtime), ferramentas.
4. LIMITAÇÕES
   - O que não pôde ser verificado e por quê.
5. FINDINGS
   - Tabela: ID | título | SECURITY_SEVERITY | OPERATIONAL_SEVERITY | status | dono.
   - Detalhe de cada finding no Finding template.
6. CONTROLES VERIFICADOS
   - O que foi testado e está adequado, com evidência.
7. SECURITY GATE
   - Security Gate template preenchido.
8. PLANO DE REMEDIAÇÃO
   - Ordem, esforço, prazo e reteste previsto.
9. ANEXOS
   - Consultas executadas, saídas relevantes (mascaradas), diffs, capturas.
```

## Production change template

```text
CHANGE:
BRANCH:
COMMIT:
REVIEW:
SECURITY_FINDINGS:
STAGING_RESULT:
BACKUP:
RESTORE_VERIFIED:
ROLLBACK:
AUTHORIZATION:
DEPLOY_RESULT:
POST_DEPLOY_TEST:
EVIDENCE_LINKS:
```

---

# Parte IV - Regras para desenvolvimento assistido por IA

Use estas regras como complemento do processo do projeto:

- segurança é requisito de produto e arquitetura;
- nunca fazer deploy diretamente para produção;
- nunca expor secrets, tokens ou dados reais desnecessários;
- nenhuma alteração destrutiva sem autorização explícita;
- `CRITICAL` e `HIGH` bloqueiam produção até tratamento ou aceitação formal;
- usar branch isolada;
- fazer a menor correção segura;
- executar testes proporcionais ao risco;
- solicitar revisão independente;
- usar dados sintéticos sempre que possível;
- tratar LGPD desde o schema e o threat model;
- manter staging realmente separado;
- validar restore, não apenas a existência de backup;
- registrar evidência, versão, decisão e limitações;
- não executar workflows ou ações externas durante auditorias read-only;
- não considerar a resposta da IA como prova sem verificar no código, configuração ou runtime.

---

# Parte V - Padrões prontos (Supabase + Next.js + Vercel)

Trechos testados na auditoria e remediação do NossoCRM (set/2026). Adapte nomes de tabela e coluna. Todos são idempotentes e foram validados com teste antes/depois (runbook, seção 10).

## 49. Lições do caso real

| O que aconteceu | Por que passou despercebido | Padrão que evita |
|---|---|---|
| Cadastro público aberto + gatilho de signup lendo `role` de `user_metadata`: qualquer pessoa virava admin | O template original confiava no metadata do cadastro | Seção 50 |
| ~25 tabelas com `USING (true)` em produção; o staging tinha isolamento aplicado à mão, fora das migrations | Testar no staging "provava" um estado que produção não tinha (drift) | Seções 51 e 9.3 |
| Funções `SECURITY DEFINER` executáveis sem login | `EXECUTE` para `PUBLIC` é o padrão do PostgreSQL | Seção 52 |
| Previews da Vercel com a chave de serviço e o banco de produção | Variáveis marcadas para Production + Preview ao mesmo tempo | Seção 55 |
| A variável `..._PUBLISHABLE_KEY` de produção continha a chave legada `anon` | Só o nome da variável foi conferido, não o valor | Seção 55 |
| Storage: qualquer logado lia e apagava arquivos de outra organização | Policies conferiam só `bucket_id` | Seção 53 |
| Chaves de IA legíveis por qualquer membro | Segredo numa tabela de configurações lida pela sessão do usuário | Seção 54 |
| `REVOKE` em funções do `pg_net` não teve efeito e não deu erro | O privilégio pertencia ao `supabase_admin` | Runbook 4.13 |
| Correções de RLS aplicadas sem backup novo | O backup existente era de antes das mudanças | Checklist, fase E |
| Senha colada no prompt do PowerShell apareceu num print | O script pediu a mesma senha três vezes | Seção 56 |

## 50. Criação de usuário: papel e tenant só do servidor

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE v_org uuid;
BEGIN
  v_org := NULLIF(new.raw_app_meta_data->>'organization_id', '')::uuid;   -- nunca raw_user_meta_data
  IF v_org IS NULL OR NOT EXISTS (SELECT 1 FROM public.organizations o WHERE o.id = v_org) THEN
    RAISE EXCEPTION 'Organization required';          -- ou regra explícita de organização padrão
  END IF;
  INSERT INTO public.profiles (id, email, name, role, organization_id)
  VALUES (new.id, new.email,
          COALESCE(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),  -- só dado cosmético
          COALESCE(new.raw_app_meta_data->>'role', 'user'), v_org);
  RETURN new;
END $$;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

-- O cliente edita só colunas pessoais do próprio perfil.
REVOKE UPDATE ON public.profiles FROM anon, authenticated;
GRANT UPDATE (name, avatar_url, phone, updated_at) ON public.profiles TO authenticated;
```

No código de servidor (convite, setup, instalador), grave papel e tenant em `app_metadata` com a chave de serviço: `auth.admin.createUser({ email, password, user_metadata: { name }, app_metadata: { role, organization_id } })`. Um gatilho `BEFORE UPDATE` em `profiles` que recusa mudança de `role`/`organization_id` quando `auth.uid()` não é nulo é a segunda barreira, caso alguém devolva o grant por engano.

## 51. Isolamento por tenant

```sql
CREATE OR REPLACE FUNCTION public.current_user_org_id()
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = ''
AS $$ SELECT p.organization_id FROM public.profiles p WHERE p.id = auth.uid() $$;
REVOKE ALL ON FUNCTION public.current_user_org_id() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.current_user_org_id() TO authenticated, service_role;

-- Tabelas com organization_id: uma policy FOR ALL com USING e WITH CHECK iguais.
DO $$ DECLARE t text; BEGIN
  FOREACH t IN ARRAY ARRAY['deals', 'contacts', 'activities'] LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', t || '_org_isolate', t);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR ALL TO authenticated
      USING (organization_id = public.current_user_org_id())
      WITH CHECK (organization_id = public.current_user_org_id())', t || '_org_isolate', t);
  END LOOP; END $$;

-- Tabela filha sem organization_id: herda pelo pai.
CREATE POLICY deal_notes_org_isolate ON public.deal_notes FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.deals d WHERE d.id = deal_id AND d.organization_id = public.current_user_org_id()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.deals d WHERE d.id = deal_id AND d.organization_id = public.current_user_org_id()));
```

- Antes de trocar policies, apague **todas** as antigas da tabela (loop em `pg_policies`): uma policy permissiva esquecida anula a restritiva, porque policies permissivas se somam com OR.
- `organizations`: só `SELECT` da própria; escrita apenas pelo servidor. `profiles`: `SELECT` da mesma organização, `UPDATE` só de si mesmo.
- Tabelas sem uso pelo cliente (ex.: `rate_limits`): RLS ligado e nenhuma policy.
- Se o cliente insere sem mandar `organization_id`, use um gatilho `BEFORE INSERT` `SECURITY INVOKER` que preenche com `current_user_org_id()`.
- Registros órfãos (tenant nulo) somem com o isolamento: preencha antes, na mesma migration.

## 52. Funções chamadas pela API

```sql
DO $$ DECLARE f regprocedure; BEGIN
  FOR f IN SELECT p.oid::regprocedure FROM pg_proc p
           WHERE p.pronamespace = 'public'::regnamespace AND p.prosecdef LOOP
    EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM PUBLIC, anon', f);
    EXECUTE format('ALTER FUNCTION %s SET search_path = public, extensions', f);  -- ou '' com nomes qualificados
  END LOOP; END $$;
-- Depois conceda explicitamente o que o app usa:
GRANT EXECUTE ON FUNCTION public.minha_rpc(uuid) TO authenticated;
```

Dentro de cada função `SECURITY DEFINER`, confira o chamador (`auth.uid()`) e o tenant do objeto antes de ler ou escrever. Depois do `REVOKE`, confira com `has_function_privilege('anon', 'public.minha_rpc(uuid)', 'EXECUTE')`.

## 53. Storage por dono

```sql
-- Arquivos em "<deal_id>/<arquivo>": o deal tem de ser da organização do usuário.
CREATE POLICY deal_files_read ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'deal-files' AND EXISTS (
    SELECT 1 FROM public.deals d
    WHERE d.id::text = (storage.foldername(name))[1] AND d.organization_id = public.current_user_org_id()));
-- Repita para INSERT (WITH CHECK) e DELETE (USING).

-- Avatares em "avatars/<user_id>.<ext>": leitura pública, escrita só do dono.
CREATE POLICY avatar_upload ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'avatars' AND split_part(storage.filename(name), '.', 1) = (SELECT auth.uid())::text);
```

Defina o formato do caminho no código **antes** de escrever a policy, e teste upload próprio, upload em pasta alheia e leitura cruzada.

## 54. Segredos de integração

Tabela própria (ex.: `organization_secrets`) com RLS ligado e **nenhuma** policy para `authenticated`; leitura e escrita só por rotas de servidor com a chave de serviço, depois de conferir papel e tenant. A tela mostra só "configurada" ou os 4 últimos caracteres. Assim, grant por coluna e `select('*')` nunca entram em conflito.

## 55. Chaves e ambientes (Supabase + Vercel)

| Variável | Production | Preview | Tipo na Vercel |
|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | projeto de produção | projeto de staging | plain ou sensitive |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | `sb_publishable_...` de produção | `sb_publishable_...` de staging | plain |
| `SUPABASE_SECRET_KEY` | secret `vercel_production` | secret `vercel_preview` **do staging** | sensitive |

- Uma secret key por consumidor, com nome que diz onde é usada; apagar uma não afeta as outras.
- Nunca marque Production e Preview na mesma variável de segredo. Revise também as variáveis com escopo de branch.
- Conferência final no bundle publicado (runbook 5.2): prefixo `sb_publishable_` e ref do projeto certo em cada ambiente.
- Desligar as chaves legadas (JWT) só depois de os logs mostrarem que nada mais as usa (runbook 4.14).

## 56. Operações com senha

- Scripts que precisam de senha pedem em campo oculto (`Read-Host -AsSecureString` no PowerShell), usam a senha só na variável de ambiente do processo (`PGPASSWORD`) e a apagam no fim.
- Pedir a mesma senha várias vezes gera erro de colagem: peça uma vez e confirme uma vez.
- A senha nunca vai para argumento de linha de comando visível em print, log, manifesto ou chat.
- Se uma senha aparecer em print ou histórico: apague do histórico (PowerShell: arquivo do PSReadLine), feche o terminal e troque a senha.

## 57. Web (Next.js)

```ts
// proxy.ts: estáticos de public/ nunca passam pelo redirect de login
export const config = { matcher: [
  '/((?!api|_next/static|_next/image|_next/data|favicon.ico|sitemap.xml|robots.txt|manifest.webmanifest|.*\\.(?:svg|png|jpg|jpeg|gif|webp|js)$).*)',
] };

// next.config.ts: 'unsafe-eval' só em desenvolvimento
const isDev = process.env.NODE_ENV !== 'production';
const scriptSrc = `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''}`;
```

`'unsafe-inline'` só sai com nonce gerado no proxy, e isso torna toda página dinâmica. Registre a decisão em vez de remover sem medir o custo.

## 58. E-mail do domínio

- Raiz que não envia e-mail: `TXT @ "v=spf1 -all"`. Remetentes reais (Resend, Workspace) ficam em subdomínio próprio ou entram no `include:`.
- DKIM de cada serviço publicado conforme o painel dele.
- DMARC em etapas: `p=none` → `p=quarantine; adkim=s; aspf=r` → `p=reject` (após cerca de 2 semanas sem e-mail legítimo em spam). Confira antes com "Mostrar original" no Gmail: SPF, DKIM e DMARC com `PASS`.

## 59. Repositório

- Ruleset no branch padrão: bloquear delete e force push, exigir PR (0 aprovações para quem trabalha sozinho).
- GitHub gratuito: ruleset só em repositório público. Fork não vira privado, só copiando para um repositório novo.
- CI ligado e executando de fato; workflows sem uso desligados.
- Repositório público: nada de segredo, relatório de auditoria ou descrição detalhada de falha aberta.

## Referências principais

- [Lei nº 13.709/2018 - LGPD, Planalto](https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm)
- [ANPD - Guia de Segurança da Informação para agentes de pequeno porte](https://www.gov.br/anpd/pt-br/centrais-de-conteudo/materiais-educativos-e-publicacoes/processo-guia-orientativo-sobre-seguranca-da-informacao-para-agentes-de-tratamento-de-pequeno-porte.pdf)
- [ANPD - Agentes de tratamento e encarregado](https://www.gov.br/anpd/pt-br/centrais-de-conteudo/materiais-educativos-e-publicacoes/guia-orientativo-para-definicoes-dos-agentes-de-tratamento-de-dados-pessoais-e-do-encarregado)
- [ANPD - Direitos dos titulares](https://www.gov.br/anpd/pt-br/assuntos/titular-de-dados-1/direito-dos-titulares)
- [ANPD - Transferência internacional](https://www.gov.br/anpd/pt-br/assuntos/assuntos-internacionais/transferencia-internacional-de-dados)
- [ANPD - Comunicação de incidente de segurança](https://www.gov.br/anpd/pt-br/assuntos/incidente-de-seguranca)
- [OWASP ASVS](https://owasp.org/www-project-application-security-verification-standard/)
- [OWASP API Security Top 10](https://owasp.org/API-Security/)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [OWASP Top 10 for LLM Applications](https://genai.owasp.org/llm-top-10/)
- [OWASP Secure Headers Project](https://owasp.org/www-project-secure-headers/)
- [NIST Secure Software Development Framework](https://csrc.nist.gov/projects/ssdf)
- [NIST SP 800-218A - IA](https://csrc.nist.gov/pubs/sp/800/218/a/final)
- [CIS Critical Security Controls](https://www.cisecurity.org/controls)
- [PostgreSQL Row Security Policies](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [PostgreSQL Function Privileges](https://www.postgresql.org/docs/current/perm-functions.html)
- [Supabase Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Supabase Database Advisors](https://supabase.com/docs/guides/database/database-advisors)
- [Next.js - How to Think About Security](https://nextjs.org/blog/security-nextjs-server-components-actions)
- [Vercel Deployment Protection](https://vercel.com/docs/deployment-protection)

> As fontes devem ser rechecadas quando o projeto for iniciado, especialmente para mudanças regulatórias, versões de dependências, provedores de IA, transferências internacionais e requisitos setoriais.
