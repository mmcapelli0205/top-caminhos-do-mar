import { useEffect, useState } from "react";

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
      <div className="flex flex-col items-center justify-center py-6">
        <p className="text-2xl font-bold text-green-400">TOP 1575 — Finalizado ✅</p>
      </div>
    );
  }

  if (phase === "started") {
    return (
      <div className="flex flex-col items-center justify-center py-6">
        <p className="text-3xl font-bold text-orange-400 animate-pulse">
          🔥 O TOP JÁ COMEÇOU!
        </p>
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

  const blocks = [
    { value: pad(days), label: "DIAS" },
    { value: pad(hours), label: "HORAS" },
    { value: pad(minutes), label: "MIN" },
    { value: pad(seconds), label: "SEG" },
  ];

  return (
    <div className="flex flex-col items-center justify-center gap-3">
      <p className="text-xs font-semibold tracking-widest uppercase text-orange-400/80">
        Faltam {weeks} semana{weeks !== 1 ? "s" : ""} e {remainingDays} dia{remainingDays !== 1 ? "s" : ""}
      </p>
      <div className="flex items-center gap-2">
        {blocks.map((b, i) => (
          <div key={b.label} className="flex items-center gap-2">
            <div className="flex flex-col items-center">
              <div className="w-14 h-14 md:w-16 md:h-16 rounded-lg border border-orange-500/30 bg-orange-500/5 flex items-center justify-center">
                <span className="text-2xl md:text-3xl font-mono font-bold text-orange-300 tabular-nums">
                  {b.value}
                </span>
              </div>
              <span className="text-[9px] md:text-[10px] text-orange-400/60 uppercase tracking-wider mt-1 font-medium">
                {b.label}
              </span>
            </div>
            {i < blocks.length - 1 && (
              <span className="text-orange-500/40 text-lg font-bold mb-4">:</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
