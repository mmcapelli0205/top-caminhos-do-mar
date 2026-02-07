

## Layout Principal + Sidebar + Controle de Acesso

### O que sera feito
Adicionar a estrutura principal do app (sidebar, header, rotas protegidas e controle de acesso por papel) sem alterar a tela de login existente.

### Arquitetura

**Novos arquivos:**
- `src/components/AppLayout.tsx` — Layout wrapper com sidebar + header + area de conteudo
- `src/components/AppSidebar.tsx` — Sidebar com menu filtrado por papel/area
- `src/lib/auth.ts` — Utilitarios de autenticacao (ler usuario do localStorage, mapa de permissoes, logout)
- `src/pages/Participantes.tsx` — Pagina placeholder
- `src/pages/Familias.tsx` — Pagina placeholder
- `src/pages/Servidores.tsx` — Pagina placeholder
- `src/pages/Hakunas.tsx` — Pagina placeholder
- `src/pages/Financeiro.tsx` — Pagina placeholder
- `src/pages/Equipamentos.tsx` — Pagina placeholder
- `src/pages/ArtesEDocs.tsx` — Pagina placeholder
- `src/pages/CheckIn.tsx` — Pagina placeholder
- `src/pages/Configuracoes.tsx` — Pagina placeholder

**Arquivos modificados:**
- `src/App.tsx` — Adicionar todas as rotas dentro do layout
- `src/pages/Dashboard.tsx` — Simplificar (remover logica de auth propria, usar layout)
- `src/index.css` — Atualizar variaveis CSS para dark theme com cores #1A1A2E e #0F0F23

### Tema Dark

Atualizar as variaveis CSS `:root` para aplicar o dark theme por padrao:
- `--background`: cor baseada em #0F0F23 (234 60% 10%)
- `--sidebar-background`: cor baseada em #1A1A2E (240 30% 14%)
- `--primary`: laranja #E8731A convertido para HSL
- Sidebar com foreground claro, accent com tom do laranja

### Controle de Acesso (`src/lib/auth.ts`)

Mapa de itens do menu numerados 1-10:
1. Dashboard, 2. Participantes, 3. Familias, 4. Servidores, 5. Hakunas, 6. Financeiro, 7. Equipamentos, 8. Artes e Docs, 9. Check-in, 10. Configuracoes

Regras:
- **diretoria**: todos (1-10)
- **coordenacao**: depende do `area_servico`:
  - Eventos: 1,2,3,4,8
  - Seguranca: 1,2,3,4,8
  - Hakunas: 1,2,3,4,7,8
  - Logistica: 1,2,4,7,8
  - Comunicacao: 1,3,4,7,8,9
  - Midia: 1,2,3,4,7,8
  - Administracao: 1,2,3,4,5,6,7,8,9
  - Intercessao: 1,2,3,4,8
- **servidor**: 1, 8
- **participante**: apenas Dashboard com conteudo especifico (docs, QR code, informacoes)

Uma funcao `getVisibleMenuItems(user)` retorna a lista filtrada de itens.

### AppLayout (`src/components/AppLayout.tsx`)

- Wrapper que verifica se ha usuario no localStorage; se nao, redireciona para `/`
- Usa `SidebarProvider` do shadcn
- Header fixo no topo com:
  - Esquerda: `SidebarTrigger` (hamburguer no mobile) + "TOP Manager"
  - Direita: nome do usuario, badge com papel, botao logout
- Conteudo renderizado via `<Outlet />` do react-router

### AppSidebar (`src/components/AppSidebar.tsx`)

- Usa componentes shadcn/ui Sidebar
- Le usuario do localStorage, calcula itens visiveis
- Cada item usa `NavLink` para highlighting da rota ativa
- Icones lucide: LayoutDashboard, Users, UsersRound, Shield, HeartPulse, DollarSign, Wrench, Image, QrCode, Settings
- Responsividade via shadcn sidebar: expandida no desktop, colapsada (icones) no tablet, drawer no mobile

### Rotas (`src/App.tsx`)

Estrutura:
```text
/           -> Login (sem layout)
/dashboard  -> AppLayout > Dashboard
/participantes -> AppLayout > Participantes
/familias   -> AppLayout > Familias
/servidores -> AppLayout > Servidores
/hakunas    -> AppLayout > Hakunas
/financeiro -> AppLayout > Financeiro
/equipamentos -> AppLayout > Equipamentos
/artes-docs -> AppLayout > ArtesEDocs
/check-in   -> AppLayout > CheckIn
/configuracoes -> AppLayout > Configuracoes
*           -> NotFound
```

O `AppLayout` sera usado como layout route do react-router (`<Route element={<AppLayout />}>` com rotas filhas usando `<Outlet />`).

### Paginas Placeholder

Cada pagina tera apenas:
- Titulo da pagina (h1)
- Texto "Em construcao"
- Estilo consistente com dark theme

### Secao Tecnica

- O `AppLayout` usa `useEffect` + `useNavigate` para redirecionar se nao logado
- O logout limpa `top_user` do localStorage e navega para `/`
- O shadcn Sidebar com `collapsible="icon"` colapsa em icones; no mobile usa o sheet/drawer automatico
- Nenhuma alteracao no login existente (`src/pages/Login.tsx`)
- Nenhuma tabela nova no Supabase
