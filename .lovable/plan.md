
# Correção — WeatherCard (7 dias + vento + dias corretos)

## Arquivo a Modificar
`src/components/dashboard/WeatherCard.tsx` — único arquivo alterado.

## Mudanças Técnicas

### 1. Nova URL da API
```
https://api.open-meteo.com/v1/forecast
  ?latitude=-23.78
  &longitude=-46.01
  &daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,weathercode,windspeed_10m_max
  &timezone=America/Sao_Paulo
  &forecast_days=7
```
- Coordenadas ajustadas para `-23.78 / -46.01` (SP-148 Km 42, Serra do Mar)
- Adicionado `windspeed_10m_max` ao parâmetro `daily`
- `forecast_days` alterado de `4` para `7`

### 2. Nome do dia da semana (correção principal)
O bug atual ocorre porque `new Date("2026-02-20")` sem horário é interpretado como **UTC midnight**, e ao chamar `.getDay()` em fuso America/São_Paulo (UTC-3) o resultado retrocede um dia.

Solução: usar `toLocaleDateString` com locale `pt-BR` diretamente na string de data retornada pela API, que vem no formato `YYYY-MM-DD`:

```ts
function getDayLabel(dateStr: string, isToday: boolean): string {
  if (isToday) return "HOJE";
  // Append T12:00 para evitar problema de timezone com UTC midnight
  const date = new Date(dateStr + "T12:00:00");
  return date
    .toLocaleDateString("pt-BR", { weekday: "short" })
    .replace(".", "")
    .toUpperCase();
}
```
Resultado: `"sex."` → `"SEX"`, `"sáb."` → `"SÁB"`, etc.

### 3. Estrutura de dados dos 7 dias
```ts
const columns = [0,1,2,3,4,5,6].map((i) => ({
  day: getDayLabel(daily.time[i], i === 0),
  isToday: i === 0,
  weather: getWeather(daily.weathercode[i]),
  max: Math.round(daily.temperature_2m_max[i]),
  min: Math.round(daily.temperature_2m_min[i]),
  wind: Math.round(daily.windspeed_10m_max[i]),
}));
```

### 4. Layout responsivo para 7 cards

**Desktop:** `grid-cols-7` — 7 colunas em linha.

**Mobile:** `overflow-x-auto` com `flex` e `min-w-[52px]` em cada card — scroll horizontal suave.

Estrutura:
```tsx
{/* Mobile: scroll horizontal */}
<div className="flex overflow-x-auto gap-1 sm:hidden pb-1">
  {columns.map(col => <DayCard key={col.day} {...col} />)}
</div>

{/* Desktop: grid 7 colunas */}
<div className="hidden sm:grid grid-cols-7 gap-1">
  {columns.map(col => <DayCard key={col.day} {...col} />)}
</div>
```

### 5. Card individual — nova linha do vento
```tsx
{/* Vento */}
<span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
  <Wind className="h-3 w-3" />
  {col.wind}
</span>
```
- Ícone `Wind` do `lucide-react` (já instalado)
- Fonte menor que a temperatura mínima
- Cor `text-muted-foreground` (mais claro)
- Sem unidade "km/h" para caber no card estreito

### 6. Ajuste de tamanhos dos cards
Para caber 7 colunas, reduzir ligeiramente os tamanhos:
- Badge do dia: `text-[10px]` (era `text-[11px]`)
- Temperatura máxima: `text-base font-bold` (era `text-lg`)
- Emoji do clima: `text-2xl` (era `text-3xl`)
- Temperatura mínima: `text-sm` (era `text-lg`)
- `CardContent p-2` (era `p-3`)

### Resultado visual esperado
```
Clima — SP-148 Km 42
┌──────┬──────┬──────┬──────┬──────┬──────┬──────┐
│ HOJE │ SÁB  │ DOM  │ SEG  │ TER  │ QUA  │ QUI  │
│ 31°  │ 27°  │ 26°  │ 25°  │ 28°  │ 29°  │ 27°  │
│  ⛅  │  🌧  │  🌧  │  ☁️  │  ⛅  │  ⛅  │  🌧  │
│ 18°  │ 20°  │ 19°  │ 20°  │ 19°  │ 18°  │ 20°  │
│ 💨12 │ 💨15 │ 💨8  │ 💨10 │ 💨12 │ 💨14 │ 💨9  │
└──────┴──────┴──────┴──────┴──────┴──────┴──────┘
```

Nenhuma dependência nova. Nenhuma migration SQL. Apenas `src/components/dashboard/WeatherCard.tsx`.
