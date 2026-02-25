import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, ArrowLeft, Save } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { validateCPF, maskCPF, maskPhone } from "@/lib/cpf";
import { useToast } from "@/hooks/use-toast";

import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const AREAS_SERVICO = [
  "Hakuna", "Segurança", "Eventos", "Mídia", "Comunicação",
  "Logística", "Voz", "ADM",
  "Intercessão", "Louvor", "Diretoria",
];

const HABILIDADES = [
  "Louvor/Instrumentos", "Evangelista", "Avançado em Excel",
  "Fala Inglês fluente", "Sabe pilotar barco a motor",
  "Tem curso de emergência e primeiros socorros",
  "Bombeiro ou resgate", "Médico ou enfermeiro",
  "Sou da área de saúde", "Sou fotógrafo",
  "Faço edição de foto e vídeos",
  "Tenho experiência em cozinha industrial",
];

const EXPERIENCIAS = [
  "Primeira vez", "Já servi em 1 TOP", "Já servi em 2 TOPs", "Já servi em 3 ou mais TOPs",
];

const schema = z.object({
  nome: z.string().min(1, "Nome é obrigatório"),
  email: z.string().email("Email inválido"),
  telefone: z.string().min(1, "Telefone é obrigatório"),
  estrangeiro: z.boolean(),
  cpf: z.string(),
  data_nascimento: z.string().min(1, "Data de nascimento é obrigatória"),
  numero_legendario: z.string().min(1, "Número legendário é obrigatório"),
  experiencia: z.string().optional(),
  
  pais: z.string(),
  cep: z.string().optional(),
  endereco: z.string().optional(),
  cidade: z.string().optional(),
  estado: z.string().optional(),
  igreja: z.string().optional(),
  sede: z.string().optional(),
  habilidades: z.string(),
  areas_servidas: z.string(),
  area_preferencia_1: z.string().min(1, "1ª preferência é obrigatória"),
  area_preferencia_2: z.string().min(1, "2ª preferência é obrigatória"),
  contato_nome: z.string().min(1, "Nome do contato é obrigatório"),
  contato_email: z.string().email("Email inválido"),
  contato_telefone: z.string().min(1, "Telefone do contato é obrigatório"),
  tem_veiculo: z.boolean(),
  tem_recurso: z.boolean(),
  recurso_descricao: z.string().optional(),
  cupom_desconto: z.string().optional(),
  valor_pago: z.coerce.number().min(0).optional().or(z.literal("").transform(() => undefined)),
  forma_pagamento: z.string().optional(),
}).refine(d => d.estrangeiro || validateCPF(d.cpf), {
  message: "CPF inválido", path: ["cpf"],
}).refine(d => d.area_preferencia_1 !== d.area_preferencia_2, {
  message: "Deve ser diferente da 1ª preferência", path: ["area_preferencia_2"],
});

type FormData = z.infer<typeof schema>;

function maskCEP(v: string) {
  const d = v.replace(/\D/g, "").slice(0, 8);
  return d.length > 5 ? d.replace(/(\d{5})(\d)/, "$1-$2") : d;
}

export default function ServidorForm() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);

  const defaultArea = searchParams.get("area") || "";

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      nome: "", email: "", telefone: "", estrangeiro: false, cpf: "",
      data_nascimento: "", numero_legendario: "", experiencia: "",
      pais: "Brasil", cep: "", endereco: "", cidade: "", estado: "",
      igreja: "", sede: "", habilidades: "[]", areas_servidas: "[]",
      area_preferencia_1: defaultArea, area_preferencia_2: "",
      contato_nome: "", contato_email: "", contato_telefone: "",
      tem_veiculo: false, tem_recurso: false, recurso_descricao: "",
      cupom_desconto: "", forma_pagamento: "",
    },
  });

  const estrangeiro = form.watch("estrangeiro");
  const temRecurso = form.watch("tem_recurso");
  const areaPref1 = form.watch("area_preferencia_1");

  // Parse JSON arrays for checkboxes
  const habilidadesValue: string[] = (() => { try { return JSON.parse(form.watch("habilidades")); } catch { return []; } })();
  const areasServidasValue: string[] = (() => { try { return JSON.parse(form.watch("areas_servidas")); } catch { return []; } })();

  useEffect(() => {
    if (!isEdit) return;
    (async () => {
      const { data, error } = await supabase.from("servidores").select("*").eq("id", id).maybeSingle();
      if (error || !data) {
        toast({ title: "Servidor não encontrado", variant: "destructive" });
        navigate("/servidores");
        return;
      }
      form.reset({
        nome: data.nome ?? "", email: data.email ?? "", telefone: data.telefone ? maskPhone(data.telefone) : "",
        estrangeiro: data.estrangeiro ?? false, cpf: data.cpf ? maskCPF(data.cpf) : "",
        data_nascimento: data.data_nascimento ?? "", numero_legendario: data.numero_legendario ?? "",
        experiencia: data.experiencia ?? "",
        pais: data.pais ?? "Brasil", cep: data.cep ?? "", endereco: data.endereco ?? "",
        cidade: data.cidade ?? "", estado: data.estado ?? "", igreja: data.igreja ?? "", sede: data.sede ?? "",
        habilidades: data.habilidades ?? "[]", areas_servidas: data.areas_servidas ?? "[]",
        area_preferencia_1: data.area_preferencia_1 ?? "", area_preferencia_2: data.area_preferencia_2 ?? "",
        contato_nome: data.contato_nome ?? "", contato_email: data.contato_email ?? "",
        contato_telefone: data.contato_telefone ? maskPhone(data.contato_telefone) : "",
        tem_veiculo: data.tem_veiculo ?? false, tem_recurso: data.tem_recurso ?? false,
        recurso_descricao: data.recurso_descricao ?? "", cupom_desconto: data.cupom_desconto ?? "",
        valor_pago: data.valor_pago ?? undefined, forma_pagamento: data.forma_pagamento ?? "",
      });
    })();
  }, [id, isEdit]);

  async function fetchCEP(cep: string) {
    const digits = cep.replace(/\D/g, "");
    if (digits.length !== 8) return;
    try {
      const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
      const data = await res.json();
      if (data.erro) { toast({ title: "CEP não encontrado", variant: "destructive" }); return; }
      form.setValue("endereco", data.logradouro || "");
      form.setValue("cidade", data.localidade || "");
      form.setValue("estado", data.uf || "");
    } catch { toast({ title: "Erro ao buscar CEP", variant: "destructive" }); }
  }

  function toggleArrayItem(field: "habilidades" | "areas_servidas", item: string, current: string[]) {
    const next = current.includes(item) ? current.filter(i => i !== item) : [...current, item];
    form.setValue(field, JSON.stringify(next));
  }

  async function onSubmit(values: FormData) {
    setSaving(true);
    const telDigits = values.telefone.replace(/\D/g, "");
    const cpfDigits = values.cpf.replace(/\D/g, "");
    const contatoTelDigits = values.contato_telefone.replace(/\D/g, "");

    const payload: Record<string, unknown> = {
      nome: values.nome.trim(), email: values.email, telefone: telDigits,
      estrangeiro: values.estrangeiro, cpf: values.estrangeiro ? null : cpfDigits,
      data_nascimento: values.data_nascimento || null, numero_legendario: values.numero_legendario,
      experiencia: values.experiencia || null,
      pais: values.pais, cep: values.cep?.replace(/\D/g, "") || null,
      endereco: values.endereco || null, cidade: values.cidade || null, estado: values.estado || null,
      igreja: values.igreja || null, sede: values.sede || null,
      habilidades: values.habilidades, areas_servidas: values.areas_servidas,
      area_preferencia_1: values.area_preferencia_1, area_preferencia_2: values.area_preferencia_2,
      contato_nome: values.contato_nome, contato_email: values.contato_email, contato_telefone: contatoTelDigits,
      tem_veiculo: values.tem_veiculo, tem_recurso: values.tem_recurso,
      recurso_descricao: values.tem_recurso ? (values.recurso_descricao || null) : null,
      cupom_desconto: values.cupom_desconto || null,
      valor_pago: values.valor_pago ?? 0, forma_pagamento: values.forma_pagamento || null,
      updated_at: new Date().toISOString(),
    };

    let error;
    if (isEdit) {
      ({ error } = await supabase.from("servidores").update(payload).eq("id", id));
    } else {
      payload.qr_code = crypto.randomUUID();
      payload.area_servico = values.area_preferencia_1;
      payload.status = "pendente";
      const { data: inserted, error: insertErr } = await supabase.from("servidores").insert(payload as any).select().single();
      error = insertErr;
      // Create hakuna record if applicable
      if (!error && inserted && values.area_preferencia_1 === "Hakuna") {
        await supabase.from("hakunas").insert({ servidor_id: inserted.id });
      }
    }

    setSaving(false);
    if (error) {
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: `Servidor ${isEdit ? "atualizado" : "cadastrado"} com sucesso!` });
    queryClient.invalidateQueries({ queryKey: ["servidores"] });
    navigate("/servidores");
  }

  return (
    <div className="space-y-4 max-w-3xl">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/servidores")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold text-foreground">{isEdit ? "Editar Servidor" : "Novo Servidor"}</h1>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <Tabs defaultValue="pessoais">
            <TabsList className="flex-wrap h-auto">
              <TabsTrigger value="pessoais">Dados Pessoais</TabsTrigger>
              <TabsTrigger value="endereco">Endereço & Igreja</TabsTrigger>
              <TabsTrigger value="habilidades">Habilidades & Área</TabsTrigger>
              <TabsTrigger value="contato">Contato & Recursos</TabsTrigger>
            </TabsList>

            {/* Tab 1 - Dados Pessoais */}
            <TabsContent value="pessoais">
              <div className="grid gap-4 sm:grid-cols-2 mt-4">
                <FormField control={form.control} name="nome" render={({ field }) => (
                  <FormItem className="sm:col-span-2"><FormLabel>Nome *</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="email" render={({ field }) => (
                  <FormItem><FormLabel>Email *</FormLabel><FormControl><Input type="email" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="telefone" render={({ field }) => (
                  <FormItem><FormLabel>Telefone *</FormLabel><FormControl><Input {...field} placeholder="(00) 00000-0000" onChange={e => field.onChange(maskPhone(e.target.value))} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="estrangeiro" render={({ field }) => (
                  <FormItem className="flex items-center gap-2 space-y-0">
                    <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                    <FormLabel>Sou estrangeiro</FormLabel>
                  </FormItem>
                )} />
                <FormField control={form.control} name="cpf" render={({ field }) => (
                  <FormItem><FormLabel>CPF {estrangeiro ? "" : "*"}</FormLabel><FormControl><Input {...field} disabled={estrangeiro} placeholder="000.000.000-00" onChange={e => field.onChange(maskCPF(e.target.value))} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="data_nascimento" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data de Nascimento *</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !field.value && "text-muted-foreground")}>
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {field.value ? format(new Date(field.value + "T12:00:00"), "dd/MM/yyyy") : "Selecione"}
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar mode="single" locale={ptBR}
                          selected={field.value ? new Date(field.value + "T12:00:00") : undefined}
                          onSelect={date => field.onChange(date ? format(date, "yyyy-MM-dd") : "")}
                          defaultMonth={new Date(1990, 0)} captionLayout="dropdown-buttons"
                          fromYear={1930} toYear={2010} className="p-3 pointer-events-auto" />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="numero_legendario" render={({ field }) => (
                  <FormItem><FormLabel>Nº Legendário *</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="experiencia" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Experiência</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value ?? ""}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger></FormControl>
                      <SelectContent>{EXPERIENCIAS.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}</SelectContent>
                    </Select>
                  </FormItem>
                )} />
              </div>
            </TabsContent>

            {/* Tab 2 - Endereço */}
            <TabsContent value="endereco">
              <div className="grid gap-4 sm:grid-cols-2 mt-4">
                <FormField control={form.control} name="pais" render={({ field }) => (
                  <FormItem>
                    <FormLabel>País</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        {["Brasil", "Estados Unidos", "Portugal", "Outro"].map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )} />
                <FormField control={form.control} name="cep" render={({ field }) => (
                  <FormItem>
                    <FormLabel>CEP</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value ?? ""} placeholder="00000-000"
                        onChange={e => {
                          const masked = maskCEP(e.target.value);
                          field.onChange(masked);
                          if (masked.replace(/\D/g, "").length === 8) fetchCEP(masked);
                        }} />
                    </FormControl>
                  </FormItem>
                )} />
                <FormField control={form.control} name="endereco" render={({ field }) => (
                  <FormItem className="sm:col-span-2"><FormLabel>Endereço</FormLabel><FormControl><Input {...field} value={field.value ?? ""} /></FormControl></FormItem>
                )} />
                <FormField control={form.control} name="cidade" render={({ field }) => (
                  <FormItem><FormLabel>Cidade</FormLabel><FormControl><Input {...field} value={field.value ?? ""} /></FormControl></FormItem>
                )} />
                <FormField control={form.control} name="estado" render={({ field }) => (
                  <FormItem><FormLabel>Estado</FormLabel><FormControl><Input {...field} value={field.value ?? ""} /></FormControl></FormItem>
                )} />
                <FormField control={form.control} name="igreja" render={({ field }) => (
                  <FormItem><FormLabel>Igreja</FormLabel><FormControl><Input {...field} value={field.value ?? ""} /></FormControl></FormItem>
                )} />
                <FormField control={form.control} name="sede" render={({ field }) => (
                  <FormItem><FormLabel>Sede</FormLabel><FormControl><Input {...field} value={field.value ?? ""} /></FormControl></FormItem>
                )} />
              </div>
            </TabsContent>

            {/* Tab 3 - Habilidades & Área */}
            <TabsContent value="habilidades">
              <div className="space-y-6 mt-4">
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-3">Habilidades</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {HABILIDADES.map(h => (
                      <label key={h} className="flex items-center gap-2 text-sm cursor-pointer">
                        <Checkbox checked={habilidadesValue.includes(h)} onCheckedChange={() => toggleArrayItem("habilidades", h, habilidadesValue)} />
                        {h}
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-3">Áreas que já serviu</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {AREAS_SERVICO.map(a => (
                      <label key={a} className="flex items-center gap-2 text-sm cursor-pointer">
                        <Checkbox checked={areasServidasValue.includes(a)} onCheckedChange={() => toggleArrayItem("areas_servidas", a, areasServidasValue)} />
                        {a}
                      </label>
                    ))}
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField control={form.control} name="area_preferencia_1" render={({ field }) => (
                    <FormItem>
                      <FormLabel>1ª Preferência de Área *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger></FormControl>
                        <SelectContent>{AREAS_SERVICO.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}</SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="area_preferencia_2" render={({ field }) => (
                    <FormItem>
                      <FormLabel>2ª Preferência de Área *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger></FormControl>
                        <SelectContent>{AREAS_SERVICO.filter(a => a !== areaPref1).map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}</SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
              </div>
            </TabsContent>

            {/* Tab 4 - Contato & Recursos */}
            <TabsContent value="contato">
              <div className="grid gap-4 sm:grid-cols-2 mt-4">
                <FormField control={form.control} name="contato_nome" render={({ field }) => (
                  <FormItem className="sm:col-span-2"><FormLabel>Nome do Contato (esposa/mãe) *</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="contato_email" render={({ field }) => (
                  <FormItem><FormLabel>Email do Contato *</FormLabel><FormControl><Input type="email" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="contato_telefone" render={({ field }) => (
                  <FormItem><FormLabel>Telefone do Contato *</FormLabel><FormControl><Input {...field} placeholder="(00) 00000-0000" onChange={e => field.onChange(maskPhone(e.target.value))} /></FormControl><FormMessage /></FormItem>
                )} />

                <FormField control={form.control} name="tem_veiculo" render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel>Tem Caminhonete, Carro 4x4, Van ou outro veículo?</FormLabel>
                    <FormControl>
                      <RadioGroup value={field.value ? "sim" : "nao"} onValueChange={v => field.onChange(v === "sim")} className="flex gap-4">
                        <div className="flex items-center gap-2"><RadioGroupItem value="sim" id="veiculo-sim" /><Label htmlFor="veiculo-sim">Sim</Label></div>
                        <div className="flex items-center gap-2"><RadioGroupItem value="nao" id="veiculo-nao" /><Label htmlFor="veiculo-nao">Não</Label></div>
                      </RadioGroup>
                    </FormControl>
                  </FormItem>
                )} />

                <FormField control={form.control} name="tem_recurso" render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel>Tem algum recurso ou equipamento útil para servir?</FormLabel>
                    <FormControl>
                      <RadioGroup value={field.value ? "sim" : "nao"} onValueChange={v => field.onChange(v === "sim")} className="flex gap-4">
                        <div className="flex items-center gap-2"><RadioGroupItem value="sim" id="recurso-sim" /><Label htmlFor="recurso-sim">Sim</Label></div>
                        <div className="flex items-center gap-2"><RadioGroupItem value="nao" id="recurso-nao" /><Label htmlFor="recurso-nao">Não</Label></div>
                      </RadioGroup>
                    </FormControl>
                  </FormItem>
                )} />

                {temRecurso && (
                  <FormField control={form.control} name="recurso_descricao" render={({ field }) => (
                    <FormItem className="sm:col-span-2"><FormLabel>Descreva o recurso</FormLabel><FormControl><Input {...field} value={field.value ?? ""} /></FormControl></FormItem>
                  )} />
                )}

                <FormField control={form.control} name="cupom_desconto" render={({ field }) => (
                  <FormItem><FormLabel>Cupom de Desconto</FormLabel><FormControl><Input {...field} value={field.value ?? ""} /></FormControl></FormItem>
                )} />
                <FormField control={form.control} name="valor_pago" render={({ field }) => (
                  <FormItem><FormLabel>Valor Pago (R$)</FormLabel><FormControl><Input type="number" step="0.01" {...field} value={field.value ?? ""} /></FormControl></FormItem>
                )} />
                <FormField control={form.control} name="forma_pagamento" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Forma de Pagamento</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value ?? ""}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger></FormControl>
                      <SelectContent>
                        {["PIX", "Cartão de Crédito", "Cartão de Débito", "Boleto", "Dinheiro", "Outro"].map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )} />
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-2 mt-6">
            <Button type="button" variant="outline" onClick={() => navigate("/servidores")}>Cancelar</Button>
            <Button type="submit" disabled={saving}>
              <Save className="h-4 w-4 mr-1" /> {saving ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
