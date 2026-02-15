

## TOP Real Time - Acompanhamento ao Vivo

### Resumo
Criar pagina dedicada `/top-real-time` com dois timers paralelos (teorico e real), controles de execucao para ADM/Diretoria, e visualizacao readonly para coordenadores 01. Adicionar card no Dashboard e item no menu lateral.

### Arquivos

**1. Novo: `src/pages/TopRealTime.tsx`**

Pagina principal com:

- **Verificacao de acesso**: Usa `useAuth()` para role + query em `servidores` pelo email do profile para verificar se e coord_01 (campo `cargo_area` contendo "coordenador" ou similar, e posicao na tabela `areas.coordenador_id`). Se nao autorizado, redireciona para `/dashboard`.
- **Permissoes**:
  - `canControl = isDiretoria || isAdmCoord` (coordenadores da area ADM)
  - Coord 01 de outras areas: apenas visualiza
- **Estado**: `diaSelecionado` (D1-D4), atividades do dia via React Query com `refetchInterval: 5000`
- **Query**: `cronograma_atividades` filtrado por dia + cronograma_tipo "adm", ordenado por `ordem`

**Header**:
- Titulo "TOP Real Time" com bolinha vermelha `animate-pulse`
- Seletor de dia (4 botoes coloridos, mesmas cores do cronograma: D1=laranja, D2=azul, D3=verde, D4=amarelo)
- Badge "Atividade X de Y"
- Botao "Voltar ao Inicio" no canto direito

**Painel Teorico (esquerda)**:
- Card com borda azul, titulo "Cronograma Planejado"
- Calcula qual atividade deveria estar acontecendo baseado em `new Date()` vs `horario_inicio/horario_fim` de cada atividade
- Timer `setInterval(1000)` mostrando tempo restante ou tempo excedido (vermelho se negativo)
- Mostra: nome, tipo (badge), local, horario previsto

**Painel Real (direita)**:
- Card com borda laranja, titulo "Execucao Real"
- Mostra atividade com `status_execucao === 'em_andamento'`
- Timer contando desde `horario_inicio_real`
- Barra de progresso baseada em `tempo_previsto_min`:
  - Verde: < 80%
  - Amarelo: 80-100%
  - Vermelho: > 100%
- Mostra: nome, tipo, local, horario real de inicio

**Comparacao Central**:
- Badge grande entre os paineis mostrando diferenca entre posicao teorica e real
- Verde "No horario" se < 5min, verde "Adiantado Xmin", vermelho pulsante "Atrasado Xmin"

**Controles (se canControl)**:
- Card atividade atual com botao "CONCLUIR" (vermelho, h-12)
  - Ao clicar: update `horario_fim_real = NOW()`, calcula `tempo_real_min`, `status_execucao = 'concluida'`
  - Invalida query, avanca para proxima
- Card proxima atividade com botao "INICIAR" (verde, h-12)
  - Ao clicar: update `horario_inicio_real = NOW()`, `status_execucao = 'em_andamento'`
- Botao "PULAR" (cinza, menor) com dialog para observacao obrigatoria
  - `status_execucao = 'pulada'`, `observacao_execucao = texto`

**Lista do Dia (abaixo)**:
- Lista compacta de todas as atividades do dia
- Icones de status: check verde (concluida), circulo laranja pulsante (em andamento), seta cinza (pulada, texto riscado), relogio cinza (pendente)
- Atividades concluidas mostram: tempo previsto vs real + diferenca

**2. Alteracao: `src/App.tsx`**

- Importar TopRealTime
- Adicionar rota: `<Route path="/top-real-time" element={<TopRealTime />} />` dentro do AppLayout

**3. Alteracao: `src/lib/auth.ts`**

- Adicionar item no `ALL_MENU_ITEMS`:
```text
{ id: 13, title: "TOP Real Time", url: "/top-real-time", icon: Radio }
```
- Import `Radio` do lucide
- No `getVisibleMenuItems`:
  - Diretoria: incluir id 13
  - Coordenacao: incluir id 13
  - Outros: nao incluir

**4. Alteracao: `src/pages/Dashboard.tsx`**

- Na secao "Countdown + Card Equipe", mudar grid para 3 colunas no desktop:
```text
<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
  <CountdownSection />
  <QuickActions userEmail={profile?.email ?? null} />
  <TopRealTimeCard />
</div>
```
- Novo componente inline `TopRealTimeCard`:
  - Icone Radio com `animate-pulse`
  - Titulo "TOP Real Time"
  - Subtexto "Acompanhamento ao vivo"
  - Logica de data: `const isLive = new Date() >= new Date("2026-04-02") || searchParams.get("debug") === "true"`
  - Se nao live: badge "Em breve", opacity-50, nao clicavel
  - Se live: badge "AO VIVO" vermelho pulsante, onClick navega para `/top-real-time`
  - Usar `useSearchParams` do react-router-dom para debug

### Logica de Permissoes Detalhada

```text
isDiretoria (role === "diretoria") -> canControl = true, ve tudo
Coord ADM (area_servico === "ADM" e cargo_area coord) -> canControl = true
Coord 01 de qualquer area (coordenador_id na tabela areas) -> canControl = false, apenas visualiza
Logistica coords -> visualiza (ve cronograma adm)
Demais -> redireciona para /dashboard
```

Para determinar se usuario e coord_01: query em `areas` verificando se `coordenador_id` corresponde ao servidor do usuario logado. Alternativa mais simples: verificar cargo do profile (`cargo === "coordenacao"` ou `role === "diretoria"`).

### Detalhes Tecnicos

- Nenhuma migration (campos `horario_inicio_real`, `horario_fim_real`, `tempo_real_min`, `status_execucao`, `observacao_execucao` ja existem em `cronograma_atividades`)
- Nenhuma dependencia nova
- Query key: `["top-realtime", diaSelecionado]` com refetchInterval 5s
- Timers: dois `useEffect` com `setInterval(1000)` para teorico e real
- Cleanup dos intervals no return do useEffect
- Cores do seletor de dia: D1=#F97316, D2=#3B82F6, D3=#22C55E, D4=#EAB308
- Horarios do cronograma sao `time without time zone` (ex: "06:30:00") - construir Date combinando data de hoje com o horario para comparacao
- `horario_inicio_real` e `horario_fim_real` sao `timestamp with time zone` - usar diretamente

### Responsividade

- Desktop: 2 paineis lado a lado (grid-cols-2), controles abaixo
- Tablet: 2 paineis lado a lado
- Mobile: paineis empilhados (grid-cols-1), botoes h-12 touch-friendly
- Lista do dia: cards compactos empilhados

