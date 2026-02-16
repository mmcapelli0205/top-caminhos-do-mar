import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval,
  format, isSameMonth, isSameDay, addMonths, subMonths, addDays,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { CORES_EQUIPES, getTextColor } from "@/lib/coresEquipes";

interface CalEvent {
  data_inicio: string;
  titulo: string;
  area: string;
  local?: string | null;
  cor: string;
}

const EVENTOS_FIXOS: CalEvent[] = [
  { data_inicio: "2026-02-15T00:00:00", titulo: "Abertura das Inscrições", area: "ADM", cor: CORES_EQUIPES["ADM"] },
  { data_inicio: "2026-04-02T12:00:00", titulo: "🏔️ Início do TOP 1575", area: "Diretoria", cor: CORES_EQUIPES["Diretoria"] },
];

const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

export default function CalendarioMensal() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const isMobile = useIsMobile();
  const today = new Date();

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);

  const { data: dbEvents } = useQuery({
    queryKey: ["inicio-eventos", format(monthStart, "yyyy-MM")],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("area_eventos")
        .select("titulo, data_inicio, local, area_id, areas:area_id(nome, cor)")
        .gte("data_inicio", monthStart.toISOString())
        .lte("data_inicio", monthEnd.toISOString());
      if (error) throw error;
      return (data ?? []).map((e: any) => ({
        data_inicio: e.data_inicio,
        titulo: e.titulo,
        local: e.local,
        area: e.areas?.nome ?? "",
        cor: CORES_EQUIPES[e.areas?.nome ?? ""] ?? e.areas?.cor ?? "#6366f1",
      })) as CalEvent[];
    },
  });

  const allEvents = useMemo(() => {
    const fixed = EVENTOS_FIXOS.filter((e) => {
      const d = new Date(e.data_inicio);
      return d >= monthStart && d <= monthEnd;
    });
    return [...(dbEvents ?? []), ...fixed];
  }, [dbEvents, monthStart, monthEnd]);

  const eventsForDay = (day: Date) =>
    allEvents.filter((e) => isSameDay(new Date(e.data_inicio), day));

  // Mobile: list next 7 days
  if (isMobile) {
    const next7 = Array.from({ length: 7 }, (_, i) => addDays(today, i));
    return (
      <Card id="calendario-section">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-primary" />
            <CardTitle className="text-sm font-medium text-muted-foreground">Próximos 7 dias</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {next7.map((day) => {
            const dayEvents = eventsForDay(day);
            return (
              <div key={day.toISOString()} className="flex gap-3 items-start py-1 border-b border-border/40 last:border-0">
                <div className={`text-center min-w-[40px] ${isSameDay(day, today) ? "text-primary font-bold" : "text-muted-foreground"}`}>
                  <div className="text-xs uppercase">{format(day, "EEE", { locale: ptBR })}</div>
                  <div className="text-lg">{format(day, "dd")}</div>
                </div>
                <div className="flex-1 space-y-1">
                  {dayEvents.length === 0 ? (
                    <p className="text-xs text-muted-foreground/50">—</p>
                  ) : (
                    dayEvents.map((ev, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: ev.cor }} />
                        <span className="text-xs text-foreground truncate">{ev.titulo}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    );
  }

  // Desktop: full month grid
  const calStart = startOfWeek(monthStart);
  const calEnd = endOfWeek(monthEnd);
  const days = eachDayOfInterval({ start: calStart, end: calEnd });

  return (
    <Card id="calendario-section">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-5 w-5 text-primary" />
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {format(currentMonth, "MMMM yyyy", { locale: ptBR }).replace(/^\w/, (c) => c.toUpperCase())}
          </CardTitle>
        </div>
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-px">
          {WEEKDAYS.map((d) => (
            <div key={d} className="text-center text-[10px] font-medium text-muted-foreground py-1">
              {d}
            </div>
          ))}
          {days.map((day) => {
            const inMonth = isSameMonth(day, currentMonth);
            const isToday = isSameDay(day, today);
            const dayEvents = eventsForDay(day);

            const cell = (
              <div
                className={`min-h-[52px] p-1 rounded-md text-center transition-colors ${
                  !inMonth ? "opacity-30" : ""
                } ${isToday ? "ring-1 ring-primary bg-primary/5" : "hover:bg-muted/30"}`}
              >
                <span className={`text-xs ${isToday ? "font-bold text-primary" : "text-foreground"}`}>
                  {format(day, "d")}
                </span>
                {dayEvents.length > 0 && (
                  <div className="flex justify-center gap-0.5 mt-1 flex-wrap">
                    {dayEvents.slice(0, 3).map((ev, i) => (
                      <span key={i} className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: ev.cor }} />
                    ))}
                  </div>
                )}
              </div>
            );

            if (dayEvents.length === 0) return <div key={day.toISOString()}>{cell}</div>;

            return (
              <Popover key={day.toISOString()}>
                <PopoverTrigger asChild>
                  <button className="w-full text-left">{cell}</button>
                </PopoverTrigger>
                <PopoverContent className="w-64 p-3 space-y-2" side="top">
                  <p className="text-xs font-semibold text-foreground">
                    {format(day, "dd 'de' MMMM", { locale: ptBR })}
                  </p>
                  {dayEvents.map((ev, i) => {
                    const tc = getTextColor(ev.cor);
                    return (
                      <div key={i} className="flex items-start gap-2">
                        <span className="h-2.5 w-2.5 rounded-full mt-1 shrink-0" style={{ backgroundColor: ev.cor }} />
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-foreground truncate">{ev.titulo}</p>
                          <div className="flex items-center gap-1 mt-0.5">
                            <Badge className="text-[9px] px-1 py-0" style={{ backgroundColor: ev.cor, color: tc }}>
                              {ev.area}
                            </Badge>
                            {ev.local && (
                              <span className="text-[10px] text-muted-foreground truncate">{ev.local}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </PopoverContent>
              </Popover>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
