

## Remover Edge Function Legada `login`

A edge function `login` ainda existe no projeto apesar de ser codigo morto (a autenticacao agora usa Supabase Auth nativo). Ela precisa ser removida.

### Acoes

| Arquivo / Recurso | Acao |
|---|---|
| `supabase/functions/login/index.ts` | Deletar arquivo |
| `supabase/config.toml` | Remover linhas 3-4 (`[functions.login]` e `verify_jwt = false`) |
| Edge function deployada `login` | Deletar do Supabase |

### Detalhes tecnicos

1. Deletar o arquivo `supabase/functions/login/index.ts` (e o diretorio `login/`)
2. Editar `supabase/config.toml` removendo a secao `[functions.login]`, resultando em:
```
project_id = "ilknzgupnswyeynwpovj"

[functions.manage-users]
verify_jwt = false

[functions.validate-keyword]
verify_jwt = false
```
3. Chamar a ferramenta de delecao de edge functions para remover `login` do Supabase

Nenhum outro arquivo do projeto referencia essa edge function.
