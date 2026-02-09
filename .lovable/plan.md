

## Fix: Aprovacao robusta em uma unica chamada

### Problema

A aprovacao atual faz 3 chamadas de rede sequenciais:
1. `supabase.from("user_profiles").update(...)` (cliente direto)
2. `fetch(edge fn, action: "update")` (gerenciar roles)
3. `fetch(edge fn, action: "confirm_email")` (confirmar email)

Isso causa lentidao (cold start da edge function), risco de falha parcial (perfil atualizado mas role/email nao), e o spinner fica "em loop" por varios segundos sem feedback.

### Solucao

Criar uma acao `approve` na edge function que faz tudo de uma vez: atualizar perfil, gerenciar roles e confirmar email. O cliente faz UMA unica chamada.

### Alteracoes

**1. `supabase/functions/manage-users/index.ts`** - Nova acao "approve":

```ts
if (action === "approve") {
  const { user_id, cargo, aprovado_por } = body;
  if (!user_id || !cargo) return json({ error: "user_id e cargo obrigatorios" }, 400);

  // 1. Update user_profiles
  const { error: profileError } = await supabase
    .from("user_profiles")
    .update({
      status: "aprovado",
      cargo,
      aprovado_por,
      data_aprovacao: new Date().toISOString(),
    })
    .eq("id", user_id);
  if (profileError) return json({ error: profileError.message }, 500);

  // 2. Delete old roles + insert new
  await supabase.from("user_roles").delete().eq("user_id", user_id);
  const { error: roleError } = await supabase
    .from("user_roles")
    .insert({ user_id, role: cargo });
  if (roleError) return json({ error: roleError.message }, 500);

  // 3. Confirm email
  const { error: confirmError } = await supabase.auth.admin.updateUserById(user_id, {
    email_confirm: true,
  });
  if (confirmError) return json({ error: confirmError.message }, 500);

  return json({ success: true });
}
```

Tambem alterar a verificacao de permissao: alem de checar role "diretoria", tambem checar `pode_aprovar = true` no `user_profiles`. Isso porque a pagina de Aprovacoes e acessivel a qualquer usuario com `pode_aprovar`, nao apenas diretoria.

```ts
// Apos checar roleData para diretoria, tambem verificar pode_aprovar
if (!roleData) {
  const { data: approverProfile } = await supabase
    .from("user_profiles")
    .select("pode_aprovar")
    .eq("id", caller.id)
    .single();

  // Permitir apenas para acoes de aprovacao se tem pode_aprovar
  if (!approverProfile?.pode_aprovar || !["approve", "confirm_email"].includes(action)) {
    return json({ error: "Apenas diretoria pode gerenciar usuarios" }, 403);
  }
}
```

**2. `src/pages/Aprovacoes.tsx`** - Simplificar `handleAprovar`:

Substituir as 3 chamadas por uma unica:

```ts
const handleAprovar = async () => {
  if (!aprovarDialog) return;
  setAprovando(true);
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData?.session?.access_token;

    const res = await fetch(
      "https://ilknzgupnswyeynwpovj.supabase.co/functions/v1/manage-users",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          action: "approve",
          user_id: aprovarDialog.id,
          cargo: cargoSelecionado,
          aprovado_por: session?.user?.id,
        }),
      }
    );

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Erro ao aprovar");
    }

    toast({ title: `${aprovarDialog.nome} aprovado como ${CARGOS.find(c => c.value === cargoSelecionado)?.label}!` });
    queryClient.invalidateQueries({ queryKey: ["user-profiles"] });
    setAprovarDialog(null);
  } catch (e: any) {
    toast({ title: e.message || "Erro ao aprovar", variant: "destructive" });
  } finally {
    setAprovando(false);
  }
};
```

### Arquivos alterados

| Arquivo | Alteracao |
|---|---|
| `supabase/functions/manage-users/index.ts` | Adicionar acao "approve" (tudo em uma chamada) + permitir users com `pode_aprovar` |
| `src/pages/Aprovacoes.tsx` | Substituir 3 chamadas por 1 unica chamada a acao "approve" |

### Resultado

- Aprovacao em 1 chamada em vez de 3 (mais rapido, sem cold start duplo)
- Se qualquer etapa falhar, o erro e mostrado ao usuario (nao mais silenciado)
- Users com `pode_aprovar` (nao apenas diretoria) podem aprovar via edge function
- Atomicidade: se o role falhar, o usuario vê o erro em vez de ficar com status inconsistente

