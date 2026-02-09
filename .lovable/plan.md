

## Fix: Arquivos sumidos na aba Artes e Docs

### Causa

A tabela `artes_docs` tem **RLS (Row Level Security) ativado**, porem **nenhuma policy** foi criada. Isso bloqueia todas as operacoes (SELECT, INSERT, UPDATE, DELETE) para qualquer usuario, mesmo autenticado. Os 2 arquivos continuam no banco, so nao aparecem na interface.

As outras tabelas do sistema possuem uma policy `auth_only` que permite acesso a usuarios autenticados — a `artes_docs` ficou de fora.

### Correcao

Criar uma migration SQL adicionando a policy `auth_only` na tabela `artes_docs`, identica as demais tabelas:

```sql
CREATE POLICY "auth_only" ON public.artes_docs
  AS RESTRICTIVE
  FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);
```

### Resultado

- Os 2 arquivos existentes voltarao a aparecer imediatamente
- Upload, edicao e exclusao voltarao a funcionar
- Apenas usuarios autenticados terao acesso (mesmo padrao das outras tabelas)

### Arquivo alterado

| Arquivo | Alteracao |
|---|---|
| Nova migration SQL | Adicionar policy `auth_only` na tabela `artes_docs` |

