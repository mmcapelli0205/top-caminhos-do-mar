

## Mover Hakunas para dentro da Area Hakuna (AreaPortal)

### Resumo
Remover a pagina standalone Hakunas do menu lateral e das rotas, e integrar suas 5 abas (Equipe, Ergometricos, Autorizacoes, Medicamentos, Equipamentos) dentro do AreaPortal quando a area e "Hakuna". As permissoes granulares ja mapeadas em `permissoes.ts` controlam visibilidade e edicao.

### Arquivos a Modificar

**1. `src/pages/AreaPortal.tsx`**

- Importar os 5 componentes existentes:
  - `EquipeTab` de `@/components/hakunas/EquipeTab`
  - `ErgometricosTab` de `@/components/hakunas/ErgometricosTab`
  - `AutorizacoesTab` de `@/components/hakunas/AutorizacoesTab`
  - `MedicamentosEstoqueTab` de `@/components/hakunas/MedicamentosEstoqueTab`
  - `EquipamentosEstoqueTab` de `@/components/hakunas/EquipamentosEstoqueTab`
- Importar `Plus` e `Wand2` de lucide-react, e `useNavigate` (ja importado)

- No TabsList, apos "Pedidos", adicionar 5 abas condicionais (apenas quando `decodedNome === "Hakuna"`):
  - Equipe: `isAbaVisivel(getPermissao("equipe"))`
  - Ergometricos: `isAbaVisivel(getPermissao("ergometricos"))`
  - Autorizacoes: `isAbaVisivel(getPermissao("autorizacoes"))`
  - Medicamentos: `isAbaVisivel(getPermissao("medicamentos"))`
  - Equipamentos: `isAbaVisivel(getPermissao("equipamentos"))`

- Adicionar 5 TabsContent correspondentes, com os componentes existentes renderizados diretamente (eles nao recebem props de permissao atualmente — manter assim nesta fase, pois a logica interna de cada tab ja funciona)

- Na aba "equipe", adicionar um wrapper com botoes "+ Novo Hakuna" e "Gerar Match Automatico" antes do `EquipeTab`, visiveis apenas se `canEditPerm(getPermissao("equipe"))`. O botao "Novo Hakuna" navega para `/servidores/novo?area=Hakuna`.

**2. `src/lib/auth.ts`**

- Remover o item de menu com id 5 ("Hakunas", url "/hakunas") do array `ALL_MENU_ITEMS`
- Remover import `HeartPulse` se nao for mais usado por outros itens

**3. `src/App.tsx`**

- Remover a rota `<Route path="/hakunas" element={<Hakunas />} />`
- Remover o import `Hakunas` de `@/pages/Hakunas`

**4. `src/pages/Hakunas.tsx`**

- NAO deletar o arquivo — manter como referencia

### Detalhes Tecnicos

- Os 5 componentes de abas ja existem como arquivos separados em `src/components/hakunas/`
- Os componentes nao precisam de alteracoes — eles funcionam de forma autonoma com suas proprias queries
- O botao "Gerar Match Automatico" atualmente esta dentro do `EquipeTab` (linha 178), entao NAO precisa ser duplicado no AreaPortal. Ele ja aparece automaticamente ao renderizar `EquipeTab`.
- O botao "+ Novo Hakuna" do `Hakunas.tsx` (linha 36) navegava para `/servidores/novo?area=Hakuna`. Adicionar um botao equivalente acima do EquipeTab no AreaPortal, controlado por permissao.
- Nenhuma migration necessaria
- Nenhuma dependencia nova
- O TabsList ja tem `overflow-x-auto` para scroll horizontal no mobile

