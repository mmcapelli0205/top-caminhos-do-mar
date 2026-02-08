

## Modulo TOPs + Integracao WhatsApp

### Migracao de Banco

A tabela `tops` precisa de uma coluna adicional:

```sql
ALTER TABLE tops ADD COLUMN observacoes text;
```

As tabelas `whatsapp_templates` e `whatsapp_envios` ja existem com dados seed. Nenhuma outra migracao necessaria.

### Estrutura de Arquivos

| Arquivo | Acao |
|---|---|
| `src/pages/Tops.tsx` | Reescrever completamente - pagina com 2 abas (Edicoes + WhatsApp) |
| `src/components/tops/TopFormDialog.tsx` | Novo - Dialog para criar/editar TOP |
| `src/components/tops/TopActiveCard.tsx` | Novo - Card em destaque do TOP ativo |
| `src/components/tops/WhatsAppConfigSection.tsx` | Novo - Configuracao da API Evolution + webhook |
| `src/components/tops/WhatsAppTemplatesSection.tsx` | Novo - Lista e edicao de templates |
| `src/components/tops/WhatsAppDisparoSection.tsx` | Novo - Disparo manual com selecao de destino |
| `src/components/tops/WhatsAppLogSection.tsx` | Novo - Log de envios com filtros e reenvio |
| `src/components/tops/TemplateEditDialog.tsx` | Novo - Dialog para editar mensagem do template |

### Tab 1 - Edicoes

**Card TOP Ativo** (topo da pagina):
- Mostra o TOP com status != "Finalizado" (ou o mais recente)
- Exibe: nome, local, datas, contagem de participantes/servidores/familias (queries de contagem), receita total
- Usa os dados de `participantes`, `servidores`, `familias` filtrados pelo top_id

**Tabela de TOPs:**
- Colunas: Nome | Local | Data Inicio | Data Fim | Participantes (count) | Servidores (count) | Status | Acoes
- Status com Badge colorido: Planejamento (cinza), Inscricoes Abertas (azul), Em Andamento (amarelo), Finalizado (verde)
- Botao "+ Novo TOP"
- Acoes: Editar (abre dialog), Ver Dashboard (navega para /dashboard)

**Dialog Novo/Editar TOP** (TopFormDialog):
- Campos: nome, local, data_inicio, data_fim, max_participantes, status (Select), observacoes (textarea)
- INSERT ou UPDATE na tabela `tops`

### Tab 2 - WhatsApp

Dividida em 4 secoes verticais com Cards:

**Secao 1 - Configuracao da API** (WhatsAppConfigSection):
- Campos salvos em localStorage (chave `whatsapp_config`):
  - URL da Evolution API (text)
  - API Key (password input)
  - Nome da Instancia (text)
  - URL do Webhook N8N (text)
- Botao "Testar Conexao": faz GET para `{url}/instance/connectionState/{instancia}` com header apikey
- Mostra toast com resultado

**Secao 2 - Templates** (WhatsAppTemplatesSection):
- Lista dos 6 templates do banco (whatsapp_templates)
- Cada template em um Card mostrando:
  - Nome + Badge com gatilho (inscricao=verde, ergometrico=laranja, etc)
  - Toggle Switch ativo/inativo (UPDATE no banco)
  - Preview da mensagem com variaveis destacadas em amarelo (regex `{{...}}`)
  - Botao "Editar" abre TemplateEditDialog
- TemplateEditDialog: textarea com a mensagem, lista de variaveis disponiveis como referencia

**Secao 3 - Disparo Manual** (WhatsAppDisparoSection):
- Select template (lista templates ativos)
- Select destino: Todos Participantes, Todos Servidores, Participantes sem Ergometrico, Familia especifica (Select com familias), Pessoa especifica (Select com participantes)
- Preview: mostra contagem de destinatarios
- Botao "Enviar" com Dialog de confirmacao
- Ao confirmar:
  1. Busca destinatarios conforme filtro
  2. Para cada: substitui variaveis no template ({{nome}}, {{telefone}}, etc)
  3. Faz POST para URL webhook N8N com payload `{ telefone, mensagem, nome, template, top_id }`
  4. Insere registro em `whatsapp_envios` com status "pendente"
  5. Toast informando quantidade enviada

**Secao 4 - Log de Envios** (WhatsAppLogSection):
- Tabela: Data | Destinatario | Telefone | Template | Status | Erro | Acoes
- Filtros: status (Pendente/Enviado/Falha) e template
- Badges: Pendente (laranja), Enviado (verde), Falha (vermelho)
- Botao "Reenviar" nos que falharam (reenvia para o webhook)

### Detalhes Tecnicos

**Substituicao de variaveis:**
- Funcao utilitaria que recebe template string e objeto de dados
- Regex: `/\{\{(\w+)\}\}/g` substituindo pelo valor do objeto
- Dados vem de joins entre participantes/servidores/familias/tops

**Contagens para o card ativo:**
- Participantes: `SELECT count(*) FROM participantes WHERE top_id = ?`
- Servidores: `SELECT count(*) FROM servidores WHERE top_id = ?`
- Familias: `SELECT count(*) FROM familias WHERE familia_top_id = ?`
- Receita: `SELECT sum(valor_pago) FROM participantes WHERE top_id = ?`

**Disparo via webhook (nao edge function):**
- O disparo e feito direto do frontend via fetch POST para a URL do webhook N8N configurada pelo usuario
- Nenhuma edge function necessaria para isso
- O N8N recebe e chama a Evolution API

### Responsividade
- Card TOP ativo: full-width, stack vertical em mobile
- Tabela TOPs: scroll horizontal em mobile
- Templates: cards empilhados em mobile
- Secao config: campos full-width
- Log: tabela com scroll horizontal

