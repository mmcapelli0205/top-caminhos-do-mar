

## Adicionar console.log para debug no Login

### Alteracao

No arquivo `src/pages/Login.tsx`, adicionar dois `console.log`:

1. **Antes da query (linha 36):** `console.log("Tentando buscar usuario:", username.trim());`
2. **Apos a query (linha 41, antes do `if (error)`):** `console.log("Resultado:", data, error);`

Isso permitira ver no DevTools exatamente o que o Supabase retorna — se `data` e `null` e `error` e `null`, o problema e RLS bloqueando o SELECT com a anon key.

### Proximo passo apos debug

Se confirmado que RLS bloqueia, sera necessario adicionar uma policy `FOR SELECT USING (true)` na tabela `usuarios` no Supabase, ou criar um approach mais seguro via edge function.

