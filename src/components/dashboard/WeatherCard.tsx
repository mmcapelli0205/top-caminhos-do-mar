import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { CloudRain, Wind, Droplets, MapPin } from "lucide-react";

const API_URL =
  "https://api.open-meteo.com/v1/forecast?latitude=-23.78&longitude=-46.01&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,weathercode,windspeed_10m_max&current=temperature_2m,weathercode,windspeed_10m&timezone=America/Sao_Paulo&forecast_days=7";

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
  80: { emoji: "🌧️", desc: "Pancadas" },
  81: { emoji: "🌧️", desc: "Pancadas" },
  82: { emoji: "🌧️", desc: "Pancadas Fortes" },
  95: { emoji: "⛈️", desc: "Tempestade" },
  96: { emoji: "⛈️", desc: "Tempestade" },
  99: { emoji: "⛈️", desc: "Tempestade" },
};

function getWeather(code: number) {
  return WMO[code] ?? { emoji: "🌤️", desc: "Parcialmente Nublado" };
}

function getDayLabel(dateStr: string, isToday: boolean): string {
  if (isToday) return "Hoje";
  const date = new Date(dateStr + "T12:00:00");
  return date.toLocaleDateString("pt-BR", { weekday: "short" }).replace(".", "");
}

function getDateLabel(dateStr: string): string {
  const date = new Date(dateStr + "T12:00:00");
  return date.toLocaleDateString("pt-BR", { day: "numeric", month: "short" }).replace(".", "");
}

type DayData = {
  day: string;
  date: string;
  isToday: boolean;
  weather: { emoji: string; desc: string };
  max: number;
  min: number;
  rain: number;
  wind: number;
};

function ForecastDay({ day, date, isToday, weather, max, min, rain, wind }: DayData) {
  return (
    <div
      className={`flex flex-col items-center gap-1 py-3 px-2 rounded-lg transition-colors min-w-[56px] ${
        isToday ? "bg-primary/8 border border-primary/20" : "hover:bg-[#1e1e1e]"
      }`}
    >
      <span className={`text-xs font-medium ${isToday ? "text-primary" : "text-muted-foreground"}`}>
        {day}
      </span>
      <span className="text-[10px] text-muted-foreground/60">{date}</span>
      <span className="text-xl my-1">{weather.emoji}</span>
      <span className="text-sm font-semibold text-foreground">{max}°</span>
      <span className="text-xs text-muted-foreground">{min}°</span>
      {rain > 30 && (
        <span className="flex items-center gap-0.5 text-[10px] text-blue-400/80 mt-0.5">
          <Droplets className="h-2.5 w-2.5" />
          {rain}%
        </span>
      )}
    </div>
  );
}

export default function WeatherCard() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["weather-open-meteo-v3"],
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
      <div className="rounded-lg border border-border bg-card p-6 text-center">
        <CloudRain className="h-5 w-5 mx-auto text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground">Clima indisponível</p>
      </div>
    );
  }

  if (isLoading || !data) {
    return (
      <div className="rounded-lg border border-border bg-card p-4">
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  const daily = data.daily;
  const current = data.current;
  const currentWeather = getWeather(current?.weathercode ?? 0);
  const currentTemp = Math.round(current?.temperature_2m ?? 0);
  const currentWind = Math.round(current?.windspeed_10m ?? 0);

  const columns: DayData[] = [0, 1, 2, 3, 4, 5, 6].map((i) => ({
    day: getDayLabel(daily.time[i], i === 0),
    date: getDateLabel(daily.time[i]),
    isToday: i === 0,
    weather: getWeather(daily.weathercode[i]),
    max: Math.round(daily.temperature_2m_max[i]),
    min: Math.round(daily.temperature_2m_min[i]),
    rain: Math.round(daily.precipitation_probability_max[i] ?? 0),
    wind: Math.round(daily.windspeed_10m_max[i]),
  }));

  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      {/* Current weather header */}
      <div className="flex items-center justify-between p-4 pb-3 border-b border-border">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{currentWeather.emoji}</span>
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-semibold text-foreground">{currentTemp}°C</span>
              <span className="text-sm text-muted-foreground">{currentWeather.desc}</span>
            </div>
            <div className="flex items-center gap-1 mt-0.5 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3" />
              <span>SP-148 Km 42 — Serra do Mar</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Wind className="h-3.5 w-3.5" />
          <span>{currentWind} km/h</span>
        </div>
      </div>

      {/* 7-day forecast */}
      <div className="p-3">
        {/* Mobile: horizontal scroll */}
        <div className="flex overflow-x-auto gap-1 sm:hidden pb-1 -mx-1 px-1">
          {columns.map((col, i) => (
            <ForecastDay key={i} {...col} />
          ))}
        </div>

        {/* Desktop: grid */}
        <div className="hidden sm:grid grid-cols-7 gap-1">
          {columns.map((col, i) => (
            <ForecastDay key={i} {...col} />
          ))}
        </div>
      </div>
    </div>
  );
}
