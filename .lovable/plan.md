

## Sistema de Cadastro com Aprovacao - Plano de Implementacao

### Visao Geral

Substituir completamente o sistema de login atual (tabela `usuarios` + edge function `login`) pelo Supabase Auth nativo com fluxo: palavra-chave --> cadastro --> confirmacao de email --> aprovacao manual --> acesso.

---

### 1. Migracao de Banco de Dados

**Alterar tabela `user_profiles`:**
- Adicionar policy RLS para permitir leitura publica (anon) do proprio perfil via `auth.uid()`
- Adicionar policy para INSERT do proprio perfil
- Adicionar policy para UPDATE pelo admin (diretoria)

**Alterar tabela `system_config`:**
- Adicionar policy SELECT para anon (para validar palavra-chave no cadastro)

**Criar tabela `user_roles`** (conforme exigencia de seguranca):
- `id uuid PK`
- `user_id uuid references auth.users(id) on delete cascade`
- `role text` (diretoria, coordenacao, servidor, participante)
- RLS com security definer function `has_role()`

**SQL de bootstrap:**
- Nao sera necessario neste momento pois o primeiro usuario sera criado manualmente ou via logica de "primeiro cadastro = diretoria"

---

### 2. Edge Function: `validate-keyword`

Nova edge function simples que:
1. Recebe `{ keyword: string }`
2. Busca `system_config` onde `chave = 'palavra_chave_cadastro'`
3. Compara (case-insensitive)
4. Retorna `{ valid: true/false }`

Necessaria porque `system_config` tem RLS restritivo para anon.

---

### 3. Estrutura de Arquivos

| Arquivo | Acao |
|---|---|
| `src/pages/Login.tsx` | Reescrever - login com email/senha via Supabase Auth + botao "Criar conta" |
| `src/pages/Cadastro.tsx` | Novo - formulario de cadastro completo |
| `src/pages/Aprovacoes.tsx` | Novo - painel de aprovacao para diretoria |
| `src/pages/AguardandoAprovacao.tsx` | Novo - tela de espera/recusa pos-login |
| `src/lib/auth.ts` | Reescrever - usar Supabase Auth ao inves de localStorage |
| `src/hooks/useAuth.ts` | Novo - hook com onAuthStateChange + profile loading |
| `src/components/AppLayout.tsx` | Modificar - usar novo hook de auth + verificar status do perfil |
| `src/components/AppSidebar.tsx` | Modificar - menu baseado em cargo do user_profiles |
| `src/App.tsx` | Modificar - adicionar rotas /cadastro e /aprovacoes |
| `supabase/functions/validate-keyword/index.ts` | Novo - validacao da palavra-chave |

---

### 4. Detalhes por Componente

#### Login.tsx (reescrita)
- Manter visual atual (background, logo, card glassmorphism)
- Campos: Email + Senha (substituem username)
- Botao "ENTRAR" chama `supabase.auth.signInWithPassword()`
- Botao "Criar conta" abaixo
- Ao clicar "Criar conta": abre Dialog pedindo palavra-chave
  - Valida via edge function `validate-keyword`
  - Se correto: navega para `/cadastro`
  - Se errado: toast erro

#### Cadastro.tsx (novo)
- Mesma estetica da tela de login (background + card)
- Campos: nome, email, telefone (mascara), numero_legendario, area_preferencia (Select com 15 areas), senha, confirmar_senha
- Ao submeter:
  1. `supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin } })`
  2. Insert em `user_profiles` com `id = auth user id`, `status = 'pendente'`
  3. Mostra mensagem de sucesso

#### useAuth.ts (novo hook)
- `onAuthStateChange` listener
- Carrega `user_profiles` quando autenticado
- Carrega `user_roles` para verificar cargo
- Expoe: `session`, `profile`, `role`, `loading`, `signOut`

#### AppLayout.tsx (modificar)
- Usa `useAuth` ao inves de `getUser()`
- Se profile.status = 'pendente' --> renderiza `AguardandoAprovacao`
- Se profile.status = 'recusado' --> renderiza tela de recusa
- Se profile.status = 'aprovado' --> renderiza layout normal

#### AguardandoAprovacao.tsx (novo)
- Icone Clock + mensagem "Seu cadastro esta em analise"
- Botao "Sair" (logout)
- Se status = 'recusado': icone XCircle + motivo_recusa + botao "Sair"

#### Aprovacoes.tsx (novo)
- Visivel apenas para diretoria
- Cards de contagem: Pendentes | Aprovados | Recusados | Total
- Filtro por status + busca por nome
- Tabela: Nome | Email | Telefone | N Legendario | Area | Data | Status | Acoes
- Acoes pendentes: Aprovar (com select de cargo) + Recusar (com motivo)
- Acoes aprovados: Alterar cargo + Revogar
- Secao "Configuracoes" com campo editavel da palavra-chave (update `system_config`)

#### Menu Lateral (AppSidebar + auth.ts)
- Adicionar item "Aprovacoes" (icone UserCheck, id=12) visivel apenas para diretoria
- Mapear cargo do `user_profiles` para visibilidade de menu:
  - `diretoria`: tudo
  - `coordenacao` (coord, coord02, coord03): Dashboard, Participantes, Servidores, Area, Financeiro
  - `sombra`: Dashboard, Area
  - `servidor`: Dashboard, Area

---

### 5. Detalhes Tecnicos

**Autenticacao:**
- Substituir `localStorage.getItem("top_user")` por `supabase.auth.getSession()`
- `onAuthStateChange` configurado ANTES de `getSession()`
- `emailRedirectTo: window.location.origin` no signUp

**user_roles vs user_profiles.cargo:**
- A coluna `cargo` em `user_profiles` define o papel operacional (qual menu ve)
- Tabela `user_roles` armazena roles para RLS policies seguras
- Ao aprovar, o admin insere na `user_roles` tambem

**Bootstrap do primeiro usuario:**
- Logica na edge function ou no frontend: se `user_profiles` esta vazio e alguem faz cadastro, auto-aprovar como diretoria
- Alternativa: inserir manualmente via SQL o registro do Joao Coury

**Logout:**
- Chamar `supabase.auth.signOut()` ao inves de limpar localStorage

**Configuracao da palavra-chave:**
- Na pagina Aprovacoes, secao no final
- Update em `system_config` via Supabase client (precisa de RLS policy adequada)

---

### 6. Sequencia de Implementacao

1. Migracoes de banco (RLS policies, user_roles)
2. Edge function `validate-keyword`
3. Hook `useAuth.ts`
4. Reescrever `Login.tsx`
5. Criar `Cadastro.tsx`
6. Criar `AguardandoAprovacao.tsx`
7. Modificar `AppLayout.tsx`
8. Modificar `auth.ts` e `AppSidebar.tsx`
9. Criar `Aprovacoes.tsx`
10. Atualizar `App.tsx` com novas rotas

