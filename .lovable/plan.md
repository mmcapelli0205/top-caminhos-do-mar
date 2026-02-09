

## Fix: Loop na aprovacao - Email nao confirmado

### Problema raiz

Os logs do Supabase Auth mostram erros repetidos `email_not_confirmed` ao tentar login. O fluxo atual:

1. Usuario se cadastra via Cadastro.tsx (auth.signUp)
2. Supabase Auth envia email de confirmacao (obrigatorio)
3. Diretor aprova o perfil na pagina de Aprovacoes (atualiza user_profiles e user_roles)
4. Usuario tenta logar mas NAO CONSEGUE porque o email nao foi confirmado no Supabase Auth
5. "Loop" - tenta varias vezes, sempre falha

A aprovacao do perfil (user_profiles.status = "aprovado") NAO confirma o email no sistema de autenticacao. Sao duas coisas separadas.

### Solucao

Ao aprovar um usuario, chamar a Admin API do Supabase para confirmar o email automaticamente. Isso sera feito via edge function `manage-users` (que ja existe e tem acesso ao `SUPABASE_SERVICE_ROLE_KEY`).

### Alteracoes

**1. `supabase/functions/manage-users/index.ts`** - Adicionar acao "confirm_email":

```ts
if (action === "confirm_email") {
  const { user_id } = body;
  if (!user_id) return json({ error: "user_id obrigatorio" }, 400);
  
  const { error } = await supabase.auth.admin.updateUserById(user_id, {
    email_confirm: true
  });
  
  if (error) return json({ error: error.message }, 500);
  return json({ success: true });
}
```

**2. `src/pages/Aprovacoes.tsx`** - Na funcao `handleAprovar`, apos atualizar perfil e role, chamar a edge function para confirmar o email:

```ts
// Apos o upsert do role, confirmar email via edge function
const { data: sessionData } = await supabase.auth.getSession();
await fetch("https://ilknzgupnswyeynwpovj.supabase.co/functions/v1/manage-users", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${sessionData?.session?.access_token}`,
  },
  body: JSON.stringify({ action: "confirm_email", user_id: aprovarDialog.id }),
});
```

**3. `src/pages/Aprovacoes.tsx`** - Corrigir o gerenciamento de roles na aprovacao:

Problema atual: o upsert com `onConflict: "user_id,role"` nao remove roles anteriores. Se o usuario tiver role "servidor" e for aprovado como "diretoria", fica com duas roles.

Correcao: deletar roles existentes antes de inserir a nova (usando a edge function manage-users que tem permissao de DELETE via service role):

```ts
// Substituir o upsert por: delete old roles + insert new
await fetch(".../manage-users", {
  body: JSON.stringify({ 
    action: "update", 
    user_id: aprovarDialog.id, 
    role: cargoSelecionado 
  }),
});
```

Ou alternativamente, manter o upsert mas antes deletar roles antigas via edge function.

**4. `src/pages/Aprovacoes.tsx`** - Mover o setState da linha 78 para um useEffect:

```ts
// DE (durante render - anti-pattern):
if (configData?.valor && !keyword) setKeyword(configData.valor);

// PARA (useEffect):
useEffect(() => {
  if (configData?.valor && !keyword) setKeyword(configData.valor);
}, [configData?.valor]);
```

### Fluxo corrigido

```text
Diretor clica "Aprovar"
       |
       v
1. Atualiza user_profiles (status=aprovado, cargo=X)
       |
       v
2. Gerencia roles via edge function (delete old + insert new)
       |
       v
3. Confirma email via edge function (admin.updateUserById)
       |
       v
4. Toast de sucesso + refetch lista
       |
       v
Usuario aprovado consegue logar imediatamente!
```

### Arquivos alterados

| Arquivo | Alteracao |
|---|---|
| `supabase/functions/manage-users/index.ts` | Adicionar acao "confirm_email" |
| `src/pages/Aprovacoes.tsx` | Chamar confirm_email na aprovacao, corrigir roles, fix useEffect |

