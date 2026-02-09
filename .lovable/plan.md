

## Fix: Cadastro nao insere user_profiles

### Problema

O `signUp` do Supabase Auth cria o usuario, mas o INSERT na `user_profiles` falha silenciosamente porque:
- Com confirmacao de email habilitada, o usuario nao esta autenticado apos o `signUp`
- As policies RLS exigem `auth.uid() IS NOT NULL` e `id = auth.uid()` para INSERT
- Sem sessao ativa, o INSERT e rejeitado pelo RLS

### Solucao (2 partes)

**Parte 1 - Database trigger (SECURITY DEFINER)**

Criar uma funcao + trigger que automaticamente insere na `user_profiles` quando um novo usuario e criado no `auth.users`. Como e `SECURITY DEFINER`, bypassa RLS.

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.user_profiles (id, nome, email, telefone, numero_legendario, area_preferencia, status, cargo)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nome', ''),
    COALESCE(NEW.email, ''),
    COALESCE(NEW.raw_user_meta_data->>'telefone', null),
    COALESCE(NEW.raw_user_meta_data->>'numero_legendario', null),
    COALESCE(NEW.raw_user_meta_data->>'area_preferencia', null),
    'pendente',
    'servidor'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
```

**Parte 2 - Cadastro.tsx**

1. Passar dados do formulario no `options.data` do `signUp` (metadata do auth)
2. Remover o INSERT manual na `user_profiles` (o trigger cuida disso)

Alteracao no `signUp`:
```ts
await supabase.auth.signUp({
  email: form.email.trim(),
  password: form.senha,
  options: {
    emailRedirectTo: window.location.origin,
    data: {
      nome: form.nome.trim(),
      telefone: form.telefone.trim(),
      numero_legendario: form.numero_legendario.trim() || null,
      area_preferencia: form.area_preferencia || null,
    },
  },
});
```

Remover as linhas 107-122 (o bloco do INSERT na `user_profiles` e o tratamento de erro do profile).

### Arquivos alterados

| Arquivo | Alteracao |
|---|---|
| Migration SQL | Criar funcao `handle_new_user()` + trigger `on_auth_user_created` |
| `src/pages/Cadastro.tsx` | Passar metadata no signUp, remover INSERT manual |

### Observacao importante

O trigger e criado na tabela `auth.users`. Embora a documentacao do Supabase desencoraje modificacoes no schema `auth`, **triggers na tabela `auth.users` para criar profiles e um padrao oficial recomendado pelo Supabase** e nao causa problemas.
