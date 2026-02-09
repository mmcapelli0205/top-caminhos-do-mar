

## Limpeza de Seguranca - Codigo Legado

### Situacao atual

- A tabela `usuarios` so e referenciada na edge function `login/index.ts` e no arquivo de tipos auto-gerado (`types.ts`). Nenhum outro arquivo do projeto a utiliza.
- Nao existem `console.log` expondo dados sensiveis no codigo.

### Acoes

**1. Deletar a edge function `login/index.ts`**
- Remover o arquivo `supabase/functions/login/index.ts`
- Remover a configuracao `[functions.login]` do `supabase/config.toml`
- Deletar a funcao deployada no Supabase

**2. Tabela `usuarios`**
- Nao sera deletada (conforme solicitado)
- Confirmacao: ela NAO e usada em nenhum outro lugar do projeto alem da edge function que sera removida e do arquivo de tipos auto-gerado

**3. Console.logs sensiveis**
- Nao ha nenhum `console.log` no codigo que exponha dados sensiveis — nenhuma acao necessaria

### Resumo das alteracoes

| Arquivo | Acao |
|---|---|
| `supabase/functions/login/index.ts` | Deletar |
| `supabase/config.toml` | Remover secao `[functions.login]` |
| Edge function deployada `login` | Remover do Supabase |

