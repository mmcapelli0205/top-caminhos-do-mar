

## Sistema de Permissoes Granulares - Parte 1: Hook e Regras

### Resumo
Criar dois novos arquivos com o sistema centralizado de permissoes por cargo/posicao em cada area. Nenhum componente existente sera alterado nesta parte.

### Arquivos

**1. Novo: `src/lib/permissoes.ts`**

Arquivo de regras de permissao contendo:
- Tipos: `NivelPermissao` ("E" | "V" | "EP" | "A" | "X"), `CargoArea`, `AbaPermissao`
- Constante `PERMISSOES`: Record com as permissoes de cada area/cargo conforme especificado (Eventos, Hakuna, Seguranca, Logistica, Voz, Comunicacao, Midia, Intercessao, DOC, Louvor, ADM, Diretoria)
- Constante `PERMISSOES_DIRETOR_ESPIRITUAL` com permissoes especificas
- Funcoes utilitarias exportadas: `getPermissaoAba`, `isAbaVisivel`, `canEdit`, `canCreate`, `canDelete`, `canApprove`
- Logica de fallback: se aba nao mapeada para area/cargo, retorna "X"

**2. Novo: `src/hooks/usePermissoes.ts`**

Hook que combina `useAuth`, query da area (coordenadores/sombras) e query do servidor logado (por email) para determinar o `CargoArea` do usuario na area atual.

- Busca area por nome para comparar IDs de coordenadores/sombras com o servidor logado
- Busca servidor pelo email do profile logado
- Determina cargo: compara `servidor.id` com `area.coordenador_id`, `coordenador_02_id`, etc.
- Diretoria recebe acesso total; Diretor Espiritual recebe permissoes especificas
- Retorna: `{ cargo, getPermissao, isDiretoria, isDiretorEspiritual, isLoading }`

### Detalhes Tecnicos

- Nenhuma migration necessaria
- Nenhuma dependencia nova
- 2 arquivos novos, 0 arquivos alterados
- Hook usa React Query keys: `["area-permissoes", areaNome]` e `["servidor-logado", email]`
- A query de servidor usa `maybeSingle()` em vez de `single()` para evitar erro quando servidor nao existe (caso de usuario sem registro em servidores)

