import { useState, useEffect, useRef, useCallback } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Camera, Phone } from "lucide-react";
import type { Participante } from "@/hooks/useParticipantes";

export function ConsultaPulseiraTab() {
  const [participante, setParticipante] = useState<Participante | null>(null);
  const [hakuna, setHakuna] = useState<{ nome: string; profissao: string | null } | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  const cachedParticipantes = useRef<Participante[]>([]);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [scannerActive, setScannerActive] = useState(false);
  const containerId = "consulta-scanner";

  useEffect(() => {
    supabase.from("participantes").select("*").then(({ data }) => {
      if (data) cachedParticipantes.current = data;
    });
  }, []);

  useEffect(() => {
    const on = () => setIsOnline(true);
    const off = () => setIsOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => { window.removeEventListener("online", on); window.removeEventListener("offline", off); };
  }, []);

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

  const lookupParticipante = async (codigo: string) => {
    let found: Participante | null = null;

    if (isOnline) {
      const { data } = await supabase
        .from("participantes")
        .select("*")
        .eq("qr_code", codigo)
        .maybeSingle();
      found = data as Participante | null;
    } else {
      found = cachedParticipantes.current.find(p => p.qr_code === codigo) ?? null;
    }

    if (!found) {
      setNotFound(true);
      setParticipante(null);
      return;
    }

    setNotFound(false);
    setParticipante(found);

    // Fetch hakuna responsável
    if (isOnline) {
      const { data: hp } = await supabase
        .from("hakuna_participante")
        .select("servidor_id, servidores:servidor_id(nome, profissao)")
        .eq("participante_id", found.id)
        .limit(1)
        .maybeSingle();
      if (hp && (hp as any).servidores) {
        const srv = (hp as any).servidores;
        setHakuna({ nome: srv.nome, profissao: srv.profissao });
      } else {
        setHakuna(null);
      }
    }
  };

  const startScanner = async () => {
    if (scannerActive) return;
    setParticipante(null);
    setNotFound(false);
    try {
      const scanner = new Html5Qrcode(containerId);
      scannerRef.current = scanner;
      await scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decoded) => {
          scanner.pause(true);
          lookupParticipante(decoded);
          stopScanner();
        },
        () => {}
      );
      setScannerActive(true);
    } catch (e: any) {
      toast({ title: "Erro ao abrir câmera", description: e.message, variant: "destructive" });
    }
  };

  const calcAge = (dob: string | null) => {
    if (!dob) return null;
    const birth = new Date(dob + "T12:00:00");
    const now = new Date();
    let age = now.getFullYear() - birth.getFullYear();
    if (now < new Date(now.getFullYear(), birth.getMonth(), birth.getDate())) age--;
    return age;
  };

  const hasDoenca = !!(participante?.doenca || participante?.medicamentos || participante?.alergia_alimentar);
  const idade = participante ? calcAge(participante.data_nascimento) : null;

  return (
    <div className="space-y-4 max-w-lg mx-auto">
      {!isOnline && (
        <div className="bg-yellow-500/20 border border-yellow-500/50 rounded-lg p-3 text-center text-sm">
          ⚠️ Modo Offline
        </div>
      )}

      {!participante && !notFound && (
        <div className="space-y-4">
          <div id={containerId} className="w-full aspect-square max-h-[300px] bg-muted rounded-lg overflow-hidden" />
          {!scannerActive ? (
            <Button
              onClick={startScanner}
              className="w-full h-16 text-lg bg-blue-600 hover:bg-blue-700"
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

      {notFound && (
        <div className="text-center space-y-4">
          <p className="text-lg text-muted-foreground">Pulseira sem participante vinculado</p>
          <Button onClick={() => { setNotFound(false); }} className="w-full h-14 text-lg bg-blue-600 hover:bg-blue-700">
            <Camera className="h-5 w-5 mr-2" /> Bipar Outra Pulseira
          </Button>
        </div>
      )}

      {participante && (
        <div className="space-y-4">
          {/* ALERTA MÉDICO */}
          <Card className={hasDoenca ? "border-red-500/50 bg-red-900/30" : "border-green-500/50 bg-green-900/20"}>
            <CardContent className="p-4 space-y-2">
              {hasDoenca ? (
                <>
                  <p className="text-xl font-bold text-red-400">⚠️ ALERTA MÉDICO</p>
                  {participante.doenca && <p className="text-lg">Doenças: {participante.doenca}</p>}
                  {participante.medicamentos && <p className="text-lg">Medicamentos: {participante.medicamentos}</p>}
                  {participante.alergia_alimentar && <p className="text-lg">Alergias: {participante.alergia_alimentar}</p>}
                </>
              ) : (
                <p className="text-lg text-green-400">✅ Sem condições médicas registradas</p>
              )}
            </CardContent>
          </Card>

          {/* IDENTIFICAÇÃO */}
          <Card>
            <CardContent className="p-4 space-y-2">
              <p className="text-2xl font-bold">{participante.nome}</p>
              <Badge className="bg-orange-500 text-white text-lg px-3 py-1">
                Família Nº {participante.familia_id ?? "?"}
              </Badge>
              {idade !== null && <p className="text-lg">Idade: {idade} anos</p>}
              {hakuna ? (
                <p className="text-sm text-muted-foreground">
                  Hakuna: {hakuna.nome}{hakuna.profissao ? ` - ${hakuna.profissao}` : ""}
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">Hakuna: não atribuído</p>
              )}
            </CardContent>
          </Card>

          {/* CONTATO EMERGÊNCIA */}
          {(participante.contato_nome || participante.contato_telefone) && (
            <Card className="bg-muted/50">
              <CardContent className="p-4 space-y-1">
                <p className="text-sm text-muted-foreground">📞 Contato de Emergência</p>
                {participante.contato_nome && <p className="text-lg">{participante.contato_nome}</p>}
                {participante.contato_telefone && (
                  <a
                    href={`tel:${participante.contato_telefone.replace(/\D/g, "")}`}
                    className="text-lg text-blue-400 underline flex items-center gap-2"
                  >
                    <Phone className="h-4 w-4" /> {participante.contato_telefone}
                  </a>
                )}
              </CardContent>
            </Card>
          )}

          <Button
            onClick={() => { setParticipante(null); setHakuna(null); }}
            className="w-full h-14 text-lg bg-blue-600 hover:bg-blue-700"
          >
            <Camera className="h-5 w-5 mr-2" /> Bipar Outra Pulseira
          </Button>
        </div>
      )}
    </div>
  );
}
