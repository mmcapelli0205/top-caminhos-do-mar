import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { CloudRain } from "lucide-react";

const API_URL =
  "https://api.open-meteo.com/v1/forecast?latitude=-23.7745&longitude=-46.5633&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,weathercode&current=temperature_2m,weathercode,relative_humidity_2m,wind_speed_10m&timezone=America/Sao_Paulo&forecast_days=4";

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

const DAYS_PT = ["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SÁB"];

export default function WeatherCard() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["weather-open-meteo"],
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
      <Card className="bg-gradient-to-b from-slate-800/40 to-slate-900/40 border-slate-700/30 max-w-md mx-auto">
        <CardContent className="p-3 text-center">
          <CloudRain className="h-6 w-6 mx-auto text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">Clima indisponível</p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading || !data) {
    return (
      <Card className="bg-gradient-to-b from-slate-800/40 to-slate-900/40 border-slate-700/30 max-w-md mx-auto">
        <CardContent className="p-3"><Skeleton className="h-28 w-full" /></CardContent>
      </Card>
    );
  }

  const daily = data.daily;

  // Build 4 columns: today (index 0) + 3 next days
  const columns = [0, 1, 2, 3].map((i) => {
    const date = new Date(daily.time[i]);
    return {
      day: DAYS_PT[date.getDay()],
      isToday: i === 0,
      weather: getWeather(daily.weathercode[i]),
      max: Math.round(daily.temperature_2m_max[i]),
      min: Math.round(daily.temperature_2m_min[i]),
    };
  });

  return (
    <Card className="bg-gradient-to-b from-slate-800/40 to-slate-900/40 border-slate-700/30 max-w-md mx-auto">
      <CardContent className="p-3 space-y-2">
        {/* Header */}
        <p className="text-xs text-gray-400">Clima — SP-148 Km 42</p>

        {/* 4-column grid */}
        <div className="grid grid-cols-4 gap-3">
          {columns.map((col) => (
            <div key={col.day} className="flex flex-col items-center gap-1">
              {/* Day badge */}
              <span
                className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                  col.isToday
                    ? "bg-orange-500 text-white"
                    : "bg-gray-600 text-white"
                }`}
              >
                {col.isToday ? "HOJE" : col.day}
              </span>

              {/* Max temp */}
              <span className="text-lg font-bold text-white">{col.max}°</span>

              {/* Weather emoji */}
              <span className="text-3xl leading-none">{col.weather.emoji}</span>

              {/* Min temp */}
              <span className="text-lg text-gray-400">{col.min}°</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
