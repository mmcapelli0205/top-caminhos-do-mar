import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Wind } from "lucide-react";
import {
  SunIcon,
  MoonIcon,
  CloudIcon,
  PartlyCloudyIcon,
  RainIcon,
  HeavyRainIcon,
  SnowIcon,
  ThunderIcon,
  FogIcon,
  DrizzleIcon,
} from "@/components/ui/animated-weather-icons";
import type { ComponentType } from "react";

const API_URL =
  "https://api.open-meteo.com/v1/forecast?latitude=-23.78&longitude=-46.01&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,weathercode,windspeed_10m_max&current=temperature_2m,weathercode,windspeed_10m,is_day&timezone=America/Sao_Paulo&forecast_days=7";

interface WeatherIconProps {
  size?: number;
  className?: string;
}

interface WeatherInfo {
  Icon: ComponentType<WeatherIconProps>;
  desc: string;
}

const WMO_DAY: Record<number, WeatherInfo> = {
  0: { Icon: SunIcon, desc: "Céu Limpo" },
  1: { Icon: PartlyCloudyIcon, desc: "Parcialmente Nublado" },
  2: { Icon: PartlyCloudyIcon, desc: "Parcialmente Nublado" },
  3: { Icon: CloudIcon, desc: "Nublado" },
  45: { Icon: FogIcon, desc: "Névoa" },
  48: { Icon: FogIcon, desc: "Névoa" },
  51: { Icon: DrizzleIcon, desc: "Garoa" },
  53: { Icon: DrizzleIcon, desc: "Garoa" },
  55: { Icon: DrizzleIcon, desc: "Garoa" },
  61: { Icon: RainIcon, desc: "Chuva" },
  63: { Icon: RainIcon, desc: "Chuva" },
  65: { Icon: HeavyRainIcon, desc: "Chuva Forte" },
  71: { Icon: SnowIcon, desc: "Neve" },
  73: { Icon: SnowIcon, desc: "Neve" },
  75: { Icon: SnowIcon, desc: "Neve" },
  80: { Icon: RainIcon, desc: "Pancadas" },
  81: { Icon: RainIcon, desc: "Pancadas" },
  82: { Icon: HeavyRainIcon, desc: "Pancadas Fortes" },
  95: { Icon: ThunderIcon, desc: "Tempestade" },
  96: { Icon: ThunderIcon, desc: "Tempestade" },
  99: { Icon: ThunderIcon, desc: "Tempestade" },
};

const WMO_NIGHT: Record<number, WeatherInfo> = {
  0: { Icon: MoonIcon, desc: "Noite Limpa" },
  1: { Icon: MoonIcon, desc: "Noite c/ Nuvens" },
  2: { Icon: CloudIcon, desc: "Parcialmente Nublado" },
};

function getWeather(code: number, isDay: boolean = true): WeatherInfo {
  if (!isDay && WMO_NIGHT[code]) return WMO_NIGHT[code];
  return WMO_DAY[code] ?? { Icon: PartlyCloudyIcon, desc: "Parcialmente Nublado" };
}

function getDayLabel(dateStr: string, isToday: boolean): string {
  if (isToday) return "HOJE";
  const date = new Date(dateStr + "T12:00:00");
  return date.toLocaleDateString("pt-BR", { weekday: "short" }).replace(".", "").toUpperCase();
}

function getDateLabel(dateStr: string): string {
  const date = new Date(dateStr + "T12:00:00");
  return date.toLocaleDateString("pt-BR", { day: "numeric", month: "short" }).replace(".", "");
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
      <Card className="border-border/50">
        <CardContent className="p-4 text-center">
          <CloudIcon size={24} className="mx-auto mb-1" />
          <p className="text-xs text-muted-foreground">Clima indisponível</p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading || !data) {
    return (
      <Card className="border-border/50">
        <CardContent className="p-4">
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  const daily = data.daily;
  const current = data.current;
  const isDay = current?.is_day === 1;
  const currentWeather = getWeather(current?.weathercode ?? 0, isDay);
  const CurrentIcon = currentWeather.Icon;
  const currentTemp = Math.round(current?.temperature_2m ?? 0);
  const currentWind = Math.round(current?.windspeed_10m ?? 0);

  return (
    <Card className="border-border/50 overflow-hidden">
      <CardContent className="p-0">
        {/* Header compacto com clima atual */}
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/30">
          <div className="flex items-center gap-2">
            <CurrentIcon size={32} />
            <div>
              <span className="text-lg font-bold text-foreground">{currentTemp}°C</span>
              <span className="text-xs text-muted-foreground ml-1.5">{currentWeather.desc}</span>
            </div>
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Wind className="h-3 w-3" /> {currentWind} km/h
            </span>
            <span className="hidden sm:inline">SP-148 Km 42</span>
          </div>
        </div>

        {/* Previsão 7 dias - grid compacto */}
        <div className="grid grid-cols-7 divide-x divide-border/20">
          {[0, 1, 2, 3, 4, 5, 6].map((i) => {
            const isToday = i === 0;
            const weather = getWeather(daily.weathercode[i], true);
            const DayIcon = weather.Icon;
            const max = Math.round(daily.temperature_2m_max[i]);
            const min = Math.round(daily.temperature_2m_min[i]);
            const wind = Math.round(daily.windspeed_10m_max[i]);

            return (
              <div
                key={i}
                className={`flex flex-col items-center py-2.5 px-1 gap-0.5 ${
                  isToday ? "bg-orange-500/8" : ""
                }`}
              >
                <span
                  className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                    isToday
                      ? "bg-orange-500 text-white"
                      : "text-muted-foreground"
                  }`}
                >
                  {getDayLabel(daily.time[i], isToday)}
                </span>
                <span className="text-[8px] text-muted-foreground/60">{getDateLabel(daily.time[i])}</span>
                <DayIcon size={24} />
                <span className="text-xs font-semibold text-foreground">{max}°</span>
                <span className="text-[10px] text-muted-foreground">{min}°</span>
                <span className="flex items-center gap-0.5 text-[8px] text-muted-foreground/50">
                  <Wind className="h-2 w-2" />{wind}
                </span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
