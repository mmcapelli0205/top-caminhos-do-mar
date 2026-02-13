

## Problema Raiz Identificado

O crash "Algo deu errado" acontece **antes mesmo da tela de login aparecer** porque o arquivo `src/integrations/supabase/client.ts` referencia `localStorage` diretamente na configuracao do cliente Supabase (linha 13):

```text
storage: localStorage,
```

Quando o modulo e importado (isso acontece antes de qualquer componente renderizar), se o navegador bloqueia acesso ao `localStorage` (Safari iOS em navegacao privada, ou outros cenarios restritivos no mobile), uma excecao e lancada no nivel do modulo. Isso derruba toda a aplicacao instantaneamente, ativando o ErrorBoundary com "Algo deu errado".

Isso explica por que nenhum mobile consegue carregar — basta o usuario estar em navegacao privada ou ter restricoes de storage.

## Solucao

### Etapa 1: Criar storage seguro no `client.ts`

Substituir `storage: localStorage` por um wrapper seguro que tenta usar `localStorage` mas, se falhar, usa um fallback em memoria (os dados nao persistem, mas o app funciona normalmente).

### Etapa 2: Remover configuracao explicita desnecessaria

As opcoes `persistSession: true`, `autoRefreshToken: true` e `detectSessionInUrl: true` ja sao os valores padrao do Supabase. Manter apenas o `storage` com o wrapper seguro.

---

### Detalhes Tecnicos

**Arquivo: `src/integrations/supabase/client.ts`**

Adicionar um helper `safeStorage` que:
- Tenta acessar `localStorage` dentro de um `try/catch`
- Se falhar, retorna um objeto `Map`-based que implementa a interface `Storage` (`getItem`, `setItem`, `removeItem`)
- Usa esse helper como `storage` na configuracao do Supabase

Codigo resultante:

```text
function getSafeStorage(): Storage {
  try {
    // Test access
    const key = "__storage_test__";
    localStorage.setItem(key, "1");
    localStorage.removeItem(key);
    return localStorage;
  } catch {
    // Fallback: in-memory storage
    const store = new Map<string, string>();
    return {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => { store.set(k, v); },
      removeItem: (k: string) => { store.delete(k); },
      clear: () => { store.clear(); },
      get length() { return store.size; },
      key: (i: number) => [...store.keys()][i] ?? null,
    };
  }
}

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: getSafeStorage(),
  },
});
```

**Arquivos modificados:**
- `src/integrations/supabase/client.ts`

Apos implementar, sera necessario **publicar** o projeto para que a correcao chegue ao site de producao (caminhosdomar.site).
