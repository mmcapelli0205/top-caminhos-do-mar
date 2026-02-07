

## Check-in com QR Code

### Resumo
Construir a pagina completa de Check-in em `/check-in` com duas abas: preparacao de QR Codes e realizacao de check-in no dia do evento com scanner de camera.

### Dependencias novas
- `qrcode` — geracao de QR codes client-side (canvas/data URL)
- `html5-qrcode` — scanner de camera para leitura de QR codes
- `jszip` — empacotamento dos PNGs em ZIP para download
- `@types/qrcode` — tipos TypeScript

### Arquivos a criar/modificar

**1. `src/pages/CheckIn.tsx`** (reescrever) — Pagina completa com 2 abas

### Detalhes Tecnicos

#### Tab 1 - "QR Codes" (Preparacao)

**Dados:** Usa `useParticipantes()` para buscar participantes e familias.

**Tabela:**
- Colunas: Nome, Familia (numero via familiaMap), QR Code (thumbnail 48x48), Status (checkin_realizado)
- QR code gerado client-side a partir do campo `qr_code` do participante (UUID)
- Se `qr_code` estiver null, mostra "Sem QR"

**Botao "Gerar Todos QR Codes":**
- Para cada participante sem `qr_code` preenchido, gera um UUID via `crypto.randomUUID()`
- Faz batch update no Supabase: `update({ qr_code }).eq("id", participante.id)` para cada um
- Invalida cache react-query `["participantes"]`
- Toast de sucesso

**Botao "Baixar QR Codes (ZIP)":**
- Usa `qrcode` para gerar PNG data URL para cada participante com `qr_code`
- Usa `jszip` para empacotar todos os PNGs
- Cada arquivo nomeado: `QR_[Nome]_Familia[N].png` (nome sanitizado, sem caracteres especiais)
- Download via blob URL

#### Tab 2 - "Realizar Check-in" (Dia do evento)

**Layout:**
- Contador no topo: "Check-ins: X / Y total (Z%)" — X = count de checkin_realizado=true, Y = total participantes
- Area de camera (60vh height, full-width mobile)
- Barra de busca manual abaixo da camera (pesquisa por nome ou CPF)
- Card de resultado abaixo

**Scanner:**
- Usa `html5-qrcode` com `Html5QrcodeScanner` ou `Html5Qrcode` diretamente
- Inicializa camera ao montar a tab
- On decode: busca participante com `qr_code` matching, se nao encontrado busca em `servidores`
- Cleanup ao desmontar

**Card de Resultado (apos scan ou busca):**
- Nome (texto grande)
- Familia # (via familiaMap)
- Status atual (checkin_realizado)
- Tipo: "Participante" ou "Servidor"

**Validacao — Card Verde:**
Condicoes para "Documentacao OK":
- `contrato_assinado === true`
- `ergometrico_status === 'aprovado'` OU `'dispensado'` OU idade < 40

Se todas ok: card verde com icone check e "Documentacao OK"
Se alguma falha: card vermelho com lista de pendencias

**Para servidores:** Sempre mostra card verde (sem validacao de contrato/ergometrico)

**Botao "Confirmar Check-in":**
- Visivel sempre no card verde
- No card vermelho: botao "Forcar Check-in" (outline/destructive) com confirmacao
- Ao confirmar:
  - Update `checkin_realizado = true` (participantes) ou `checkin = true` (servidores)
  - Play beep via Web Audio API: oscillator 800Hz por 200ms
  - Toast de sucesso
  - Invalida cache `["participantes"]`
  - Limpa resultado e reseta scanner para proxima pessoa

**Busca Manual:**
- Input com debounce 300ms
- Filtra participantes por nome (case-insensitive includes) ou CPF (digits only)
- Mostra lista de resultados clicaveis (max 5)
- Ao clicar, seleciona e mostra o card de resultado

#### Funcao auxiliar calcAge
Reutiliza logica de calculo de idade (mesma do familiaAlgorithm.ts) para verificar se participante tem menos de 40 anos.

#### Responsividade
- Camera area: `h-[60vh] w-full` em mobile, `h-[400px] max-w-2xl mx-auto` em desktop
- Card de resultado: full-width em mobile, max-w-md centralizado em desktop
- Tabela da Tab 1: scroll horizontal em mobile

### Componentes shadcn utilizados
- Tabs, TabsList, TabsTrigger, TabsContent
- Table, TableHeader, TableRow, TableHead, TableCell, TableBody
- Input, Button, Badge, Card, CardHeader, CardContent
- Dialog (para confirmacao de "Forcar Check-in")

### Sem alteracoes no banco
Usa campos existentes: `participantes.qr_code`, `participantes.checkin_realizado`, `servidores.qr_code`, `servidores.checkin`. Nenhuma migracao necessaria.

