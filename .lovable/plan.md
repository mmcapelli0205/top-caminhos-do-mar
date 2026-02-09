

## Fix URGENTE: Loading infinito no useAuth

### Problema

O `useAuth.ts` tem o `loadProfile` dentro do callback do `onAuthStateChange`, e o `useEffect` depende de `[loadProfile]`. Isso cria um ciclo: auth event -> fetch profile -> state update -> re-render -> `loadProfile` recria (apesar do useCallback, qualquer mudanca de dependencias o recria) -> useEffect re-executa -> novo listener -> novo auth event -> loop.

### Correcoes

#### 1. `src/hooks/useAuth.ts` — Reescrever com 2 useEffects independentes

**useEffect 1** (dependencias: `[]`):
- Configura `onAuthStateChange` que SO faz `setSession(newSession)` e `setLoading(false)`
- Chama `getSession()` para sessao inicial
- Cleanup: `subscription.unsubscribe()`
- NAO chama loadProfile aqui

**useEffect 2** (dependencias: `[userId]` derivado de `session?.user?.id`):
- Quando `userId` muda (e nao e null), busca profile e role
- Quando `userId` e null, limpa profile e role
- Controla loading de profile separadamente ou junto

Estrutura:

```text
useAuth
  |
  +-- useEffect 1 ([] deps)
  |     onAuthStateChange -> setSession only
  |     getSession -> setSession + setLoading(false)
  |
  +-- useEffect 2 ([session?.user?.id] deps)
  |     userId exists -> fetch profile + role
  |     userId null -> clear profile + role
  |
  +-- signOut (useCallback, [] deps)
  +-- refreshProfile (useCallback, [session?.user?.id] deps)
```

#### 2. `src/pages/Login.tsx` — Remover navigate apos login

Linha 71: remover `navigate("/dashboard")`. O `onAuthStateChange` detecta a sessao, o `AppLayout` renderiza automaticamente via rota protegida. Em vez disso, apenas mostrar o loading enquanto o auth processa.

#### 3. `src/components/AppLayout.tsx` — Sem mudancas necessarias

O codigo atual ja redireciona para `/` quando `!loading && !session` (linha 26-30) e retorna null quando `!session` (linha 45). Isso esta correto.

#### 4. `src/hooks/useInactivityTimeout.ts` — Sem mudancas necessarias

Nao possui setInterval ou setTimeout que recarregue sessao. Apenas timers de inatividade que funcionam corretamente.

### Arquivos alterados

| Arquivo | Alteracao |
|---|---|
| `src/hooks/useAuth.ts` | Separar em 2 useEffects, remover loadProfile do onAuthStateChange |
| `src/pages/Login.tsx` | Remover `navigate("/dashboard")` da linha 71 |

### Detalhes tecnicos do novo useAuth

```text
Estado:
  session (Session | null)
  profile (UserProfile | null)  
  role (string | null)
  loading (boolean) — true ate sessao inicial + profile carregados

useEffect 1 — Listener de auth ([] deps):
  const { subscription } = onAuthStateChange((event, s) => {
    setSession(s)  // SO isso
  })
  getSession().then(s => setSession(s))
  return () => subscription.unsubscribe()

useEffect 2 — Carregar profile ([session?.user?.id] deps):
  const userId = session?.user?.id
  if (!userId) {
    setProfile(null)
    setRole(null)  
    setLoading(false)
    return
  }
  // fetch profile + role
  // setLoading(false) ao terminar
```

A chave e que o useEffect 1 NUNCA depende de funcoes que mudam, e o useEffect 2 so re-executa quando o ID do usuario realmente muda — nao a cada re-render.
