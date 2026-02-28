"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  Search, X, Home, Radio, Map, Users, Shield, QrCode, Wrench,
  Image as ImageIcon, Calendar, UserCheck, Settings, User,
  Building2, ArrowRight,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getPermissoesMenu, type PermissoesMenu } from "@/lib/permissoes";

/* ─── Types ─── */
interface SearchItem {
  id: string;
  type: "page" | "servidor" | "participante" | "area";
  label: string;
  sublabel?: string;
  icon: React.ReactNode;
  url: string;
}

interface Props {
  cargo: string | null;
  areaServico: string | null;
  podeAprovar?: boolean;
}

/* ─── Menu pages (same as sidebar) ─── */
const PAGE_ICON: Record<string, React.ElementType> = {
  inicio: Home, realtime: Radio, mapa: Map, participantes: Users,
  servidores: Shield, checkin: QrCode, equipamentos: Wrench,
  artes: ImageIcon, tops: Calendar, aprovacoes: UserCheck, config: Settings,
};

const ALL_PAGES: {
  id: string; title: string; url: string;
  menuKey: keyof PermissoesMenu;
}[] = [
  { id: "inicio",        title: "Início / Dashboard",  url: "/dashboard",     menuKey: "menu_mapa" },
  { id: "realtime",      title: "TOP Real Time",       url: "/top-real-time", menuKey: "menu_realtime" },
  { id: "mapa",          title: "Mapa da Trilha",      url: "/kmz",           menuKey: "menu_mapa" },
  { id: "participantes", title: "Participantes",       url: "/participantes", menuKey: "menu_participantes" },
  { id: "servidores",    title: "Servidores",          url: "/servidores",    menuKey: "menu_servidores" },
  { id: "checkin",       title: "Check-in",            url: "/check-in",      menuKey: "menu_checkin" },
  { id: "equipamentos",  title: "Equipamentos",        url: "/equipamentos",  menuKey: "menu_equipamentos" },
  { id: "artes",         title: "Artes & Docs",        url: "/artes-docs",    menuKey: "menu_artes" },
  { id: "tops",          title: "TOPs",                url: "/tops",          menuKey: "menu_tops" },
  { id: "aprovacoes",    title: "Aprovações",          url: "/aprovacoes",    menuKey: "menu_aprovacoes" },
  { id: "config",        title: "Configurações",       url: "/configuracoes", menuKey: "menu_config" },
];

/* ─── Debounce hook ─── */
function useDebounce(value: string, delay = 250) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

/* ─── Component ─── */
export default function CommandSearch({ cargo, areaServico, podeAprovar = false }: Props) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchItem[]>([]);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debouncedQuery = useDebounce(query);

  // Compute allowed pages
  const effectiveArea = cargo === "diretoria" ? "Diretoria" : (areaServico ?? null);
  const perms = getPermissoesMenu(effectiveArea);
  const allowedPages: SearchItem[] = ALL_PAGES
    .filter((p) => {
      if (p.id === "inicio") return true;
      if (p.id === "aprovacoes") return podeAprovar || perms.menu_aprovacoes;
      return perms[p.menuKey] === true;
    })
    .map((p) => {
      const Icon = PAGE_ICON[p.id] || Home;
      return {
        id: `page-${p.id}`,
        type: "page" as const,
        label: p.title,
        sublabel: "Página",
        icon: <Icon className="h-4 w-4 text-blue-500" />,
        url: p.url,
      };
    });

  // Keyboard shortcut: Ctrl+K / Cmd+K
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
      if (e.key === "Escape") {
        setOpen(false);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Focus input when dialog opens
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery("");
      setResults(allowedPages.slice(0, 6));
      setSelectedIdx(0);
    }
  }, [open]);

  // Search logic
  useEffect(() => {
    if (!open) return;
    const q = debouncedQuery.toLowerCase().trim();

    if (!q) {
      setResults(allowedPages.slice(0, 6));
      setSelectedIdx(0);
      return;
    }

    // Filter pages
    const pageResults = allowedPages.filter((p) =>
      p.label.toLowerCase().includes(q)
    );

    // Search Supabase for servidores + participantes + areas
    const searchDB = async () => {
      setLoading(true);
      const items: SearchItem[] = [...pageResults];

      try {
        // Servidores
        if (perms.menu_servidores || cargo === "diretoria") {
          const { data: servs } = await supabase
            .from("servidores")
            .select("id, nome_completo, area_servico, cargo")
            .ilike("nome_completo", `%${q}%`)
            .limit(5);

          if (servs) {
            items.push(
              ...servs.map((s) => ({
                id: `serv-${s.id}`,
                type: "servidor" as const,
                label: s.nome_completo,
                sublabel: `Servidor · ${s.area_servico || "Sem área"} · ${s.cargo || ""}`,
                icon: <Shield className="h-4 w-4 text-emerald-500" />,
                url: `/servidores?busca=${encodeURIComponent(s.nome_completo)}`,
              }))
            );
          }
        }

        // Participantes
        if (perms.menu_participantes || cargo === "diretoria") {
          const { data: parts } = await supabase
            .from("participantes")
            .select("id, nome_completo, familia, status")
            .ilike("nome_completo", `%${q}%`)
            .limit(5);

          if (parts) {
            items.push(
              ...parts.map((p) => ({
                id: `part-${p.id}`,
                type: "participante" as const,
                label: p.nome_completo,
                sublabel: `Participante · ${p.familia || "Sem família"} · ${p.status || ""}`,
                icon: <User className="h-4 w-4 text-amber-500" />,
                url: `/participantes?busca=${encodeURIComponent(p.nome_completo)}`,
              }))
            );
          }
        }

        // Áreas
        const { data: areas } = await supabase
          .from("areas")
          .select("id, nome, coordenador")
          .ilike("nome", `%${q}%`)
          .limit(5);

        if (areas) {
          items.push(
            ...areas.map((a) => ({
              id: `area-${a.id}`,
              type: "area" as const,
              label: a.nome,
              sublabel: `Área · Coord: ${a.coordenador || "—"}`,
              icon: <Building2 className="h-4 w-4 text-purple-500" />,
              url: `/dashboard`,
            }))
          );
        }
      } catch (err) {
        console.error("Search error:", err);
      }

      setResults(items);
      setSelectedIdx(0);
      setLoading(false);
    };

    searchDB();
  }, [debouncedQuery, open]);

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIdx((i) => Math.min(i + 1, results.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIdx((i) => Math.max(i - 1, 0));
      } else if (e.key === "Enter" && results[selectedIdx]) {
        e.preventDefault();
        selectItem(results[selectedIdx]);
      }
    },
    [results, selectedIdx]
  );

  function selectItem(item: SearchItem) {
    setOpen(false);
    navigate(item.url);
  }

  // Type badges
  const typeBadge: Record<string, { label: string; cls: string }> = {
    page: { label: "Página", cls: "bg-blue-500/10 text-blue-500" },
    servidor: { label: "Servidor", cls: "bg-emerald-500/10 text-emerald-500" },
    participante: { label: "Participante", cls: "bg-amber-500/10 text-amber-500" },
    area: { label: "Área", cls: "bg-purple-500/10 text-purple-500" },
  };

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-lg border border-border bg-muted/50 px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        title="Buscar (Ctrl+K)"
      >
        <Search className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Buscar...</span>
        <kbd className="hidden rounded border border-border bg-background px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground sm:inline">
          ⌘K
        </kbd>
      </button>

      {/* Overlay + Dialog */}
      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
            />

            {/* Search dialog */}
            <motion.div
              className="fixed left-1/2 top-[15%] z-50 w-[92vw] max-w-lg -translate-x-1/2"
              initial={{ opacity: 0, y: -20, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.96 }}
              transition={{ duration: 0.2 }}
            >
              <div className="overflow-hidden rounded-xl border border-border bg-background shadow-2xl">
                {/* Input */}
                <div className="flex items-center gap-3 border-b border-border px-4 py-3">
                  <Search className="h-5 w-5 text-muted-foreground shrink-0" />
                  <input
                    ref={inputRef}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Buscar páginas, servidores, participantes..."
                    className="flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
                  />
                  {query && (
                    <button onClick={() => setQuery("")} className="text-muted-foreground hover:text-foreground">
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>

                {/* Results */}
                <div className="max-h-[50vh] overflow-y-auto overscroll-contain p-1">
                  {loading && (
                    <div className="flex items-center justify-center py-6 text-xs text-muted-foreground">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent mr-2" />
                      Buscando...
                    </div>
                  )}

                  {!loading && results.length === 0 && query && (
                    <div className="py-8 text-center text-sm text-muted-foreground">
                      Nenhum resultado para "<span className="font-medium text-foreground">{query}</span>"
                    </div>
                  )}

                  {!loading &&
                    results.map((item, idx) => (
                      <button
                        key={item.id}
                        onClick={() => selectItem(item)}
                        onMouseEnter={() => setSelectedIdx(idx)}
                        className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors ${
                          idx === selectedIdx
                            ? "bg-muted"
                            : "hover:bg-muted/50"
                        }`}
                      >
                        <span className="shrink-0">{item.icon}</span>
                        <div className="flex-1 min-w-0">
                          <div className="truncate text-sm font-medium text-foreground">
                            {item.label}
                          </div>
                          {item.sublabel && (
                            <div className="truncate text-xs text-muted-foreground">
                              {item.sublabel}
                            </div>
                          )}
                        </div>
                        <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${typeBadge[item.type]?.cls}`}>
                          {typeBadge[item.type]?.label}
                        </span>
                        <ArrowRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      </button>
                    ))}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between border-t border-border px-4 py-2 text-[10px] text-muted-foreground">
                  <div className="flex items-center gap-3">
                    <span>↑↓ navegar</span>
                    <span>↵ selecionar</span>
                  </div>
                  <span>ESC fechar</span>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
