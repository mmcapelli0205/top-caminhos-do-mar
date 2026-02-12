

## Problema Identificado

A funcao de "Imagem de Referencia" na IA Criativa esta decorativa - o upload funciona, mas a imagem nunca chega ao modelo de IA. O DALL-E 3 so gera imagens do zero a partir de texto, nao suporta receber uma imagem base para editar.

## Solucao

Trocar o backend de geracao de imagens do DALL-E 3 (OpenAI) para o **Lovable AI Gateway com Gemini**, que suporta nativamente receber uma imagem junto com instrucoes de edicao.

### Como vai funcionar

- **Sem imagem de referencia**: Gera imagem do zero a partir do prompt (como hoje)
- **Com imagem de referencia**: Envia a imagem + prompt para o Gemini, que edita/modifica a imagem conforme pedido (ex: "adicionar fundo de mar atras deste logo")

## Etapas

### 1. Atualizar a Edge Function `generate-image`

Substituir a chamada ao DALL-E 3 pela chamada ao Lovable AI Gateway:

- Endpoint: `https://ai.gateway.lovable.dev/v1/chat/completions`
- Modelo: `google/gemini-2.5-flash-image` (geracao de imagens)
- Autenticacao: `LOVABLE_API_KEY` (ja disponivel automaticamente)
- Quando houver `reference_image_url`, enviar como conteudo multimodal (tipo `image_url` + `text`)
- Quando nao houver, enviar apenas o prompt de texto
- Parametro `modalities: ["image", "text"]` para receber imagem na resposta
- A resposta vem em base64 - fazer upload automatico para o bucket `assets` e retornar a URL publica

### 2. Atualizar o Frontend `AreaIACriativa.tsx`

- Remover os seletores de "Tamanho" e "Qualidade" (nao se aplicam ao Gemini)
- Manter o campo de prompt e o upload de referencia como estao
- Ajustar o parsing da resposta (a URL agora vira do storage, nao da OpenAI)

### 3. Resultado Esperado

Ao enviar o logo "Caminhos do Mar" + prompt "Adicionar um fundo de mar atras deste logo", o Gemini vai receber a imagem real e edita-la conforme o pedido, mantendo o logo original.

---

### Detalhes Tecnicos

**Edge Function - Payload sem referencia:**
```text
messages: [{ role: "user", content: "prompt do usuario" }]
modalities: ["image", "text"]
model: "google/gemini-2.5-flash-image"
```

**Edge Function - Payload com referencia:**
```text
messages: [{
  role: "user",
  content: [
    { type: "text", text: "prompt do usuario" },
    { type: "image_url", image_url: { url: "URL da imagem de referencia" } }
  ]
}]
modalities: ["image", "text"]
```

**Resposta:** A imagem gerada vem como base64, sera salva no bucket `assets/ia-criativa/` e a URL publica sera retornada ao frontend.

**Arquivos modificados:**
- `supabase/functions/generate-image/index.ts` - reescrever para usar Lovable AI
- `src/components/area/AreaIACriativa.tsx` - remover opcoes de tamanho/qualidade do DALL-E

