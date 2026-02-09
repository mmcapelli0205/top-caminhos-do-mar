

## Duplas de Tirolesa

### Resumo

Nova pagina `/tirolesa` com algoritmo de formacao de duplas por familia, respeitando limites de peso (160kg dupla, 120kg individual), com controle de status e impressao PDF.

### 1. Banco de dados

Criar tabela `tirolesa_duplas` via migration:

```sql
CREATE TABLE tirolesa_duplas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  familia_id INTEGER REFERENCES familias(id),
  participante_1_id UUID REFERENCES participantes(id),
  participante_2_id UUID REFERENCES participantes(id),
  peso_1 NUMERIC,
  peso_2 NUMERIC,
  peso_total NUMERIC,
  ordem INTEGER,
  status TEXT DEFAULT 'aguardando',
  observacao TEXT,
  top_id UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE tirolesa_duplas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth_only" ON tirolesa_duplas
  AS RESTRICTIVE FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);
```

### 2. Algoritmo (`src/lib/tiralesaAlgorithm.ts`)

Nova funcao `generateZiplinePairs(families, participantMap)`:

- Para cada familia:
  1. Filtrar membros com peso registrado e <= 120kg (aptos)
  2. Marcar membros com peso > 120kg como inaptos
  3. Ordenar aptos por peso decrescente
  4. Formar duplas: indice 0 com ultimo, 1 com penultimo, etc
  5. Se sobrar 1 (impar): marca como solo
  6. Validar que nenhuma dupla > 160kg; se ultrapassar, tentar reorganizar trocando parceiros

Retorna: `{ pairs: ZiplinePair[], ineligible: IneligibleEntry[] }`

### 3. Pagina (`src/pages/Tirolesa.tsx`)

**Painel superior** com 4 cards de resumo:
- Total duplas | Total aptos | Total inaptos (>120kg) | Peso medio duplas

**Botao "Gerar Duplas"**:
- Se ja existem duplas salvas, mostra AlertDialog "Deseja refazer?"
- Deleta duplas existentes e insere novas
- Usa o algoritmo do item 2

**Lista por familia** usando Accordion (Collapsible):
- Cada familia expande para mostrar:
  - Duplas: "Dupla 1: Joao (75kg) + Maria (80kg) = 155kg" com badge de status
  - Solo: com icone laranja
  - Inaptos: com icone vermelho e texto "Acima do limite individual"

**Acoes por dupla**:
- Select para mudar status (aguardando/pronto/desceu) - update direto no Supabase
- Botao "Trocar" abre dialog para selecionar outro membro da mesma familia

**Botao "Imprimir Lista"**:
- Gera PDF com jsPDF (ja instalado) listando duplas por familia, ordenadas

### 4. Menu lateral (`src/lib/auth.ts`)

- Adicionar item id 13: `{ id: 13, title: "Tirolesa", url: "/tirolesa", icon: CableCar }`
- Visivel para: diretoria, coordenacao, coord02, coord03 (ids [1,2,3,4,6,8,13])

### 5. Rota (`src/App.tsx`)

- Import `Tirolesa` e adicionar `<Route path="/tirolesa" element={<Tirolesa />} />`

### Arquivos

| Arquivo | Acao |
|---|---|
| Migration SQL | Criar tabela `tirolesa_duplas` com RLS |
| `src/lib/tiralesaAlgorithm.ts` | Novo - algoritmo de formacao de duplas |
| `src/pages/Tirolesa.tsx` | Novo - pagina completa |
| `src/lib/auth.ts` | Adicionar item "Tirolesa" no menu |
| `src/App.tsx` | Adicionar rota `/tirolesa` |

### Detalhes tecnicos do algoritmo

```text
Por familia:
  Membros com peso
       |
       +-- peso > 120kg --> Lista "Inaptos"
       |
       +-- peso <= 120kg --> Ordenar desc
                |
                v
          [85, 80, 75, 70, 65]
                |
          Dupla 1: 85 + 65 = 150 OK
          Dupla 2: 80 + 70 = 150 OK
          Solo: 75
                |
          Se dupla > 160kg:
            tentar trocar parceiros entre duplas da mesma familia
```

