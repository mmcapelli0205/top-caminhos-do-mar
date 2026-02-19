
## Melhorias na Aba Tirolesa

### Resumo

Cinco melhorias integradas: (1) agrupamento de famílias para cross-família; (2) modo Simulação vs. Oficial; (3) Termo de Responsabilidade no scan da pulseira; (4) cards de resumo atualizados; (5) arquitetura preparada para exportação futura.

---

### Migrations Necessárias (2 novas tabelas)

**Tabela 1: `tirolesa_termo_aceite`**
Registra o aceite (ou recusa) do Termo de Responsabilidade por participante.

```sql
CREATE TABLE tirolesa_termo_aceite (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  participante_id UUID REFERENCES participantes(id) ON DELETE CASCADE,
  top_id UUID,
  status TEXT NOT NULL DEFAULT 'pendente', -- 'aceito', 'recusado', 'pendente'
  registrado_por UUID,        -- auth.uid() do servidor
  registrado_por_nome TEXT,   -- nome do servidor (desnormalizado)
  aceito_em TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(participante_id, top_id)
);
ALTER TABLE tirolesa_termo_aceite ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth_select_termo" ON tirolesa_termo_aceite FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_all_termo" ON tirolesa_termo_aceite FOR ALL TO authenticated USING (true) WITH CHECK (true);
```

**Tabela 2: `tirolesa_config`**
Guarda o texto configurável do Termo de Responsabilidade e os grupos de famílias.

```sql
CREATE TABLE tirolesa_config (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  top_id UUID,
  texto_termo TEXT DEFAULT 'Eu, participante, declaro estar ciente dos riscos da atividade de tirolesa e autorizo minha participação mediante avaliação física prévia.',
  grupos JSONB DEFAULT '[]', -- array de arrays de familia_id: [[1,4,7],[2,3]]
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE tirolesa_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth_select_config" ON tirolesa_config FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_all_config" ON tirolesa_config FOR ALL TO authenticated USING (true) WITH CHECK (true);
```

> `grupos` é um JSONB array-of-arrays. Ex.: `[[1,4,7],[2,3],[5]]`. Quando vazio, cada família é tratada isoladamente (comportamento atual).

---

### Alterações no Algoritmo — `src/lib/tiralesaAlgorithm.ts`

Mudar a assinatura de `generateZiplinePairs` para aceitar **grupos** e um **modo**:

```
generateZiplinePairs(
  familias: Familia[],
  participantes: Participante[],
  grupos: number[][],          // ex: [[1,4,7],[2,3]] — vazio = cada família isolada
  modo: "simulacao" | "oficial",
  termosAceitos: Set<string>   // Set de participante_id com termo aceito (usado só no modo "oficial")
): ZiplineResult
```

**Lógica com grupos:**
- Quando `grupos` não está vazio, o algoritmo itera sobre os grupos ao invés das famílias individualmente.
- Dentro de cada grupo, todos os participantes aptos de todas as famílias do grupo são misturados em um único pool antes de formar duplas.
- As duplas resultantes recebem `familia_id` da família do participante 1 (para exibição).
- Quando `grupos` está vazio, comportamento atual é mantido (cada família isolada).

**Filtro de modo:**
- `"simulacao"`: inclui todos os participantes com peso ≤ 120kg, independente do termo.
- `"oficial"`: inclui apenas participantes com peso ≤ 120kg **E** cujo `id` esteja em `termosAceitos`.

---

### Arquivo Principal — `src/pages/Tirolesa.tsx` (Reescrever)

**Estrutura de estado adicionada:**

```typescript
// Grupos de famílias (editável pelo coordenador)
const [grupos, setGrupos] = useState<number[][]>([]);
const [editandoGrupos, setEditandoGrupos] = useState(false);

// Modo de geração
type GenMode = "simulacao" | "oficial";
const [modoSimulacao, setModoSimulacao] = useState<"none" | "simulacao" | "oficial">("none");

// Dados simulados (apenas em memória, não vai pro banco)
const [simulacaoResult, setSimulacaoResult] = useState<ZiplineResult | null>(null);

// Config (texto do termo)
const [textoTermo, setTextoTermo] = useState<string>("");

// Aceites de termos
const termosAceitosQuery = useQuery(["tirolesa_termo_aceite", topId], ...)
```

**Seção de Agrupamento de Famílias** (exibida ANTES dos botões de geração):

- Card colapsável: "Configurar Agrupamento de Famílias"
- Botão rápido: "Todas as Famílias Juntas" — cria 1 grupo com todas as familias
- Botão: "Resetar" — grupos volta a `[]` (isolado por família)
- Lista de grupos editáveis:
  - Cada grupo mostra as famílias selecionadas com badges
  - Botão "+ Adicionar Grupo" abre um popover/select com as famílias disponíveis (multi-select com checkboxes)
  - Botão "× Remover" em cada grupo
  - Famílias já em um grupo não aparecem disponíveis para outros grupos
- Ao alterar grupos: UPSERT em `tirolesa_config` (coluna `grupos`)

**Dois botões de geração:**

```
[🔵 Simular Duplas]   [🟠 Gerar Duplas Oficial]
```

- **Simular Duplas** (azul, `bg-blue-600`):
  - Não salva no banco
  - Roda `generateZiplinePairs(..., grupos, "simulacao", new Set())`
  - Armazena resultado em `simulacaoResult`
  - Exibe na UI com badge "SIMULAÇÃO" em destaque (border-2 border-blue-400, fundo azul translúcido no header)
  - Sem `AlertDialog` de confirmação (é simulação, não destrói dados)

- **Gerar Duplas Oficial** (laranja, atual):
  - Usa `termosAceitos` (Set com IDs dos participantes com status = 'aceito')
  - `AlertDialog` de confirmação se já houver duplas salvas
  - Salva no banco (comportamento atual)
  - Exibe indicador "OFICIAL" no header da lista

**Cards de Resumo Atualizados** (de 4 para 7 cards):

```
[Aptos (Peso)] [Termo Aceito] [Termo Pendente] [Termo Recusado]
[Total Duplas] [Inaptos >120kg] [Peso Médio Dupla]
```

Cada card exibe o número correspondente com cor temática (verde para aceito, amarelo para pendente, vermelho para recusado/inapto).

**Lista de duplas:**
- Se modo simulação ativo: exibe `simulacaoResult.pairs` com borda azul e badge "SIMULAÇÃO"
- Se modo oficial: exibe `duplas` do banco (comportamento atual) com badge "OFICIAL"
- Mantém Accordion por família (ou por grupo, indicando "Grupo X: Fam. 1 + Fam. 4 + Fam. 7")

---

### Alterações no Check-in — `src/components/checkin/ConsultaPulseiraTab.tsx`

Adicionar seção "Termo de Responsabilidade da Tirolesa" na ficha do participante, abaixo do alerta médico e acima do prontuário.

**Lógica:**

1. Ao carregar o participante, buscar registro em `tirolesa_termo_aceite` WHERE `participante_id = found.id` e `top_id` atual.
2. Exibir status atual com badge:
   - Sem registro: badge cinza "Pendente"
   - `aceito`: badge verde "✅ Aceito"
   - `recusado`: badge vermelho "❌ Recusado"

3. Botão "📜 Abrir Termo de Responsabilidade" abre um Dialog:
   - Título: "Termo de Responsabilidade — Tirolesa"
   - Corpo: `textoTermo` (buscado de `tirolesa_config` no mount da tab)
   - Checkbox: "O participante leu e aceita o Termo de Responsabilidade da Tirolesa"
   - Dois botões:
     - "✅ Confirmar Aceite" (verde) — UPSERT em `tirolesa_termo_aceite` com `status='aceito'`, `aceito_em=NOW()`, `registrado_por=userId`, `registrado_por_nome=servidor.nome`
     - "❌ Recusar Termo" (vermelho, outline) — UPSERT com `status='recusado'`
   - Toast de confirmação após ação

**Nota importante:** O checkbox deve estar marcado para habilitar "Confirmar Aceite". "Recusar Termo" não requer checkbox.

---

### Configuração do Texto do Termo — `src/pages/Configuracoes.tsx` ou nova seção em Tirolesa

Opção mais simples: adicionar um card "Configurar Termo da Tirolesa" ao final da página de Configurações existente (ou como seção dentro da própria aba Tirolesa).

- Textarea com o texto atual do termo (buscado de `tirolesa_config`)
- Botão "Salvar Texto do Termo"
- UPSERT em `tirolesa_config`

Para manter o escopo, será implementado como um dialog "⚙️ Config. Termo" no header da aba Tirolesa, visível apenas para diretoria/coordenadores.

---

### Resumo de Arquivos

| Arquivo | Tipo | Descrição |
|---|---|---|
| Migration SQL | Novo | Tabelas `tirolesa_termo_aceite` e `tirolesa_config` |
| `src/lib/tiralesaAlgorithm.ts` | Alterar | Suporte a grupos multi-família e modo simulação/oficial |
| `src/pages/Tirolesa.tsx` | Reescrever | Agrupamento, dois botões, cards atualizados |
| `src/components/checkin/ConsultaPulseiraTab.tsx` | Alterar | Seção do Termo de Responsabilidade |
| `src/App.tsx` | Alterar | Adicionar rota `/tirolesa` (se ainda não existir como rota separada) |

> Nota: A aba Tirolesa está em `/tirolesa` mas não aparece na rota do `App.tsx` ainda — será necessário verificar se ela está integrada como sub-rota ou aba dentro de outra página (ex.: Área de Segurança). Se for aba dentro de `AreaPortal`, nenhuma alteração de rota é necessária.

---

### Fluxo de Uso (Como vai funcionar na prática)

```text
COORDENADOR DE SEGURANÇA:
1. Acessa aba Tirolesa
2. Configura grupos de famílias (ou clica "Todas as Famílias Juntas")
3. Clica "Simular Duplas" → vê resultado com badge SIMULAÇÃO
4. Testa variações de agrupamento até achar o melhor cenário
5. No dia do evento, quando os termos estiverem coletados:
   Clica "Gerar Duplas Oficial" → só inclui quem aceitou o termo

HAKUNA / SERVIDOR (durante o check-in):
1. Escaneia a pulseira ou digita CPF do participante
2. Vê ficha com alerta médico
3. Clica "Abrir Termo de Responsabilidade"
4. Lê o texto para o participante, marca o checkbox
5. Clica "Confirmar Aceite" ou "Recusar Termo"
6. Badge de status atualiza imediatamente
```

---

### Detalhes Técnicos

- O campo `grupos` em `tirolesa_config` usa JSONB para flexibilidade — sem necessidade de tabela auxiliar de grupos
- `tirolesa_termo_aceite` tem UNIQUE em `(participante_id, top_id)` para permitir UPSERT simples
- A simulação NÃO persiste no banco — resultado fica em `useState` local
- O algoritmo modificado é backwards-compatible: `grupos=[]` = comportamento atual
- Ambas as novas tabelas têm RLS PERMISSIVE para authenticated users (padrão do projeto)
- O texto do termo fica em `tirolesa_config.texto_termo`, editável pelo admin
- Para exportação futura: `tirolesa_termo_aceite` já possui todos os campos necessários (participante_id, status, registrado_por, aceito_em, top_id)
