---
name: project-security-baseline
description: Use for auth, RLS, secrets, or HGA security reviews.
---

# Security Baseline (HGA Systems)

Segurança é requisito de arquitetura, não etapa final. Esta skill traz as regras e o método que funcionaram na auditoria e remediação do NossoCRM (set/2026). Os documentos completos estão em `reference/`; leia só o trecho necessário para a tarefa.

| Arquivo | Para quê |
|---|---|
| `reference/SECURITY_AI_INSTRUCTIONS.md` | Regras de conduta do agente (30 itens). Leia inteiro no início. |
| `reference/SECURITY_CHECKLIST.md` | O que conferir, por fase (A: antes de desenvolver … H: LGPD). |
| `reference/SECURITY_AUDIT_RUNBOOK.md` | Como auditar: consultas SQL read-only, comandos, ordem, relatório e fluxo de remediação (seção 10). |
| `reference/SECURITY_PLAYBOOK.md` | Por quê, templates de relatório e **Parte V: padrões prontos** (SQL de isolamento, cadastro, Storage, chaves, CSP, DNS). |

## Regras que nunca se quebram

1. **Nada em produção sem autorização explícita para aquela etapa**: migration, merge, push, variável de ambiente, chave, DNS. Aprovação anterior não vale para a próxima etapa.
2. **Nunca peça, leia, digite ou repita segredos.** Senhas, tokens e chaves privadas ficam com o usuário; scripts pedem senha oculta. Se um segredo aparecer em print ou log, avise e peça a troca.
3. **Staging primeiro, sempre**, com dados sintéticos. Preview nunca usa banco nem chave de produção.
4. **Backup novo antes** de qualquer mudança de RLS, auth, grants ou migration de segurança.
5. **Toda correção tem teste que falha antes e passa depois**, e rollback gerado do estado real do destino.
6. **Prove, não presuma**: confira o efeito (`has_*_privilege`, bundle publicado, logs, API) em vez de confiar que o comando funcionou. `REVOKE` pode não fazer nada e não dar erro.
7. **Repositório público**: sem segredos, sem relatório de auditoria, sem descrição detalhada de falha ainda aberta.

## Modos de uso

### A. Projeto novo (baseline)

1. Leia `SECURITY_AI_INSTRUCTIONS.md` e as fases A e B do checklist.
2. Antes do primeiro código, registre com o usuário: tenants e papéis, **todas as portas de criação de usuário**, dados pessoais (LGPD), integrações e onde ficam os segredos.
3. Nasce certo (Playbook, Parte V):
   - papel e tenant só de `app_metadata`; cadastro público desligado até o isolamento estar provado (§50);
   - `current_user_org_id()` + policy `FOR ALL` com `USING`/`WITH CHECK` por tenant em toda tabela (§51);
   - `REVOKE EXECUTE ... FROM PUBLIC, anon` em toda função e `search_path` fixo (§52);
   - Storage com dono no caminho do arquivo (§53);
   - segredos de integração em tabela só do servidor (§54);
   - uma chave por ambiente e por consumidor; Preview → staging (§55);
   - proxy sem pegar estáticos; CSP sem `unsafe-eval` em produção (§57);
   - SPF/DKIM/DMARC (§58); `main` protegido e CI ligado (§59).
4. Entregue ao usuário a lista do que ficou pendente e do que depende dele (MFA, DNS, contas).

### B. Auditoria

Siga `SECURITY_AUDIT_RUNBOOK.md` na ordem das fases. Regras de engajamento por escrito antes de começar; **somente leitura** em produção; pare e avise se achar segredo exposto ou dado público. Relatório **fora do repositório**, com a severidade calibrada pela tabela do runbook (seção 9). Findings CRITICAL e HIGH bloqueiam produção.

### C. Remediação

Uma correção por branch/worktree, na ordem de severidade, seguindo o runbook (seção 10):
backup → migration idempotente → teste antes/depois no staging → regressão → rollback validado → teste manual no app de staging → **pedir autorização** → produção (leitura antes/depois) → PR → merge → limpar branch.

Antes de propor uma correção só no banco, procure no código quem usa o objeto: grant por coluna quebra `select('*')`, e segredo lido pela sessão do usuário exige mudança de código. Se o escopo crescer, pare e apresente as opções ao usuário (inclusive aceitar o risco, com justificativa registrada).

### D. Antes de produção

Preencha o Security Gate (checklist, fase E) e confirme: backup feito antes da mudança, restore verificado, staging validado, rollback pronto e autorização explícita.

## Formato das respostas ao usuário

- Português do Brasil, direto, sem jargão desnecessário. O usuário decide; você recomenda.
- Para cada achado: o que é, o risco em linguagem de negócio, a evidência e a correção proposta.
- Ao terminar uma etapa: o que foi alterado, o que não foi, quais testes rodaram, se houve escrita ou efeito externo e qual é a próxima decisão do usuário.
