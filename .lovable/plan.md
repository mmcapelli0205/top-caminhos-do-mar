

## Sistema de Check-in com Pulseiras QR Code -- Reestruturacao Completa

### Resumo

Reescrever a pagina de Check-in com 4 abas (Pulseiras, Realizar Check-in, Consultar Pulseira, Gestao), integrando o sistema de pulseiras QR Code como "documento" do participante durante o evento. Inclui modo offline basico e integracao com o painel Hakuna.

---

### Nenhuma migration necessaria

A tabela `pulseiras` ja existe com todas as colunas necessarias: `codigo`, `status`, `participante_id`, `vinculada_em`, `vinculada_por`, `desvinculada_em`, `desvinculada_por`, `top_id`. A tabela `participantes` ja possui `qr_code`, `peso_checkin`, `numero_legendario`, `checkin_realizado`, `checkin_em`, `checkin_por`. Nenhuma alteracao de schema necessaria.

---

### Arquivos Novos (4)

**1. `src/components/checkin/PulseirasTab.tsx`**
- Header com badges: X disponiveis / Y vinculadas / Z total
- Secao "Gerar Novas Pulseiras":
  - Input number (default 150, max 500)
  - Busca TOP ativo: `supabase.from("tops").select("id, numero").order("created_at", { ascending: false }).limit(1).maybeSingle()`
  - Busca ultima pulseira para continuar sequencia: query `pulseiras` com `order("codigo", desc).limit(1)` e parse do sequencial
  - Gera registros em batch: `TOP-{numero}-{seq.padStart(4,'0')}`
- Botao "Baixar QR Codes (ZIP)": reutiliza logica existente do QrCodeTab (qrcode + jszip)
- Tabela de pulseiras com filtro de status (Todas/Disponiveis/Vinculadas/Danificadas)
- Acao "Marcar como danificada"

**2. `src/components/checkin/RealizarCheckinTab.tsx`**
- Fluxo em 4 passos com state machine (step: 1|2|3|4)
- Passo 1: Botao "Bipar Pulseira" (h-16, bg-orange-500), abre Html5Qrcode, valida formato TOP-XXXX-XXXX
- Passo 2: Input CPF com mascara (maskCPF de `@/lib/cpf`), busca participante por CPF
- Passo 3: Card de confirmacao com familia em destaque (bg-orange-500), pesagem (input peso_checkin), alerta se diferenca > 3kg, campo numero_legendario, card de doencas/condicoes
- Passo 4: Botao "CONFIRMAR CHECK-IN" (h-16, bg-green-600). Ao confirmar:
  - UPDATE participantes SET qr_code, peso_checkin, numero_legendario, checkin_realizado=true, checkin_em=NOW(), checkin_por
  - UPDATE pulseiras SET status='vinculada', participante_id, vinculada_em, vinculada_por
  - Tela de sucesso com dados e instrucoes ("Entregar placa familia X")
  - Botao "Proximo Check-in" volta ao Passo 1
- Todos os botoes com tamanho mobile-first (min h-14, text-lg)
- Modo offline: carrega todos participantes e pulseiras no mount, fila local de check-ins pendentes, banner amarelo quando offline, sincroniza ao reconectar

**3. `src/components/checkin/ConsultaPulseiraTab.tsx`**
- Botao "Bipar Pulseira" (h-16, bg-blue-600)
- Lê QR Code, busca participante pelo qr_code
- Se encontrou: card de emergencia com 3 secoes:
  - TOPO: Alerta Medico (bg-red-900/80 se tem doenca, bg-green-900/40 se nao). Lista doencas, medicamentos, alergias
  - MEIO: Identificacao (nome, familia, idade). Hakuna responsavel (busca em hakuna_participante com join servidor)
  - RODAPE: Contato de emergencia (contato_nome, contato_telefone com link tel:)
- Botao "Bipar Outra Pulseira"
- Mesmo modo offline do RealizarCheckinTab

**4. `src/components/checkin/GestaoCheckinTab.tsx`**
- Cards resumo: Total, Check-ins Realizados (verde), Pendentes (amarelo), barra de progresso
- Tabela: Nome, Familia, Peso Inscricao, Peso Check-in, Diferenca (verde/vermelho), Nro Legendario, Status, Acoes
- Filtros: familia (select), status (realizado/pendente), busca por nome
- Acao "Desvincular": AlertDialog de confirmacao, reseta participante e libera pulseira
- Mobile: cards em vez de tabela (useIsMobile)

---

### Arquivos a Modificar (3)

**5. `src/pages/CheckIn.tsx`**
- Reescrever completamente com 4 abas: Pulseiras, Realizar Check-in, Consultar Pulseira, Gestao
- Importar useAuth para verificar permissoes
- Buscar servidor do usuario logado para verificar area_servico
- Logica de permissao:
  - cargo "diretoria" ou servidor com area "ADM": todas as abas
  - Servidor com area "Hakuna": apenas aba "Consultar Pulseira" (defaultValue="consultar")
  - Outros: redirecionar para /dashboard
- Suporte a query param `?tab=consultar` para navegacao direta
- Manter useParticipantes para dados compartilhados

**6. `src/lib/auth.ts`**
- Na funcao `getVisibleMenuItems`: adicionar item Check-in (id 9) para cargos "coordenacao", "coord02", "coord03" (atualmente so diretoria ve)
- Hakunas sao servidores normais, entao a visibilidade do menu para eles sera tratada de forma especial: o AppLayout precisara verificar area_servico para mostrar o item Check-in a servidores da area Hakuna

**7. `src/pages/AreaPortal.tsx`**
- Na aba "Painel" quando `decodedNome === "Hakuna"`:
  - Adicionar card "Consultar Pulseira" com icone QrCode
  - Ao clicar: `navigate("/check-in?tab=consultar")`
  - Visivel para todos os servidores da area Hakuna

---

### Resumo de Alteracoes

| Arquivo | Tipo | Descricao |
|---|---|---|
| `src/components/checkin/PulseirasTab.tsx` | Novo | Geracao e gestao de pulseiras |
| `src/components/checkin/RealizarCheckinTab.tsx` | Novo | Fluxo check-in em 4 passos, mobile-first |
| `src/components/checkin/ConsultaPulseiraTab.tsx` | Novo | Consulta de emergencia por pulseira |
| `src/components/checkin/GestaoCheckinTab.tsx` | Novo | Painel administrativo de check-ins |
| `src/pages/CheckIn.tsx` | Reescrever | 4 abas com permissoes |
| `src/lib/auth.ts` | Alterar | Visibilidade do menu Check-in para coordenadores |
| `src/pages/AreaPortal.tsx` | Alterar | Card "Consultar Pulseira" no painel Hakuna |

### Detalhes Tecnicos

- Nenhuma migration necessaria (tabelas e colunas ja existem)
- Nenhuma dependencia nova (html5-qrcode, qrcode, jszip ja estao no projeto)
- O modo offline usa useState/useRef (sem localStorage) — dados pendentes perdidos se fechar aba
- O scanner QR usa `Html5Qrcode` com `facingMode: "environment"` (camera traseira)
- Prefixo de pulseira: `TOP-{numero_do_top}-{sequencial_4_digitos}`
- O fluxo de check-in atualiza DUAS tabelas atomicamente (participantes + pulseiras)
- Contato de emergencia usa campos existentes: `contato_nome` e `contato_telefone` da tabela participantes
- Consulta do Hakuna responsavel: busca em `hakuna_participante` usando `participante_id`, com join em `servidores` usando `servidor_id`
- Os componentes antigos `QrCodeTab.tsx` e `CheckInTab.tsx` serao substituidos (podem ser removidos ou mantidos como referencia)

