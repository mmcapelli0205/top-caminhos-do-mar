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
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
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

  const nextMonthStart = startOfMonth(addMonths(today, 1));
  const nextMonthEnd = endOfMonth(addMonths(today, 1));

  const { data: dbEventsNext } = useQuery({
    queryKey: ["inicio-eventos-next", format(nextMonthStart, "yyyy-MM")],
    enabled: isMobile,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("area_eventos")
        .select("titulo, data_inicio, local, area_id, areas:area_id(nome, cor)")
        .gte("data_inicio", nextMonthStart.toISOString())
        .lte("data_inicio", nextMonthEnd.toISOString());
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
    const combined = [...(dbEvents ?? []), ...(isMobile ? (dbEventsNext ?? []) : [])];
    const fixed = EVENTOS_FIXOS.filter((e) => {
      const d = new Date(e.data_inicio);
      if (isMobile) {
        const limit = addDays(today, 14);
        return d >= new Date(today.toDateString()) && d <= limit;
      }
      return d >= monthStart && d <= monthEnd;
    });
    return [...combined, ...fixed];
  }, [dbEvents, dbEventsNext, monthStart, monthEnd, isMobile]);

  const eventsForDay = (day: Date) =>
    allEvents.filter((e) => isSameDay(new Date(e.data_inicio), day));

  // ─── MOBILE: Compact horizontal strip ───
  if (isMobile) {
    const next7 = Array.from({ length: 7 }, (_, i) => addDays(today, i));
    const next14 = Array.from({ length: 14 }, (_, i) => addDays(today, i));
    const upcomingEvents: { day: Date; event: CalEvent }[] = [];
    next14.forEach((day) => {
      eventsForDay(day).forEach((ev) => upcomingEvents.push({ day, event: ev }));
    });

    const selected = selectedDay ?? today;
    const selectedEvents = eventsForDay(selected);

    return (
      <Card id="calendario-section" className="border-border/50">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-orange-400" />
            <CardTitle className="text-sm font-medium text-foreground">Calendário</CardTitle>
          </div>
          <span className="text-[10px] text-muted-foreground/50 uppercase tracking-wider">
            {format(today, "MMMM yyyy", { locale: ptBR }).replace(/^\w/, (c) => c.toUpperCase())}
          </span>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Horizontal 7-day strip */}
          <div className="grid grid-cols-7 gap-1">
            {next7.map((day) => {
              const isToday2 = isSameDay(day, today);
              const isSelected = isSameDay(day, selected);
              const dayEvents = eventsForDay(day);
              const hasEvents = dayEvents.length > 0;

              return (
                <button
                  key={day.toISOString()}
                  onClick={() => setSelectedDay(day)}
                  className={`flex flex-col items-center py-2 px-1 rounded-xl transition-all duration-150 ${
                    isSelected
                      ? "bg-orange-500 text-white shadow-lg shadow-orange-500/20"
                      : isToday2
                      ? "bg-orange-500/10 text-orange-400"
                      : "text-muted-foreground hover:bg-white/[0.04]"
                  }`}
                >
                  <span className={`text-[9px] uppercase tracking-wider font-medium ${
                    isSelected ? "text-white/80" : ""
                  }`}>
                    {format(day, "EEE", { locale: ptBR }).substring(0, 3)}
                  </span>
                  <span className={`text-lg font-bold leading-tight mt-0.5 ${
                    isSelected ? "text-white" : isToday2 ? "text-orange-400" : "text-foreground"
                  }`}>
                    {format(day, "dd")}
                  </span>
                  {hasEvents ? (
                    <div className="flex gap-0.5 mt-1">
                      {dayEvents.slice(0, 3).map((ev, i) => (
                        <span
                          key={i}
                          className="h-1.5 w-1.5 rounded-full"
                          style={{ backgroundColor: isSelected ? "#fff" : ev.cor }}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="h-1.5 mt-1" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Selected day events */}
          {selectedEvents.length > 0 && (
            <div className="space-y-2 pt-1 border-t border-border/20">
              <p className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-wider">
                {isSameDay(selected, today) ? "Hoje" : format(selected, "EEEE, dd 'de' MMM", { locale: ptBR })}
              </p>
              {selectedEvents.map((ev, i) => {
                const tc = getTextColor(ev.cor);
                return (
                  <div key={i} className="flex items-center gap-2.5 py-1">
                    <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: ev.cor }} />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-foreground truncate">{ev.titulo}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <Badge className="text-[8px] px-1.5 py-0 h-3.5" style={{ backgroundColor: ev.cor, color: tc }}>
                          {ev.area}
                        </Badge>
                        {ev.local && (
                          <span className="text-[10px] text-muted-foreground/60 truncate">{ev.local}</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Upcoming events (when selected day has none) */}
          {upcomingEvents.length > 0 && selectedEvents.length === 0 && (
            <div className="space-y-2 pt-1 border-t border-border/20">
              <p className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-wider">
                Próximos eventos
              </p>
              {upcomingEvents.slice(0, 4).map(({ day, event: ev }, i) => {
                const tc = getTextColor(ev.cor);
                return (
                  <div key={i} className="flex items-center gap-2.5 py-1">
                    <div className="text-center min-w-[28px]">
                      <div className="text-[9px] text-muted-foreground/40 uppercase">{format(day, "MMM", { locale: ptBR })}</div>
                      <div className="text-sm font-bold text-foreground">{format(day, "dd")}</div>
                    </div>
                    <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: ev.cor }} />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-foreground truncate">{ev.titulo}</p>
                      <Badge className="text-[8px] px-1.5 py-0 h-3.5 mt-0.5" style={{ backgroundColor: ev.cor, color: tc }}>
                        {ev.area}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {selectedEvents.length === 0 && upcomingEvents.length === 0 && (
            <div className="text-center py-3 border-t border-border/20">
              <p className="text-xs text-muted-foreground/40">Nenhum evento nos próximos dias</p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // ─── DESKTOP: Full month grid ───
  const calStart = startOfWeek(monthStart);
  const calEnd = endOfWeek(monthEnd);
  const days = eachDayOfInterval({ start: calStart, end: calEnd });

  return (
    <Card id="calendario-section" className="border-border/50">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-orange-400" />
          <CardTitle className="text-sm font-medium text-foreground">
            {format(currentMonth, "MMMM yyyy", { locale: ptBR }).replace(/^\w/, (c) => c.toUpperCase())}
          </CardTitle>
        </div>
        <div className="flex gap-0.5">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-white/5"
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-white/5"
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-px">
          {WEEKDAYS.map((d) => (
            <div key={d} className="text-center text-[10px] font-semibold text-muted-foreground/50 uppercase tracking-wider py-1.5">
              {d}
            </div>
          ))}
          {days.map((day) => {
            const inMonth = isSameMonth(day, currentMonth);
            const isToday2 = isSameDay(day, today);
            const dayEvents = eventsForDay(day);

            const cell = (
              <div
                className={`min-h-[48px] p-1 rounded-md text-center transition-all duration-150 ${
                  !inMonth ? "opacity-20" : ""
                } ${
                  isToday2
                    ? "bg-orange-500 text-white ring-1 ring-orange-400/50"
                    : "hover:bg-white/[0.04]"
                }`}
              >
                <span className={`text-xs ${isToday2 ? "font-bold text-white" : "text-muted-foreground"}`}>
                  {format(day, "d")}
                </span>
                {dayEvents.length > 0 && (
                  <div className="flex justify-center gap-0.5 mt-1 flex-wrap">
                    {dayEvents.slice(0, 3).map((ev, i) => (
                      <span key={i} className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: isToday2 ? "#fff" : ev.cor }} />
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
                <PopoverContent className="w-64 p-3 space-y-2 bg-card border-border/50" side="top">
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
