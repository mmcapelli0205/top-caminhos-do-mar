

## Radar Informativo - Legendarios (Plano Atualizado)

Modulo completo para rastrear e exibir TOPs dos Legendarios com inscricoes abertas, usando Firecrawl e Perplexity para busca automatizada.

### Pre-requisitos (Conectores)

Antes de implementar, sera necessario conectar dois servicos ao projeto:
- **Firecrawl** - para raspar sites como Ticket and Go e plataformas alternativas
- **Perplexity** - para busca inteligente de TOPs via IA

Voce sera solicitado a conectar ambos durante a implementacao.

### Novas Tabelas Supabase

**`tops_legendarios`** - Armazena os TOPs encontrados
- id, numero_top, nome_track, cidade, estado, data_checkin, data_retorno
- valor_participante, link_participante, valor_servidor, link_servidor
- link_servidor_enviado_por, link_servidor_encontrado_em, link_servidor_data
- instagram_base, status (aberto/esgotado/encerrado), origem_dados, data_captura
- destaque (boolean), ativo (boolean)
- top_id (referencia ao TOP ativo do app, nullable)
- RLS: leitura publica (anon), escrita autenticado

**`bases_legendarios`** - Perfis de Instagram das bases regionais
- id, instagram_handle, nome, regiao, seguidores, logo_url, ativo
- RLS: leitura publica, escrita autenticado

**`radar_noticias`** - Noticias relevantes encontradas pelo Perplexity
- id, titulo, resumo, fonte_url, fonte_nome, data_publicacao, data_captura
- RLS: leitura publica, escrita apenas via service_role

### Dados Iniciais — 43 Bases de Instagram

Ao criar a tabela `bases_legendarios`, inserir TODOS os perfis conhecidos:

| Handle | Identificacao |
|---|---|
| @legendariosbrasil | Nacional |
| @legendariossaopaulo | Sao Paulo |
| @legendariosreset | Reset |
| @legendarios3colinas | 3 Colinas |
| @legendariossatl | SATL |
| @legendariosglobal | Global |
| @legendariospt | Portugal |
| @legendariosmontenegro | Montenegro |
| @legendarios.spcapital | SP Capital |
| @legendariosvaledosfortes | Vale dos Fortes |
| @legendariosusa | USA |
| @legendariosabusca | A Busca |
| @legendariosostepr | Oeste PR |
| @legendariosalmaguerreira | Alma Guerreira |
| @legendariosvaledosol | Vale do Sol |
| @legendariospara | Para |
| @legendariosmaringa | Maringa |
| @legendariostheharbour | The Harbour |
| @legendarioslamantiqueira | La Mantiqueira |
| @legendariosaraPongas | Arapongas |
| @legendariosdivinopolis | Divinopolis |
| @legendariosaguasprofundas | Aguas Profundas |
| @legendariosdourados | Dourados |
| @legendariosceara | Ceara |
| @legendariosuberlandiaarocha | Uberlandia A Rocha |
| @legendariosapucaranapr | Apucarana PR |
| @legendariosaguadepedra | Agua de Pedra |
| @legendariosbetim | Betim |
| @legendarios_sp_valedoparaiba | SP Vale do Paraiba |
| @legendariossouloffire | Soul of Fire |
| @legendariosatitude | Atitude |
| @legendariosbauru | Bauru |
| @legendarioseaglesnest | Eagle's Nest |
| @legendarioslitoral | Litoral |
| @legendarios.es | Espirito Santo |
| @legendarisitalia | Italia |
| @legendarioscostaricaoficial | Costa Rica Oficial |
| @legendariosvaledossinos | Vale dos Sinos |
| @legendarioscoracaovalente | Coracao Valente |
| @legendariosbrasilia | Brasilia / DF |
| @legendariosgoias | Goias |
| @legendariostrackpantanal | Track Pantanal / MS |
| @legendarisforcaselvagem | Forca Selvagem |

### Arquivos Novos

**Pagina principal:**
- `src/pages/RadarLegendarios.tsx` - Pagina com grid de TOPs, filtros, secao de bases e noticias

**Componentes:**
- `src/components/radar/TopLegendarioCard.tsx` - Card individual com numero gigante dourado, botoes PARTICIPAR (verde) e SERVIR (azul), contagem regressiva, badge de status
- `src/components/radar/RadarFilters.tsx` - Filtros por estado, mes, status de link de servidor
- `src/components/radar/RastrearTopsButton.tsx` - Botao que dispara as 4 buscas em paralelo
- `src/components/radar/AjudeEncontrarModal.tsx` - Modal crowdsourcing para enviar link faltante
- `src/components/radar/BasesInstagramSection.tsx` - Grid de cards dos 43 Instagrams das bases
- `src/components/radar/RadarNoticiasSection.tsx` - Secao de noticias relevantes
- `src/components/radar/CompartilharWhatsApp.tsx` - Botao de compartilhamento formatado

**API/Hooks:**
- `src/hooks/useRadarLegendarios.ts` - Hook para queries e mutations dos TOPs
- `src/lib/radarCrossMatch.ts` - Logica de cruzamento e pareamento de resultados

**Edge Functions:**
- `supabase/functions/radar-rastrear/index.ts` - Executa as 4 buscas em paralelo, cruza resultados, salva na tabela
- `supabase/functions/radar-cron/index.ts` - Job automatico a cada 12 horas

### Arquivos Modificados

- `src/App.tsx` - Adicionar rota `/radar`
- `src/components/AppSidebar.tsx` - Adicionar item "Radar" no menu lateral com icone Radio
- `supabase/config.toml` - Adicionar configuracao das novas edge functions

### Logica das Buscas (Edge Function `radar-rastrear`)

Executa 4 buscas em paralelo usando `Promise.allSettled`:

1. **Firecrawl - Ticket and Go**: Map de `ticketandgo.com.br` filtrando URLs com "legendarios". `/evento/` = PARTICIPANTE, sem `/evento/` = SERVIDOR
2. **Firecrawl - Instagram**: Tenta raspar os 43 perfis das bases. Fallback: retorna lista de perfis como atalhos diretos
3. **Perplexity - Busca IA**: Query pedindo TOPs futuros de 2026 com links de participante e servidor
4. **Firecrawl - Plataformas alternativas**: Map de e-inscricao.com e enttro.com buscando "legendarios"

Cruzamento por nome da track, depois por cidade+data. Upsert na tabela.

### Design Visual

- Fundo escuro `#1a1a1a`, cards `#2d2d2d` com borda dourada sutil `#c9a84c`
- Numero do TOP em fonte extra bold dourada
- Botao PARTICIPAR verde `#22c55e`, SERVIR azul `#3b82f6`
- Contagem regressiva em laranja
- Grid responsivo: 2 colunas desktop, 1 mobile
- Secao de bases: grid de mini-cards com logo do Instagram e nome do perfil

### Resiliencia

- Cada busca independente: se uma falha, as outras continuam
- Nunca mostrar erro: sempre exibir resultados parciais + caminhos alternativos
- Instagram fallback: cards de atalho direto quando scraping falhar
- Dados cached no Supabase: TOPs anteriores sempre visiveis

