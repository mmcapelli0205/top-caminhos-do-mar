

## Melhoria Visual: Cards de Equipes na Tela Servidores

### Arquivo: `src/pages/Servidores.tsx`

### Mudancas

**1. Novos imports:**
- Adicionar `useState` para controle de erro de imagem (ja importado)
- Importar `CORES_EQUIPES` e `getTextColor` de `@/lib/coresEquipes`

**2. Constantes novas (no topo do arquivo):**
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

const ASSET_BASE = "https://ilknzgupnswyeynwpovj.supabase.co/storage/v1/object/public/assets/";
```

**3. Estado para controle de erro de imagem:**
- Adicionar `const [imgErrors, setImgErrors] = useState<Record<string, boolean>>({})` para rastrear quais logos falharam individualmente

**4. Substituir bloco de Area Cards (linhas 254-280):**

O grid atual com cards simples de texto sera substituido por cards visuais quadrados:

- **Grid**: `grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4`
- **Cada card**:
  - `aspect-square` para formato quadrado
  - Borda sutil na cor da equipe via `style={{ borderColor: CORES_EQUIPES[area] }}`
  - `hover:scale-[1.05]` + `shadow-lg` no hover + `transition-all duration-300`
  - Logo centralizada (~h-20 w-20, object-contain) com fallback para letra inicial grande em circulo colorido
  - Nome da area abaixo da logo (font-bold, text-sm)
  - Badge com quantidade de aprovados no canto superior direito (position absolute)
  - Badge de pendentes (laranja) caso existam
  - Cursor pointer, clique navega para `/areas/{area}`
- **Card "Sem Area"**: mantido com estilo vermelho, mesmo formato quadrado

**5. Nenhuma outra alteracao:**
- Toda logica de navegacao, filtros, tabela, dialogs permanece identica
- Nenhuma dependencia nova

