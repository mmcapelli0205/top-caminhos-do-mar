
## Ajuste: Logos das Equipes no QuickActions

### Arquivo a modificar: `src/components/inicio/QuickActions.tsx`

Reescrever o componente para exibir um unico card com a logo da equipe do usuario, substituindo os 4 cards de atalho atuais.

**Mudancas:**
- Remover imports nao utilizados (`ClipboardList`, `Package`, `CalendarDays`, `Lock`, `ChevronRight`, `Badge`)
- Adicionar estado `imgError` para fallback
- Adicionar constante `LOGOS_EQUIPES` com o mapa de arquivos de logo
- Adicionar constante `ASSET_BASE` com a URL base do bucket
- Substituir o grid de 4 cards por um unico card contendo:
  - `<img>` com a logo da equipe (h-16 w-16 object-contain)
  - `onError` handler que ativa fallback para circulo com iniciais (usando `CORES_EQUIPES` e `getTextColor`)
  - Nome da area
  - Texto "Acessar minha area" com seta
  - Hover com `hover:scale-[1.02] transition-all`
  - Clique navega para `/areas/{area_servico}`
- Se o usuario nao for servidor (sem area): retorna `null`

**Constante LOGOS_EQUIPES:**
```text
const LOGOS_EQUIPES: Record<string, string> = {
  "ADM": "adm.png",
  "Eventos": "eventos.png",
  "Hakuna": "hakunas.png",
  "Intercessão": "intercessao.png",
  "DOC": "intercessao.png",
  "Louvor": "intercessao.png",
  "Logística": "logistica.png",
  "Mídia": "midia.png",
  "Comunicação": "midia.png",
  "Segurança": "seguranca.png",
  "Voz": "voz.png",
  "Coordenação Geral": "adm.png",
};
```

**URL da imagem:**
```text
https://ilknzgupnswyeynwpovj.supabase.co/storage/v1/object/public/assets/${LOGOS_EQUIPES[area]}
```

**Fallback:** Se `onError` dispara, mostrar circulo com iniciais da area usando cores de `CORES_EQUIPES` e `getTextColor` (importados de `@/lib/coresEquipes`).

**Nenhum outro arquivo alterado. Nenhuma dependencia nova.**
