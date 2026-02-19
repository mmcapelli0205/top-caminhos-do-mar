import { useState, useEffect, useRef, useCallback } from "react";
import SignaturePad from "signature_pad";
import { Html5Qrcode } from "html5-qrcode";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Camera, Phone, Thermometer, Droplets, Heart, Pill, ClipboardList, Clock, Search, FileText } from "lucide-react";
import { maskCPF } from "@/lib/cpf";
import type { Participante } from "@/hooks/useParticipantes";

interface Props {
  userId: string;
  userEmail: string;
}

// Vital sign helpers
function tempStatus(v: number) {
  if (v < 35.5) return { label: "Hipotermia", color: "bg-blue-500" };
  if (v <= 37.2) return { label: "Normal", color: "bg-green-600" };
  if (v <= 37.7) return { label: "Pré-febril", color: "bg-yellow-500" };
  return { label: "Febre", color: "bg-red-600" };
}
function glicStatus(v: number) {
  if (v < 70) return { label: "Hipoglicemia", color: "bg-red-600" };
  if (v <= 130) return { label: "Normal", color: "bg-green-600" };
  return { label: "Hiperglicemia", color: "bg-red-600" };
}
function pressaoStatus(s: number, d: number) {
  if (s >= 180 || d >= 110) return { label: "CRISE HIPERTENSIVA", color: "bg-red-600", pulse: true };
  if ((s >= 140 && s <= 179) || (d >= 90 && d <= 109)) return { label: "Hipertensão", color: "bg-red-600" };
  if (s < 90 || d < 60) return { label: "Hipotensão", color: "bg-red-600" };
  if (s >= 90 && s <= 139 && d >= 60 && d <= 89) return { label: "Normal", color: "bg-green-600" };
  return { label: "—", color: "bg-muted" };
}

export function ConsultaPulseiraTab({ userId, userEmail }: Props) {
  const [participante, setParticipante] = useState<Participante | null>(null);
  const [hakuna, setHakuna] = useState<{ nome: string; profissao: string | null } | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [servidor, setServidor] = useState<{ id: string; nome: string } | null>(null);

  // Prontuário state
  const [temperatura, setTemperatura] = useState("");
  const [glicemia, setGlicemia] = useState("");
  const [pressaoSis, setPressaoSis] = useState("");
  const [pressaoDia, setPressaoDia] = useState("");
  const [medId, setMedId] = useState("");
  const [medQtd, setMedQtd] = useState("");
  const [medVia, setMedVia] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [saving, setSaving] = useState(false);

  // Medication lists
  const [necessaire, setNecessaire] = useState<any[]>([]);
  const [estoqueGeral, setEstoqueGeral] = useState<any[]>([]);
  // History
  const [historico, setHistorico] = useState<any[]>([]);

  const [manualCodigo, setManualCodigo] = useState("");
  const [manualCpf, setManualCpf] = useState("");

  // Termo de Responsabilidade
  const [termoStatus, setTermoStatus] = useState<"pendente" | "aceito" | "recusado" | null>(null);
  const [termoDialogOpen, setTermoDialogOpen] = useState(false);
  const [termoTexto, setTermoTexto] = useState(`TERMO INFORMAÇÕES IMPORTANTES E CONHECIMENTO DE RISCOS E RESPONSABILIDADES - TIROLESA – VOO DA SERRA

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

Declaro ainda estar ciente e de acordo com o uso e armazenamento dos meus dados pessoais, conforme a LGPD (Lei nº 13.709/2018) e demais normas legais aplicáveis.`);
  const [termoCheckbox, setTermoCheckbox] = useState(false);
  const [savingTermo, setSavingTermo] = useState(false);

  // Assinatura digital
  const [assinaturaPad, setAssinaturaPad] = useState<SignaturePad | null>(null);
  const [assinaturaVazia, setAssinaturaVazia] = useState(true);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const cachedParticipantes = useRef<Participante[]>([]);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [scannerActive, setScannerActive] = useState(false);
  const containerId = "consulta-scanner";

  // Inicializar SignaturePad quando o dialog de termo abrir
  useEffect(() => {
    if (!termoDialogOpen || !canvasRef.current) return;
    const sp = new SignaturePad(canvasRef.current, { backgroundColor: "rgb(255,255,255)" });
    sp.addEventListener("afterUpdateStroke", () => setAssinaturaVazia(sp.isEmpty()));
    setAssinaturaPad(sp);
    setAssinaturaVazia(true);
    return () => { sp.off(); };
  }, [termoDialogOpen]);

  useEffect(() => {
    supabase.from("participantes").select("*").then(({ data }) => {
      if (data) cachedParticipantes.current = data;
    });
  }, []);

  // Fetch servidor logado
  useEffect(() => {
    if (!userEmail) return;
    supabase.from("servidores").select("id, nome").eq("email", userEmail).maybeSingle().then(({ data }) => {
      if (data) setServidor(data);
    });
  }, [userEmail]);

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

  const loadMedications = async (servidorId: string) => {
    const [nec, est] = await Promise.all([
      supabase.from("hakuna_necessaire").select("*").eq("hakuna_servidor_id", servidorId),
      supabase.from("hakuna_estoque_medicamentos").select("*"),
    ]);
    setNecessaire(nec.data ?? []);
    setEstoqueGeral(est.data ?? []);
  };

  const loadHistorico = async (participanteId: string) => {
    const { data } = await supabase
      .from("atendimentos_hakuna")
      .select("*, servidores:hakuna_servidor_id(nome)")
      .eq("participante_id", participanteId)
      .order("created_at", { ascending: false })
      .limit(50);
    setHistorico(data ?? []);
  };

  // Carregar texto do termo e status do participante
  const loadTermoData = async (participanteId: string) => {
    // Texto do termo (config)
    const { data: cfgData } = await (supabase.from("tirolesa_config" as any) as any).select("texto_termo").limit(1).maybeSingle();
    if (cfgData?.texto_termo) setTermoTexto(cfgData.texto_termo);

    // Status do termo para este participante
    const { data: termoData } = await (supabase.from("tirolesa_termo_aceite" as any) as any)
      .select("status")
      .eq("participante_id", participanteId)
      .limit(1)
      .maybeSingle();
    setTermoStatus(termoData?.status ?? "pendente");
    setTermoCheckbox(false);
  };

  const lookupParticipante = async (codigo: string) => {
    let found: Participante | null = null;
    if (isOnline) {
      const { data } = await supabase.from("participantes").select("*").eq("qr_code", codigo).maybeSingle();
      found = data as Participante | null;
    } else {
      found = cachedParticipantes.current.find(p => p.qr_code === codigo) ?? null;
    }
    if (!found) { setNotFound(true); setParticipante(null); return; }
    setNotFound(false);
    setParticipante(found);
    resetProntuario();
    setTermoStatus(null);

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
      } else setHakuna(null);

      if (servidor) loadMedications(servidor.id);
      loadHistorico(found.id);
      loadTermoData(found.id);
    }
  };

  const resetProntuario = () => {
    setTemperatura(""); setGlicemia(""); setPressaoSis(""); setPressaoDia("");
    setMedId(""); setMedQtd(""); setMedVia(""); setObservacoes("");
  };

  const handleBuscaCodigo = async () => {
    const codigo = manualCodigo.trim();
    if (!codigo) return;
    await lookupParticipante(codigo);
    if (!participante) {
      // lookupParticipante sets notFound if not found
    }
  };

  const handleBuscaCpf = async () => {
    const cpfLimpo = manualCpf.replace(/\D/g, "");
    if (cpfLimpo.length !== 11) { toast({ title: "CPF inválido", variant: "destructive" }); return; }
    let found: Participante | null = null;
    if (isOnline) {
      const { data } = await supabase.from("participantes").select("*").eq("cpf", cpfLimpo).maybeSingle();
      found = data as Participante | null;
    } else {
      found = cachedParticipantes.current.find(p => p.cpf.replace(/\D/g, "") === cpfLimpo) ?? null;
    }
    if (!found) { setNotFound(true); setParticipante(null); return; }
    setNotFound(false);
    setParticipante(found);
    resetProntuario();
    setTermoStatus(null);
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
      } else setHakuna(null);
      if (servidor) loadMedications(servidor.id);
      loadHistorico(found.id);
      loadTermoData(found.id);
    }
  };

  const startScanner = async () => {
    if (scannerActive) return;
    setParticipante(null); setNotFound(false);
    try {
      const scanner = new Html5Qrcode(containerId);
      scannerRef.current = scanner;
      await scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decoded) => { scanner.pause(true); lookupParticipante(decoded); stopScanner(); },
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

  const handleSalvarAtendimento = async () => {
    if (!participante || !servidor) return;
    setSaving(true);
    try {
      const temp = temperatura ? parseFloat(temperatura) : null;
      const glic = glicemia ? parseInt(glicemia) : null;
      const pSis = pressaoSis ? parseInt(pressaoSis) : null;
      const pDia = pressaoDia ? parseInt(pressaoDia) : null;

      // Determine medication info
      let medNome: string | null = null;
      let medOrigem: string | null = null;
      const medQtdNum = medQtd ? parseInt(medQtd) : null;

      if (medId && medQtdNum) {
        // Check necessaire first
        const necItem = necessaire.find(n => n.medicamento_id === medId);
        if (necItem && necItem.quantidade >= medQtdNum) {
          medNome = necItem.medicamento_nome;
          medOrigem = "necessaire";
          await supabase.from("hakuna_necessaire").update({ quantidade: necItem.quantidade - medQtdNum }).eq("id", necItem.id);
        } else {
          // Fallback to estoque geral
          const estItem = estoqueGeral.find(e => e.id === medId);
          if (estItem) {
            medNome = estItem.nome;
            medOrigem = "geral";
            await supabase.from("hakuna_estoque_medicamentos").update({ quantidade: estItem.quantidade - medQtdNum }).eq("id", estItem.id);
          }
        }
      }

      await supabase.from("atendimentos_hakuna").insert({
        participante_id: participante.id,
        hakuna_servidor_id: servidor.id,
        temperatura: temp,
        temperatura_status: temp ? tempStatus(temp).label.toLowerCase().replace(/[- ]/g, "_") : null,
        glicemia: glic,
        glicemia_status: glic ? glicStatus(glic).label.toLowerCase() : null,
        pressao_sistolica: pSis,
        pressao_diastolica: pDia,
        pressao_status: pSis && pDia ? pressaoStatus(pSis, pDia).label.toLowerCase().replace(/[ ]/g, "_") : null,
        medicamento_id: medId || null,
        medicamento_nome: medNome,
        medicamento_quantidade: medQtdNum,
        medicamento_via: medVia || null,
        medicamento_origem: medOrigem,
        observacoes: observacoes || null,
      } as any);

      toast({ title: "✅ Atendimento registrado!" });
      resetProntuario();
      loadHistorico(participante.id);
      if (servidor) loadMedications(servidor.id);
    } catch (e: any) {
      toast({ title: "Erro ao salvar", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleSalvarTermo = async (novoStatus: "aceito" | "recusado") => {
    if (!participante) return;
    setSavingTermo(true);
    try {
      const assinaturaBase64 =
        novoStatus === "aceito" && assinaturaPad && !assinaturaPad.isEmpty()
          ? assinaturaPad.toDataURL("image/png")
          : null;

      await (supabase.from("tirolesa_termo_aceite" as any) as any).upsert({
        participante_id: participante.id,
        top_id: participante.top_id ?? null,
        status: novoStatus,
        registrado_por: userId ?? null,
        registrado_por_nome: servidor?.nome ?? null,
        aceito_em: novoStatus === "aceito" ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
        assinatura_base64: assinaturaBase64,
      }, { onConflict: "participante_id,top_id" });
      setTermoStatus(novoStatus);
      setTermoDialogOpen(false);
      setTermoCheckbox(false);
      setAssinaturaVazia(true);
      toast({
        title: novoStatus === "aceito" ? "✅ Termo aceito registrado!" : "❌ Recusa do termo registrada.",
      });
    } catch (e: any) {
      toast({ title: "Erro ao salvar termo", variant: "destructive" });
    } finally {
      setSavingTermo(false);
    }
  };

  const hasDoenca = !!(participante?.doenca || participante?.medicamentos || participante?.alergia_alimentar);
  const idade = participante ? calcAge(participante.data_nascimento) : null;

  // Real-time badge computations
  const tempVal = temperatura ? parseFloat(temperatura) : null;
  const glicVal = glicemia ? parseInt(glicemia) : null;
  const pSisVal = pressaoSis ? parseInt(pressaoSis) : null;
  const pDiaVal = pressaoDia ? parseInt(pressaoDia) : null;

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
            <Button onClick={startScanner} className="w-full h-16 text-lg bg-blue-600 hover:bg-blue-700">
              <Camera className="h-6 w-6 mr-2" /> Bipar Pulseira
            </Button>
          ) : (
            <Button variant="outline" onClick={stopScanner} className="w-full h-14">Parar Scanner</Button>
          )}

          {/* Busca Manual */}
          <div className="space-y-3 pt-2">
            <p className="text-sm text-muted-foreground">Ou busque manualmente:</p>
            <div className="grid grid-cols-1 gap-3">
              <div className="flex gap-2">
                <Input
                  value={manualCodigo}
                  onChange={e => setManualCodigo(e.target.value)}
                  placeholder="TOP-1575-0001"
                  className="h-12 flex-1"
                />
                <Button onClick={handleBuscaCodigo} className="h-12 px-4" disabled={!manualCodigo.trim()}>
                  <Search className="h-4 w-4 mr-1" /> Código
                </Button>
              </div>
              <div className="flex gap-2">
                <Input
                  value={manualCpf}
                  onChange={e => setManualCpf(maskCPF(e.target.value))}
                  placeholder="000.000.000-00"
                  className="h-12 flex-1"
                  inputMode="numeric"
                />
                <Button onClick={handleBuscaCpf} className="h-12 px-4" disabled={manualCpf.replace(/\D/g, "").length !== 11}>
                  <Search className="h-4 w-4 mr-1" /> CPF
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {notFound && (
        <div className="text-center space-y-4">
          <p className="text-lg text-muted-foreground">Pulseira sem participante vinculado</p>
          <Button onClick={() => setNotFound(false)} className="w-full h-14 text-lg bg-blue-600 hover:bg-blue-700">
            <Camera className="h-5 w-5 mr-2" /> Bipar Outra Pulseira
          </Button>
        </div>
      )}

      {participante && (
        <div className="space-y-4">
          {/* SEÇÃO 1: DADOS DO PARTICIPANTE */}
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

          <Card>
            <CardContent className="p-4 space-y-2">
              <p className="text-2xl font-bold">{participante.nome}</p>
              <Badge className="bg-orange-500 text-white text-lg px-3 py-1">Família Nº {participante.familia_id ?? "?"}</Badge>
              {idade !== null && <p className="text-lg">Idade: {idade} anos</p>}
              {hakuna ? (
                <p className="text-sm text-muted-foreground">Hakuna: {hakuna.nome}{hakuna.profissao ? ` - ${hakuna.profissao}` : ""}</p>
              ) : (
                <p className="text-sm text-muted-foreground">Hakuna: não atribuído</p>
              )}
            </CardContent>
          </Card>

          {(participante.contato_nome || participante.contato_telefone) && (
            <Card className="bg-muted/50">
              <CardContent className="p-4 space-y-1">
                <p className="text-sm text-muted-foreground">📞 Contato de Emergência</p>
                {participante.contato_nome && <p className="text-lg">{participante.contato_nome}</p>}
                {participante.contato_telefone && (
                  <a href={`tel:${participante.contato_telefone.replace(/\D/g, "")}`} className="text-lg text-blue-400 underline flex items-center gap-2">
                    <Phone className="h-4 w-4" /> {participante.contato_telefone}
                  </a>
                )}
              </CardContent>
            </Card>
          )}

          {/* SEÇÃO: TERMO DE RESPONSABILIDADE DA TIROLESA */}
          <Card className={
            termoStatus === "aceito"
              ? "border-green-500/50 bg-green-500/5"
              : termoStatus === "recusado"
              ? "border-destructive/50 bg-destructive/5"
              : "border-border bg-muted/30"
          }>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <p className="text-sm font-semibold flex items-center gap-2">
                  <FileText className="h-4 w-4" /> Tirolesa — Termo de Responsabilidade
                </p>
                {termoStatus === "aceito" && (
                  <Badge className="bg-green-600 text-white text-xs">✅ Aceito</Badge>
                )}
                {termoStatus === "recusado" && (
                  <Badge variant="destructive" className="text-xs">❌ Recusado</Badge>
                )}
                {(termoStatus === "pendente" || termoStatus === null) && (
                  <Badge variant="outline" className="text-xs text-muted-foreground">⏳ Pendente</Badge>
                )}
              </div>
              <Button
                size="sm"
                variant="outline"
                className="w-full"
                onClick={() => { setTermoCheckbox(false); setTermoDialogOpen(true); }}
              >
                <FileText className="h-4 w-4 mr-2" /> Abrir Termo de Responsabilidade
              </Button>
            </CardContent>
          </Card>

          {/* SEÇÃO 2: PRONTUÁRIO */}
          <Card>
            <CardContent className="p-4">
              <p className="text-lg font-bold flex items-center gap-2 mb-4">
                <ClipboardList className="h-5 w-5" /> Prontuário de Atendimento

              </p>
              <Tabs defaultValue="registrar">
                <TabsList className="w-full">
                  <TabsTrigger value="registrar" className="flex-1">Registrar</TabsTrigger>
                  <TabsTrigger value="historico" className="flex-1">Histórico ({historico.length})</TabsTrigger>
                </TabsList>

                <TabsContent value="registrar" className="space-y-4 mt-4">
                  {/* Temperatura */}
                  <div className="space-y-1">
                    <label className="text-sm font-medium flex items-center gap-1"><Thermometer className="h-4 w-4" /> Temperatura (°C)</label>
                    <div className="flex items-center gap-2">
                      <Input type="number" step="0.1" value={temperatura} onChange={e => setTemperatura(e.target.value)} placeholder="36.5" className="h-12 text-lg" inputMode="decimal" />
                      {tempVal !== null && !isNaN(tempVal) && (
                        <Badge className={`${tempStatus(tempVal).color} text-white`}>{tempStatus(tempVal).label}</Badge>
                      )}
                    </div>
                  </div>

                  {/* Glicemia */}
                  <div className="space-y-1">
                    <label className="text-sm font-medium flex items-center gap-1"><Droplets className="h-4 w-4" /> Glicemia (mg/dL)</label>
                    <div className="flex items-center gap-2">
                      <Input type="number" value={glicemia} onChange={e => setGlicemia(e.target.value)} placeholder="100" className="h-12 text-lg" inputMode="numeric" />
                      {glicVal !== null && !isNaN(glicVal) && (
                        <Badge className={`${glicStatus(glicVal).color} text-white`}>{glicStatus(glicVal).label}</Badge>
                      )}
                    </div>
                  </div>

                  {/* Pressão */}
                  <div className="space-y-1">
                    <label className="text-sm font-medium flex items-center gap-1"><Heart className="h-4 w-4" /> Pressão Arterial</label>
                    <div className="flex items-center gap-2">
                      <Input type="number" value={pressaoSis} onChange={e => setPressaoSis(e.target.value)} placeholder="120" className="h-12 text-lg flex-1" inputMode="numeric" />
                      <span className="text-muted-foreground">/</span>
                      <Input type="number" value={pressaoDia} onChange={e => setPressaoDia(e.target.value)} placeholder="80" className="h-12 text-lg flex-1" inputMode="numeric" />
                      {pSisVal && pDiaVal && !isNaN(pSisVal) && !isNaN(pDiaVal) && (() => {
                        const s = pressaoStatus(pSisVal, pDiaVal);
                        return <Badge className={`${s.color} text-white ${s.pulse ? "animate-pulse" : ""}`}>{s.label}</Badge>;
                      })()}
                    </div>
                  </div>

                  {/* Medicamento */}
                  <div className="space-y-1">
                    <label className="text-sm font-medium flex items-center gap-1"><Pill className="h-4 w-4" /> Medicamento</label>
                    <select
                      value={medId}
                      onChange={e => setMedId(e.target.value)}
                      className="w-full h-12 rounded-md border border-input bg-background px-3 text-sm"
                    >
                      <option value="">Nenhum</option>
                      {necessaire.length > 0 && (
                        <optgroup label="Minha Necessaire">
                          {necessaire.filter(n => (n.quantidade ?? 0) > 0).map(n => (
                            <option key={`nec-${n.medicamento_id}`} value={n.medicamento_id}>
                              {n.medicamento_nome} (disp: {n.quantidade})
                            </option>
                          ))}
                        </optgroup>
                      )}
                      <optgroup label="Estoque Geral">
                        {estoqueGeral.filter(e => e.quantidade > 0).map(e => (
                          <option key={`est-${e.id}`} value={e.id}>
                            {e.nome} (disp: {e.quantidade})
                          </option>
                        ))}
                      </optgroup>
                    </select>
                    {medId && (
                      <div className="flex gap-2 mt-2">
                        <Input type="number" value={medQtd} onChange={e => setMedQtd(e.target.value)} placeholder="Qtd" className="h-10 w-24" inputMode="numeric" />
                        <Select value={medVia} onValueChange={setMedVia}>
                          <SelectTrigger className="flex-1 h-10"><SelectValue placeholder="Via" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="oral">Oral</SelectItem>
                            <SelectItem value="sublingual">Sublingual</SelectItem>
                            <SelectItem value="intramuscular">Intramuscular</SelectItem>
                            <SelectItem value="intravenosa">Intravenosa</SelectItem>
                            <SelectItem value="topica">Tópica</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>

                  {/* Observações */}
                  <div className="space-y-1">
                    <label className="text-sm font-medium">Observações</label>
                    <Textarea value={observacoes} onChange={e => setObservacoes(e.target.value)} placeholder="Observações do atendimento..." />
                  </div>

                  <Button onClick={handleSalvarAtendimento} disabled={saving} className="w-full h-14 text-lg bg-blue-600 hover:bg-blue-700">
                    {saving ? "Salvando..." : "💾 Salvar Atendimento"}
                  </Button>
                </TabsContent>

                <TabsContent value="historico" className="mt-4">
                  {historico.length === 0 ? (
                    <p className="text-muted-foreground text-center py-4">Nenhum atendimento registrado</p>
                  ) : (
                    <div className="space-y-3">
                      {historico.map((h: any) => (
                        <Card key={h.id} className="border-l-4 border-l-blue-500">
                          <CardContent className="p-3 space-y-1">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              {h.created_at ? new Date(h.created_at).toLocaleString("pt-BR") : ""}
                            </div>
                            <p className="text-sm font-medium">
                              Hakuna: {(h as any).servidores?.nome ?? "—"}
                            </p>
                            <div className="flex flex-wrap gap-1">
                              {h.temperatura && (
                                <Badge className={`${tempStatus(Number(h.temperatura)).color} text-white text-xs`}>
                                  🌡 {h.temperatura}°C - {tempStatus(Number(h.temperatura)).label}
                                </Badge>
                              )}
                              {h.glicemia && (
                                <Badge className={`${glicStatus(h.glicemia).color} text-white text-xs`}>
                                  🩸 {h.glicemia} mg/dL - {glicStatus(h.glicemia).label}
                                </Badge>
                              )}
                              {h.pressao_sistolica && h.pressao_diastolica && (
                                <Badge className={`${pressaoStatus(h.pressao_sistolica, h.pressao_diastolica).color} text-white text-xs`}>
                                  ❤️ {h.pressao_sistolica}/{h.pressao_diastolica} - {pressaoStatus(h.pressao_sistolica, h.pressao_diastolica).label}
                                </Badge>
                              )}
                            </div>
                            {h.medicamento_nome && (
                              <p className="text-sm">💊 {h.medicamento_nome} x{h.medicamento_quantidade} ({h.medicamento_via})</p>
                            )}
                            {h.observacoes && <p className="text-sm text-muted-foreground">{h.observacoes}</p>}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          <Button
            onClick={() => { setParticipante(null); setHakuna(null); setHistorico([]); setTermoStatus(null); }}
            className="w-full h-14 text-lg bg-blue-600 hover:bg-blue-700"
          >
            <Camera className="h-5 w-5 mr-2" /> Bipar Outra Pulseira
          </Button>
        </div>
      )}

      {/* Dialog: Termo de Responsabilidade */}
      <Dialog open={termoDialogOpen} onOpenChange={(v) => { setTermoDialogOpen(v); if (!v) { setTermoCheckbox(false); setAssinaturaVazia(true); } }}>
        <DialogContent className="max-w-lg max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" /> Termo de Responsabilidade — Tirolesa
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto space-y-4 py-2">
            <div className="bg-muted/50 rounded-lg p-4 text-sm leading-relaxed whitespace-pre-wrap max-h-64 overflow-y-auto">
              {termoTexto}
            </div>
            <div className="flex items-start gap-3 p-3 border rounded-lg">
              <Checkbox
                id="termo-checkbox"
                checked={termoCheckbox}
                onCheckedChange={(v) => { setTermoCheckbox(!!v); if (!v) { assinaturaPad?.clear(); setAssinaturaVazia(true); } }}
                className="mt-0.5"
              />
              <label htmlFor="termo-checkbox" className="text-sm cursor-pointer leading-snug">
                O participante <strong>{participante?.nome}</strong> leu e aceita o Termo de Responsabilidade da Tirolesa.
              </label>
            </div>

            {/* Canvas de Assinatura — aparece após marcar o checkbox */}
            {termoCheckbox && (
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Assinatura do Participante <span className="text-destructive">*</span>
                </label>
                <div className="border rounded-lg overflow-hidden" style={{ background: "white" }}>
                  <canvas
                    ref={canvasRef}
                    className="w-full touch-none"
                    height={160}
                    style={{ display: "block" }}
                  />
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  type="button"
                  onClick={() => { assinaturaPad?.clear(); setAssinaturaVazia(true); }}
                >
                  🔄 Limpar Assinatura
                </Button>
                {assinaturaVazia && (
                  <p className="text-xs text-destructive">Assinatura obrigatória para confirmar aceite.</p>
                )}
              </div>
            )}
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2 pt-2">
            <Button
              variant="outline"
              className="border-destructive text-destructive hover:bg-destructive/10 flex-1"
              onClick={() => handleSalvarTermo("recusado")}
              disabled={savingTermo}
            >
              ❌ Recusar Termo
            </Button>
            <Button
              className="bg-green-600 hover:bg-green-700 text-white flex-1"
              disabled={!termoCheckbox || assinaturaVazia || savingTermo}
              onClick={() => handleSalvarTermo("aceito")}
            >
              ✅ Confirmar Aceite
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

