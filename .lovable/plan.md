

## Correcoes do Check-in + Prontuario Medico + Gravacao NFC

### Resumo

Tres frentes de trabalho: (1) ajustes na tela "Realizar Check-in", (2) gravacao NFC nas pulseiras, (3) prontuario medico com sinais vitais e sistema de necessaire (estoque individual do Hakuna).

---

### Migration necessaria

Duas tabelas novas:

```sql
-- Tabela de atendimentos/prontuario
CREATE TABLE atendimentos_hakuna (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  participante_id UUID REFERENCES participantes(id) ON DELETE CASCADE,
  hakuna_servidor_id UUID REFERENCES servidores(id),
  temperatura NUMERIC(4,1),
  temperatura_status TEXT,
  glicemia INTEGER,
  glicemia_status TEXT,
  pressao_sistolica INTEGER,
  pressao_diastolica INTEGER,
  pressao_status TEXT,
  medicamento_id UUID REFERENCES hakuna_estoque_medicamentos(id),
  medicamento_nome TEXT,
  medicamento_quantidade INTEGER,
  medicamento_via TEXT,
  medicamento_fonte TEXT, -- 'necessaire' ou 'estoque_geral'
  observacoes TEXT,
  top_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE atendimentos_hakuna ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth_select_atendimentos" ON atendimentos_hakuna
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_insert_atendimentos" ON atendimentos_hakuna
  FOR INSERT TO authenticated WITH CHECK (true);

-- Tabela de necessaire (estoque individual)
CREATE TABLE hakuna_necessaire (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  hakuna_servidor_id UUID REFERENCES servidores(id) ON DELETE CASCADE,
  medicamento_id UUID REFERENCES hakuna_estoque_medicamentos(id) ON DELETE CASCADE,
  quantidade INTEGER DEFAULT 0,
  top_id UUID,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(hakuna_servidor_id, medicamento_id)
);
ALTER TABLE hakuna_necessaire ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth_select_necessaire" ON hakuna_necessaire
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_all_necessaire" ON hakuna_necessaire
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
```

Nota: a constraint UNIQUE omite `top_id` propositalmente para evitar duplicatas por Hakuna+medicamento (simplifica). Se quiser multi-TOP, adiciona-se depois.

---

### Arquivo 1: `src/components/checkin/RealizarCheckinTab.tsx` (Alterar)

Correcoes pontuais no passo "confirm":

- Desabilitar botao "CONFIRMAR CHECK-IN" se `pesoCheckin` estiver vazio (campo obrigatorio)
- Linha 421-427: adicionar `disabled={confirming || !pesoCheckin}` no Button
- A tela de sucesso (step "success") ja esta implementada corretamente com familia, nome, numero legendario e instrucoes
- O restante do layout (familia destaque, dados, pesagem, doencas) ja esta implementado conforme solicitado

Unica alteracao real: tornar peso obrigatorio no botao de confirmar.

---

### Arquivo 2: `src/components/checkin/PulseirasTab.tsx` (Alterar)

Adicionar secao "Gravar Tags NFC":

- Novo botao no header ao lado de "Baixar QR Codes": "Gravar NFC" (bg-purple-600)
- Ao clicar, abre Dialog de gravacao com fluxo sequencial
- Estado: `nfcOpen` (boolean), `nfcIndex` (number), `nfcGravadas` (number)
- Lista de pulseiras disponiveis para gravar: `pulseiras.filter(p => p.status === "disponivel")`
- Mostra pulseira atual: "Proxima tag: TOP-1575-0003"
- Botao "Gravar na Tag" (h-16, bg-purple-600):
  - Verifica `'NDEFReader' in window`
  - Se nao suporta: mensagem fallback
  - Se suporta: `new NDEFReader().write({ records: [{ recordType: "text", data: codigo }] })`
  - Toast de sucesso, avanca para proxima
- Contador: "X de Y tags gravadas"
- Progress bar
- Botao "Pular" (marca como danificada e avanca)
- Botao "Voltar" (volta uma posicao)
- TypeScript: declarar `NDEFReader` como `any` para evitar erros de tipo (Web NFC nao tem tipos no TS padrao)

---

### Arquivo 3: `src/components/checkin/ConsultaPulseiraTab.tsx` (Reescrever)

Manter secao 1 (dados do participante) e adicionar secao 2 (prontuario):

**Secao 1 (existente, ajustar):**
- Alerta medico, identificacao, contato emergencia — ja implementados, manter

**Secao 2: Prontuario de Atendimento (NOVO)**

Apos os cards de identificacao, adicionar:

Card "Prontuario de Atendimento" com 2 sub-secoes (Collapsible ou tabs internas):

*Sub-secao "Registrar Atendimento":*

Sinais Vitais com badges em tempo real (onChange):
- Temperatura (input number step 0.1)
  - < 35.5: badge azul "Hipotermia"
  - 35.5-37.2: badge verde "Normal"
  - 37.3-37.7: badge amarelo "Pre-febril"
  - >= 37.8: badge vermelho "Febre"
- Glicemia (input number)
  - < 70: vermelho "Hipoglicemia"
  - 70-130: verde "Normal"
  - > 130: vermelho "Hiperglicemia"
- Pressao Arterial (2 inputs lado a lado: sistolica / diastolica)
  - Sistolica < 90 OU Diastolica < 60: vermelho "Hipotensao"
  - 90-139 / 60-89: verde "Normal"
  - 140-179 / 90-109: vermelho "Hipertensao"
  - >= 180 OU >= 110: vermelho pulsante "CRISE HIPERTENSIVA"

Medicamento Administrado:
- Select com 2 grupos (optgroup):
  - "Minha Necessaire" — query `hakuna_necessaire` WHERE `hakuna_servidor_id` = servidor logado, JOIN `hakuna_estoque_medicamentos` para nome
  - "Estoque Geral" — query `hakuna_estoque_medicamentos`
  - Cada opcao mostra nome + quantidade disponivel
- Input number: quantidade administrada
- Select: via de administracao (Oral, Sublingual, Intramuscular, Intravenosa, Topica)

Observacoes: Textarea

Botao "Salvar Atendimento" (bg-blue-600):
- INSERT em `atendimentos_hakuna`
- Se medicamento administrado:
  - Primeiro tenta dar baixa na necessaire do Hakuna
  - Se nao tem na necessaire ou quantidade insuficiente, da baixa no estoque geral
  - UPDATE quantidade na tabela correspondente

*Sub-secao "Historico de Atendimentos":*
- Query: `atendimentos_hakuna` WHERE `participante_id` = X, ORDER BY `created_at` DESC
- Timeline vertical com cards:
  - Data/hora
  - Hakuna que atendeu (JOIN servidores para nome)
  - Sinais vitais com badges coloridos
  - Medicamento (se houver)
  - Observacoes

**Props necessarias:**
- A `ConsultaPulseiraTab` precisa receber `userId` (string) para identificar o servidor logado
- No `CheckIn.tsx`: passar `userId={userId}` para `ConsultaPulseiraTab`

**Query do servidor logado:**
- Buscar servidor por email do usuario: `supabase.from("servidores").select("id, nome, profissao").eq("email", userEmail).maybeSingle()`
- Ou receber `userId` e buscar o servidor correspondente
- O `userId` sera usado para identificar o `hakuna_servidor_id` nos atendimentos

---

### Arquivo 4: `src/components/hakunas/NecessaireTab.tsx` (Novo)

Ou integrar na aba Medicamentos existente (`MedicamentosEstoqueTab.tsx`).

**Opcao escolhida: novo componente separado**, pois a logica e diferente.

**Tela de Distribuicao (para Coord Hakuna / Diretoria):**

- Header: "Distribuicao de Medicamentos"
- Query estoque geral: `hakuna_estoque_medicamentos`
- Query necessaires: `hakuna_necessaire` com JOIN em `servidores` (nome) e `hakuna_estoque_medicamentos` (nome)
- Query hakunas: `servidores` WHERE `area_servico = 'Hakuna'` AND `status = 'aprovado'`

Grid/tabela editavel:
- Linhas: medicamentos do estoque
- Colunas: cada Hakuna + "Disponivel"
- Cada celula: input number editavel
- Calculo: Disponivel = estoque_geral.quantidade - SUM(necessaires para aquele medicamento)
- Validacao: nao permitir distribuir mais do que disponivel

Botao "Salvar Distribuicao":
- Para cada celula alterada: UPSERT em `hakuna_necessaire` (usando ON CONFLICT `hakuna_servidor_id, medicamento_id`)
- Toast de sucesso

**Tela do Hakuna (quando Hakuna loga):**

Secao "Minha Necessaire":
- Query: `hakuna_necessaire` WHERE `hakuna_servidor_id` = servidor do usuario logado
- JOIN com `hakuna_estoque_medicamentos` para nome
- Lista: nome, quantidade, badge amarelo se < 3

Secao "Estoque Geral" (referencia):
- Lista de medicamentos do estoque geral com quantidade

---

### Arquivo 5: `src/pages/CheckIn.tsx` (Alterar)

- Passar `userId` para `ConsultaPulseiraTab`: `<ConsultaPulseiraTab userId={userId} />`
- Passar email do usuario para ConsultaPulseiraTab se necessario para identificar servidor

---

### Arquivo 6: Integracao no AreaPortal ou Hakunas (Alterar)

Adicionar aba "Necessaire" no modulo Hakuna:
- No `src/pages/Hakunas.tsx` ou `src/pages/AreaPortal.tsx` (aba Hakuna)
- Nova aba: "Necessaire" entre "Medicamentos" e "Estoque"
- Importar `NecessaireTab`
- Se usuario e coordenador: mostra tela de distribuicao
- Se usuario e Hakuna comum: mostra "Minha Necessaire"

---

### Resumo de Alteracoes

| Arquivo | Tipo | Descricao |
|---|---|---|
| Migration | SQL | 2 tabelas: `atendimentos_hakuna`, `hakuna_necessaire` |
| `src/components/checkin/RealizarCheckinTab.tsx` | Alterar | Peso obrigatorio no botao confirmar |
| `src/components/checkin/PulseirasTab.tsx` | Alterar | Secao gravacao NFC com Dialog |
| `src/components/checkin/ConsultaPulseiraTab.tsx` | Reescrever | Adicionar prontuario medico completo |
| `src/components/hakunas/NecessaireTab.tsx` | Novo | Distribuicao e consulta de necessaire |
| `src/pages/CheckIn.tsx` | Alterar | Passar userId para ConsultaPulseiraTab |
| `src/pages/AreaPortal.tsx` | Alterar | Aba Necessaire no modulo Hakuna |

### Detalhes Tecnicos

- 1 migration com 2 tabelas novas + RLS
- Nenhuma dependencia nova (Web NFC e API nativa do navegador)
- NDEFReader sera acessado via `(window as any).NDEFReader` para evitar erros de tipo TypeScript
- Os badges de sinais vitais usam logica inline no onChange (sem debounce, resposta imediata)
- A baixa de medicamento no prontuario segue prioridade: necessaire primeiro, estoque geral como fallback
- A tabela `atendimentos_hakuna` referencia `hakuna_estoque_medicamentos.id` para o medicamento (compativel com estoque existente)
- O campo `medicamento_nome` e desnormalizado para historico (caso o medicamento seja excluido, o nome persiste)
- A UNIQUE constraint em `hakuna_necessaire` (`hakuna_servidor_id, medicamento_id`) permite UPSERT simples

