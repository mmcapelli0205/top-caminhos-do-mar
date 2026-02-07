

## Modulo Servidores e Hakunas - Cadastro + Alocacao por Area

### Resumo
Reescrever as paginas /servidores e /hakunas com dashboard panoramico, formulario de cadastro completo com 4 abas, fluxo de alocacao Aceitar/Recusar por coordenador, e lista filtrada de Hakunas. Criar nova pagina ServidorForm seguindo o padrao existente do ParticipanteForm.

### Arquivos a criar/modificar

| Arquivo | Acao |
|---|---|
| `src/pages/Servidores.tsx` | Reescrever - dashboard + lista com alocacao |
| `src/pages/ServidorForm.tsx` | Criar - formulario 4 abas |
| `src/pages/Hakunas.tsx` | Reescrever - lista filtrada Hakuna |
| `src/App.tsx` | Adicionar rotas /servidores/novo e /servidores/:id/editar |

### Nenhuma migracao necessaria
Todos os campos ja existem na tabela `servidores` (nome, cpf, telefone, email, data_nascimento, numero_legendario, experiencia, estrangeiro, pais, cep, endereco, cidade, estado, igreja, sede, habilidades, areas_servidas, area_preferencia_1, area_preferencia_2, contato_nome, contato_email, contato_telefone, tem_veiculo, tem_recurso, recurso_descricao, cupom_desconto, status, tamanho_farda, area_servico, especialidade, checkin, qr_code, valor_pago, forma_pagamento, updated_at). A tabela `hakunas` tambem ja existe com servidor_id, especialidade_medica, registro_profissional, crm, associacao_medica, disponibilidade.

### Detalhes Tecnicos

#### 1. App.tsx - Novas rotas

Adicionar dentro do bloco AppLayout:
- `/servidores/novo` renderizando ServidorForm
- `/servidores/:id/editar` renderizando ServidorForm

#### 2. Servidores.tsx - Dashboard + Lista com Alocacao

**Constantes (no topo do arquivo):**

```text
AREAS_SERVICO = ["Hakuna", "Seguranca", "Eventos", "Midia", "Comunicacao",
  "Logistica", "Voz", "ADM", "Resgate", "Coordenacao Geral",
  "Intercessao", "Alimentacao", "Tempo e Execucao", "DOC", "Outra area"]
```

**Query:** useQuery buscando todos os servidores da tabela `servidores`.

**Estrutura da pagina:**

1. **Header**: Icone Shield + "Servidores" + contador + botoes "+ Novo Servidor" e "Exportar CSV"

2. **Alertas** (Cards vermelho/laranja no topo):
   - "X servidores aguardando alocacao!" se houver status="pendente"
   - "X servidores sem area!" se houver status="sem_area"
   - Clicaveis: ao clicar, seta o filtro de status correspondente

3. **Cards panoramicos** (grid responsivo 2 cols mobile, 4 desktop):
   - Um Card por area de servico mostrando: nome da area, total aprovados, badge laranja com pendentes
   - Card especial "Sem Area" em vermelho

4. **Filtros:**
   - Select "Area" (Todas + cada area)
   - Select "Status" (Todos, Pendente, Aprovado, Recusado, Sem Area)
   - Input busca por nome/CPF

5. **Tabela:**
   - Colunas: Nome | Idade | Telefone | 1a Opcao | 2a Opcao | Area Atual | Status | Acoes
   - Status com Badge colorido (pendente=laranja, aprovado=verde, recusado=vermelho, sem_area=vermelho escuro)
   - Acoes: Eye (ver), Pencil (editar), e se pendente: botao Check verde "Aceitar" e botao X vermelho "Recusar"

6. **Logica Aceitar:**
   - Update: area_servico = area onde esta pendente, status = "aprovado"
   - Toast de sucesso
   - Invalida queries

7. **Logica Recusar:**
   - Abre Dialog com Textarea obrigatorio "Motivo da recusa"
   - Se estava na 1a opcao (area_servico === area_preferencia_1): move para 2a opcao (area_servico = area_preferencia_2, status permanece "pendente")
   - Se estava na 2a opcao: status = "sem_area"
   - Toast informando resultado
   - Invalida queries

8. **Logica de filtro por area:**
   - Mostra servidores aprovados naquela area + pendentes cuja area_servico corresponde

9. **Paginacao e ordenacao:** Mesmo padrao do Participantes.tsx (PAGE_SIZE=20, sort por nome/idade/status)

10. **Sheet de detalhes:** Ao clicar Eye ou na linha, abre Sheet lateral com todos os dados do servidor (similar ao ParticipanteSheet)

#### 3. ServidorForm.tsx - Formulario 4 Abas

Segue o padrao do ParticipanteForm.tsx existente (useForm + zod + react-hook-form).

**Schema zod:**
- nome: string required
- email: string email required
- telefone: string required
- estrangeiro: boolean
- cpf: string, required se nao estrangeiro, validacao validateCPF
- data_nascimento: string required
- numero_legendario: string required
- experiencia: string (enum)
- tamanho_farda: string
- pais: string default "Brasil"
- cep: string
- endereco, cidade, estado: string
- igreja, sede: string
- habilidades: string (JSON array serializado)
- areas_servidas: string (JSON array serializado)
- area_preferencia_1: string required
- area_preferencia_2: string required, diferente de area_preferencia_1
- contato_nome: string required
- contato_email: string email required
- contato_telefone: string required
- tem_veiculo: boolean
- tem_recurso: boolean
- recurso_descricao: string (visivel se tem_recurso)
- cupom_desconto: string
- valor_pago: number

**Aba 1 - Dados Pessoais:**
- nome, email, telefone (mascara), checkbox estrangeiro, cpf (mascara, desabilitado se estrangeiro), data_nascimento (DatePicker dropdown-buttons fromYear=1930 toYear=2010), numero_legendario, experiencia (Select), tamanho_farda (Select)

**Aba 2 - Endereco e Igreja:**
- pais (Select), cep (mascara xxxxx-xxx, auto-fetch viacep ao completar 8 digitos), endereco, cidade, estado, igreja, sede

**Aba 3 - Habilidades e Area:**
- habilidades: grid de Checkboxes com as 12 habilidades definidas, salva como JSON string
- areas_servidas: grid de Checkboxes com AREAS_SERVICO, salva como JSON string
- area_preferencia_1: Select required
- area_preferencia_2: Select required (filtra para excluir a 1a opcao)

**Aba 4 - Contato e Recursos:**
- contato_nome, contato_email, contato_telefone (mascara)
- tem_veiculo: RadioGroup Sim/Nao
- tem_recurso: RadioGroup Sim/Nao
- recurso_descricao: Input visivel condicionalmente
- cupom_desconto, valor_pago, forma_pagamento

**Ao salvar (criar):**
- Gera qr_code = crypto.randomUUID()
- area_servico = area_preferencia_1
- status = "pendente"
- Se area_preferencia_1 === "Hakuna": insere registro na tabela `hakunas` com servidor_id
- Toast + redirect /servidores

**Ao salvar (editar):**
- Update com updated_at = now()
- Se area_servico mudou para "Hakuna" e nao tem registro em hakunas: criar
- Toast + redirect /servidores

**Comportamento com query param ?area=Hakuna:**
- Le searchParams, se area=Hakuna pre-seleciona area_preferencia_1

#### 4. Hakunas.tsx - Lista Filtrada

**Query:** Busca servidores onde area_servico = 'Hakuna' AND status = 'aprovado'. Faz query separada na tabela `hakunas` via servidor_id para pegar dados medicos.

**Estrutura:**
1. **Header:** Icone HeartPulse + "Hakunas - Equipe de Saude" + contador + botao "+ Novo Hakuna" (link para /servidores/novo?area=Hakuna)

2. **Cards resumo:**
   - Total Hakunas aprovados
   - Subtotais por especialidade_medica (Medico: X, Fisioterapeuta: X, etc)

3. **Tabela:**
   - Colunas: Nome | Idade | Telefone | Especialidade Medica | CRM/Registro | Igreja | Check-in | Acoes
   - Acoes: Eye (ver detalhes) e Pencil (editar -> /servidores/:id/editar)

### Componentes shadcn utilizados
Tabs, TabsList, TabsTrigger, TabsContent, Table, Input, Select, Checkbox, Button, Badge, Card, Dialog, Calendar/Popover (DatePicker), RadioGroup, Alert, Textarea, Sheet, Skeleton

### Responsividade
- Cards panoramicos: grid-cols-2 mobile, grid-cols-3 md, grid-cols-4 lg
- Formulario: tabs empilham em mobile (TabsList com flex-wrap)
- Tabela: overflow-x-auto, colunas secundarias hidden em mobile
- Dialog de recusa: max-w-md, responsivo por padrao do shadcn

