
# Web Check-in dos Servidores — Plano de Implementação

## Estado Atual

Ambas as tabelas já existem no banco de dados:
- `checkin_servidores` — com as colunas corretas (id, servidor_id, servidor_nome, area_servico, cargo, cpf, transporte, status, checkin_em, desistencia_em, desistencia_por, desistencia_por_nome, top_id, created_at)
- `checkin_config` — com horario_checkin_servidores e horario_checkin_participantes

A lib `qrcode` já está instalada no projeto. Não é necessária migration SQL adicional.

O sistema usa `top_id` para filtrar dados por evento. O TOP ativo tem id `c8109d6c-aafe-4b1d-b2f6-f0e3eede2915` (TOP 1575).

---

## O Que Será Construído

### Parte 1 — Formulário Público `/checkin-servidor`

Página completamente pública (sem login), mobile-first, tema escuro, com 3 etapas:

**Etapa 1 — Selecionar Área**
- Dropdown com todas as áreas: Hakuna, Segurança, Eventos, Mídia, Comunicação, Logística, Voz, ADM, Intercessão, DOC, Louvor, Diretoria
- Busca o horário de abertura em `checkin_config` via anon key (RLS já permite SELECT para anon)
- Se ainda não é hora: tela de bloqueio "Check-in abre às HH:MM"

**Etapa 2 — Selecionar Nome**
- Query em `servidores` filtrada pela área selecionada
- Exclui servidores que já têm registro em `checkin_servidores` com status = 'checkin'
- Lista em ordem alfabética

**Etapa 3 — Confirmar CPF + Transporte**
- Campo CPF com máscara (usando a função `maskCPF` já existente em `src/lib/cpf.ts`)
- Valida CPF contra o campo `cpf` do servidor selecionado
- Radio: "Ônibus dos Legendários" / "Transporte Próprio"
- Insert em `checkin_servidores` com anon key (RLS pública permite INSERT)

**Tela de sucesso** com nome, área, horário e botão "Novo Check-in" que reinicia o fluxo.

---

### Parte 2 — Dashboard de Acompanhamento

Nova aba "Check-in Servidores" dentro da página `/check-in` existente, visível para `diretoria` e `coordenacao`.

**Cards de resumo no topo:**
- Total / Check-in Realizado / Aguardando / Desistências / Ônibus / Transporte Próprio

**Lista por área** — cada área tem uma seção colapsável:
```
SEGURANÇA (3 de 5 chegaram)
━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Raphael Lopes    13:42    Ônibus        ← nome branco, brilhante
✅ Herikeson        13:45    Prop.
⬜ João Silva       —        —             ← nome cinza claro
⬜ Maria Santos     —        —             ← [piscando em vermelho se alerta ativo]
                                           [botão "Desistiu" visível para coord]
```

**Lógica de alerta:** 30 min antes do horário de check-in dos participantes → nomes pendentes começam a piscar (animação CSS `pulse` em vermelho).

**Botão de Desistência:** com AlertDialog de confirmação, atualiza `status = 'desistencia'` e registra `desistencia_por` e `desistencia_em`.

**Ordenação:** pendentes primeiro (incluindo desistências), depois realizados por horário.

---

### Parte 3 — Configuração de Horários

Seção dentro do dashboard do coordenador para editar `checkin_config`. Dois campos de tempo configuráveis.

---

### Parte 4 — Gerador de QR Code para Cartaz

Dentro do dashboard, botão "🔲 Gerar QR Code do Check-in" que:
- Gera QR Code apontando para `https://top-caminhos-do-mar.lovable.app/checkin-servidor`
- Mostra o QR grande na tela
- Botão "Imprimir" abre janela de impressão com QR grande + texto "Escaneie para fazer Check-in"

---

## Arquivos a Criar/Modificar

| Arquivo | Operação | Descrição |
|---|---|---|
| `src/pages/CheckinServidor.tsx` | Criar | Formulário público — 3 etapas, sem login |
| `src/components/checkin/CheckinServidoresDashboard.tsx` | Criar | Dashboard de acompanhamento por área |
| `src/components/checkin/CheckinConfigSection.tsx` | Criar | Configuração de horários |
| `src/components/checkin/CheckinQrCodeCartaz.tsx` | Criar | Gerador de QR Code para impressão |
| `src/App.tsx` | Modificar | Adicionar rota pública `/checkin-servidor` |
| `src/pages/CheckIn.tsx` | Modificar | Adicionar nova aba "Servidores" para coordenadores/diretoria |
| `src/lib/auth.ts` | Modificar | Não necessário — o acesso ao dashboard é dentro da aba Check-in já existente |

---

## Detalhes Técnicos

### Rota pública no App.tsx
A rota `/checkin-servidor` será adicionada **fora** do `<Route element={<AppLayout />}>`, assim não exige autenticação — igual às rotas `/cadastro` e `/primeiro-acesso`.

### Query de servidores disponíveis (Etapa 2)
```typescript
// Busca servidores da área que ainda não fizeram check-in
const { data: servidores } = supabase
  .from("servidores")
  .select("id, nome, cpf, cargo")
  .eq("area_servico", areaSelecionada)
  .eq("status", "ativo")
  .order("nome");

// Busca quem já fez check-in nessa área
const { data: jaFeitos } = supabase
  .from("checkin_servidores")
  .select("servidor_id")
  .eq("area_servico", areaSelecionada)
  .eq("status", "checkin");

// Filtra na UI: servidores.filter(s => !jaFeitos.map(j => j.servidor_id).includes(s.id))
```

### Verificação de horário
```typescript
const agora = new Date();
const [h, m] = config.horario_checkin_servidores.split(":");
const abertura = new Date();
abertura.setHours(parseInt(h), parseInt(m), 0);
const liberado = agora >= abertura;
```

### Alerta de 30 minutos
```typescript
const agora = new Date();
const [h, m] = config.horario_checkin_participantes.split(":");
const alertaEm = new Date();
alertaEm.setHours(parseInt(h) - 0, parseInt(m) - 30, 0);
const alertaAtivo = agora >= alertaEm;
```

### Animação pulsante em CSS (nomes faltantes)
```css
@keyframes pulse-red {
  0%, 100% { opacity: 1; color: white; }
  50% { opacity: 0.5; color: #ef4444; }
}
.pisca { animation: pulse-red 1.5s ease-in-out infinite; }
```
Implementado via classe condicional com `cn()` do `clsx`.

### top_id nos inserts
Será buscado via query `SELECT id FROM tops ORDER BY created_at DESC LIMIT 1` no formulário público (anon pode ler tops via RLS — precisaremos verificar se essa query é permitida, e se não for, hardcodar o top_id atual ou buscá-lo de outra forma).

### RLS do formulário público
A policy existente `public_insert_checkin` já permite INSERT para `anon`. A policy `auth_select_checkin` permite SELECT para `authenticated`. O formulário público vai precisar de SELECT nos servidores (que tem RLS `auth_only`) — isso é um ponto crítico:

**Solução:** Criar uma policy de SELECT em `servidores` para `anon` somente nos campos necessários (nome, area_servico, id, cpf) OU usar uma Edge Function intermediária.

A abordagem mais segura e simples é adicionar uma **policy de SELECT** na tabela `servidores` para usuários anônimos, limitada aos campos necessários para o check-in. O CPF exposto é aceitável pois o formulário precisa validá-lo — e o CPF já é de domínio da equipe organizadora.

### Migration necessária

```sql
-- Permitir leitura anônima de servidores (apenas para o formulário de check-in)
CREATE POLICY "anon_select_servidores_checkin"
ON public.servidores
FOR SELECT
TO anon
USING (true);

-- Permitir leitura anônima de checkin_servidores (para verificar duplicatas)
-- Já existe policy auth_select_checkin que permite para authenticated
-- Precisamos adicionar para anon também
CREATE POLICY "anon_select_checkin_servidores"
ON public.checkin_servidores
FOR SELECT
TO anon
USING (true);

-- Permitir leitura anônima de checkin_config (para o horário)
-- A policy existente auth_all_checkin_config já usa USING (true) para authenticated
-- Adicionar para anon
CREATE POLICY "anon_select_checkin_config"
ON public.checkin_config
FOR SELECT
TO anon
USING (true);

-- Permitir leitura anônima de tops (para buscar o top_id ativo)
-- Verificar se já existe
```

### Ordem de implementação
1. Rodar migration SQL (policies anon)
2. Criar `CheckinServidor.tsx` (formulário público completo — 3 etapas)
3. Criar `CheckinServidoresDashboard.tsx` (dashboard por área com alertas)
4. Criar `CheckinConfigSection.tsx` (config de horários)
5. Criar `CheckinQrCodeCartaz.tsx` (gerador de QR Code)
6. Modificar `App.tsx` (rota pública)
7. Modificar `CheckIn.tsx` (nova aba para diretoria/coordenação)
