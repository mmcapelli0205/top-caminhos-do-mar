

## Atualizar integração Kling AI para API oficial

### Problema atual
As edge functions `generate-video` e `check-video-status` estão configuradas para usar o PiAPI (intermediario `api.piapi.ai`), mas voce tem acesso direto a API oficial do Kling com Access Key e Secret Key.

### O que muda

**1. Novos secrets no Supabase**
- Adicionar `KLING_ACCESS_KEY` (sua Access Key)
- Adicionar `KLING_SECRET_KEY` (sua Secret Key)
- O secret `KLING_API_KEY` existente pode ser removido (era para o PiAPI)

**2. Atualizar `supabase/functions/generate-video/index.ts`**
- Gerar JWT token usando Access Key + Secret Key (algoritmo HS256)
- Chamar a API oficial `https://api.klingai.com/v1/videos/text2video` em vez de `api.piapi.ai`
- Enviar o token no header `Authorization: Bearer <jwt>`
- Body adaptado para o formato da API oficial do Kling

**3. Atualizar `supabase/functions/check-video-status/index.ts`**
- Mesma logica de JWT
- Chamar `https://api.klingai.com/v1/videos/text2video/<task_id>` para consultar status
- Adaptar parsing da resposta ao formato oficial

### Detalhes tecnicos

A API oficial do Kling exige um JWT gerado assim:

```text
Header: { alg: "HS256", typ: "JWT" }
Payload: { iss: ACCESS_KEY, exp: now + 1800, iat: now }
Assinado com: SECRET_KEY
```

O JWT e gerado em cada chamada dentro da edge function usando uma lib Deno compativel.

### Arquivos modificados
- `supabase/functions/generate-video/index.ts`
- `supabase/functions/check-video-status/index.ts`

### Arquivos inalterados
- `src/components/area/AreaIACriativa.tsx` (nenhuma mudanca no frontend)
- `supabase/functions/generate-image/index.ts` (DALL-E nao muda)

