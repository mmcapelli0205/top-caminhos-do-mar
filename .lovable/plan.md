

## Radar + IA Criativa dentro de Servidores > Midia

### Resumo

Mover o Radar para dentro do portal da area "Midia" e adicionar ferramentas de IA (DALL-E para imagens, Kling AI para videos). O item Radar sai do menu lateral.

### Etapa 1 - Armazenar API Keys

Solicitar que voce insira as duas chaves de forma segura:
- **OPENAI_API_KEY** (sua chave `sk-...`)
- **KLING_API_KEY** (chave do Kling AI)

Elas ficam armazenadas como secrets do Supabase, nunca expostas no codigo.

### Etapa 2 - Criar Edge Functions

**`supabase/functions/generate-image/index.ts`**
- Recebe um prompt (e opcionalmente uma imagem base64 para edicao)
- Chama a API da OpenAI (DALL-E 3) usando sua OPENAI_API_KEY
- Retorna a URL da imagem gerada
- Parametros: prompt, size (1024x1024, 1792x1024, etc.), quality (standard/hd)

**`supabase/functions/generate-video/index.ts`**
- Recebe prompt textual (e opcionalmente imagem de referencia)
- Chama a API do Kling AI para criar tarefa de geracao de video
- Retorna o task_id para acompanhamento

**`supabase/functions/check-video-status/index.ts`**
- Recebe task_id
- Consulta o status da tarefa no Kling AI
- Retorna status (processing/completed/failed) e URL do video quando pronto

### Etapa 3 - Remover Radar do menu e rotas

**`src/lib/auth.ts`**
- Remover item 14 (Radar) do ALL_MENU_ITEMS
- Remover id 14 dos filtros de cargo (coordenacao, etc.)

**`src/App.tsx`**
- Remover a rota `/radar`
- Remover import de RadarLegendarios

### Etapa 4 - Criar componentes de aba

**`src/components/area/AreaRadar.tsx`**
- Extrai o conteudo de RadarLegendarios como componente reutilizavel
- Usa os mesmos hooks (useTopLegendarios, useBasesLegendarios, useRadarNoticias)
- Remove o wrapper de pagina para se integrar ao portal

**`src/components/area/AreaIACriativa.tsx`**
- Interface com 3 secoes em cards:
  - **Gerar Imagem (DALL-E)**: campo de prompt, selecao de tamanho, botao gerar, preview e download
  - **Editar Imagem (DALL-E)**: upload de imagem + instrucao, resultado editado
  - **Gerar Video (Kling AI)**: campo de prompt, botao gerar, indicador de progresso com polling, player de video quando pronto

### Etapa 5 - Integrar abas no AreaPortal

**`src/pages/AreaPortal.tsx`**
- Quando `decodedNome === "Mídia"`, exibir 2 abas extras:
  - **Radar** (componente AreaRadar)
  - **IA Criativa** (componente AreaIACriativa)

### Estrutura final das abas (area Midia)

```text
Painel | Mural | Calendario | Participantes | Docs | Radar | IA Criativa
```

### Custos

- Imagens DALL-E: cobrados na sua conta OpenAI (~$0.04-0.08 por imagem)
- Videos Kling AI: cobrados na sua conta Kling
- Nenhum credito do Lovable sera consumido por essas geracoes

### Arquivos criados
- `src/components/area/AreaRadar.tsx`
- `src/components/area/AreaIACriativa.tsx`
- `supabase/functions/generate-image/index.ts`
- `supabase/functions/generate-video/index.ts`
- `supabase/functions/check-video-status/index.ts`

### Arquivos modificados
- `src/lib/auth.ts`
- `src/App.tsx`
- `src/pages/AreaPortal.tsx`
- `supabase/config.toml`

