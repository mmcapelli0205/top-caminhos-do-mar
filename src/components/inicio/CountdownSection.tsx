import { useEffect, useState } from "react";

const TARGET = new Date("2026-04-02T12:00:00-03:00").getTime();
const END = new Date("2026-04-05T23:59:59-03:00").getTime();

type Phase = "counting" | "started" | "finished";

function TimeUnit({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <div className="relative flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-xl bg-[#1e1e1e] border border-[#2a2a2a] shadow-sm">
        <span className="text-2xl sm:text-3xl font-semibold text-foreground tabular-nums tracking-tight">
          {value}
        </span>
      </div>
      <span className="mt-1.5 text-[10px] sm:text-xs font-medium uppercase tracking-widest text-muted-foreground">
        {label}
      </span>
    </div>
  );
}

function Separator() {
  return (
    <div className="flex flex-col items-center justify-center gap-1.5 pb-5">
      <div className="h-1 w-1 rounded-full bg-muted-foreground/40" />
      <div className="h-1 w-1 rounded-full bg-muted-foreground/40" />
    </div>
  );
}

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
      <div className="rounded-lg border border-border bg-card p-8 text-center">
        <p className="text-xl font-semibold text-emerald-400">TOP 1575 — Finalizado ✅</p>
      </div>
    );
  }

  if (phase === "started") {
    return (
      <div className="rounded-lg border border-border bg-card p-8 text-center">
        <div className="inline-flex items-center gap-2 rounded-full bg-red-500/10 px-4 py-2 mb-3">
          <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
          <span className="text-sm font-medium text-red-400">AO VIVO</span>
        </div>
        <p className="text-2xl font-bold text-foreground">O TOP já começou! 🔥</p>
      </div>
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
    <div className="rounded-lg border border-border bg-card p-5 sm:p-6 flex flex-col items-center justify-center">
      <p className="text-xs font-medium text-muted-foreground mb-4 tracking-wide">
        Faltam {weeks > 0 && `${weeks} semana${weeks !== 1 ? "s" : ""} e `}{remainingDays} dia{remainingDays !== 1 ? "s" : ""}
      </p>

      <div className="flex items-start gap-2 sm:gap-3">
        <TimeUnit value={pad(days)} label="dias" />
        <Separator />
        <TimeUnit value={pad(hours)} label="horas" />
        <Separator />
        <TimeUnit value={pad(minutes)} label="min" />
        <Separator />
        <TimeUnit value={pad(seconds)} label="seg" />
      </div>

      <div className="mt-4 w-full max-w-[260px]">
        <div className="h-1 w-full rounded-full bg-[#1e1e1e] overflow-hidden">
          <div
            className="h-full rounded-full bg-primary/60 transition-all duration-1000"
            style={{
              width: `${Math.min(100, Math.max(2, 100 - (days / 90) * 100))}%`,
            }}
          />
        </div>
      </div>
    </div>
  );
}
