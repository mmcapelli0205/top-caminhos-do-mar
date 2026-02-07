import { useState, useEffect, useRef, useCallback } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import { calcAge } from "@/lib/familiaAlgorithm";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { CheckCircle2, XCircle, Search, Camera } from "lucide-react";
import type { Participante } from "@/hooks/useParticipantes";
import type { Tables } from "@/integrations/supabase/types";

type Servidor = Tables<"servidores">;

interface FoundPerson {
  type: "participante" | "servidor";
  id: string;
  nome: string;
  familiaNum?: number;
  checkedIn: boolean;
  // participante-specific
  contrato_assinado?: boolean | null;
  ergometrico_status?: string | null;
  data_nascimento?: string | null;
  // servidor-specific
  area_servico?: string | null;
}

interface Props {
  participantes: Participante[];
  familiaMap: Map<number, number>;
}

function playBeep() {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    osc.frequency.value = 800;
    osc.connect(ctx.destination);
    osc.start();
    setTimeout(() => { osc.stop(); ctx.close(); }, 200);
  } catch {}
}

export function CheckInTab({ participantes, familiaMap }: Props) {
  const queryClient = useQueryClient();
  const [found, setFound] = useState<FoundPerson | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<FoundPerson[]>([]);
  const [forceOpen, setForceOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scannerContainerId = "qr-scanner-container";
  const [scannerRunning, setScannerRunning] = useState(false);
  const [servidores, setServidores] = useState<Servidor[]>([]);

  // Fetch servidores once
  useEffect(() => {
    supabase.from("servidores").select("*").then(({ data }) => {
      if (data) setServidores(data);
    });
  }, []);

  const checkedInCount = participantes.filter((p) => p.checkin_realizado).length;
  const totalCount = participantes.length;
  const pct = totalCount > 0 ? Math.round((checkedInCount / totalCount) * 100) : 0;

  const lookupQrCode = useCallback((code: string) => {
    // Search participantes
    const p = participantes.find((x) => x.qr_code === code);
    if (p) {
      setFound({
        type: "participante",
        id: p.id,
        nome: p.nome,
        familiaNum: p.familia_id ? familiaMap.get(p.familia_id) : undefined,
        checkedIn: !!p.checkin_realizado,
        contrato_assinado: p.contrato_assinado,
        ergometrico_status: p.ergometrico_status,
        data_nascimento: p.data_nascimento,
      });
      return;
    }
    // Search servidores
    const s = servidores.find((x) => x.qr_code === code);
    if (s) {
      setFound({
        type: "servidor",
        id: s.id,
        nome: s.nome,
        checkedIn: !!s.checkin,
        area_servico: s.area_servico,
      });
      return;
    }
    toast({ title: "QR Code não encontrado", variant: "destructive" });
  }, [participantes, servidores, familiaMap]);

  // Scanner setup
  const startScanner = useCallback(async () => {
    if (scannerRunning || scannerRef.current) return;
    try {
      const scanner = new Html5Qrcode(scannerContainerId);
      scannerRef.current = scanner;
      await scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decoded) => {
          lookupQrCode(decoded);
          // Pause scanner after successful scan
          scanner.pause(true);
        },
        () => {}
      );
      setScannerRunning(true);
    } catch (err: any) {
      console.error("Scanner error:", err);
    }
  }, [scannerRunning, lookupQrCode]);

  const stopScanner = useCallback(async () => {
    if (scannerRef.current) {
      try {
        const state = scannerRef.current.getState();
        if (state === 2 || state === 3) { // SCANNING or PAUSED
          await scannerRef.current.stop();
        }
      } catch {}
      scannerRef.current = null;
      setScannerRunning(false);
    }
  }, []);

  useEffect(() => {
    return () => { stopScanner(); };
  }, [stopScanner]);

  // Debounced search
  useEffect(() => {
    if (!searchTerm.trim()) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(() => {
      const term = searchTerm.toLowerCase();
      const digitsOnly = searchTerm.replace(/\D/g, "");
      const results: FoundPerson[] = [];

      for (const p of participantes) {
        if (results.length >= 5) break;
        const nameMatch = p.nome.toLowerCase().includes(term);
        const cpfMatch = digitsOnly.length >= 3 && p.cpf.replace(/\D/g, "").includes(digitsOnly);
        if (nameMatch || cpfMatch) {
          results.push({
            type: "participante",
            id: p.id,
            nome: p.nome,
            familiaNum: p.familia_id ? familiaMap.get(p.familia_id) : undefined,
            checkedIn: !!p.checkin_realizado,
            contrato_assinado: p.contrato_assinado,
            ergometrico_status: p.ergometrico_status,
            data_nascimento: p.data_nascimento,
          });
        }
      }
      if (results.length < 5) {
        for (const s of servidores) {
          if (results.length >= 5) break;
          const nameMatch = s.nome.toLowerCase().includes(term);
          const cpfMatch = digitsOnly.length >= 3 && s.cpf?.replace(/\D/g, "").includes(digitsOnly);
          if (nameMatch || cpfMatch) {
            results.push({
              type: "servidor",
              id: s.id,
              nome: s.nome,
              checkedIn: !!s.checkin,
              area_servico: s.area_servico,
            });
          }
        }
      }
      setSearchResults(results);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm, participantes, servidores, familiaMap]);

  // Validation
  const getValidation = (person: FoundPerson) => {
    if (person.type === "servidor") return { ok: true, issues: [] };
    const issues: string[] = [];
    if (!person.contrato_assinado) issues.push("Contrato não assinado");
    const age = calcAge(person.data_nascimento ?? null);
    const ergoOk = person.ergometrico_status === "aprovado" || person.ergometrico_status === "dispensado" || age < 40;
    if (!ergoOk) issues.push("Ergométrico pendente");
    return { ok: issues.length === 0, issues };
  };

  const handleConfirmCheckin = async (force = false) => {
    if (!found) return;
    setConfirming(true);
    try {
      if (found.type === "participante") {
        const { error } = await supabase
          .from("participantes")
          .update({ checkin_realizado: true })
          .eq("id", found.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("servidores")
          .update({ checkin: true })
          .eq("id", found.id);
        if (error) throw error;
      }
      playBeep();
      toast({ title: `Check-in confirmado: ${found.nome}` });
      await queryClient.invalidateQueries({ queryKey: ["participantes"] });
      setFound(null);
      setSearchTerm("");
      setSearchResults([]);
      // Resume scanner
      if (scannerRef.current) {
        try { scannerRef.current.resume(); } catch {}
      }
    } catch (e: any) {
      toast({ title: "Erro no check-in", description: e.message, variant: "destructive" });
    } finally {
      setConfirming(false);
    }
  };

  const validation = found ? getValidation(found) : null;

  return (
    <div className="space-y-4">
      {/* Counter */}
      <div className="flex items-center gap-2 text-lg font-semibold">
        <CheckCircle2 className="h-5 w-5 text-primary" />
        Check-ins: {checkedInCount} / {totalCount} ({pct}%)
      </div>

      {/* Scanner area */}
      <div className="relative w-full h-[60vh] md:h-[400px] md:max-w-2xl md:mx-auto bg-muted rounded-lg overflow-hidden">
        <div id={scannerContainerId} className="w-full h-full" />
        {!scannerRunning && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
            <Camera className="h-12 w-12 text-muted-foreground" />
            <Button onClick={startScanner}>Iniciar Scanner</Button>
          </div>
        )}
      </div>

      {/* Manual search */}
      <div className="w-full md:max-w-md md:mx-auto space-y-2">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou CPF..."
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        {searchResults.length > 0 && !found && (
          <div className="border rounded-md bg-card divide-y">
            {searchResults.map((r) => (
              <button
                key={r.id}
                className="w-full px-4 py-2 text-left hover:bg-muted transition-colors text-sm"
                onClick={() => { setFound(r); setSearchResults([]); setSearchTerm(""); }}
              >
                <span className="font-medium">{r.nome}</span>
                <Badge variant="outline" className="ml-2 text-xs">
                  {r.type === "participante" ? `Família ${r.familiaNum ?? "?"}` : "Servidor"}
                </Badge>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Result card */}
      {found && validation && (
        <div className="w-full md:max-w-md md:mx-auto">
          <Card className={validation.ok ? "border-green-500 bg-green-500/10" : "border-destructive bg-destructive/10"}>
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                {validation.ok ? (
                  <CheckCircle2 className="h-6 w-6 text-green-600" />
                ) : (
                  <XCircle className="h-6 w-6 text-destructive" />
                )}
                <span className="text-xl font-bold">{found.nome}</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex gap-2 flex-wrap">
                <Badge variant="outline">
                  {found.type === "participante"
                    ? `Família ${found.familiaNum ?? "?"}`
                    : `Servidor - ${found.area_servico ?? ""}`}
                </Badge>
                {found.checkedIn && (
                  <Badge>Já fez check-in</Badge>
                )}
              </div>

              {validation.ok ? (
                <p className="text-green-700 font-medium">✅ Documentação OK</p>
              ) : (
                <div>
                  <p className="text-destructive font-medium">❌ Pendências:</p>
                  <ul className="list-disc list-inside text-sm text-destructive">
                    {validation.issues.map((i) => <li key={i}>{i}</li>)}
                  </ul>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                {validation.ok ? (
                  <Button
                    onClick={() => handleConfirmCheckin()}
                    disabled={confirming || found.checkedIn}
                    className="w-full"
                  >
                    {found.checkedIn ? "Já realizado" : confirming ? "Confirmando..." : "Confirmar Check-in"}
                  </Button>
                ) : (
                  <Button
                    variant="destructive"
                    className="w-full"
                    onClick={() => setForceOpen(true)}
                    disabled={confirming || found.checkedIn}
                  >
                    {found.checkedIn ? "Já realizado" : "Forçar Check-in"}
                  </Button>
                )}
                <Button variant="outline" onClick={() => {
                  setFound(null);
                  if (scannerRef.current) { try { scannerRef.current.resume(); } catch {} }
                }}>
                  Limpar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Force check-in dialog */}
      <AlertDialog open={forceOpen} onOpenChange={setForceOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Forçar Check-in?</AlertDialogTitle>
            <AlertDialogDescription>
              Este participante possui pendências na documentação. Deseja forçar o check-in mesmo assim?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => { setForceOpen(false); handleConfirmCheckin(true); }}>
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
