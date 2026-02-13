

## Problema

Ao fazer login no mobile, a tela trava no spinner "Carregando..." indefinidamente. Isso acontece porque:

1. O login via Supabase Auth funciona normalmente
2. O `onAuthStateChange` redireciona para `/dashboard`
3. O `AppLayout` renderiza e o hook `useAuth` começa a buscar o perfil (`user_profiles`) e papel (`user_roles`)
4. Se essa busca falhar silenciosamente (erro de rede, timeout no mobile, etc.), o estado `loading` nunca muda para `false` e o spinner fica infinito

O `useAuth` tem um `try/catch` que faz `setLoading(false)` no `finally`, mas o `catch` vazio pode engolir erros sem dar feedback ao usuario.

## Solucao

### 1. Adicionar timeout de seguranca no `useAuth.ts`

Se o carregamento do perfil demorar mais de 10 segundos, forcar `loading = false` e mostrar o app (mesmo sem perfil, o que redirecionaria para a tela de "Aguardando Aprovacao" ou permitiria retry).

### 2. Adicionar tratamento de erro visivel no `useAuth.ts`

No `catch` do `fetchProfile`, logar o erro no console e opcionalmente mostrar um toast para o usuario saber que algo deu errado.

### 3. Adicionar botao de retry no AppLayout

Se o perfil nao carregar apos o timeout, mostrar um botao "Tentar novamente" em vez do spinner infinito, para que o usuario possa retentar sem recarregar a pagina.

---

### Detalhes Tecnicos

**Arquivo: `src/hooks/useAuth.ts`**
- Adicionar um `setTimeout` de 10 segundos dentro do `useEffect` que busca o perfil
- Se o timer disparar antes do `fetchProfile` completar, forcar `setLoading(false)`
- Adicionar `console.error` no catch para facilitar debug

**Arquivo: `src/components/AppLayout.tsx`**
- Adicionar estado `timedOut` que ativa apos 12 segundos de loading
- Quando `timedOut === true`, mostrar botao "Tentar novamente" e "Sair" em vez do spinner infinito
- O botao "Tentar novamente" chama `refreshProfile()` do hook useAuth

**Arquivos modificados:**
- `src/hooks/useAuth.ts`
- `src/components/AppLayout.tsx`

