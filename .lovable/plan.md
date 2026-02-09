

## Fix: Sessao expirando - Inatividade de 40 minutos

### Alteracoes

**1. `src/integrations/supabase/client.ts`** - Adicionar `detectSessionInUrl: true` na config do auth (ja tem `persistSession`, `autoRefreshToken` e `storage`).

**2. Criar `src/hooks/useInactivityTimeout.ts`** - Novo hook que:
- Monitora eventos de atividade: `mousemove`, `mousedown`, `keydown`, `touchstart`, `scroll`
- Timer de 40 minutos (2.400.000ms) de inatividade
- Aos 35 minutos: mostra toast de aviso "Sua sessao expira em 5 minutos" com botao "Continuar" que reseta o timer
- Aos 40 minutos: executa `supabase.auth.signOut()`, mostra toast "Sessao encerrada por inatividade", redireciona para `/`
- Throttle nos event listeners para performance (1 evento a cada 30s no maximo)
- Cleanup dos listeners no unmount

**3. `src/hooks/useAuth.ts`** - Melhorar tratamento do `onAuthStateChange`:
- Tratar evento `TOKEN_REFRESHED` atualizando o state da session
- Nao fazer logout por token expirado (deixar `autoRefreshToken` renovar)

**4. `src/App.tsx`** - Configurar QueryClient com opcoes otimizadas:
```
retry: 2, staleTime: 5min, refetchOnWindowFocus: true
```

**5. `src/components/AppLayout.tsx`** - Adicionar `useInactivityTimeout(40)` no layout principal (so roda para usuarios logados).

### Detalhes tecnicos do hook useInactivityTimeout

```text
Eventos de atividade
       |
       v
  Reseta timer 40min
       |
       +--- 35min sem atividade --> Toast aviso com botao "Continuar"
       |
       +--- 40min sem atividade --> signOut() + toast + redirect "/"
```

- Usa `useRef` para o timer ID e timestamp da ultima atividade
- Usa `useCallback` + throttle para o handler de eventos
- Usa `useEffect` para registrar/limpar listeners
- Toast de aviso usa `sonner` (toast com action button)

### Arquivos

| Arquivo | Acao |
|---|---|
| `src/integrations/supabase/client.ts` | Adicionar `detectSessionInUrl: true` |
| `src/hooks/useInactivityTimeout.ts` | Criar novo hook |
| `src/hooks/useAuth.ts` | Melhorar tratamento de eventos auth |
| `src/App.tsx` | Configurar QueryClient |
| `src/components/AppLayout.tsx` | Usar `useInactivityTimeout(40)` |
