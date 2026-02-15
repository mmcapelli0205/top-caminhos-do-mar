import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";

const TARGET = new Date("2026-04-02T12:00:00-03:00").getTime();
const END = new Date("2026-04-05T23:59:59-03:00").getTime();

type Phase = "counting" | "started" | "finished";

export default function CountdownSection() {
  const [diff, setDiff] = useState(TARGET - Date.now());
  const [phase, setPhase] = useState<Phase>("counting");

  useEffect(() => {
    const id = setInterval(() => {
      const now = Date.now();
      if (now >= TARGET && now <= END) setPhase("started");
      else if (now > END) setPhase("finished");
      else {
        setPhase("counting");
        setDiff(TARGET - now);
      }
    }, 1000);
    return () => clearInterval(id);
  }, []);

  if (phase === "finished") {
    return (
      <Card className="bg-gradient-to-r from-green-900/40 to-green-800/20 border-green-700/30">
        <CardContent className="py-8 text-center">
          <p className="text-2xl font-bold text-green-400">TOP 1575 — Finalizado ✅</p>
        </CardContent>
      </Card>
    );
  }

  if (phase === "started") {
    return (
      <Card className="bg-gradient-to-r from-orange-900/50 to-amber-800/30 border-orange-600/40">
        <CardContent className="py-8 text-center">
          <p className="text-3xl font-bold text-orange-400 animate-pulse">
            🔥 O TOP JÁ COMEÇOU!
          </p>
        </CardContent>
      </Card>
    );
  }

  const totalSeconds = Math.max(0, Math.floor(diff / 1000));
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const weeks = Math.floor(days / 7);
  const remainingDays = days % 7;

  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    <Card className="bg-gradient-to-r from-orange-900/50 to-amber-800/30 border-orange-600/40 overflow-hidden">
      <CardContent className="py-6 text-center space-y-3">
        <p className="text-sm text-orange-300/80 font-medium tracking-wide uppercase">
          Faltam {weeks} semana{weeks !== 1 ? "s" : ""} e {remainingDays} dia{remainingDays !== 1 ? "s" : ""}
        </p>
        <div className="flex items-center justify-center gap-3 md:gap-5">
          {[
            { value: pad(days), label: "dias" },
            { value: pad(hours), label: "horas" },
            { value: pad(minutes), label: "min" },
            { value: pad(seconds), label: "seg" },
          ].map((item) => (
            <div key={item.label} className="flex flex-col items-center">
              <span className="text-3xl md:text-5xl font-mono font-bold text-orange-300 tabular-nums">
                {item.value}
              </span>
              <span className="text-[10px] md:text-xs text-orange-400/70 uppercase tracking-wider mt-1">
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
