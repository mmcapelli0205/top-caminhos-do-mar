

## Correcao: Policy da tabela artes_docs com tipo errado

### Problema

A policy `auth_only` na tabela `artes_docs` foi criada como **RESTRICTIVE**, enquanto todas as outras tabelas do sistema usam **PERMISSIVE**. No PostgreSQL, policies RESTRICTIVE sozinhas (sem nenhuma PERMISSIVE) bloqueiam todo acesso -- por isso os arquivos nao aparecem mesmo apos login.

### Correcao

Executar uma migration SQL para:
1. Remover a policy RESTRICTIVE atual
2. Recriar como PERMISSIVE (igual as demais tabelas)

```sql
DROP POLICY "auth_only" ON public.artes_docs;

CREATE POLICY "auth_only" ON public.artes_docs
  AS PERMISSIVE
  FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);
```

### Resultado esperado

Os 2 arquivos existentes voltarao a aparecer imediatamente apos login.

