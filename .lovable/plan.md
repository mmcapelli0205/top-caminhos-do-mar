

## Formulario de Participante - Cadastro e Edicao

### Resumo
Criar pagina de formulario com 5 abas (Tabs) para cadastrar e editar participantes, conectada ao Supabase. Funciona em duas rotas: `/participantes/novo` (criar) e `/participantes/:id/editar` (editar).

### Arquivos a criar/modificar

**1. `src/pages/ParticipanteForm.tsx`** (novo) — Componente principal do formulario

**2. `src/App.tsx`** (modificar) — Adicionar duas rotas novas

### Detalhes Tecnicos

**Rotas novas no App.tsx:**
- `/participantes/novo` -> ParticipanteForm (modo criacao)
- `/participantes/:id/editar` -> ParticipanteForm (modo edicao, busca dados existentes)

**Formulario com react-hook-form + zod:**
- Validacao com zod schema incluindo:
  - `nome`: string obrigatorio
  - `cpf`: string obrigatorio com validacao de algoritmo CPF (digitos verificadores)
  - `telefone`: string obrigatorio
  - `data_nascimento`: string obrigatorio
  - `igreja`: string obrigatorio
  - Demais campos opcionais
- Mascaras de CPF e telefone aplicadas via onChange handlers (formatacao visual)

**5 Abas usando shadcn Tabs:**

TAB 1 - Dados Pessoais:
- nome (Input, required)
- cpf (Input com mascara 000.000.000-00, validacao algoritmo)
- email (Input type email)
- telefone (Input com mascara (00) 00000-0000, required)
- data_nascimento (DatePicker com Popover+Calendar)
- peso (Input number, kg)
- altura (Input number, metros com decimal)
- tamanho_farda (Select: P, M, G, GG, XG)
- condicionamento (Slider 1-5 com labels: Sedentario a Atleta)
- instagram (Input com prefixo @)

TAB 2 - Saude:
- doenca (Textarea)
- medicamentos (Textarea)
- alergia_alimentar (Textarea)
- Alerta condicional (se idade >= 40): Alert laranja + ergometrico_status (Select) + ergometrico_url (Input para link ou upload para bucket "assets")

TAB 3 - Contatos e Igreja:
- igreja (Input, required)
- profissao (Input)
- amigo_parente (Input)
- Separador: "Contato de Emergencia"
- contato_nome, contato_telefone (mascara), contato_email
- Separador: "Inscricao por Terceiros"
- inscrito_por (Input)
- motivo_inscricao (Textarea, visivel apenas se inscrito_por preenchido)

TAB 4 - Financeiro:
- forma_pagamento (Select: PIX, Cartao, Multiplos Cartoes)
- cupom_desconto (Input)
- valor_pago (Input com prefixo R$)

TAB 5 - Documentos:
- contrato_assinado (Switch)
- contrato_url (Input para link ou upload)

**Comportamento no salvar:**
- Criacao: gera `qr_code = crypto.randomUUID()`, status = "inscrito"
- Edicao: seta `updated_at = new Date().toISOString()`
- Insert/Update via supabase client
- Toast de sucesso "Participante salvo com sucesso!"
- Redirect para `/participantes`
- Invalida cache react-query ["participantes"]

**Modo edicao:**
- Usa `useParams()` para pegar o ID
- Busca participante via `supabase.from("participantes").select("*").eq("id", id).single()`
- Preenche o formulario com `form.reset(data)`

**Upload de arquivos (ergometrico_url, contrato_url):**
- Upload para bucket "assets" do Supabase Storage (ja existe e eh publico)
- Salva URL publica no campo correspondente

**Responsivo:**
- Em mobile (useIsMobile hook): Tabs com orientacao vertical ou Accordion
- Inputs full-width
- Botao salvar sticky no bottom em mobile

**Nota:** O campo `pais` mencionado no prompt nao existe na tabela do banco, portanto sera omitido.

### Validacao CPF (algoritmo)
Implementar funcao que valida os 2 digitos verificadores do CPF brasileiro, rejeitar CPFs com todos digitos iguais.

### Sem alteracoes no banco
Todas as operacoes usam a tabela `participantes` existente e o bucket "assets" existente. Nenhuma migracao necessaria.

