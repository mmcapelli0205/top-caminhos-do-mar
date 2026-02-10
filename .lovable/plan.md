

## Correção: Tela azul escura vazia depois do login (mobile e desktop)

### Problema identificado

Depois de fazer login, o `AppLayout.tsx` tem dois problemas:

1. **`return null` sem feedback visual** (linha 45): Quando a sessão ainda não foi detectada, o componente renderiza literalmente nada — o usuário vê apenas o fundo azul escuro do CSS (`hsl(240 60% 10%)`).

2. **Spinner de loading quase invisível**: O estado de carregamento mostra um spinner pequeno (`Loader2`) sem nenhum texto ou indicação visual clara, dificultando saber que o app está carregando.

3. **Possível problema de publicação**: As alterações recentes podem não estar publicadas no domínio customizado `caminhosdomar.site`. O app publicado pode estar com código antigo.

### Correções planejadas

**Arquivo: `src/components/AppLayout.tsx`**

1. Substituir `return null` por uma tela de loading visível com spinner e texto "Carregando..."
2. Melhorar o estado de loading existente adicionando texto explicativo e o logo/nome do app
3. Ambos os estados terão fundo escuro explícito para garantir visibilidade

### Detalhes Tecnicos

| Local | Antes | Depois |
|---|---|---|
| `AppLayout.tsx` linha 37-43 (loading) | Spinner sozinho sem texto | Spinner + texto "Carregando..." centralizado |
| `AppLayout.tsx` linha 45 (`!session`) | `return null` (tela vazia) | Mesma tela de loading com spinner + texto, pois logo em seguida o redirect para "/" acontece |

### O que muda na pratica

- O usuario nunca mais vera uma tela completamente vazia/azul
- Sempre havera um spinner com texto "Carregando..." visivel durante transicoes de estado
- O redirect para a tela de login continua funcionando normalmente

### Importante

Depois de aprovar e implementar, sera necessario **publicar** o projeto para que as mudancas aparecam no dominio customizado `caminhosdomar.site`.

