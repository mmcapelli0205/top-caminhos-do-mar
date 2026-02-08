

## Problema

A pagina de Configuracoes e a edge function `manage-users` ainda usam o sistema de autenticacao antigo (tabela `usuarios` + localStorage `top_user`). Porem, a autenticacao foi migrada para o Supabase Auth nativo, com dados em `user_profiles` e `user_roles`.

Resultado: a edge function procura o `caller_id` na tabela `usuarios` (que esta vazia ou sem seu usuario), nao encontra, e retorna "Apenas diretoria pode gerenciar usuarios".

## Solucao

Migrar a pagina de Configuracoes e a edge function para usar o sistema de autenticacao atual.

### 1. Atualizar a edge function `manage-users`

- Em vez de receber `caller_id` no body, extrair o usuario autenticado do header `Authorization` (JWT do Supabase Auth)
- Verificar o papel do usuario na tabela `user_roles` (em vez de `usuarios`)
- Listar usuarios de `user_profiles` + `user_roles` (em vez de `usuarios`)
- Criar/atualizar usuarios usando Supabase Auth Admin API + `user_profiles` + `user_roles`

### 2. Atualizar a pagina `Configuracoes.tsx`

- Substituir `getUser()` (localStorage) por `useAuth()` hook (Supabase Auth)
- Enviar o token JWT do Supabase nas chamadas a API (header Authorization) em vez de `caller_id` no body
- Verificar permissao com base no `role` do hook `useAuth` em vez de `currentUser?.papel`
- Ajustar a interface `Usuario` para refletir os campos de `user_profiles` + `user_roles`

### Detalhes tecnicos

**Edge function `manage-users/index.ts`:**
- Usar `supabase.auth.getUser(token)` para autenticar o caller
- Consultar `user_roles` para verificar se o caller tem role `diretoria`
- Na acao `list`: fazer JOIN de `user_profiles` com `user_roles`
- Na acao `create`: usar `supabase.auth.admin.createUser()` + inserir em `user_profiles` e `user_roles`
- Na acao `update`: atualizar `user_profiles` e `user_roles` (e opcionalmente email/senha via Admin API)

**Pagina `Configuracoes.tsx`:**
- Importar `useAuth` de `@/hooks/useAuth` e `supabase` do client
- Usar `session?.access_token` no header Authorization das chamadas
- Usar `role === 'diretoria'` para controle de acesso
- Adaptar o formulario para os campos de `user_profiles` (email, nome, telefone, cargo, etc.)

