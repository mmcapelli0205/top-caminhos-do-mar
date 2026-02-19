
# Situação Atual e Solução

## Diagnóstico

O arquivo `CAMINHOS_DO_MAR_OFICIAL-2.kmz` enviado é um arquivo ZIP binário contendo `doc.kml` internamente. As ferramentas de leitura de texto do Lovable não conseguem descompactar o ZIP para extrair o XML — o arquivo aparece como dados binários corrompidos.

O `src/data/kmzData.ts` atual contém rotas **simplificadas/interpoladas** (não extraídas do KML original):
- Rota D1: ~97 pontos (gerados programaticamente com incrementos uniformes)
- Rota D2: ~55 pontos
- Rota D3: ~60 pontos
- Rota D4: ~83 pontos (estes são os mais próximos do real, pois são incrementos lineares)

O resultado visual são **linhas retas** porque os pontos foram gerados com interpolação linear, não extraídos das curvas reais da trilha.

## O Que Precisa Acontecer

Para ter as 364 coordenadas reais da rota D1 (e equivalentes para D2-D4), precisamos do conteúdo XML do `doc.kml`. Existem duas formas de obter isso:

---

## Opção 1 — Você extrai e cola as coordenadas (mais rápido)

Abra o arquivo `.kmz` no seu computador:
1. Renomeie `CAMINHOS_DO_MAR_OFICIAL-2.kmz` para `CAMINHOS_DO_MAR_OFICIAL-2.zip`
2. Extraia o ZIP — dentro haverá um arquivo `doc.kml`
3. Abra o `doc.kml` em qualquer editor de texto (VSCode, Notepad++)
4. Procure pelas tags `<LineString>` de cada rota (ex: "Rota D1 6,13km")
5. Copie o conteúdo da tag `<coordinates>` de cada rota
6. Cole aqui no chat

O formato das coordenadas no KML é: `lng,lat,altitude` (ordem diferente do Leaflet que usa `lat,lng`).

---

## Opção 2 — Usar o KMZ diretamente no browser (implementar parser)

Adicionar a lib `jszip` (já instalada no projeto!) para ler o KMZ no browser e parsear o XML automaticamente em runtime — sem precisar hardcodar nada.

### Como funcionaria:

```
KMZ (ZIP) → JSZip → doc.kml (XML) → DOMParser → coordenadas → Leaflet
```

A página `/kmz` carregaria o arquivo KMZ, extrairia as coordenadas reais e renderizaria as rotas completas com todos os pontos.

### Implementação:

1. Copiar o KMZ para `public/CAMINHOS_DO_MAR.kmz`
2. Criar hook `useKmzData()` que:
   - Faz `fetch('/CAMINHOS_DO_MAR.kmz')`
   - Usa `JSZip.loadAsync(blob)` para abrir o ZIP
   - Lê `doc.kml` como texto
   - Usa `DOMParser` para parsear o XML
   - Extrai todos os `<Placemark>` com `<Point>` (pontos) e `<LineString>` (rotas)
   - Retorna pontos e rotas no formato correto para o Leaflet
3. Substituir os arrays hardcoded em `KmzMapa.tsx` pelo hook dinâmico
4. Mostrar `<Skeleton>` enquanto o KMZ carrega

### Vantagens da Opção 2:
- Coordenadas 100% fiéis ao arquivo KMZ original (364 pontos na D1, etc.)
- Se o KMZ for atualizado, basta substituir o arquivo em `public/` — sem tocar no código
- Reutilizável para versões futuras do evento

### Desvantagens:
- Adiciona ~200ms de loading inicial para parsear o KMZ
- Requer que o arquivo KMZ fique em `public/` (acessível publicamente)

---

## Recomendação

**Opção 2** é a mais robusta. O `jszip` já está instalado no projeto. O KMZ já foi enviado e pode ser copiado para `public/`. O parser leria exatamente o que o Google Earth mostra — sem simplificações.

## Plano Técnico (Opção 2)

### Arquivos a modificar/criar:

| Arquivo | Operação | Descrição |
|---|---|---|
| `public/CAMINHOS_DO_MAR.kmz` | Criar (copiar do upload) | KMZ copiado para servir estaticamente |
| `src/hooks/useKmzParser.ts` | Criar | Hook que faz fetch + parse do KMZ com JSZip + DOMParser |
| `src/pages/KmzMapa.tsx` | Modificar | Usar `useKmzParser` em vez dos dados hardcoded; adicionar loading state |
| `src/data/kmzData.ts` | Manter | Manter apenas os tipos e constantes de estilo (cores, ícones) |

### Hook `useKmzParser`:

```typescript
export function useKmzParser(kmzUrl: string) {
  const [pontos, setPontos] = useState<KMZPonto[]>([]);
  const [rotas, setRotas] = useState<KMZRota[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function parseKmz() {
      try {
        const res = await fetch(kmzUrl);
        const blob = await res.blob();
        const zip = await JSZip.loadAsync(blob);
        
        // Encontrar o .kml dentro do ZIP
        const kmlFile = Object.values(zip.files).find(f => f.name.endsWith('.kml'));
        const kmlText = await kmlFile.async('text');
        
        // Parsear o XML
        const parser = new DOMParser();
        const doc = parser.parseFromString(kmlText, 'text/xml');
        
        // Extrair pontos (Placemark com Point)
        const pontosExtraidos = extrairPontos(doc);
        
        // Extrair rotas (Placemark com LineString)
        const rotasExtraidas = extrairRotas(doc);
        
        setPontos(pontosExtraidos);
        setRotas(rotasExtraidas);
      } catch (e) {
        setError('Erro ao carregar mapa');
      } finally {
        setLoading(false);
      }
    }
    parseKmz();
  }, [kmzUrl]);

  return { pontos, rotas, loading, error };
}
```

### Mapeamento de pastas KML → dias:

O KML tem pastas nomeadas como "Logistica", "Homologação D1", "Homologação D2", etc. O parser mapeará:
- Pasta "Logistic*" → `dia: "logistica"`
- Pasta "*D1*" → `dia: "d1"`
- Pasta "*D2*" → `dia: "d2"`
- Pasta "*D3*" → `dia: "d3"`
- Pasta "*D4*" → `dia: "d4"`

### Mapeamento de nomes → tipos de ponto:

- Nome contém "Predica" ou "Prédica" → `tipo: "predica"`
- Nome contém "Acampamento" → `tipo: "acampamento"`
- Nome contém "Base" → `tipo: "base"`
- Nome contém "Extração" ou "Extracao" → `tipo: "extracao"`
- Demais → `tipo: "ponto"`

### Cores das rotas por dia (mantidas):
- logistica: `#D2B48C`
- d1: `#3B82F6`
- d2: `#A855F7`
- d3: `#F97316`
- d4: `#EF4444`
