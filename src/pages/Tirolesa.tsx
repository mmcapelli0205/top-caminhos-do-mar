import { useState, useMemo, useEffect, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useParticipantes } from "@/hooks/useParticipantes";
import { useAuth } from "@/hooks/useAuth";
import {
  generateZiplinePairs,
  type ZiplinePair,
  type IneligibleEntry,
} from "@/lib/tiralesaAlgorithm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  CableCar,
  Users,
  UserX,
  AlertTriangle,
  Printer,
  RefreshCw,
  User,
  Settings,
  ChevronDown,
  ChevronUp,
  Plus,
  X,
  FlaskConical,
  CheckCircle2,
  FileText,
  Download,
} from "lucide-react";
import jsPDF from "jspdf";

type DuplaRow = {
  id: string;
  familia_id: number;
  participante_1_id: string;
  participante_2_id: string | null;
  peso_1: number;
  peso_2: number | null;
  peso_total: number;
  ordem: number;
  status: string;
  observacao: string | null;
  top_id: string | null;
  desceu: boolean;
  desceu_em: string | null;
  grupo_tipo: string | null;
};

const GRUPO_LABELS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

export default function Tirolesa() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { session } = useAuth();
  const { participantes, familias: allFamilias, isLoading: loadingParts } = useParticipantes();

  const [generating, setGenerating] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  // Agrupamento
  const [grupos, setGrupos] = useState<number[][]>([]);
  const [showGrupoConfig, setShowGrupoConfig] = useState(false);

  // Simulação
  const [modoAtivo, setModoAtivo] = useState<"none" | "simulacao" | "oficial">("none");
  const [simulacaoResult, setSimulacaoResult] = useState<ReturnType<typeof generateZiplinePairs> | null>(null);

  // Config / Termo
  const [showConfigTermo, setShowConfigTermo] = useState(false);
  const [textoTermo, setTextoTermo] = useState(
    `TERMO INFORMAÇÕES IMPORTANTES E CONHECIMENTO DE RISCOS E RESPONSABILIDADES - TIROLESA – VOO DA SERRA

Este Termo está em conformidade com a Política de Segurança da MSV AVENTURA LTDA – Tirolesa Voo da Serra e com a ABNT NBR ISO 21101 – Turismo de Aventura (Requisito 6.1.3).

LEIA ATENTAMENTE E REPASSE AS INFORMAÇÕES AOS ACOMPANHANTES:

ORIENTAÇÕES GERAIS
• Antes da atividade, todos os participantes receberão instruções técnicas e de segurança, que devem ser rigorosamente seguidas.
• A atividade ocorre exclusivamente em locais autorizados, com uso obrigatório dos equipamentos de proteção individual e coletivo.
• A MSV AVENTURA LTDA é responsável pela operação, contando com equipe treinada para gestão de riscos, auto resgate e primeiros socorros.
• Os condutores devem ser respeitados e suas orientações seguidas para a segurança de todos.

CIÊNCIA E RESPONSABILIDADES DO PARTICIPANTE
• Comprometo-me a seguir todas as orientações da equipe operacional.
• Estou ciente da disponibilização de seguro facultativo e equipamentos de proteção em condições adequadas de uso.
• Declaro que minhas informações de saúde e condições físicas são verdadeiras, responsabilizando-me por dados omitidos ou incorretos.
• Reconheço que a atividade pode ser adiada, alterada ou cancelada por motivos de segurança, sem direito a reembolso em caso de cancelamento ou desistência.
• Estou ciente dos riscos inerentes a prática da atividade em ambiente natural, tais como: quedas, escorregões, picadas de animais, insolação, hipotermia, intempéries climáticas, mal súbito, entre outros.
• Condições climáticas adversas podem ocasionar a suspensão ou encerramento imediato da atividade.
• O não cumprimento das orientações implica responsabilidade integral do participante por eventuais danos a si ou a terceiros.

CONDUTA E PREPARO
• Atividades de aventura envolvem riscos controlados e exigem disposição, atenção e espírito colaborativo.
• Utilizar roupas confortáveis e calçados fechados e adequados.
• Manter conduta respeitosa com a equipe e demais participantes.

MENORES DE IDADE
• Autorizo, quando aplicável, a descida dupla de menores, estando ciente das regras e procedimentos de segurança.
• Assumo total responsabilidade por condutas inadequadas do menor e por eventuais danos decorrentes.
• Menores que recusarem a descida serão conduzidos com segurança pela equipe até seus responsáveis.

COMUNICAÇÃO
• Qualquer situação não prevista neste Termo deverá ser comunicada imediatamente à equipe da Tirolesa – Voo da Serra.

CONDIÇÕES DA ATIVIDADE
• Atividade: Tirolesa Voo da Serra
• Peso Mínimo: 35 kg (voo exclusivo)
• Peso Máximo: 120 kg (individual) e 170 kg (duplo)
• Idade Mínima: a partir de 8 anos (voo exclusivo) a partir de 5 anos (voo duplo – acompanhado de um participante acima de 18 anos).
• Obrigatório: uso de calçado fechado
• Altura mínima: 1 metro

DECLARAÇÃO
Declaro que estou fisicamente e mentalmente apto, li e aceito todas as condições deste Termo, estando ciente dos riscos e responsabilidades inerentes à atividade. Reconheço que a MSV AVENTURA LTDA e seus colaboradores não se responsabilizam por eventos de caso fortuito, força maior ou pelo descumprimento das orientações de segurança.

Declaro ainda estar ciente e de acordo com o uso e armazenamento dos meus dados pessoais, conforme a LGPD (Lei nº 13.709/2018) e demais normas legais aplicáveis.`
  );
  const [savingTermo, setSavingTermo] = useState(false);

  // Briefing Prévio (local, sem persistência)
  const BRIEFING_ITEMS = [
    { id: "voo_ind", categoria: "INFORMAÇÕES SOBRE A ATIVIDADE", texto: "Informar sobre voo individual: a partir de 8 anos, peso mínimo 35kg, peso máximo 120kg" },
    { id: "voo_dup", categoria: "INFORMAÇÕES SOBRE A ATIVIDADE", texto: "Informar sobre voo duplo: a partir de 5 anos, acompanhado de maior de 18 anos, peso máximo combinado 170kg" },
    { id: "restrict", categoria: "RESTRIÇÕES DE SAÚDE", texto: "Verificar restrições: hipertensão, fobia de altura, problemas cardíacos, dificuldades respiratórias, desmaios/convulsões, efeito de álcool/entorpecentes, parte do corpo imobilizada, pós-operatório, suspeita de gestação/gestante" },
    { id: "roupas", categoria: "VESTIMENTA E EQUIPAMENTOS", texto: "Orientar sobre roupas confortáveis e calçados fechados (não é permitido sem blusa)" },
    { id: "balanca", categoria: "VESTIMENTA E EQUIPAMENTOS", texto: "Informar sobre pesagem obrigatória em balança antes da atividade (peso total incluindo mochilas, acessórios e vestimentas)" },
    { id: "termo", categoria: "TERMO DE RESPONSABILIDADE", texto: "Garantir que o participante faça o aceite e assine o Termo de forma digital" },
    { id: "proibidos", categoria: "PERTENCES NÃO PERMITIDOS NA DESCIDA", texto: "Orientar sobre itens proibidos: piercing no umbigo, brincos grandes, colares, pulseiras com pingentes, relógio, mochilas grandes, pochetes, bags, bolsas de lado, pertences nos bolsos (mesmo com zíper), celulares e câmeras sem suporte adequado" },
    { id: "sacolinha", categoria: "PERTENCES NÃO PERMITIDOS NA DESCIDA", texto: "Oferecer sacochila para itens pequenos (devolver na desequipagem)" },
    { id: "permitidos", categoria: "PERTENCES PERMITIDOS NA DESCIDA", texto: "Informar itens permitidos: mochilas pequenas, sacochilas, brincos pequenos, óculos de grau/sol (bem presos), celulares e câmeras com suporte adequado" },
  ];
  const [showBriefing, setShowBriefing] = useState(false);
  const [briefingChecked, setBriefingChecked] = useState<Set<string>>(new Set());

  // Match Manual de Solos
  const [showMatchManual, setShowMatchManual] = useState(false);
  const [matchSelecionado, setMatchSelecionado] = useState<string | null>(null);
  const [matchManualPairs, setMatchManualPairs] = useState<ZiplinePair[]>([]);
  const [confirmMatchPair, setConfirmMatchPair] = useState<{ p1: typeof participantes[0]; p2: typeof participantes[0] } | null>(null);
  const [savingMatchPair, setSavingMatchPair] = useState(false);

  // Derivar topId dos participantes
  const topId = useMemo(() => {
    if (participantes.length > 0 && participantes[0].top_id) return participantes[0].top_id;
    return null;
  }, [participantes]);

  // CORREÇÃO: Filtrar famílias pelo conjunto de familia_id nos participantes ativos
  // (evita mostrar famílias de outros TOPs mesmo quando familia_top_id é NULL)
  const familias = useMemo(() => {
    const familiasComParticipantes = new Set(
      participantes.map((p) => p.familia_id).filter(Boolean)
    );
    return allFamilias.filter((f) => familiasComParticipantes.has(f.id));
  }, [allFamilias, participantes]);

  // --- Queries ---
  const duplasQuery = useQuery({
    queryKey: ["tirolesa_duplas", topId],
    enabled: topId != null,
    queryFn: async () => {
      if (!topId) return [] as DuplaRow[];
      const { data, error } = await (supabase.from("tirolesa_duplas" as any) as any)
        .select("*")
        .eq("top_id", topId);
      if (error) throw error;
      return (data ?? []) as unknown as DuplaRow[];
    },
  });

  const termosQuery = useQuery({
    queryKey: ["tirolesa_termo_aceite", topId],
    queryFn: async () => {
      let q = (supabase.from("tirolesa_termo_aceite" as any) as any).select("*");
      if (topId) q = q.eq("top_id", topId);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as any[];
    },
  });

  const configQuery = useQuery({
    queryKey: ["tirolesa_config", topId],
    queryFn: async () => {
      let q = (supabase.from("tirolesa_config" as any) as any).select("*");
      if (topId) q = q.eq("top_id", topId);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as any[];
    },
  });

  // Carregar config salva
  useEffect(() => {
    const rows = configQuery.data ?? [];
    if (rows.length > 0) {
      const cfg = rows[0];
      if (cfg.texto_termo) setTextoTermo(cfg.texto_termo);
      if (cfg.grupos && Array.isArray(cfg.grupos) && cfg.grupos.length > 0) {
        setGrupos(cfg.grupos as number[][]);
      }
    }
  }, [configQuery.data]);

  const duplas = duplasQuery.data ?? [];
  const termos = termosQuery.data ?? [];

  const termosAceitosSet = useMemo(() => {
    const s = new Set<string>();
    termos.filter((t) => t.status === "aceito").forEach((t) => s.add(t.participante_id));
    return s;
  }, [termos]);

  // Mapa de participantes e famílias
  const partMap = useMemo(() => {
    const m = new Map<string, typeof participantes[0]>();
    participantes.forEach((p) => m.set(p.id, p));
    return m;
  }, [participantes]);

  const familiaMap = useMemo(() => {
    const m = new Map<number, typeof familias[0]>();
    familias.forEach((f) => m.set(f.id, f));
    return m;
  }, [familias]);

  // Famílias já em algum grupo
  const familiasEmGrupos = useMemo(() => {
    const s = new Set<number>();
    grupos.forEach((g) => g.forEach((fid) => s.add(fid)));
    return s;
  }, [grupos]);

  // Algoritmo para stats (simulação completa, sem termo)
  const algoStatsResult = useMemo(() => {
    if (familias.length === 0 || participantes.length === 0) return null;
    return generateZiplinePairs(familias, participantes, grupos, "simulacao", new Set());
  }, [familias, participantes, grupos]);

  // Stats de termos
  const totalAptoPeso = useMemo(
    () => participantes.filter((p) => p.peso != null && p.peso > 0 && p.peso <= 120).length,
    [participantes]
  );
  const totalTermoAceito = termos.filter((t) => t.status === "aceito").length;
  const totalTermoRecusado = termos.filter((t) => t.status === "recusado").length;
  const totalTermoPendente = totalAptoPeso - totalTermoAceito - totalTermoRecusado;

  // Stats de duplas (depende do modo)
  const activePairs: ZiplinePair[] =
    modoAtivo === "simulacao" && simulacaoResult
      ? simulacaoResult.pairs
      : [];

  // solosAtivos: solos disponíveis para match manual (exclui já emparelhados manualmente)
  const solosAtivos = useMemo(() => {
    const manualUsed = new Set<string>(
      matchManualPairs.flatMap((p) =>
        [p.participante1.id, p.participante2?.id].filter(Boolean) as string[]
      )
    );
    if (modoAtivo === "simulacao" && simulacaoResult) {
      return simulacaoResult.pairs
        .filter((p) => !p.participante2 && !manualUsed.has(p.participante1.id))
        .map((p) => p.participante1)
        .sort((a, b) => (a.peso ?? 0) - (b.peso ?? 0));
    }
    if (modoAtivo === "oficial") {
      return duplas
        .filter((d) => !d.participante_2_id && d.grupo_tipo !== "manual")
        .map((d) => partMap.get(d.participante_1_id))
        .filter(Boolean)
        .sort((a, b) => (a!.peso ?? 0) - (b!.peso ?? 0)) as typeof participantes;
    }
    return [];
  }, [modoAtivo, simulacaoResult, duplas, partMap, matchManualPairs]);

  // totalSolo: solos restantes sem dupla (exclui emparelhados manualmente na simulação)
  const totalSolo = modoAtivo === "simulacao"
    ? solosAtivos.length
    : duplas.filter((d) => !d.participante_2_id && d.grupo_tipo !== "manual").length;

  // totalDuplas: inclui duplas manuais
  const totalDuplas = modoAtivo === "simulacao"
    ? activePairs.filter((p) => p.participante2).length + matchManualPairs.filter((p) => p.participante2).length
    : duplas.filter((d) => d.participante_2_id).length;

  const totalInaptos = algoStatsResult?.ineligible.length ?? 0;

  const totalDesceu = duplas.filter((d) => d.desceu && d.participante_2_id).length;
  const totalDuplasOficiais = duplas.filter((d) => d.participante_2_id).length;

  const pesoMedioSource = modoAtivo === "simulacao"
    ? activePairs.filter((p) => p.participante2)
    : duplas.filter((d) => d.participante_2_id);

  const pesoMedio = pesoMedioSource.length > 0
    ? (modoAtivo === "simulacao"
        ? (pesoMedioSource as ZiplinePair[]).reduce((s, p) => s + p.pesoTotal, 0)
        : (pesoMedioSource as DuplaRow[]).reduce((s, d) => s + d.peso_total, 0)
      ) / pesoMedioSource.length
    : 0;

  // Verificar se há combinações possíveis (≤170kg) entre solos restantes
  const temCombinacoesPossiveis = useMemo(() => {
    const solos = solosAtivos;
    for (let i = 0; i < solos.length; i++) {
      for (let j = i + 1; j < solos.length; j++) {
        if ((solos[i].peso ?? 0) + (solos[j].peso ?? 0) <= 170) return true;
      }
    }
    return false;
  }, [solosAtivos]);

  // --- Agrupamento helpers ---
  const saveGrupos = useCallback(async (newGrupos: number[][]): Promise<boolean> => {
    const rows = configQuery.data ?? [];
    try {
      if (rows.length > 0) {
        const { error } = await (supabase.from("tirolesa_config" as any) as any)
          .update({ grupos: newGrupos, updated_at: new Date().toISOString() })
          .eq("id", rows[0].id);
        if (error) throw error;
      } else {
        const { error } = await (supabase.from("tirolesa_config" as any) as any).insert({
          top_id: topId,
          grupos: newGrupos,
          texto_termo: textoTermo,
        });
        if (error) throw error;
      }
      queryClient.invalidateQueries({ queryKey: ["tirolesa_config"] });
      return true;
    } catch (e: any) {
      toast({ title: e.message || "Erro ao salvar agrupamento", variant: "destructive" });
      return false;
    }
  }, [configQuery.data, topId, textoTermo, queryClient, toast]);

  const handleTodasJuntas = async () => {
    const g = [familias.map((f) => f.id)];
    setGrupos(g);
    const ok = await saveGrupos(g);
    if (ok) toast({ title: "Todas as famílias agrupadas!" });
  };

  const handleResetarGrupos = async () => {
    const prevGrupos = grupos;
    setGrupos([]);
    setSimulacaoResult(null);
    setMatchManualPairs([]);
    setModoAtivo("none");
    const ok = await saveGrupos([]);
    if (ok) {
      toast({ title: "Agrupamento resetado" });
    } else {
      // Revert local state on DB failure
      setGrupos(prevGrupos);
    }
  };

  const handleAddGrupo = async () => {
    const g = [...grupos, []];
    setGrupos(g);
    await saveGrupos(g);
  };

  const handleRemoveGrupo = async (idx: number) => {
    const prevGrupos = grupos;
    const g = grupos.filter((_, i) => i !== idx);
    setGrupos(g);
    // Clear simulation when group structure changes
    setSimulacaoResult(null);
    setMatchManualPairs([]);
    if (modoAtivo === "simulacao") setModoAtivo("none");
    const ok = await saveGrupos(g);
    if (!ok) {
      // Revert local state on DB failure
      setGrupos(prevGrupos);
    }
  };

  const handleToggleFamiliaNoGrupo = async (grupoIdx: number, familiaId: number) => {
    const g = grupos.map((grupo, i) => {
      if (i !== grupoIdx) return grupo;
      if (grupo.includes(familiaId)) return grupo.filter((id) => id !== familiaId);
      return [...grupo, familiaId];
    });
    setGrupos(g);
    await saveGrupos(g);
  };

  // --- Match Manual handlers ---
  const handleMatchClick = (participante: typeof participantes[0]) => {
    if (matchSelecionado === participante.id) {
      setMatchSelecionado(null);
      return;
    }
    if (matchSelecionado) {
      const p1 = solosAtivos.find((s) => s.id === matchSelecionado)!;
      const pesoTotal = (p1.peso ?? 0) + (participante.peso ?? 0);
      if (pesoTotal <= 170) {
        setConfirmMatchPair({ p1, p2: participante });
      }
      return;
    }
    setMatchSelecionado(participante.id);
  };

  const handleConfirmarMatchPair = async () => {
    if (!confirmMatchPair) return;
    const { p1, p2 } = confirmMatchPair;

    if (modoAtivo === "simulacao") {
      const novaPair: ZiplinePair = {
        grupoIdx: 9999,
        familiaId: p1.familia_id ?? 0,
        participante1: p1,
        participante2: p2,
        peso1: p1.peso ?? 0,
        peso2: p2.peso ?? 0,
        pesoTotal: (p1.peso ?? 0) + (p2.peso ?? 0),
        ordem: matchManualPairs.length + 1,
      };
      setMatchManualPairs((prev) => [...prev, novaPair]);
      toast({ title: "Dupla formada!" });
    } else {
      setSavingMatchPair(true);
      try {
        const { error } = await (supabase.from("tirolesa_duplas" as any) as any).insert({
          familia_id: p1.familia_id ?? null,
          participante_1_id: p1.id,
          participante_2_id: p2.id,
          peso_1: p1.peso ?? 0,
          peso_2: p2.peso ?? 0,
          peso_total: (p1.peso ?? 0) + (p2.peso ?? 0),
          ordem: duplas.length + 1,
          status: "aguardando",
          observacao: null,
          top_id: topId,
          desceu: false,
          desceu_em: null,
          grupo_tipo: "manual",
        });
        if (error) throw error;
        queryClient.invalidateQueries({ queryKey: ["tirolesa_duplas"] });
        toast({ title: "Dupla salva!" });
      } catch (e: any) {
        toast({ title: e.message || "Erro ao salvar dupla", variant: "destructive" });
      } finally {
        setSavingMatchPair(false);
      }
    }
    setConfirmMatchPair(null);
    setMatchSelecionado(null);
  };

  // --- Geração ---
  const handleSimular = () => {
    setMatchManualPairs([]);
    setMatchSelecionado(null);
    const result = generateZiplinePairs(
      familias,
      participantes,
      grupos,
      "simulacao",
      new Set()
    );
    setSimulacaoResult(result);
    setModoAtivo("simulacao");
    toast({ title: `Simulação: ${result.pairs.length} duplas/solos formados` });
  };

  const handleGerarOficial = async () => {
    if (duplas.length > 0) {
      setConfirmOpen(true);
      return;
    }
    await doGenerate();
  };

  const doGenerate = async () => {
    setConfirmOpen(false);
    setGenerating(true);
    try {
      const result = generateZiplinePairs(
        familias,
        participantes,
        grupos,
        "oficial",
        termosAceitosSet
      );

      if (topId) {
        await (supabase.from("tirolesa_duplas" as any) as any).delete().eq("top_id", topId);
      }

      if (result.pairs.length > 0) {
        const rows = result.pairs.map((p) => ({
          familia_id: p.familiaId,
          participante_1_id: p.participante1.id,
          participante_2_id: p.participante2?.id ?? null,
          peso_1: p.peso1,
          peso_2: p.peso2,
          peso_total: p.pesoTotal,
          ordem: p.ordem,
          status: "aguardando",
          observacao: p.participante2 ? null : "Solo",
          top_id: topId,
          desceu: false,
          desceu_em: null,
          grupo_tipo: "auto",
        }));
        const { error } = await (supabase.from("tirolesa_duplas" as any) as any).insert(rows);
        if (error) throw error;
      }

      setSimulacaoResult(null);
      setModoAtivo("oficial");
      toast({ title: `✅ ${result.pairs.length} duplas oficiais geradas!` });
      queryClient.invalidateQueries({ queryKey: ["tirolesa_duplas"] });
    } catch (e: any) {
      toast({ title: e.message || "Erro ao gerar duplas", variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  };

  const handleToggleDesceu = async (duplaId: string, checked: boolean) => {
    const { error } = await (supabase.from("tirolesa_duplas" as any) as any)
      .update({
        desceu: checked,
        desceu_em: checked ? new Date().toISOString() : null,
      })
      .eq("id", duplaId);
    if (error) {
      toast({ title: "Erro ao atualizar", variant: "destructive" });
    } else {
      queryClient.invalidateQueries({ queryKey: ["tirolesa_duplas"] });
    }
  };

  const handleSaveTermo = async () => {
    setSavingTermo(true);
    try {
      const rows = configQuery.data ?? [];
      if (rows.length > 0) {
        await (supabase.from("tirolesa_config" as any) as any)
          .update({ texto_termo: textoTermo, updated_at: new Date().toISOString() })
          .eq("id", rows[0].id);
      } else {
        await (supabase.from("tirolesa_config" as any) as any).insert({
          top_id: topId,
          texto_termo: textoTermo,
          grupos: grupos,
        });
      }
      queryClient.invalidateQueries({ queryKey: ["tirolesa_config"] });
      toast({ title: "Texto do termo salvo!" });
      setShowConfigTermo(false);
    } catch (e: any) {
      toast({ title: "Erro ao salvar termo", variant: "destructive" });
    } finally {
      setSavingTermo(false);
    }
  };

  const handlePrintPDF = () => {
    const doc = new jsPDF();
    let y = 20;
    doc.setFontSize(16);
    const modeLabel = modoAtivo === "simulacao" ? " [SIMULAÇÃO]" : " [OFICIAL]";
    doc.text(`Tirolesa - Lista de Duplas${modeLabel}`, 14, y);
    y += 12;

    const sortedFamilias = [...familias].sort((a, b) => a.numero - b.numero);

    if (modoAtivo === "simulacao" && simulacaoResult) {
      const gruposEfetivos = simulacaoResult.grupos;
      gruposEfetivos.forEach((grupoFamIds, grupoIdx) => {
        const grupoPairs = simulacaoResult.pairs.filter((p) => p.grupoIdx === grupoIdx);
        if (grupoPairs.length === 0) return;
        if (y > 260) { doc.addPage(); y = 20; }
        doc.setFontSize(13);
        const famNames = grupoFamIds.map((fid) => `Família ${familiaMap.get(fid)?.numero ?? fid}`).join(" + ");
        doc.text(`GRUPO ${GRUPO_LABELS[grupoIdx]} — ${famNames}`, 14, y);
        y += 8;
        doc.setFontSize(10);
        grupoPairs.forEach((p) => {
          if (y > 275) { doc.addPage(); y = 20; }
          const p1 = p.participante1;
          const p2 = p.participante2;
          const fam1Label = `Fam.${familiaMap.get(p1.familia_id ?? 0)?.numero ?? "?"}`;
          if (p2) {
            const fam2Label = `Fam.${familiaMap.get(p2.familia_id ?? 0)?.numero ?? "?"}`;
            doc.text(`Dupla ${p.ordem}: ${p1.nome} (${fam1Label}, ${p.peso1}kg) + ${p2.nome} (${fam2Label}, ${p.peso2}kg) = ${p.pesoTotal}kg`, 18, y);
          } else {
            doc.text(`Solo ${p.ordem}: ${p1.nome} (${fam1Label}, ${p.peso1}kg)`, 18, y);
          }
          y += 6;
        });
        y += 4;
      });
    } else {
      for (const fam of sortedFamilias) {
        const famDuplas = duplas.filter((d) => d.familia_id === fam.id);
        if (!famDuplas.length) continue;
        if (y > 260) { doc.addPage(); y = 20; }
        doc.setFontSize(13);
        doc.text(`Família ${fam.numero}${fam.nome ? ` - ${fam.nome}` : ""}`, 14, y);
        y += 8;
        doc.setFontSize(10);
        for (const d of famDuplas) {
          if (y > 275) { doc.addPage(); y = 20; }
          const p1 = partMap.get(d.participante_1_id);
          const p2 = d.participante_2_id ? partMap.get(d.participante_2_id) : null;
          if (p2) {
            doc.text(`Dupla ${d.ordem}: ${p1?.nome ?? "?"} (${d.peso_1}kg) + ${p2?.nome ?? "?"} (${d.peso_2}kg) = ${d.peso_total}kg`, 18, y);
          } else {
            doc.text(`Solo ${d.ordem}: ${p1?.nome ?? "?"} (${d.peso_1}kg)`, 18, y);
          }
          y += 6;
        }
        y += 4;
      }
    }

    doc.save("tirolesa-duplas.pdf");
  };

  const isLoading = loadingParts || duplasQuery.isLoading;

  // TODO: Substituir exportação CSV por webhook quando API da MSV Aventura estiver disponível
  const getTermosAceitosData = async () => {
    const { data: termoRows } = await (supabase.from("tirolesa_termo_aceite" as any) as any)
      .select("*")
      .eq("status", "aceito")
      .eq("top_id", topId);

    if (!termoRows || termoRows.length === 0) return [];

    const { data: partsData } = await supabase
      .from("participantes")
      .select("id, nome, cpf, telefone, email, peso, altura, data_nascimento")
      .in("id", termoRows.map((t: any) => t.participante_id));

    const partByIdMap = new Map((partsData ?? []).map((p: any) => [p.id, p]));

    return termoRows.map((t: any) => {
      const p = partByIdMap.get(t.participante_id) ?? {};
      return {
        nome: (p as any).nome ?? "",
        cpf: (p as any).cpf ?? "",
        telefone: (p as any).telefone ?? "",
        email: (p as any).email ?? "",
        peso_kg: (p as any).peso ?? "",
        altura_m: (p as any).altura ?? "",
        data_nascimento: (p as any).data_nascimento ?? "",
        status_termo: t.status,
        data_aceite: t.aceito_em ? new Date(t.aceito_em).toLocaleString("pt-BR") : "",
        servidor: t.registrado_por_nome ?? "",
        assinatura_base64: t.assinatura_base64 ?? "",
      };
    });
  };

  const handleExportarCSV = async () => {
    if (!topId) return;
    try {
      const rows = await getTermosAceitosData();
      if (rows.length === 0) {
        toast({ title: "Nenhum termo aceito para exportar" });
        return;
      }
      const headers = ["Nome Completo", "CPF", "Telefone", "E-mail", "Peso (kg)", "Altura (m)", "Data Nascimento", "Status Termo", "Data/Hora Aceite", "Servidor que Registrou", "Assinatura (base64)"];
      const csvContent = [
        headers.join(";"),
        ...rows.map((r) => Object.values(r).map((v) => `"${String(v).replace(/"/g, '""')}"`).join(";")),
      ].join("\n");

      const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      const datePart = new Date().toISOString().split("T")[0];
      link.href = url;
      link.setAttribute("download", `termos_tirolesa_TOP1575_${datePart}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast({ title: `✅ CSV exportado com ${rows.length} termos aceitos!` });
    } catch (e: any) {
      toast({ title: "Erro ao exportar CSV", variant: "destructive" });
    }
  };

  // Grupos efetivos para exibição
  const gruposEfetivosDisplay = useMemo(() => {
    if (modoAtivo === "simulacao" && simulacaoResult) {
      return simulacaoResult.grupos;
    }
    if (grupos.length === 0) {
      return familias.map((f) => [f.id]);
    }
    const familiasUsadas = new Set<number>();
    const g = grupos
      .map((gr) => {
        const unicas = gr.filter((fid) => !familiasUsadas.has(fid));
        unicas.forEach((fid) => familiasUsadas.add(fid));
        return unicas;
      })
      .filter((gr) => gr.length > 0);
    familias.forEach((f) => { if (!familiasUsadas.has(f.id)) g.push([f.id]); });
    return g;
  }, [modoAtivo, simulacaoResult, grupos, familias]);

  // Agrupar duplas oficiais por grupo (excluindo manuais — ficam no GRUPO SOLO)
  const duplasPorGrupo = useMemo(() => {
    if (modoAtivo !== "oficial") return new Map<number, DuplaRow[]>();
    const map = new Map<number, DuplaRow[]>();
    gruposEfetivosDisplay.forEach((grupoFamIds, idx) => {
      const famIdsSet = new Set(grupoFamIds);
      const d = duplas.filter((du) => famIdsSet.has(du.familia_id) && du.grupo_tipo !== "manual");
      if (d.length > 0) map.set(idx, d.sort((a, b) => a.ordem - b.ordem));
    });
    return map;
  }, [modoAtivo, duplas, gruposEfetivosDisplay]);

  // Ineligíveis por família
  const ineligibleByFamilia = useMemo(() => {
    const map = new Map<number, IneligibleEntry[]>();
    algoStatsResult?.ineligible.forEach((e) => {
      const arr = map.get(e.familiaId) ?? [];
      arr.push(e);
      map.set(e.familiaId, arr);
    });
    return map;
  }, [algoStatsResult]);

  const showDuplaDesceuCard = modoAtivo === "oficial" && duplas.length > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <CableCar className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">Tirolesa</h1>
          {modoAtivo === "simulacao" && (
            <Badge className="bg-blue-600 text-white text-xs">SIMULAÇÃO</Badge>
          )}
          {modoAtivo === "oficial" && (
            <Badge className="bg-orange-600 text-white text-xs">OFICIAL</Badge>
          )}
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportarCSV}
            disabled={!topId}
          >
            <Download className="h-4 w-4 mr-1" /> Exportar Termos (CSV)
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowConfigTermo(true)}
          >
            <Settings className="h-4 w-4 mr-1" /> Config. Termo
          </Button>
          <Button
            variant="outline"
            onClick={handlePrintPDF}
            disabled={modoAtivo === "none" || (modoAtivo === "oficial" && duplas.length === 0)}
          >
            <Printer className="h-4 w-4 mr-1" /> Imprimir
          </Button>
          <Button
            className="bg-blue-600 hover:bg-blue-700 text-white border-blue-600"
            onClick={handleSimular}
            disabled={isLoading || generating}
          >
            <FlaskConical className="h-4 w-4 mr-1" /> Simular Duplas
          </Button>
          <Button
            onClick={handleGerarOficial}
            disabled={generating || isLoading}
            className="bg-orange-600 hover:bg-orange-700 text-white"
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${generating ? "animate-spin" : ""}`} />
            {generating ? "Gerando..." : "Gerar Oficial"}
          </Button>
        </div>
      </div>

      {/* Summary Cards — 8 cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Card 1 — Aptos (Peso) / Termo Aceito */}
        <Card>
          <CardHeader className="pb-1 p-3">
            <CardTitle className="text-xs font-medium text-muted-foreground">Aptos (Peso) / Termo</CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <div className="text-2xl font-bold">
              <span className="text-green-600">{totalAptoPeso}</span>
              <span className="text-sm text-muted-foreground"> / {totalTermoAceito}</span>
            </div>
          </CardContent>
        </Card>

        {/* Card 2 — Descida Individual (clicável, abre match manual) */}
        <Card
          className={`transition-colors ${modoAtivo !== "none" ? "cursor-pointer hover:border-primary" : "opacity-50 pointer-events-none"}`}
          onClick={() => modoAtivo !== "none" && setShowMatchManual(true)}
        >
          <CardHeader className="pb-1 p-3">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              <User className="h-3 w-3" /> Descida Individual
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <div className="text-2xl font-bold text-orange-600">{totalSolo}</div>
            <div className="text-xs text-muted-foreground">solos</div>
          </CardContent>
        </Card>

        {/* Card 3 — Termo Pendente */}
        <Card>
          <CardHeader className="pb-1 p-3">
            <CardTitle className="text-xs font-medium text-muted-foreground">Termo Pendente</CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <div className="text-2xl font-bold text-yellow-600">{Math.max(0, totalTermoPendente)}</div>
          </CardContent>
        </Card>

        {/* Card 4 — Termo Recusado */}
        <Card>
          <CardHeader className="pb-1 p-3">
            <CardTitle className="text-xs font-medium text-muted-foreground">Termo Recusado</CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <div className="text-2xl font-bold text-destructive">{totalTermoRecusado}</div>
          </CardContent>
        </Card>

        {/* Card 5 — Total Duplas */}
        <Card>
          <CardHeader className="pb-1 p-3">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Total Duplas {modoAtivo !== "none" ? `(${modoAtivo === "simulacao" ? "Sim." : "Oficial"})` : ""}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <div className="text-2xl font-bold">{totalDuplas}</div>
          </CardContent>
        </Card>

        {/* Card 6 — Inaptos */}
        <Card>
          <CardHeader className="pb-1 p-3">
            <CardTitle className="text-xs font-medium text-muted-foreground">Inaptos (&gt;120kg)</CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <div className="text-2xl font-bold text-destructive">{totalInaptos}</div>
          </CardContent>
        </Card>

        {/* Card 7 — Peso Médio Dupla */}
        <Card>
          <CardHeader className="pb-1 p-3">
            <CardTitle className="text-xs font-medium text-muted-foreground">Peso Médio Dupla</CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <div className="text-2xl font-bold">{pesoMedio > 0 ? `${pesoMedio.toFixed(1)}kg` : "—"}</div>
          </CardContent>
        </Card>

        {/* Card 8 — Duplas Desceram */}
        <Card>
          <CardHeader className="pb-1 p-3">
            <CardTitle className="text-xs font-medium text-muted-foreground">Duplas Desceram</CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            {showDuplaDesceuCard ? (
              <div className="text-2xl font-bold text-green-600">
                {totalDesceu} <span className="text-sm text-muted-foreground">/ {totalDuplasOficiais}</span>
              </div>
            ) : (
              <div className="text-2xl font-bold text-muted-foreground">—</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Configuração de Agrupamento */}
      {/* Briefing Prévio */}
      <Card>
        <CardHeader className="p-4 pb-2">
          <button
            className="flex items-center justify-between w-full text-left"
            onClick={() => setShowBriefing((v) => !v)}
          >
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <FileText className="h-4 w-4" /> Briefing Prévio
              {briefingChecked.size === BRIEFING_ITEMS.length && (
                <Badge className="text-xs bg-green-500/20 text-green-700 border-green-300">✅ Briefing Completo</Badge>
              )}
              <span className="text-xs font-normal text-muted-foreground">
                ({briefingChecked.size}/{BRIEFING_ITEMS.length} itens)
              </span>
            </CardTitle>
            {showBriefing ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </CardHeader>
        {showBriefing && (
          <CardContent className="p-4 pt-0 space-y-4">
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => setBriefingChecked(new Set(BRIEFING_ITEMS.map(i => i.id)))}>
                Marcar todos
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setBriefingChecked(new Set())}>
                Limpar
              </Button>
            </div>
            {Array.from(new Set(BRIEFING_ITEMS.map(i => i.categoria))).map(cat => (
              <div key={cat} className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{cat}</p>
                {BRIEFING_ITEMS.filter(i => i.categoria === cat).map(item => (
                  <div key={item.id} className="flex items-start gap-3 p-3 border rounded-lg">
                    <Checkbox
                      id={`briefing-${item.id}`}
                      checked={briefingChecked.has(item.id)}
                      onCheckedChange={(v) => {
                        setBriefingChecked(prev => {
                          const next = new Set(prev);
                          if (v) next.add(item.id); else next.delete(item.id);
                          return next;
                        });
                      }}
                      className="mt-0.5 shrink-0"
                    />
                    <label htmlFor={`briefing-${item.id}`} className={`text-sm cursor-pointer leading-snug ${briefingChecked.has(item.id) ? "line-through text-muted-foreground" : ""}`}>
                      {item.texto}
                    </label>
                  </div>
                ))}
              </div>
            ))}
          </CardContent>
        )}
      </Card>

      {/* Configuração de Agrupamento */}
      <Card>
        <CardHeader className="p-4 pb-2">
          <button
            className="flex items-center justify-between w-full text-left"
            onClick={() => setShowGrupoConfig((v) => !v)}
          >
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Users className="h-4 w-4" /> Configurar Agrupamento de Famílias
              {familias.length > 0 && (
                <span className="text-xs font-normal text-muted-foreground">
                  ({familias.length} famílias disponíveis)
                </span>
              )}
            </CardTitle>
            {showGrupoConfig ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </CardHeader>
        {showGrupoConfig && (
          <CardContent className="p-4 pt-0 space-y-3">
            <div className="flex gap-2 flex-wrap">
              <Button size="sm" variant="outline" onClick={handleTodasJuntas}>
                <CheckCircle2 className="h-3 w-3 mr-1" /> Todas as Famílias Juntas
              </Button>
              <Button size="sm" variant="outline" onClick={handleResetarGrupos}>
                <X className="h-3 w-3 mr-1" /> Resetar (individual por família)
              </Button>
              <Button size="sm" variant="outline" onClick={handleAddGrupo}>
                <Plus className="h-3 w-3 mr-1" /> Novo Grupo
              </Button>
            </div>

            {grupos.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Sem agrupamento configurado — duplas formadas dentro de cada família individualmente.
              </p>
            ) : (
              <div className="space-y-3">
                {grupos.map((grupo, gi) => (
                  <div key={gi} className="border rounded-lg p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-primary">
                        GRUPO {GRUPO_LABELS[gi]}
                      </span>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 px-2 text-destructive hover:text-destructive"
                        onClick={() => handleRemoveGrupo(gi)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {grupo.map((fid) => {
                        const fam = familiaMap.get(fid);
                        return (
                          <Badge
                            key={fid}
                            className="cursor-pointer bg-primary/20 text-primary border-primary/30 hover:bg-destructive/20 hover:text-destructive"
                            onClick={() => handleToggleFamiliaNoGrupo(gi, fid)}
                          >
                            Fam. {fam?.numero ?? fid} ×
                          </Badge>
                        );
                      })}
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {familias
                        .sort((a, b) => a.numero - b.numero)
                        .map((fam) => {
                          const inThisGroup = grupo.includes(fam.id);
                          const inOtherGroup = !inThisGroup && familiasEmGrupos.has(fam.id);
                          return (
                            <button
                              key={fam.id}
                              disabled={inOtherGroup}
                              onClick={() => !inOtherGroup && handleToggleFamiliaNoGrupo(gi, fam.id)}
                              className={`text-xs px-2 py-1 rounded border transition-colors ${
                                inThisGroup
                                  ? "bg-primary text-primary-foreground border-primary"
                                  : inOtherGroup
                                  ? "opacity-30 cursor-not-allowed bg-muted text-muted-foreground border-muted"
                                  : "bg-background text-foreground border-border hover:bg-accent"
                              }`}
                            >
                              Fam. {fam.numero}{fam.nome ? ` (${fam.nome})` : ""}
                            </button>
                          );
                        })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        )}
      </Card>

      {/* Lista de duplas */}
      {isLoading ? (
        <p className="text-muted-foreground">Carregando...</p>
      ) : modoAtivo === "none" && duplas.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            <CableCar className="h-12 w-12 mx-auto mb-4 opacity-30" />
            <p>Nenhuma dupla gerada ainda.</p>
            <p className="text-sm">Use "Simular Duplas" para planejar ou "Gerar Oficial" para o dia do evento.</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Banner de modo */}
          {modoAtivo === "simulacao" && (
            <div className="border-2 border-blue-500 bg-blue-500/10 rounded-lg p-3 flex items-center gap-2">
              <FlaskConical className="h-4 w-4 text-blue-500" />
              <span className="text-sm text-blue-600 font-medium">
                SIMULAÇÃO — Resultado não salvo. Todos os participantes aptos por peso (termo ignorado).
              </span>
            </div>
          )}
          {modoAtivo === "oficial" && (
            <div className="border-2 border-orange-500 bg-orange-500/10 rounded-lg p-3 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-orange-500" />
              <span className="text-sm text-orange-600 font-medium">
                OFICIAL — Duplas salvas. Apenas participantes com termo aceito.
              </span>
            </div>
          )}

          <Accordion type="multiple" className="space-y-2">
            {gruposEfetivosDisplay.map((grupoFamIds, gi) => {
              const grupoPairsSimu = modoAtivo === "simulacao" && simulacaoResult
                ? simulacaoResult.pairs.filter((p) => p.grupoIdx === gi)
                : [];
              const grupoDuplasOfic = modoAtivo === "oficial"
                ? (duplasPorGrupo.get(gi) ?? [])
                : [];

              const hasPairs = (modoAtivo === "simulacao" ? grupoPairsSimu.length : grupoDuplasOfic.length) > 0;
              const famIdsSet = new Set(grupoFamIds);
              const grupoIneligible = algoStatsResult?.ineligible.filter(
                (ie) => ie.familiaId != null && famIdsSet.has(ie.familiaId)
              ) ?? [];

              if (!hasPairs && grupoIneligible.length === 0) return null;

              const famLabel = grupoFamIds
                .map((fid) => `Família ${familiaMap.get(fid)?.numero ?? fid}`)
                .join(", ");

              const nDuplas = modoAtivo === "simulacao"
                ? grupoPairsSimu.filter((p) => p.participante2).length
                : grupoDuplasOfic.filter((d) => d.participante_2_id).length;

              const nSolo = modoAtivo === "simulacao"
                ? grupoPairsSimu.filter((p) => !p.participante2).length
                : grupoDuplasOfic.filter((d) => !d.participante_2_id).length;

              const isSimpleGroup = grupoFamIds.length === 1;

              return (
                <AccordionItem
                  key={gi}
                  value={String(gi)}
                  className={`border rounded-lg px-4 ${modoAtivo === "simulacao" ? "border-blue-500/40 bg-blue-500/5" : ""}`}
                >
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm">
                        {isSimpleGroup
                          ? `Família ${familiaMap.get(grupoFamIds[0])?.numero ?? grupoFamIds[0]}${familiaMap.get(grupoFamIds[0])?.nome ? ` — ${familiaMap.get(grupoFamIds[0])?.nome}` : ""}`
                          : `GRUPO ${GRUPO_LABELS[gi]} — ${famLabel}`}
                      </span>
                      <Badge variant="secondary" className="text-xs">{nDuplas} duplas</Badge>
                      {nSolo > 0 && (
                        <Badge className="text-xs bg-orange-500/20 text-orange-700 border-orange-300">
                          {nSolo} solo
                        </Badge>
                      )}
                      {grupoIneligible.length > 0 && (
                        <Badge variant="destructive" className="text-xs">
                          {grupoIneligible.length} inaptos
                        </Badge>
                      )}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-2 py-2">
                      {/* Pares — modo simulação */}
                      {modoAtivo === "simulacao" && grupoPairsSimu.map((p) => {
                        const p1 = p.participante1;
                        const p2 = p.participante2;
                        const fam1 = familiaMap.get(p1.familia_id ?? 0);
                        const fam2 = p2 ? familiaMap.get(p2.familia_id ?? 0) : null;
                        return (
                          <div key={`${p.grupoIdx}-${p.ordem}`} className="flex items-center gap-2 p-3 rounded-md border bg-card">
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              {p2 ? (
                                <>
                                  <Users className="h-4 w-4 text-primary shrink-0" />
                                  <span className="text-sm truncate">
                                    <strong>Dupla {p.ordem}:</strong>{" "}
                                    {p1.nome} <span className="text-muted-foreground text-xs">(Fam.{fam1?.numero})</span> ({p.peso1}kg)
                                    {" "}+{" "}
                                    {p2.nome} <span className="text-muted-foreground text-xs">(Fam.{fam2?.numero})</span> ({p.peso2}kg)
                                    {" "}= <strong>{p.pesoTotal}kg</strong>
                                    {p.pesoTotal > 170 && " ⚠️"}
                                  </span>
                                </>
                              ) : (
                                <>
                                  <User className="h-4 w-4 text-orange-500 shrink-0" />
                                  <span className="text-sm truncate">
                                    <strong>Solo {p.ordem}:</strong>{" "}
                                    {p1.nome} <span className="text-muted-foreground text-xs">(Fam.{fam1?.numero})</span> ({p.peso1}kg)
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        );
                      })}

                      {/* Pares — modo oficial */}
                      {modoAtivo === "oficial" && grupoDuplasOfic.map((d) => {
                        const p1 = partMap.get(d.participante_1_id);
                        const p2 = d.participante_2_id ? partMap.get(d.participante_2_id) : null;
                        const fam1 = p1 ? familiaMap.get(p1.familia_id ?? 0) : null;
                        const fam2 = p2 ? familiaMap.get(p2.familia_id ?? 0) : null;
                        return (
                          <div key={d.id} className="flex items-center justify-between gap-2 p-3 rounded-md border bg-card">
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              {p2 ? (
                                <>
                                  <Users className="h-4 w-4 text-primary shrink-0" />
                                  <span className="text-sm truncate">
                                    <strong>Dupla {d.ordem}:</strong>{" "}
                                    {p1?.nome ?? "?"} <span className="text-muted-foreground text-xs">(Fam.{fam1?.numero})</span> ({d.peso_1}kg)
                                    {" "}+{" "}
                                    {p2?.nome ?? "?"} <span className="text-muted-foreground text-xs">(Fam.{fam2?.numero})</span> ({d.peso_2}kg)
                                    {" "}= <strong>{d.peso_total}kg</strong>
                                    {d.peso_total > 170 && " ⚠️"}
                                  </span>
                                </>
                              ) : (
                                <>
                                  <User className="h-4 w-4 text-orange-500 shrink-0" />
                                  <span className="text-sm truncate">
                                    <strong>Solo {d.ordem}:</strong>{" "}
                                    {p1?.nome ?? "?"} <span className="text-muted-foreground text-xs">(Fam.{fam1?.numero})</span> ({d.peso_1}kg)
                                  </span>
                                </>
                              )}
                            </div>
                            {p2 && (
                              <div className="flex items-center gap-2 shrink-0">
                                {d.desceu && (
                                  <Badge className="text-xs bg-green-500/20 text-green-700 border-green-300">✅ Desceu</Badge>
                                )}
                                <div className="flex items-center gap-1">
                                  <Checkbox
                                    id={`desceu-${d.id}`}
                                    checked={d.desceu ?? false}
                                    onCheckedChange={(checked) => handleToggleDesceu(d.id, !!checked)}
                                  />
                                  <label htmlFor={`desceu-${d.id}`} className="text-xs cursor-pointer select-none">
                                    Desceu
                                  </label>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}

                      {/* Inaptos */}
                      {grupoIneligible.map((ie) => (
                        <div
                          key={ie.participante.id}
                          className="flex items-center gap-2 p-3 rounded-md border border-destructive/30 bg-destructive/5"
                        >
                          <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
                          <span className="text-sm text-destructive">
                            {ie.participante.nome} ({ie.participante.peso}kg) —{" "}
                            <span className="text-muted-foreground text-xs">
                              Fam.{familiaMap.get(ie.familiaId)?.numero}
                            </span>{" "}
                            — {ie.motivo}
                          </span>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>

          {/* GRUPO SOLO — Duplas Manuais (sempre por último) */}
          {(matchManualPairs.length > 0 || duplas.filter((d) => d.grupo_tipo === "manual").length > 0) && (() => {
            const duplasManuais = modoAtivo === "simulacao"
              ? matchManualPairs
              : duplas.filter((d) => d.grupo_tipo === "manual");
            const solosRestantes = solosAtivos;

            return (
              <Card className="border-purple-500/40 bg-purple-500/5">
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2 flex-wrap">
                    <Users className="h-4 w-4 text-purple-600" />
                    GRUPO SOLO — Duplas Manuais
                    <Badge variant="secondary" className="text-xs">
                      {duplasManuais.filter((p) =>
                        modoAtivo === "simulacao"
                          ? !!(p as ZiplinePair).participante2
                          : !!(p as DuplaRow).participante_2_id
                      ).length} duplas
                    </Badge>
                    {solosRestantes.length > 0 && (
                      <Badge className="text-xs bg-orange-500/20 text-orange-700 border-orange-300">
                        {solosRestantes.length} solo restante
                      </Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0 space-y-2">
                  {/* Duplas manuais — simulação */}
                  {modoAtivo === "simulacao" && (matchManualPairs as ZiplinePair[])
                    .filter((p) => p.participante2)
                    .map((p, i) => {
                      const fam1 = familiaMap.get(p.participante1.familia_id ?? 0);
                      const fam2 = familiaMap.get(p.participante2!.familia_id ?? 0);
                      return (
                        <div key={i} className="flex items-center gap-2 p-3 rounded-md border bg-card">
                          <Users className="h-4 w-4 text-purple-600 shrink-0" />
                          <span className="text-sm">
                            <strong>Dupla {i + 1}:</strong>{" "}
                            {p.participante1.nome} <span className="text-muted-foreground text-xs">(Fam.{fam1?.numero})</span> ({p.peso1}kg)
                            {" "}+ {p.participante2!.nome} <span className="text-muted-foreground text-xs">(Fam.{fam2?.numero})</span> ({p.peso2}kg)
                            {" "}= <strong>{p.pesoTotal}kg</strong>
                          </span>
                        </div>
                      );
                    })}

                  {/* Duplas manuais — oficial */}
                  {modoAtivo === "oficial" && (duplas.filter((d) => d.grupo_tipo === "manual" && d.participante_2_id) as DuplaRow[])
                    .map((d) => {
                      const p1 = partMap.get(d.participante_1_id);
                      const p2 = partMap.get(d.participante_2_id!);
                      const fam1 = p1 ? familiaMap.get(p1.familia_id ?? 0) : null;
                      const fam2 = p2 ? familiaMap.get(p2.familia_id ?? 0) : null;
                      return (
                        <div key={d.id} className="flex items-center justify-between gap-2 p-3 rounded-md border bg-card">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <Users className="h-4 w-4 text-purple-600 shrink-0" />
                            <span className="text-sm truncate">
                              <strong>Dupla:</strong>{" "}
                              {p1?.nome ?? "?"} <span className="text-muted-foreground text-xs">(Fam.{fam1?.numero})</span> ({d.peso_1}kg)
                              {" "}+ {p2?.nome ?? "?"} <span className="text-muted-foreground text-xs">(Fam.{fam2?.numero})</span> ({d.peso_2}kg)
                              {" "}= <strong>{d.peso_total}kg</strong>
                            </span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {d.desceu && <Badge className="text-xs bg-green-500/20 text-green-700 border-green-300">✅ Desceu</Badge>}
                            <div className="flex items-center gap-1">
                              <Checkbox
                                id={`desceu-manual-${d.id}`}
                                checked={d.desceu ?? false}
                                onCheckedChange={(checked) => handleToggleDesceu(d.id, !!checked)}
                              />
                              <label htmlFor={`desceu-manual-${d.id}`} className="text-xs cursor-pointer select-none">Desceu</label>
                            </div>
                          </div>
                        </div>
                      );
                    })}

                  {/* Solos restantes */}
                  {solosRestantes.map((solo) => {
                    const fam = familiaMap.get(solo.familia_id ?? 0);
                    return (
                      <div key={solo.id} className="flex items-center gap-2 p-3 rounded-md border border-orange-300/40 bg-orange-500/5">
                        <User className="h-4 w-4 text-orange-500 shrink-0" />
                        <span className="text-sm text-muted-foreground">
                          <strong>Solo restante:</strong> {solo.nome} <span className="text-xs">(Fam.{fam?.numero})</span> — {solo.peso}kg
                        </span>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            );
          })()}
        </>
      )}

      {/* Dialog: Match Manual de Solos */}
      <Dialog
        open={showMatchManual}
        onOpenChange={(v) => {
          setShowMatchManual(v);
          if (!v) setMatchSelecionado(null);
        }}
      >
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" /> Formação Manual de Duplas — Solos
            </DialogTitle>
            <p className="text-sm text-muted-foreground">{solosAtivos.length} participantes sem dupla</p>
          </DialogHeader>

          {/* Banner de seleção ativa */}
          {matchSelecionado && (() => {
            const sel = solosAtivos.find((s) => s.id === matchSelecionado);
            const pesoMax = 170 - (sel?.peso ?? 0);
            return sel ? (
              <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-3 text-sm">
                Selecionado: <strong>{sel.nome}</strong> ({sel.peso}kg) — Peso máximo do par: <strong>{pesoMax}kg</strong>
                <Button size="sm" variant="ghost" className="ml-2 h-6 px-2" onClick={() => setMatchSelecionado(null)}>
                  Cancelar seleção
                </Button>
              </div>
            ) : null;
          })()}

          {/* Mensagem sem combinações possíveis */}
          {solosAtivos.length >= 2 && !temCombinacoesPossiveis && (
            <div className="bg-muted rounded-lg p-4 text-center text-sm text-muted-foreground">
              Não há mais combinações possíveis dentro do limite de 170kg
            </div>
          )}

          {solosAtivos.length === 0 && (
            <div className="text-center text-sm text-muted-foreground py-4">
              Todos os solos foram emparelhados ou não há solos no resultado atual.
            </div>
          )}

          {/* Tabela de solos */}
          {solosAtivos.length > 0 && (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="w-8"></th>
                  <th className="text-left py-2 font-medium">Nome</th>
                  <th className="text-left py-2 font-medium">Família</th>
                  <th className="text-right py-2 font-medium">Peso</th>
                </tr>
              </thead>
              <tbody>
                {solosAtivos.map((solo) => {
                  const isSelecionado = matchSelecionado === solo.id;
                  const pesoMaxAtual = matchSelecionado && !isSelecionado
                    ? 170 - (solosAtivos.find((s) => s.id === matchSelecionado)?.peso ?? 0)
                    : null;
                  const isDesabilitado = pesoMaxAtual !== null && (solo.peso ?? 0) > pesoMaxAtual;
                  const fam = familiaMap.get(solo.familia_id ?? 0);
                  return (
                    <tr
                      key={solo.id}
                      className={`border-b transition-colors ${
                        isSelecionado
                          ? "bg-primary/10"
                          : isDesabilitado
                          ? "opacity-40"
                          : "hover:bg-muted/50 cursor-pointer"
                      }`}
                      onClick={() => !isDesabilitado && handleMatchClick(solo)}
                    >
                      <td className="py-2 pr-2">
                        <Checkbox checked={isSelecionado} disabled={isDesabilitado} />
                      </td>
                      <td className="py-2">{solo.nome}</td>
                      <td className="py-2 text-muted-foreground">Fam. {fam?.numero ?? "?"}</td>
                      <td className="py-2 text-right font-medium">{solo.peso}kg</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}

          {/* Confirmação de dupla */}
          {confirmMatchPair && (
            <div className="border rounded-lg p-4 bg-muted/50 space-y-3">
              <p className="font-medium">Formar dupla?</p>
              <p className="text-sm">
                {confirmMatchPair.p1.nome} ({confirmMatchPair.p1.peso}kg, Fam.{familiaMap.get(confirmMatchPair.p1.familia_id ?? 0)?.numero})
                {" "}+ {confirmMatchPair.p2.nome} ({confirmMatchPair.p2.peso}kg, Fam.{familiaMap.get(confirmMatchPair.p2.familia_id ?? 0)?.numero})
                {" "}= <strong>{(confirmMatchPair.p1.peso ?? 0) + (confirmMatchPair.p2.peso ?? 0)}kg</strong>
              </p>
              <div className="flex gap-2">
                <Button size="sm" onClick={handleConfirmarMatchPair} disabled={savingMatchPair}>
                  ✅ Confirmar Dupla
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => { setConfirmMatchPair(null); setMatchSelecionado(null); }}
                >
                  ✖ Cancelar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog: Configurar Texto do Termo */}
      <Dialog open={showConfigTermo} onOpenChange={setShowConfigTermo}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" /> Configurar Texto do Termo
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Este texto será exibido para o participante durante o check-in da pulseira.
            </p>
            <Textarea
              value={textoTermo}
              onChange={(e) => setTextoTermo(e.target.value)}
              rows={8}
              placeholder="Texto do Termo de Responsabilidade..."
              className="text-sm"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfigTermo(false)}>Cancelar</Button>
            <Button onClick={handleSaveTermo} disabled={savingTermo}>
              {savingTermo ? "Salvando..." : "Salvar Texto"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm regenerate */}
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Refazer duplas oficiais?</AlertDialogTitle>
            <AlertDialogDescription>
              Isso apagará todas as duplas oficiais atuais e gerará novas com base nos termos aceitos. Deseja continuar?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={doGenerate} className="bg-orange-600 hover:bg-orange-700">
              Refazer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
