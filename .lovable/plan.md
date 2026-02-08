

## Modulo Artes & Docs - Galeria de Arquivos

### Tabela
A tabela `artes_docs` ja esta criada com todas as colunas necessarias: nome, descricao, categoria, subcategoria, arquivo_url, tipo_arquivo, tamanho_bytes, versao, tags, enviado_por, top_id, created_at, updated_at. Nenhuma migracao necessaria.

### Estrutura de Arquivos

| Arquivo | Acao |
|---|---|
| `src/pages/ArtesEDocs.tsx` | Reescrever completamente - pagina principal com header, filtros, grid/lista e dialogs |
| `src/components/artes-docs/ArteDocFormDialog.tsx` | Novo - Dialog de upload/edicao com campos e upload para Storage |
| `src/components/artes-docs/ArteDocPreviewDialog.tsx` | Novo - Dialog de preview de imagem em tamanho grande |

### Pagina Principal (ArtesEDocs.tsx)

**Header**: Icone Palette + "Artes & Docs" + Badge contador + botao "+ Upload"

**Filtros**:
- Categoria: Select com "Todas", "Arte Visual", "Documento Oficial"
- Subcategoria: Select dinamico (muda opcoes conforme categoria selecionada)
  - Arte Visual: Banner, Post Instagram, Post WhatsApp, Convite, Cracha, Certificado, Outro
  - Documento Oficial: Contrato, Termo de Responsabilidade, Regulamento, Autorizacao, Ficha Medica, Outro
- Busca por nome ou tag (input text)

**Toggle de visualizacao**: ToggleGroup com Grid (LayoutGrid) e Lista (List)

**Modo Grid** (default):
- Cards responsivos: grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4
- Cada card mostra:
  - Thumbnail: se imagem (png/jpg/svg/webp) exibe a imagem; se PDF icone FileText; outros icone File
  - Nome do arquivo
  - Badge categoria (Arte Visual = roxo, Documento Oficial = azul)
  - Badge subcategoria (outline)
  - "v{versao}" badge se versao > 1
  - "Por [enviado_por] em [data formatada]"
  - Tamanho formatado (KB ou MB)
  - Botoes: Download, Editar, Nova Versao, Excluir

**Modo Lista**:
- Tabela com colunas: Nome, Categoria, Subcategoria, Versao, Enviado por, Data, Tamanho, Acoes

**Queries**:
- Buscar todos artes_docs ordenados por created_at desc
- Filtrar no frontend por categoria, subcategoria, busca (nome ou tags)

### Dialog Upload/Editar (ArteDocFormDialog.tsx)

Campos:
- nome (text, required)
- descricao (textarea)
- categoria (Select: Arte Visual, Documento Oficial)
- subcategoria (Select dinamico conforme categoria)
- arquivo (file upload para bucket "assets" path "artes-docs/{uuid}.{ext}", required para novo)
- tags (text input, separar por virgula)

Ao salvar:
- Detecta tipo_arquivo pela extensao do arquivo
- Calcula tamanho_bytes do arquivo enviado
- INSERT ou UPDATE no artes_docs

### Nova Versao

- Botao "Nova Versao" no card abre o ArteDocFormDialog em modo especial
- Mantem nome, categoria, subcategoria, tags do registro original
- Exige upload de novo arquivo
- Faz INSERT de novo registro com versao = versao_anterior + 1
- O registro antigo permanece (historico)

### Preview (ArteDocPreviewDialog.tsx)

- Imagens (png/jpg/svg/webp): abre Dialog com imagem em tamanho grande
- PDF: abre em nova aba (window.open)
- Outros: download direto

### Excluir

- Confirmacao antes de deletar
- Remove registro do banco (nao remove arquivo do storage para manter historico)

### Upload de Arquivos

Utilizar bucket "assets" (ja existente e publico) com path `artes-docs/{uuid}.{extensao}`.

### Responsividade

- Grid: 1 col mobile, 2 tablet, 3-4 desktop
- Cards: full-width mobile
- Dialog upload: max-w-lg desktop, overflow-y-auto para scroll

