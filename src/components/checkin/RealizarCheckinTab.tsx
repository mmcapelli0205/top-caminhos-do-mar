import { useState, useEffect, useRef, useCallback } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import { maskCPF } from "@/lib/cpf";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Camera, Search, CheckCircle2, AlertTriangle, ArrowLeft } from "lucide-react";
import type { Participante } from "@/hooks/useParticipantes";

interface Props {
  userId: string;
}

type Step = "scan" | "cpf" | "confirm" | "success";

export function RealizarCheckinTab({ userId }: Props) {
  const queryClient = useQueryClient();
  const [step, setStep] = useState<Step>("scan");
  const [codigoPulseira, setCodigoPulseira] = useState("");
  const [cpf, setCpf] = useState("");
  const [participante, setParticipante] = useState<Participante | null>(null);
  const [pesoCheckin, setPesoCheckin] = useState("");
  const [numLegendario, setNumLegendario] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingQueue, setPendingQueue] = useState<any[]>([]);

  // Offline cache
  const cachedParticipantes = useRef<Participante[]>([]);
  const cachedPulseiras = useRef<any[]>([]);

  // Scanner
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [scannerActive, setScannerActive] = useState(false);
  const containerId = "checkin-scanner";

  // Load cache on mount
  useEffect(() => {
    supabase.from("participantes").select("*").then(({ data }) => {
      if (data) cachedParticipantes.current = data;
    });
    supabase.from("pulseiras").select("*").then(({ data }) => {
      if (data) cachedPulseiras.current = data;
    });
  }, []);

  // Online/offline listener
  useEffect(() => {
    const onOnline = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  // Sync pending when back online
  useEffect(() => {
    if (isOnline && pendingQueue.length > 0) {
      const syncAll = async () => {
        for (const item of pendingQueue) {
          try {
            await supabase.from("participantes").update({
              qr_code: item.codigo,
              peso_checkin: item.peso,
              numero_legendario: item.numLeg || null,
              checkin_realizado: true,
              checkin_em: item.timestamp,
              checkin_por: userId,
            }).eq("id", item.participanteId);
            await supabase.from("pulseiras").update({
              status: "vinculada",
              participante_id: item.participanteId,
              vinculada_em: item.timestamp,
              vinculada_por: userId,
            }).eq("codigo", item.codigo);
          } catch {}
        }
        setPendingQueue([]);
        toast({ title: `✅ ${pendingQueue.length} check-ins sincronizados!` });
        queryClient.invalidateQueries({ queryKey: ["participantes"] });
      };
      syncAll();
    }
  }, [isOnline, pendingQueue, userId, queryClient]);

  const stopScanner = useCallback(async () => {
    if (scannerRef.current) {
      try {
        const state = scannerRef.current.getState();
        if (state === 2 || state === 3) await scannerRef.current.stop();
      } catch {}
      scannerRef.current = null;
      setScannerActive(false);
    }
  }, []);

  useEffect(() => () => { stopScanner(); }, [stopScanner]);

  const startScanner = async () => {
    if (scannerActive) return;
    try {
      const scanner = new Html5Qrcode(containerId);
      scannerRef.current = scanner;
      await scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decoded) => {
          if (/^TOP-\d+-\d{4}$/.test(decoded)) {
            scanner.pause(true);
            handlePulseiraScan(decoded);
          } else {
            toast({ title: "Formato inválido", description: "Esperado: TOP-XXXX-XXXX", variant: "destructive" });
          }
        },
        () => {}
      );
      setScannerActive(true);
    } catch (e: any) {
      toast({ title: "Erro ao abrir câmera", description: e.message, variant: "destructive" });
    }
  };

  const handlePulseiraScan = async (codigo: string) => {
    // Check pulseira status
    let pulseira: any = null;
    if (isOnline) {
      const { data } = await supabase
        .from("pulseiras")
        .select("*, participantes(nome)")
        .eq("codigo", codigo)
        .maybeSingle();
      pulseira = data;
    } else {
      pulseira = cachedPulseiras.current.find(p => p.codigo === codigo);
    }

    if (!pulseira) {
      toast({ title: "Pulseira não encontrada", variant: "destructive" });
      resumeScanner();
      return;
    }

    if (pulseira.status === "vinculada") {
      const nome = pulseira.participantes?.nome || "alguém";
      toast({ title: `Pulseira já vinculada a ${nome}`, variant: "destructive" });
      resumeScanner();
      return;
    }

    if (pulseira.status === "danificada") {
      toast({ title: "Pulseira danificada", variant: "destructive" });
      resumeScanner();
      return;
    }

    setCodigoPulseira(codigo);
    await stopScanner();
    setStep("cpf");
  };

  const resumeScanner = () => {
    if (scannerRef.current) {
      try { scannerRef.current.resume(); } catch {}
    }
  };

  const handleBuscarCPF = async () => {
    const cpfLimpo = cpf.replace(/\D/g, "");
    if (cpfLimpo.length !== 11) {
      toast({ title: "CPF inválido", variant: "destructive" });
      return;
    }

    let found: Participante | null = null;
    if (isOnline) {
      const { data } = await supabase
        .from("participantes")
        .select("*")
        .eq("cpf", cpfLimpo)
        .maybeSingle();
      found = data as Participante | null;
    } else {
      found = cachedParticipantes.current.find(p => p.cpf.replace(/\D/g, "") === cpfLimpo) ?? null;
    }

    if (!found) {
      toast({ title: "CPF não encontrado", variant: "destructive" });
      return;
    }

    if (found.checkin_realizado) {
      toast({ title: "Participante já realizou check-in", variant: "destructive" });
      return;
    }

    setParticipante(found);
    setStep("confirm");
  };

  const calcAge = (dob: string | null) => {
    if (!dob) return null;
    const birth = new Date(dob + "T12:00:00");
    const now = new Date();
    let age = now.getFullYear() - birth.getFullYear();
    if (now < new Date(now.getFullYear(), birth.getMonth(), birth.getDate())) age--;
    return age;
  };

  const handleConfirm = async () => {
    if (!participante) return;
    setConfirming(true);

    const timestamp = new Date().toISOString();
    const peso = pesoCheckin ? parseFloat(pesoCheckin) : null;

    if (isOnline) {
      try {
        const { error: e1 } = await supabase
          .from("participantes")
          .update({
            qr_code: codigoPulseira,
            peso_checkin: peso,
            numero_legendario: numLegendario || null,
            checkin_realizado: true,
            checkin_em: timestamp,
            checkin_por: userId,
          })
          .eq("id", participante.id);
        if (e1) throw e1;

        const { error: e2 } = await supabase
          .from("pulseiras")
          .update({
            status: "vinculada",
            participante_id: participante.id,
            vinculada_em: timestamp,
            vinculada_por: userId,
          })
          .eq("codigo", codigoPulseira);
        if (e2) throw e2;

        queryClient.invalidateQueries({ queryKey: ["participantes"] });
        queryClient.invalidateQueries({ queryKey: ["pulseiras"] });
      } catch (e: any) {
        toast({ title: "Erro no check-in", description: e.message, variant: "destructive" });
        setConfirming(false);
        return;
      }
    } else {
      setPendingQueue(prev => [...prev, {
        participanteId: participante.id,
        codigo: codigoPulseira,
        peso,
        numLeg: numLegendario,
        timestamp,
      }]);
    }

    setConfirming(false);
    setStep("success");
  };

  const resetFlow = () => {
    setStep("scan");
    setCodigoPulseira("");
    setCpf("");
    setParticipante(null);
    setPesoCheckin("");
    setNumLegendario("");
  };

  const familiaNum = participante?.familia_id ?? null;
  const idade = participante ? calcAge(participante.data_nascimento) : null;
  const pesoDiff = participante?.peso && pesoCheckin
    ? Math.abs(Number(participante.peso) - parseFloat(pesoCheckin))
    : null;
  const hasDoenca = !!(participante?.doenca || participante?.medicamentos || participante?.alergia_alimentar);

  return (
    <div className="space-y-4 max-w-lg mx-auto">
      {!isOnline && (
        <div className="bg-yellow-500/20 border border-yellow-500/50 rounded-lg p-3 text-center text-sm">
          ⚠️ Modo Offline — dados podem estar desatualizados
        </div>
      )}
      {pendingQueue.length > 0 && (
        <Badge variant="secondary" className="w-full justify-center py-1">
          {pendingQueue.length} check-ins pendentes de sincronização
        </Badge>
      )}

      {/* STEP: SCAN */}
      {step === "scan" && (
        <div className="space-y-4">
          <div id={containerId} className="w-full aspect-square max-h-[300px] bg-muted rounded-lg overflow-hidden" />
          {!scannerActive ? (
            <Button
              onClick={startScanner}
              className="w-full h-16 text-lg bg-orange-500 hover:bg-orange-600"
            >
              <Camera className="h-6 w-6 mr-2" /> Bipar Pulseira
            </Button>
          ) : (
            <Button variant="outline" onClick={stopScanner} className="w-full h-14">
              Parar Scanner
            </Button>
          )}
        </div>
      )}

      {/* STEP: CPF */}
      {step === "cpf" && (
        <div className="space-y-4">
          <Button variant="ghost" size="sm" onClick={resetFlow}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Voltar
          </Button>
          <Badge variant="outline" className="w-full justify-center py-2 text-sm font-mono">
            Pulseira: {codigoPulseira} ✓
          </Badge>
          <div>
            <label className="text-sm font-medium">CPF do Participante</label>
            <Input
              value={cpf}
              onChange={e => setCpf(maskCPF(e.target.value))}
              placeholder="000.000.000-00"
              className="h-14 text-lg mt-1"
              inputMode="numeric"
            />
          </div>
          <Button onClick={handleBuscarCPF} className="w-full h-14 text-lg">
            <Search className="h-5 w-5 mr-2" /> Buscar
          </Button>
        </div>
      )}

      {/* STEP: CONFIRM */}
      {step === "confirm" && participante && (
        <div className="space-y-4">
          <Button variant="ghost" size="sm" onClick={() => setStep("cpf")}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Voltar
          </Button>

          {/* Família destaque */}
          <Card className="bg-orange-500 border-orange-600">
            <CardContent className="p-4 text-center text-white">
              <p className="text-3xl font-bold">FAMÍLIA Nº {familiaNum ?? "?"}</p>
              <p className="text-lg mt-1">Entregar Placa Família {familiaNum ?? "?"}</p>
            </CardContent>
          </Card>

          {/* Dados */}
          <Card>
            <CardContent className="p-4 space-y-2">
              <p className="text-xl font-bold">{participante.nome}</p>
              {idade !== null && <p className="text-muted-foreground">{idade} anos</p>}
              {participante.igreja && <p className="text-sm text-muted-foreground">Igreja: {participante.igreja}</p>}
              {participante.cidade && <p className="text-sm text-muted-foreground">Cidade: {participante.cidade}</p>}
            </CardContent>
          </Card>

          {/* Pesagem */}
          <Card>
            <CardContent className="p-4 space-y-3">
              {participante.peso && (
                <p className="text-muted-foreground">Peso na inscrição: {Number(participante.peso).toFixed(1)} kg</p>
              )}
              <div>
                <label className="text-sm font-medium">Peso na balança (kg)</label>
                <Input
                  type="number"
                  step="0.1"
                  value={pesoCheckin}
                  onChange={e => setPesoCheckin(e.target.value)}
                  placeholder="Ex: 72.5"
                  className="h-14 text-lg mt-1"
                  inputMode="decimal"
                />
              </div>
              {pesoDiff !== null && pesoDiff > 3 && (
                <div className="bg-yellow-500/20 border border-yellow-500/50 rounded-lg p-3 flex items-center gap-2 animate-pulse">
                  <AlertTriangle className="h-5 w-5 text-yellow-500" />
                  <span className="text-sm">⚠️ Peso divergente! Inscrição: {Number(participante.peso).toFixed(1)}kg / Balança: {pesoCheckin}kg</span>
                </div>
              )}
              {pesoDiff !== null && pesoDiff <= 3 && (
                <Badge className="bg-green-600">✅ Peso OK</Badge>
              )}
            </CardContent>
          </Card>

          {/* Nº Legendário */}
          <div>
            <label className="text-sm font-medium">Nº Legendário (opcional)</label>
            <Input
              value={numLegendario}
              onChange={e => setNumLegendario(e.target.value)}
              placeholder="Ex: 15750042"
              className="h-12 mt-1"
            />
          </div>

          {/* Doenças */}
          {hasDoenca && (
            <Card className="border-red-500/50 bg-red-900/20">
              <CardContent className="p-4 space-y-1">
                <p className="font-bold text-red-400">⚠️ ATENÇÃO MÉDICA</p>
                {participante.doenca && <p className="text-sm">Doenças: {participante.doenca}</p>}
                {participante.medicamentos && <p className="text-sm">Medicamentos: {participante.medicamentos}</p>}
                {participante.alergia_alimentar && <p className="text-sm">Alergias: {participante.alergia_alimentar}</p>}
              </CardContent>
            </Card>
          )}

          <Button
            onClick={handleConfirm}
            disabled={confirming}
            className="w-full h-16 text-xl bg-green-600 hover:bg-green-700"
          >
            {confirming ? "Confirmando..." : "✅ CONFIRMAR CHECK-IN"}
          </Button>
        </div>
      )}

      {/* STEP: SUCCESS */}
      {step === "success" && participante && (
        <div className="space-y-4">
          <Card className="bg-green-600 border-green-700">
            <CardContent className="p-6 text-center text-white space-y-3">
              <CheckCircle2 className="h-12 w-12 mx-auto" />
              <p className="text-2xl font-bold">CHECK-IN REALIZADO</p>
              <p className="text-xl">{participante.nome}</p>
              <p className="text-lg">FAMÍLIA Nº {familiaNum ?? "?"}</p>
              {numLegendario && <p>Nº Legendário: {numLegendario}</p>}
              <div className="mt-4 bg-white/20 rounded-lg p-3">
                <p>👉 Entregar placa e encaminhar para fila {familiaNum ?? "?"}</p>
              </div>
            </CardContent>
          </Card>
          <Button onClick={resetFlow} className="w-full h-14 text-lg">
            Próximo Check-in
          </Button>
        </div>
      )}
    </div>
  );
}
