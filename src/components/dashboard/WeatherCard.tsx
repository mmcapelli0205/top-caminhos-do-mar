import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { CloudRain, Wind } from "lucide-react";

const API_URL =
  "https://api.open-meteo.com/v1/forecast?latitude=-23.78&longitude=-46.01&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,weathercode,windspeed_10m_max&timezone=America/Sao_Paulo&forecast_days=7";

const WMO: Record<number, { emoji: string; desc: string }> = {
  0: { emoji: "☀️", desc: "Céu Limpo" },
  1: { emoji: "⛅", desc: "Parcialmente Nublado" },
  2: { emoji: "⛅", desc: "Parcialmente Nublado" },
  3: { emoji: "☁️", desc: "Nublado" },
  45: { emoji: "🌫️", desc: "Névoa" },
  48: { emoji: "🌫️", desc: "Névoa" },
  51: { emoji: "🌦️", desc: "Garoa" },
  53: { emoji: "🌦️", desc: "Garoa" },
  55: { emoji: "🌦️", desc: "Garoa" },
  61: { emoji: "🌧️", desc: "Chuva" },
  63: { emoji: "🌧️", desc: "Chuva" },
  65: { emoji: "🌧️", desc: "Chuva Forte" },
  71: { emoji: "🌨️", desc: "Neve" },
  73: { emoji: "🌨️", desc: "Neve" },
  75: { emoji: "🌨️", desc: "Neve" },
  80: { emoji: "🌧️", desc: "Pancadas de Chuva" },
  81: { emoji: "🌧️", desc: "Pancadas de Chuva" },
  82: { emoji: "🌧️", desc: "Pancadas Fortes" },
  95: { emoji: "⛈️", desc: "Tempestade" },
  96: { emoji: "⛈️", desc: "Tempestade" },
  99: { emoji: "⛈️", desc: "Tempestade" },
};

function getWeather(code: number) {
  return WMO[code] ?? { emoji: "🌤️", desc: "Parcialmente Nublado" };
}

function getDayLabel(dateStr: string, isToday: boolean): string {
  if (isToday) return "HOJE";
  // Append T12:00:00 to avoid UTC midnight timezone shift (would give wrong day in UTC-3)
  const date = new Date(dateStr + "T12:00:00");
  return date
    .toLocaleDateString("pt-BR", { weekday: "short" })
    .replace(".", "")
    .toUpperCase();
}

type DayCol = {
  day: string;
  isToday: boolean;
  weather: { emoji: string; desc: string };
  max: number;
  min: number;
  wind: number;
};

function DayCard({ day, isToday, weather, max, min, wind }: DayCol) {
  return (
    <div className="flex flex-col items-center gap-0.5 min-w-[48px]">
      {/* Day badge */}
      <span
        className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full whitespace-nowrap ${
          isToday ? "bg-orange-500 text-white" : "bg-gray-600 text-white"
        }`}
      >
        {day}
      </span>

      {/* Max temp */}
      <span className="text-base font-bold text-foreground">{max}°</span>

      {/* Weather emoji */}
      <span className="text-2xl leading-none">{weather.emoji}</span>

      {/* Min temp */}
      <span className="text-sm text-muted-foreground">{min}°</span>

      {/* Wind speed */}
      <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
        <Wind className="h-3 w-3 shrink-0" />
        {wind}
      </span>
    </div>
  );
}

export default function WeatherCard() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["weather-open-meteo-v2"],
    queryFn: async () => {
      const res = await fetch(API_URL);
      if (!res.ok) throw new Error("Falha ao buscar clima");
      return res.json();
    },
    staleTime: 30 * 60 * 1000,
    retry: 1,
  });

  if (isError) {
    return (
      <Card className="bg-gradient-to-b from-slate-800/40 to-slate-900/40 border-slate-700/30 max-w-2xl mx-auto">
        <CardContent className="p-3 text-center">
          <CloudRain className="h-6 w-6 mx-auto text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">Clima indisponível</p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading || !data) {
    return (
      <Card className="bg-gradient-to-b from-slate-800/40 to-slate-900/40 border-slate-700/30 max-w-2xl mx-auto">
        <CardContent className="p-3">
          <Skeleton className="h-28 w-full" />
        </CardContent>
      </Card>
    );
  }

  const daily = data.daily;

  const columns: DayCol[] = [0, 1, 2, 3, 4, 5, 6].map((i) => ({
    day: getDayLabel(daily.time[i], i === 0),
    isToday: i === 0,
    weather: getWeather(daily.weathercode[i]),
    max: Math.round(daily.temperature_2m_max[i]),
    min: Math.round(daily.temperature_2m_min[i]),
    wind: Math.round(daily.windspeed_10m_max[i]),
  }));

  return (
    <Card className="bg-gradient-to-b from-slate-800/40 to-slate-900/40 border-slate-700/30 max-w-2xl mx-auto">
      <CardContent className="p-2 space-y-2">
        {/* Header */}
        <p className="text-xs text-muted-foreground px-1">Clima — SP-148 Km 42</p>

        {/* Mobile: horizontal scroll */}
        <div className="flex overflow-x-auto gap-2 sm:hidden pb-1 px-1">
          {columns.map((col) => (
            <DayCard key={col.day + col.max} {...col} />
          ))}
        </div>

        {/* Desktop: 7-column grid */}
        <div className="hidden sm:grid grid-cols-7 gap-1 px-1">
          {columns.map((col) => (
            <DayCard key={col.day + col.max} {...col} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
