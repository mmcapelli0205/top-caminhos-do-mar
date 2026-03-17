
Problema confirmado: o backend de autenticação está funcionando, mas a interface trava no passo seguinte.

O que a análise mostrou:
- O login do usuário foi aceito pelo Supabase com sucesso (`POST /auth/v1/token` retornou 200).
- Mesmo assim, não houve navegação para `/dashboard`.
- No snapshot de rede não apareceu nenhuma chamada seguinte para `user_profiles`, o que bate com o código atual de `src/pages/Login.tsx`: o `onAuthStateChange` é `async` e faz `await supabase.from("user_profiles")...` antes de navegar.

Causa raiz provável:
- A tela de login ainda depende de um fluxo frágil: ela espera o `onAuthStateChange` disparar e, dentro desse callback, faz uma nova chamada ao Supabase antes de redirecionar.
- Esse padrão é instável e pode “engasgar” após F5 / logout / novo login.
- Além disso, a checagem de `primeiro_acesso` está duplicada na Login, embora o `AppLayout/useAuth` já faça esse controle depois que a sessão existe.

Plano de correção:
1. Simplificar `src/pages/Login.tsx`
   - Remover a consulta assíncrona de `user_profiles` de dentro do `onAuthStateChange`.
   - Fazer o listener apenas reagir à existência de sessão válida e redirecionar de forma síncrona para `/dashboard`.
   - No `handleLogin`, após `signInWithPassword` sem erro, navegar imediatamente para `/dashboard` como fallback robusto, sem depender só do listener.

2. Centralizar a decisão de “primeiro acesso”
   - Deixar a Login só cuidar de autenticar.
   - Deixar `AppLayout`/`useAuth` decidir se o usuário vai para `/dashboard` ou `/primeiro-acesso`, porque esse dado já pertence ao fluxo autenticado.

3. Endurecer o tipo do perfil
   - Em `src/hooks/useAuth.ts`, incluir `primeiro_acesso` na interface `UserProfile`.
   - Em `src/components/AppLayout.tsx`, parar de usar `(profile as any).primeiro_acesso` e usar o campo tipado.

4. Unificar a limpeza de sessão
   - Extrair a limpeza de tokens/localStorage para um helper compartilhado.
   - Reusar esse helper em:
     - `src/hooks/useAuth.ts`
     - `src/hooks/useInactivityTimeout.ts`
     - `src/pages/Login.tsx`
     - `src/pages/PrimeiroAcesso.tsx` (hoje ainda faz `signOut()` simples antes de reautenticar)
   - Isso evita corrigir um fluxo e deixar outro quebrado.

5. Validar o fluxo completo depois da implementação
   - Login normal
   - Logout
   - Novo login sem limpar cache
   - F5 na tela de login e novo login
   - Fluxo de primeiro acesso
   - Teste em desktop e mobile

Arquivos envolvidos:
- `src/pages/Login.tsx` — correção principal
- `src/hooks/useAuth.ts` — tipagem + helper compartilhado
- `src/components/AppLayout.tsx` — usar `primeiro_acesso` tipado
- `src/hooks/useInactivityTimeout.ts` — reaproveitar helper
- `src/pages/PrimeiroAcesso.tsx` — alinhar reautenticação

Resumo técnico:
Isto não está com cara de “cache do navegador”. O login está acontecendo. O gargalo está no frontend, no redirecionamento pós-login. A correção certa é remover a dependência de query assíncrona dentro do `onAuthStateChange` e deixar a navegação pós-login muito mais direta e previsível.
