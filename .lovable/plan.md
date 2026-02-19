
## Fix — Tiles do Leaflet desalinhados (invalidateSize)

### Causa Raiz

O Leaflet calcula o tamanho do canvas de renderização no momento da montagem do componente. Como o `MapContainer` está dentro de um layout com sidebar (que completa o render após o mapa), o container tem tamanho incorreto no instante da inicialização — resultando em tiles quebrados/desalinhados.

Três pontos precisam ser corrigidos:

---

### 1. Componente `MapResizer` — `invalidateSize` após montagem

Criar um componente filho do `MapContainer` que usa `useMap()` para acessar a instância do mapa e chamar `invalidateSize()` com um delay de 100ms (garante que o layout finalizou), além de re-chamar no `resize` da janela.

**Inserir antes da função `CentralizarMapa` (linha ~68):**
```tsx
function MapResizer() {
  const map = useMap();
  useEffect(() => {
    const timer = setTimeout(() => map.invalidateSize(), 100);
    const handleResize = () => map.invalidateSize();
    window.addEventListener("resize", handleResize);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", handleResize);
    };
  }, [map]);
  return null;
}
```

**Adicionar como primeiro filho do `MapContainer` (após a abertura da tag, antes do `TileLayer`):**
```tsx
<MapContainer ...>
  <MapResizer />
  <TileLayer ... />
  ...
```

---

### 2. CSS do Leaflet — mover o `@import` para antes dos `@tailwind`

No `src/index.css` atual o import está na linha 5 (após os `@tailwind`). O PostCSS processa os `@tailwind` antes do `@import`, o que pode causar conflito de especificidade. Mover o `@import` para a **linha 1**:

```css
@import "leaflet/dist/leaflet.css";

@tailwind base;
@tailwind components;
@tailwind utilities;
```

---

### 3. Altura explícita no container do mapa

O container atual usa `h-[calc(100vh-4rem)]` (linha 207). Trocar para `calc(100vh - 56px)` via `style` inline no `MapContainer` para garantir que o Leaflet receba um valor concreto em pixels, sem depender do Tailwind:

**`MapContainer` (linha 240-244):**
```tsx
<MapContainer
  center={CENTER}
  zoom={15}
  style={{ width: "100%", height: "calc(100vh - 56px)" }}
  zoomControl={false}
>
```

E o wrapper `div` externo manter com a mesma altura para consistência:
```tsx
<div className="relative w-full overflow-hidden" style={{ height: "calc(100vh - 56px)" }}>
```

---

### 4. CSS global `.leaflet-container`

Adicionar ao final de `src/index.css`:
```css
.leaflet-container {
  height: 100%;
  width: 100%;
  background: #0f0f23;
}
```

---

### Resumo dos arquivos alterados

| Arquivo | Mudança |
|---|---|
| `src/pages/KmzMapa.tsx` | + componente `MapResizer`, `<MapResizer />` no mapa, height no style do wrapper e `MapContainer` |
| `src/index.css` | Mover `@import leaflet` para linha 1; adicionar `.leaflet-container` no final |

