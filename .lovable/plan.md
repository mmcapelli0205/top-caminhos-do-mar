

## Modulo Hakunas - Equipe de Saude Completa (5 Abas)

### Resumo
Reescrever `/hakunas` com 5 abas: Equipe (lista + match participantes), Ergometricos (exames 40+), Autorizacoes (liberacao montanha), Medicamentos (kit com cotacao 3 farmacias), Equipamentos (kit com cotacao 3 lojas). Medicamentos e Equipamentos seguem o padrao ja existente do MreSection/BebidasSection. Itens "comprar" sobem como despesa auto_calculada pro Financeiro.

### Nenhuma migracao necessaria
Todas as tabelas ja existem: `ergometricos`, `autorizacoes_medicas`, `hakuna_medicamentos`, `hakuna_equipamentos`, `hakuna_participante`. Os tipos serao regenerados automaticamente.

### Arquivos a criar/modificar

| Arquivo | Acao |
|---|---|
| `src/pages/Hakunas.tsx` | Reescrever - header + 5 abas |
| `src/components/hakunas/EquipeTab.tsx` | Criar - lista Hakunas + match participantes |
| `src/components/hakunas/ErgometricosTab.tsx` | Criar - registro ergometricos 40+ |
| `src/components/hakunas/AutorizacoesTab.tsx` | Criar - autorizacoes medicas |
| `src/components/hakunas/MedicamentosTab.tsx` | Criar - kit medicamentos (padrao MreSection) |
| `src/components/hakunas/EquipamentosTab.tsx` | Criar - kit equipamentos (padrao MreSection) |

### Detalhes Tecnicos

#### Hakunas.tsx (pagina principal)
- Header com HeartPulse + "Hakunas - Equipe de Saude" + contador + botao "+ Novo Hakuna"
- Tabs: Equipe | Ergometricos | Autorizacoes | Medicamentos | Equipamentos
- Cada aba renderiza seu componente dedicado

#### EquipeTab.tsx
- **Queries**: servidores (area_servico='Hakuna', status='aprovado'), hakunas, hakuna_participante, participantes
- **Cards resumo**: Total aprovados + contagem por especialidade_medica
- **Tabela**: Nome | Especialidade | CRM/Registro | Telefone | Participantes vinculados (count) | Acoes
- **Match automatico**: Botao "Gerar Match Automatico" que:
  1. Busca participantes com campo `doenca` preenchido
  2. Analisa palavras-chave e faz match com especialidade do Hakuna (diabetes->Medico, cadeirante->Fisioterapeuta, etc.)
  3. Distribui round-robin entre Hakunas da mesma especialidade
  4. Insere em `hakuna_participante` com motivo automatico
- **Expansao por Hakuna**: Cada linha expande mostrando participantes vinculados com nome, idade, condicao, medicamentos, prioridade
- **Acoes**: Desvincular, Vincular manualmente (select com busca)

#### ErgometricosTab.tsx
- **Info**: "Participantes com 40+ anos precisam de teste ergometrico aprovado"
- **Queries**: participantes (filtro idade >= 40), ergometricos
- **Cards**: Total 40+ | Pendentes | Enviados | Aprovados | Reprovados | Dispensados
- **Filtro**: Status (Todos, Pendente, Enviado, Aprovado, Reprovado, Dispensado)
- **Tabela**: Nome | Idade | Status | Arquivo (link) | Analisado por | Data | Observacoes | Acoes
- **Upload**: Upload para bucket "assets", cria registro em `ergometricos`
- **Analisar**: Dialog com select status (Aprovado/Reprovado) + textarea observacoes, update em `ergometricos` + `participantes.ergometrico_status`

#### AutorizacoesTab.tsx
- **Info**: "Autorizacao medica para subir a montanha"
- **Queries**: todos participantes, autorizacoes_medicas
- **Tabela**: Nome | Idade | Doenca/Condicao | Ergometrico | Autorizacao | Observacoes | Acoes
- Participantes com doenca preenchida ficam destacados
- **Acoes**: Aprovar (verde) / Reprovar (vermelho) via Dialog com observacoes obrigatorias
- Salva em `autorizacoes_medicas`

#### MedicamentosTab.tsx
- **Segue padrao identico ao MreSection** (ja existente no projeto)
- Conectado a tabela `hakuna_medicamentos`
- 3 fornecedores editaveis (default: "Drogasil", "Droga Raia", "Farmacia Popular")
- Colunas: Item | Qtd | Unid. | Situacao | Cedido por | Farm.1 R$ | Farm.2 R$ | Farm.3 R$ | Menor | Total
- **Situacao** (Select): "Comprar" (badge vermelho), "Em Estoque" (badge verde), "Cedido por Hakuna" (badge azul, mostra campo cedido_por)
- Menor = MIN(farm1, farm2, farm3), preco_manual override
- Total = Menor x Qtd (somente se situacao = "comprar")
- Rodape: CUSTO TOTAL e CUSTO POR KIT
- Reutiliza componente PriceCell existente
- **"Salvar como Despesa"**: upsert em `despesas` com descricao="Kit Medico - Medicamentos", categoria="Medicamentos", auto_calculado=true

#### EquipamentosTab.tsx
- **Identico ao MedicamentosTab** mas conectado a `hakuna_equipamentos`
- 3 fornecedores editaveis (default: "Shopmed", "Cirurgica Express", "Farmacia Popular")
- Colunas: Item | Qtd | Situacao | Cedido por | Loja1 R$ | Loja2 R$ | Loja3 R$ | Menor | Total
- Mesma logica de situacao (Comprar/Em Estoque/Cedido)
- **"Salvar como Despesa"**: categoria="Equipamentos Medicos", auto_calculado=true

### Integracao com Financeiro
- Medicamentos e Equipamentos usam o mesmo padrao de `saveDespesaMutation` do MreSection/BebidasSection
- Upsert por descricao + auto_calculado=true
- Aparece automaticamente no Financeiro > Resumo (grafico de pizza + soma despesas)

### Componentes reutilizados
- PriceCell (de `src/components/financeiro/PriceCell.tsx`)
- ServidorSheet (detalhes lateral)
- Todos componentes shadcn: Tabs, Table, Input, Select, Checkbox, Button, Badge, Card, Dialog, Alert, Textarea, Skeleton

### Responsividade
- Tabs com scroll horizontal em mobile (TabsList overflow-x-auto)
- Tabelas overflow-x-auto, primeira coluna sticky
- Dialogs responsivos por padrao shadcn
- Cards resumo: grid-cols-2 mobile, grid-cols-3 md, grid-cols-4 lg
