

## Participantes e Hakunas -- 4 Itens

### Item 7: Cidade do Participante + Filtro

**Migration necessaria**: A tabela `participantes` nao possui coluna `cidade`. Criar:
```sql
ALTER TABLE participantes ADD COLUMN IF NOT EXISTS cidade TEXT;
```

**Arquivo: `src/pages/Participantes.tsx`**
- Adicionar estado `filterCidade` (default "todos")
- Extrair cidades unicas dos participantes carregados (front-end): `[...new Set(participantes.map(p => p.cidade).filter(Boolean))]`
- Adicionar Select de cidade nos filtros (apos o filtro de Ergometrico)
- Adicionar filtro na logica `filtered`: `if (filterCidade !== "todos") list = list.filter(p => p.cidade === filterCidade)`
- Na tabela desktop: adicionar coluna "Cidade" apos "Igreja" (hidden lg:table-cell)
- Nos cards mobile: adicionar cidade abaixo do nome

**Arquivo: `src/pages/ParticipanteForm.tsx`**
- Verificar se o formulario de cadastro ja tem campo cidade. Se nao, adicionar campo Input "Cidade" na secao de dados pessoais.

---

### Item 8: Ergometricos Configuravel

A tabela `ergometrico_config` ja existe com `idade_minima` (default 40) e `comorbidades_obrigatorias` (TEXT[]). Nenhuma migration necessaria.

**Arquivo: `src/components/hakunas/ErgometricosTab.tsx`**

Adicionar secao de configuracao no topo da aba:

- Query: `supabase.from("ergometrico_config").select("*").limit(1).single()`
- Card "Configuracao do Ergometrico" (colapsavel com Collapsible, aberto por default):
  - Input number "Idade minima obrigatoria" (default do banco: 40)
  - Multi-select/checkboxes para "Comorbidades obrigatorias"
    - Opcoes fixas: Cardiopatia, Hipertensao, Diabetes, Asma, Epilepsia, Problemas Renais, Problemas Respiratorios
    - Valores atuais carregados do campo `comorbidades_obrigatorias`
  - Botao "Salvar Configuracao" (update na tabela `ergometrico_config`)

- Alterar logica de filtragem de participantes:
  - Atualmente filtra fixo `age >= 40`
  - Mudar para: `age >= config.idade_minima` OU `participante.doenca` contem alguma das `config.comorbidades_obrigatorias`
  - Assim participantes com comorbidade aparecem independente da idade

- A configuracao so aparece se o usuario tem permissao de edicao (prop `canEdit` a ser passada do AreaPortal, ou verificacao interna)

---

### Item 9: Campo Especialidade/Profissao do Hakuna

As colunas `profissao` e `especialidade` ja existem na tabela `hakunas`. Nenhuma migration necessaria.

O codigo atual usa `especialidade_medica` para exibicao. Precisamos usar tambem `profissao` e `especialidade`.

**Arquivo: `src/components/hakunas/EquipeTab.tsx`**

- Alterar exibicao da coluna "Especialidade" na tabela:
  - Mostrar `profissao` como principal. Se `profissao === "Medico"` e `especialidade` existe, mostrar "Medico - {especialidade}"
  - Exemplo: "Enfermeiro(a)", "Medico - Cardiologista", "Fisioterapeuta"
  - Usar `h?.profissao` em vez de (ou complementando) `h?.especialidade_medica`

- Adicionar dialog/modal para editar profissao e especialidade de um Hakuna:
  - Botao de edicao na linha da tabela (icone Pencil)
  - Dialog com:
    - Select "Profissao" (obrigatorio): Medico, Enfermeiro(a), Fisioterapeuta, Massagista, Dentista, Nutricionista, Psicologo(a), Farmaceutico(a), Tecnico(a) de Enfermagem, Outro
    - Select "Especialidade" (condicional, so aparece se profissao = "Medico"): Cardiologista, Ortopedista, Clinico Geral, Pediatra, Dermatologista, Neurologista, Ginecologista, Urologista, Psiquiatra, Anestesista, Cirurgiao, Outro
  - Salvar: `supabase.from("hakunas").update({ profissao, especialidade }).eq("id", hakunaId)`

- Nos cards resumo (especCounts), agrupar por `profissao` em vez de `especialidade_medica`

---

### Item 10: Logica do Match Automatico Melhorada

**Arquivo: `src/components/hakunas/EquipeTab.tsx`**

Reescrever `matchMutation` com logica mais sofisticada:

1. Buscar TODOS os participantes (nao so os com doenca)
2. Para cada participante nao vinculado:
   - Se tem comorbidade: mapear para especialidade medica compativel
     - Cardiopatia/Hipertensao/Arritmia -> buscar Hakuna com profissao="Medico" e especialidade contendo "Cardiologista" ou "Clinico Geral"
     - Diabetes -> Clinico Geral
     - Problemas ortopedicos -> Ortopedista ou Fisioterapeuta
     - Problemas respiratorios/Asma -> Clinico Geral
     - Depressao/Ansiedade -> Psicologo(a) ou Psiquiatra
     - Fallback: Clinico Geral
   - Se NAO tem comorbidade: distribuir entre Enfermeiros, Fisioterapeutas e outros
3. Balancear quantidade: round-robin dentro de cada pool
4. Limite maximo por Hakuna: 15 participantes (configuravel)

- Antes de executar, verificar se ja existem vinculos:
  - Se sim: AlertDialog "Ja existem X vinculos. Deseja refazer? Os anteriores serao removidos."
  - Se confirmado: deletar vinculos existentes e recriar

- Apos match: toast com resumo "Match gerado! X participantes vinculados a Y Hakunas"

- A logica usa `profissao` e `especialidade` dos hakunas (nao mais `especialidade_medica`)

---

### Resumo de Alteracoes

| Arquivo | Tipo | Descricao |
|---|---|---|
| Migration | SQL | ADD COLUMN cidade TEXT em participantes |
| `src/pages/Participantes.tsx` | Alterar | Filtro e coluna cidade |
| `src/pages/ParticipanteForm.tsx` | Alterar | Campo cidade no formulario |
| `src/components/hakunas/ErgometricosTab.tsx` | Alterar | Config ergometrico + logica comorbidades |
| `src/components/hakunas/EquipeTab.tsx` | Alterar | Profissao/especialidade, dialog edicao, match melhorado |

### Detalhes Tecnicos

- 1 migration: apenas `ALTER TABLE participantes ADD COLUMN cidade TEXT`
- Tabelas `ergometrico_config`, `hakuna_participante` ja existem -- nenhuma criacao necessaria
- Colunas `profissao` e `especialidade` ja existem em `hakunas` -- nenhum ALTER necessario
- O match automatico roda no front-end (JS), nao precisa de Edge Function
- Nenhuma dependencia nova
