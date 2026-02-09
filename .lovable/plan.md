

## Fix: RLS policy on tirolesa_duplas

### Problema

A policy `auth_only` na tabela `tirolesa_duplas` foi criada como **RESTRICTIVE** (`AS RESTRICTIVE`). No PostgreSQL, policies restritivas apenas restringem acesso adicional — e necessario pelo menos uma policy **PERMISSIVE** para conceder acesso. Como so existe a restritiva, todo acesso e negado.

Na tabela `participantes` (que funciona), a mesma policy `auth_only` e **PERMISSIVE**.

### Correcao

Criar uma migration que:
1. Remove a policy restritiva atual
2. Recria como permissiva (sem `AS RESTRICTIVE`)

```sql
DROP POLICY IF EXISTS "auth_only" ON tirolesa_duplas;

CREATE POLICY "auth_only" ON tirolesa_duplas
  FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);
```

### Arquivo alterado

| Arquivo | Alteracao |
|---|---|
| Nova migration SQL | Recriar policy como PERMISSIVE |

