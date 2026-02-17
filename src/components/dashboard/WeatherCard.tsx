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

const DAYS_PT = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

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
      <Card className="bg-gradient-to-br from-blue-900/15 to-cyan-900/10 border-blue-600/15">
        <CardContent className="p-4 text-center">
          <CloudRain className="h-6 w-6 mx-auto text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">Clima indisponível</p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading || !data) {
    return (
      <Card className="bg-gradient-to-br from-blue-900/15 to-cyan-900/10 border-blue-600/15">
        <CardContent className="p-4"><Skeleton className="h-24 w-full" /></CardContent>
      </Card>
    );
  }

  const current = data.current;
  const daily = data.daily;
  const now = getWeather(current.weathercode);

  // Next 3 days (skip today = index 0)
  const forecast = [1, 2, 3].map((i) => {
    const date = new Date(daily.time[i]);
    return {
      day: DAYS_PT[date.getDay()],
      weather: getWeather(daily.weathercode[i]),
      max: Math.round(daily.temperature_2m_max[i]),
      min: Math.round(daily.temperature_2m_min[i]),
      rain: daily.precipitation_probability_max[i],
    };
  });

  return (
    <Card className="bg-gradient-to-br from-blue-900/15 to-cyan-900/10 border-blue-600/15">
      <CardContent className="p-4 space-y-3">
        {/* Header + Today */}
        <div className="flex items-center gap-3">
          <span className="text-2xl">{now.emoji}</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-2">
              <p className="text-2xl font-bold text-foreground">
                {Math.round(current.temperature_2m)}°C
              </p>
              <p className="text-xs text-muted-foreground">{now.desc}</p>
            </div>
            <p className="text-[10px] text-muted-foreground">
              💧 {current.relative_humidity_2m}% &nbsp; 💨 {Math.round(current.wind_speed_10m)} km/h
            </p>
          </div>
          <p className="text-[10px] text-muted-foreground/60 shrink-0">🏔️ SP-148 Km 42</p>
        </div>

        {/* Forecast */}
        <div className="grid grid-cols-3 gap-1">
          {forecast.map((f) => (
            <div key={f.day} className="text-center p-1.5">
              <p className="text-[10px] font-medium text-muted-foreground">{f.day}</p>
              <p className="text-sm">{f.weather.emoji}</p>
              <p className="text-[11px] text-foreground font-medium">{f.max}° / {f.min}°</p>
              <p className="text-[9px] text-muted-foreground">🌧 {f.rain}%</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
