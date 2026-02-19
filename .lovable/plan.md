
# Mapa KMZ — Caminhos do Mar (Coordenadas Reais)

## O que foi extraído do arquivo doc.kml

O arquivo contém **5 pastas** com:
- **Logística:** Base Logística (ponto) + Rota 9,36km (LineString)
- **Homologação D1:** 15 pontos + Rota D1 6,13km + Check-in Arena Santos 17,3km + Translado Vans 6,1km
- **Homologação D2:** 11 pontos + rota
- **Homologação D3:** 18 pontos + Rota D3 5,45km
- **Homologação D4:** Rota D4 5,0km + Translado Vans 3,35km

Centro geográfico da trilha: lat **-23.862**, lng **-46.462** (Parque Estadual Caminhos do Mar, São Bernardo do Campo)

---

## Coordenadas exatas a hardcodar

### Pontos (Points extraídos dos Placemarks)

**Logística:**
- Base Logistica → lat: -23.86194, lng: -46.46835

**D1 (Homologação D1):**
- Desembarque Vans → lat: -23.86046, lng: -46.45318
- Embarque van → lat: -23.86454, lng: -46.43467
- Extração D1 (ponto 1) → lat: -23.86301, lng: -46.46165
- Extração D1 (ponto 2) → lat: -23.85857, lng: -46.46621
- Extração D1 (ponto 3) → lat: -23.85228, lng: -46.45888
- Prédica (genérica) → lat: -23.86286, lng: -46.46130
- Prédica Eu Te Levarei ao Deserto → lat: -23.85271, lng: -46.46336
- Prédica Cemitério → lat: -23.86347, lng: -46.45284
- Acampamento Senderistas D1/D2/D3 → lat: -23.85189, lng: -46.46350
- Prédica Tubos → lat a completar do KML
- Segunda revista / Prédica Integridade e Caráter → lat: -23.87456, lng: -46.44286

**D2 (Homologação D2):**
- Prédica Mas Decisões (Casa Abandonada) → lat: -23.86304, lng: -46.46196
- Prédica Salto da Fé tirolesa → lat: -23.86180, lng: -46.46797
- Prédica Conquista da Montanha → lat: -23.86232, lng: -46.45360
- Suportai-vos Uns aos Outros → lat: -23.86432, lng: -46.45719
- Oração da Meia Noite / Transbordando o Amor → lat: -23.85286, lng: -46.46374
- Milha Extra → lat: -23.86011, lng: -46.45824
- Acampamento D2 → lat: -23.85189, lng: -46.46345

**D3 (Homologação D3):**
- Peleja → lat: -23.85873, lng: -46.46342
- inicio Madeiro → lat: -23.85847, lng: -46.46436
- Entrega Madeiro → lat: -23.85898, lng: -46.46654
- Três Cruz → lat: -23.86002, lng: -46.46763
- Blocão → lat: -23.85319, lng: -46.46545
- Ceia Do Rei → lat: -23.85159, lng: -46.46603
- Acampamento D3 → lat: -23.85196, lng: -46.46355
- Lazaro → lat: -23.86412, lng: -46.46082
- Fugindo das Responsabilidades → lat: -23.85247, lng: -46.46354
- Snickers Awards / Testemunhos → lat: -23.85249, lng: -46.46345
- Dá-me este Monte / Cartas → lat: -23.85249, lng: -46.46352
- Bussola → lat: -23.86146, lng: -46.46179
- Almoço Senderistas → lat: -23.86302, lng: -46.46137
- Almoço Legendários → lat: -23.86212, lng: -46.46217
- Inquebrantáveis → lat: -23.86597, lng: -46.45965
- Hidratação não opcional → lat: -23.86297, lng: -46.46138
- Prédica Naamã → lat: -23.85923, lng: -46.46675

---

## Arquitetura da Implementação

### Arquivos a criar/modificar:

| Arquivo | Operação | Descrição |
|---|---|---|
| `package.json` | Modificar | Adicionar `leaflet ^1.9.4`, `react-leaflet ^4.2.1`, `@types/leaflet ^1.9.14` |
| `src/index.css` | Modificar | Importar `leaflet/dist/leaflet.css` |
| `src/data/kmzData.ts` | Criar | Todos os pontos e rotas hardcoded com coords reais |
| `src/pages/KmzMapa.tsx` | Criar | Página principal do mapa |
| `src/lib/auth.ts` | Modificar | Adicionar item id=14 "Mapa da Trilha" visível para todos os cargos |
| `src/App.tsx` | Modificar | Adicionar rota `/kmz` |

---

## Detalhes técnicos da implementação

### `src/data/kmzData.ts`

Contém dois arrays tipados:

```typescript
export const KMZ_PONTOS: KMZPonto[] = [
  // Logistica
  { id: "base_log", nome: "Base Logística", lat: -23.86194, lng: -46.46835, dia: "logistica", tipo: "base" },

  // D1
  { id: "d1_desembarque", nome: "Desembarque Vans", lat: -23.86046, lng: -46.45318, dia: "d1", tipo: "ponto" },
  { id: "d1_extr1", nome: "Extração D1", lat: -23.86301, lng: -46.46165, dia: "d1", tipo: "extracao" },
  { id: "d1_extr2", nome: "Extração D1 (Alt 2)", lat: -23.85857, lng: -46.46621, dia: "d1", tipo: "extracao" },
  { id: "d1_extr3", nome: "Extração D1 (Alt 3)", lat: -23.85228, lng: -46.45888, dia: "d1", tipo: "extracao" },
  { id: "d1_predica1", nome: "Prédica", lat: -23.86286, lng: -46.46130, dia: "d1", tipo: "predica" },
  { id: "d1_deserto", nome: "Prédica Eu Te Levarei ao Deserto", lat: -23.85271, lng: -46.46336, dia: "d1", tipo: "predica" },
  { id: "d1_cemiterio", nome: "Prédica Cemitério", lat: -23.86347, lng: -46.45284, dia: "d1", tipo: "predica" },
  { id: "d1_acampamento", nome: "Acampamento D1/D2/D3", lat: -23.85189, lng: -46.46350, dia: "d1", tipo: "acampamento" },
  { id: "d1_embarque", nome: "Embarque Van", lat: -23.86454, lng: -46.43467, dia: "d1", tipo: "ponto" },
  { id: "d1_revista", nome: "Segunda Revista / Prédica Integridade", lat: -23.87456, lng: -46.44286, dia: "d1", tipo: "predica" },
  // ... D2, D3, D4
];

export const KMZ_ROTAS: KMZRota[] = [
  {
    id: "rota_d1",
    nome: "D1 — 6,13km",
    dia: "d1",
    distancia: "6.13km",
    cor: "#3B82F6", // azul
    coordenadas: [
      // primeiros pontos da rota D1 extraída do KML linhas 1603-1604
      [-23.86048, -46.45318], [-23.86082, -46.45309], ...
    ]
  },
  {
    id: "rota_d3",
    nome: "D3 — 5,45km",
    dia: "d3",
    distancia: "5.45km",
    cor: "#F97316", // laranja
    coordenadas: [
      // coordenadas extraídas das linhas 2051-2052
      [-23.85254, -46.46319], [-23.85254, -46.46284], ...
    ]
  },
  {
    id: "rota_d4",
    nome: "D4 — 5,0km",
    dia: "d4",
    distancia: "5.0km",
    cor: "#EF4444", // vermelho
    coordenadas: [
      // coordenadas extraídas das linhas 2370-2372
      [-23.86044, -46.45314], [-23.86050, -46.45312], ...
    ]
  },
  // rota logistica, d2, check-in arena, translado vans...
];
```

### `src/pages/KmzMapa.tsx`

Layout mobile-first com overlay de controles:

```
┌─────────────────────────────────────────┐
│ [D1] [D2] [D3] [D4] [Log] [Todos]       │ ← filtro de dia (overlay topo)
│                                           │
│         MAPA LEAFLET                      │
│                                           │
│  ● Coord Segurança 01  (laranja)          │
│  ● Hakuna              (vermelho)         │
│  📍 Minha posição      (azul)             │
│                                           │
│ 📡 Online | 📍 Comp. loc.                 │ ← status bar
│                                           │
│ [📍 Centralizar] [👥 Toggle equipes]      │ ← botões overlay
│                                           │
│ [Legenda ▼]                               │ ← canto inferior
└─────────────────────────────────────────┘
```

**Estados principais:**
```typescript
const [diaFiltro, setDiaFiltro] = useState<'todos'|'logistica'|'d1'|'d2'|'d3'|'d4'>('todos');
const [showEquipes, setShowEquipes] = useState(true);
const [showMinhaPos, setShowMinhaPos] = useState(false);
const [minhaPos, setMinhaPos] = useState<[number,number] | null>(null);
const [isOnline, setIsOnline] = useState(navigator.onLine);
const [showLegenda, setShowLegenda] = useState(false);
```

**Correção de ícones Leaflet no Vite (problema conhecido):**
```typescript
import L from 'leaflet';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({ iconUrl: markerIcon, iconRetinaUrl: markerIcon2x, shadowUrl: markerShadow });
```

**Rastreamento de posição (apenas coordenadores/Hakunas):**
```typescript
// Detectar se usuário deve compartilhar posição
const isCoordOrHakuna = useMemo(() => {
  const cargosRastreados = ['coordenacao', 'coord02', 'coord03', 'diretoria'];
  return cargosRastreados.includes(role ?? '');
}, [role]);

// GPS watch + upsert a cada posição nova (throttle 30s)
useEffect(() => {
  if (!isCoordOrHakuna || !showMinhaPos || !topId) return;
  let lastSend = 0;
  const watchId = navigator.geolocation.watchPosition(async (pos) => {
    setMinhaPos([pos.coords.latitude, pos.coords.longitude]);
    const now = Date.now();
    if (isOnline && now - lastSend > 30_000) {
      lastSend = now;
      await supabase.from('kmz_localizacoes').upsert({...}, { onConflict: 'usuario_id,top_id' });
    }
  }, null, { enableHighAccuracy: true });
  return () => navigator.geolocation.clearWatch(watchId);
}, [isCoordOrHakuna, showMinhaPos, isOnline, topId]);
```

**Polling das posições dos outros (30s):**
```typescript
const { data: localizacoes = [] } = useQuery({
  queryKey: ['kmz_localizacoes', topId],
  queryFn: async () => {
    const { data } = await supabase
      .from('kmz_localizacoes')
      .select('*')
      .eq('top_id', topId)
      .neq('usuario_id', profile?.id ?? '');
    return data ?? [];
  },
  refetchInterval: 30_000,
  enabled: !!topId && showEquipes && isOnline,
});
```

**Marcadores das equipes (L.divIcon):**
```typescript
function criarIconeEquipe(cor: string, cargo: string): L.DivIcon {
  const numero = cargo?.includes('02') ? '02' : cargo?.includes('01') ? '01' : '';
  return L.divIcon({
    html: `<div style="
      width:28px;height:28px;background:${cor};
      border:2px solid white;border-radius:50%;
      display:flex;align-items:center;justify-content:center;
      font-size:9px;font-weight:bold;color:white;
      box-shadow:0 2px 4px rgba(0,0,0,0.4);">${numero}</div>`,
    className: '',
    iconSize: [28, 28],
    iconAnchor: [14, 14]
  });
}
```

### Menu e rota

**`src/lib/auth.ts`** — Adicionar:
```typescript
import { Map } from "lucide-react";
// Na lista ALL_MENU_ITEMS:
{ id: 14, title: "Mapa da Trilha", url: "/kmz", icon: Map },

// Em todas as roles (diretoria, coordenacao, sombra, servidor, default):
// Adicionar id 14 nos arrays de visibilidade
```

**`src/App.tsx`** — Adicionar:
```tsx
import KmzMapa from "./pages/KmzMapa";
// Na rota:
<Route path="/kmz" element={<KmzMapa />} />
```

### Detalhes das rotas no arquivo de dados

As rotas do KML são **muito densas** (centenas de pontos cada). Para não sobrecarregar o arquivo, as coordenadas serão **simplificadas** — pegando 1 a cada 5 pontos da rota original — suficientes para traçar a linha corretamente no mapa sem perda visual significativa.

- Rota D1 (linhas 1603): de São Bernardo → trilha (~17km com translado, simplificado para pontos-chave)
- Rota D3 (linhas 2051): coordenadas reais, simplificadas (~1/5 dos pontos)
- Rota D4 (linhas 2370): coordenadas reais com altitude, ignorar altitude para Leaflet

### Legenda de equipes (sempre visível)

```
EQUIPES
● Hakuna         #DC2626   (vermelho)
● Segurança      #EA580C   (laranja)
● Eventos        #CA8A04   (amarelo)
● Mídia          #9CA3AF   (cinza)
● Comunicação    #7C3AED   (roxo)
● Logística      #92400E   (marrom)
● Voz            #4D7C0F   (verde militar)
● ADM            #22C55E   (verde)
● Intercessão    #F8FAFC   (branco)
● Diretoria      #1E293B   (preto)

PONTOS DE REFERÊNCIA
📖 Prédica
⛺ Acampamento
🏠 Base
🚌 Extração/Van
📍 Ponto geral
```

### Status online/offline

```tsx
useEffect(() => {
  const handleOnline = () => setIsOnline(true);
  const handleOffline = () => setIsOnline(false);
  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);
  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
}, []);
```

Banner no topo do mapa:
- Online → `📡 Posições atualizadas` (verde)
- Offline → `📴 Offline — última posição conhecida` (laranja)

---

## O que NÃO será implementado nesta versão

- Service Worker para cache de tiles offline (complexidade alta, ganho baixo)
- A rota "Check-in Arena Santos 17,3km" (é o percurso de van de Santos até o parque, não da trilha em si — muito longa e fora da área)
- A rota "Translado Vans" (percurso de van, não da trilha)

---

## Resumo dos arquivos

| Arquivo | Operação |
|---|---|
| `package.json` | + leaflet, react-leaflet, @types/leaflet |
| `src/index.css` | + import leaflet CSS |
| `src/data/kmzData.ts` | CRIAR — pontos e rotas com coordenadas reais |
| `src/pages/KmzMapa.tsx` | CRIAR — página completa do mapa |
| `src/lib/auth.ts` | + item 14 "Mapa da Trilha" para todos os cargos |
| `src/App.tsx` | + rota /kmz |
