

## Fix: Permissao `pode_aprovar` para pagina Aprovacoes

### Problema
A pagina Aprovacoes atualmente e visivel para todos os usuarios com cargo `diretoria`. O pedido e desacoplar isso do cargo e usar uma flag dedicada `pode_aprovar` na tabela `user_profiles`.

### Alteracoes

#### 1. Migracao de Banco de Dados
- Adicionar coluna `pode_aprovar BOOLEAN DEFAULT FALSE` na tabela `user_profiles`
- Setar `pode_aprovar = true` para o usuario `4c7d3dae-e747-4414-a11d-5fd3126404f5`

#### 2. Hook useAuth (`src/hooks/useAuth.ts`)
- Adicionar `pode_aprovar` ao type `UserProfile`
- O campo ja sera carregado automaticamente pelo `select("*")`

#### 3. Menu Lateral (`src/lib/auth.ts`)
- Modificar `getVisibleMenuItems` para receber um segundo parametro `podeAprovar: boolean`
- O item "Aprovacoes" (id=12) so aparece se `podeAprovar === true`, independente do cargo
- Remover o item 12 do array default da diretoria

#### 4. AppSidebar (`src/components/AppSidebar.tsx`)
- Receber prop `podeAprovar` alem de `cargo`
- Passar para `getVisibleMenuItems(cargo, podeAprovar)`

#### 5. AppLayout (`src/components/AppLayout.tsx`)
- Passar `podeAprovar={profile.pode_aprovar}` para o `AppSidebar`

#### 6. Protecao da Rota `/aprovacoes` (`src/pages/Aprovacoes.tsx`)
- No inicio do componente, verificar `profile.pode_aprovar`
- Se `false`, redirecionar para `/dashboard`

#### 7. Toggle na pagina Aprovacoes (`src/pages/Aprovacoes.tsx`)
- Na tabela de usuarios aprovados, adicionar coluna ou acao com Switch/toggle "Pode aprovar"
- Ao ativar/desativar: `UPDATE user_profiles SET pode_aprovar = valor WHERE id = usuario_id`
- Usar componente `Switch` do shadcn (ja disponivel)

### Sequencia
1. Migracao de banco (coluna + update do usuario)
2. Atualizar `UserProfile` type no hook
3. Modificar `getVisibleMenuItems` em `auth.ts`
4. Atualizar `AppSidebar` e `AppLayout` para passar `podeAprovar`
5. Adicionar protecao de rota e toggle em `Aprovacoes.tsx`

