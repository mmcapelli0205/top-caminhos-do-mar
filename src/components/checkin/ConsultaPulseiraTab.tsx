import { useState, useEffect, useRef, useCallback } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Camera, Phone, Thermometer, Droplets, Heart, Pill, ClipboardList, Clock, Search } from "lucide-react";
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

  const cachedParticipantes = useRef<Participante[]>([]);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [scannerActive, setScannerActive] = useState(false);
  const containerId = "consulta-scanner";

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

          <Button onClick={() => { setParticipante(null); setHakuna(null); setHistorico([]); }} className="w-full h-14 text-lg bg-blue-600 hover:bg-blue-700">
            <Camera className="h-5 w-5 mr-2" /> Bipar Outra Pulseira
          </Button>
        </div>
      )}
    </div>
  );
}
