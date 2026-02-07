import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, Upload, ArrowLeft, Save } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { validateCPF, maskCPF, maskPhone } from "@/lib/cpf";
import { useIsMobile } from "@/hooks/use-mobile";
import { useToast } from "@/hooks/use-toast";

import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { cn } from "@/lib/utils";

const schema = z.object({
  nome: z.string().min(1, "Nome é obrigatório").max(200),
  cpf: z.string().min(1, "CPF é obrigatório").refine((v) => validateCPF(v), "CPF inválido"),
  email: z.string().email("Email inválido").max(255).or(z.literal("")).optional(),
  telefone: z.string().min(1, "Telefone é obrigatório"),
  data_nascimento: z.string().min(1, "Data de nascimento é obrigatória"),
  peso: z.coerce.number().positive().optional().or(z.literal("").transform(() => undefined)),
  altura: z.coerce.number().positive().optional().or(z.literal("").transform(() => undefined)),
  tamanho_farda: z.string().optional(),
  condicionamento: z.number().min(1).max(5).optional(),
  instagram: z.string().max(100).optional(),
  doenca: z.string().max(1000).optional(),
  medicamentos: z.string().max(1000).optional(),
  alergia_alimentar: z.string().max(1000).optional(),
  ergometrico_status: z.string().optional(),
  ergometrico_url: z.string().optional(),
  igreja: z.string().min(1, "Igreja é obrigatória").max(200),
  profissao: z.string().max(200).optional(),
  amigo_parente: z.string().max(200).optional(),
  contato_nome: z.string().max(200).optional(),
  contato_telefone: z.string().max(30).optional(),
  contato_email: z.string().email("Email inválido").or(z.literal("")).optional(),
  inscrito_por: z.string().max(200).optional(),
  motivo_inscricao: z.string().max(1000).optional(),
  forma_pagamento: z.string().optional(),
  cupom_desconto: z.string().max(50).optional(),
  valor_pago: z.coerce.number().min(0).optional().or(z.literal("").transform(() => undefined)),
  contrato_assinado: z.boolean().optional(),
  contrato_url: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

function calcAge(dateStr: string): number | null {
  if (!dateStr) return null;
  const diff = Date.now() - new Date(dateStr).getTime();
  return Math.floor(diff / (365.25 * 86400000));
}

export default function ParticipanteForm() {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      nome: "", cpf: "", email: "", telefone: "", data_nascimento: "",
      igreja: "", condicionamento: 3, contrato_assinado: false,
    },
  });

  const dataNascimento = form.watch("data_nascimento");
  const inscritoPor = form.watch("inscrito_por");
  const age = calcAge(dataNascimento);

  useEffect(() => {
    if (!isEdit) return;
    (async () => {
      const { data, error } = await supabase
        .from("participantes")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (error || !data) {
        toast({ title: "Participante não encontrado", variant: "destructive" });
        navigate("/participantes");
        return;
      }
      form.reset({
        nome: data.nome ?? "",
        cpf: data.cpf ? maskCPF(data.cpf) : "",
        email: data.email ?? "",
        telefone: data.telefone ? maskPhone(data.telefone) : "",
        data_nascimento: data.data_nascimento ?? "",
        peso: data.peso ?? undefined,
        altura: data.altura ?? undefined,
        tamanho_farda: data.tamanho_farda ?? undefined,
        condicionamento: data.condicionamento ?? 3,
        instagram: data.instagram ?? "",
        doenca: data.doenca ?? "",
        medicamentos: data.medicamentos ?? "",
        alergia_alimentar: data.alergia_alimentar ?? "",
        ergometrico_status: data.ergometrico_status ?? "pendente",
        ergometrico_url: data.ergometrico_url ?? "",
        igreja: data.igreja ?? "",
        profissao: data.profissao ?? "",
        amigo_parente: data.amigo_parente ?? "",
        contato_nome: data.contato_nome ?? "",
        contato_telefone: data.contato_telefone ? maskPhone(data.contato_telefone) : "",
        contato_email: data.contato_email ?? "",
        inscrito_por: data.inscrito_por ?? "",
        motivo_inscricao: data.motivo_inscricao ?? "",
        forma_pagamento: data.forma_pagamento ?? undefined,
        cupom_desconto: data.cupom_desconto ?? "",
        valor_pago: data.valor_pago ?? undefined,
        contrato_assinado: data.contrato_assinado ?? false,
        contrato_url: data.contrato_url ?? "",
      });
    })();
  }, [id, isEdit]);

  async function uploadFile(file: File, field: "ergometrico_url" | "contrato_url") {
    setUploading(field);
    const ext = file.name.split(".").pop();
    const path = `participantes/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from("assets").upload(path, file);
    if (error) {
      toast({ title: "Erro no upload", description: error.message, variant: "destructive" });
      setUploading(null);
      return;
    }
    const { data: urlData } = supabase.storage.from("assets").getPublicUrl(path);
    form.setValue(field, urlData.publicUrl);
    setUploading(null);
  }

  async function onSubmit(values: FormData) {
    setSaving(true);
    const cpfDigits = values.cpf.replace(/\D/g, "");
    const telDigits = values.telefone.replace(/\D/g, "");
    const contatoTelDigits = values.contato_telefone?.replace(/\D/g, "") || null;

    const payload: Record<string, unknown> = {
      nome: values.nome.trim(),
      cpf: cpfDigits,
      email: values.email || null,
      telefone: telDigits,
      data_nascimento: values.data_nascimento || null,
      peso: values.peso || null,
      altura: values.altura || null,
      tamanho_farda: values.tamanho_farda || null,
      condicionamento: values.condicionamento ?? null,
      instagram: values.instagram || null,
      doenca: values.doenca || null,
      medicamentos: values.medicamentos || null,
      alergia_alimentar: values.alergia_alimentar || null,
      ergometrico_status: values.ergometrico_status || "pendente",
      ergometrico_url: values.ergometrico_url || null,
      igreja: values.igreja?.trim() || null,
      profissao: values.profissao || null,
      amigo_parente: values.amigo_parente || null,
      contato_nome: values.contato_nome || null,
      contato_telefone: contatoTelDigits,
      contato_email: values.contato_email || null,
      inscrito_por: values.inscrito_por || null,
      motivo_inscricao: values.inscrito_por ? (values.motivo_inscricao || null) : null,
      forma_pagamento: values.forma_pagamento || null,
      cupom_desconto: values.cupom_desconto || null,
      valor_pago: values.valor_pago || null,
      contrato_assinado: values.contrato_assinado ?? false,
      contrato_url: values.contrato_url || null,
      updated_at: new Date().toISOString(),
    };

    let error;
    if (isEdit) {
      ({ error } = await supabase.from("participantes").update(payload).eq("id", id));
    } else {
      payload.qr_code = crypto.randomUUID();
      payload.status = "inscrito";
      ({ error } = await supabase.from("participantes").insert(payload as any));
    }

    setSaving(false);
    if (error) {
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Participante salvo com sucesso!" });
    queryClient.invalidateQueries({ queryKey: ["participantes"] });
    navigate("/participantes");
  }

  const condLabels: Record<number, string> = { 1: "Sedentário", 2: "Leve", 3: "Moderado", 4: "Ativo", 5: "Atleta" };

  // Tab content components
  const TabDadosPessoais = () => (
    <div className="grid gap-4 sm:grid-cols-2">
      <FormField control={form.control} name="nome" render={({ field }) => (
        <FormItem className="sm:col-span-2">
          <FormLabel>Nome *</FormLabel>
          <FormControl><Input {...field} /></FormControl>
          <FormMessage />
        </FormItem>
      )} />
      <FormField control={form.control} name="cpf" render={({ field }) => (
        <FormItem>
          <FormLabel>CPF *</FormLabel>
          <FormControl>
            <Input {...field} placeholder="000.000.000-00"
              onChange={(e) => field.onChange(maskCPF(e.target.value))} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )} />
      <FormField control={form.control} name="email" render={({ field }) => (
        <FormItem>
          <FormLabel>Email</FormLabel>
          <FormControl><Input type="email" {...field} /></FormControl>
          <FormMessage />
        </FormItem>
      )} />
      <FormField control={form.control} name="telefone" render={({ field }) => (
        <FormItem>
          <FormLabel>Telefone *</FormLabel>
          <FormControl>
            <Input {...field} placeholder="(00) 00000-0000"
              onChange={(e) => field.onChange(maskPhone(e.target.value))} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )} />
      <FormField control={form.control} name="data_nascimento" render={({ field }) => (
        <FormItem>
          <FormLabel>Data de Nascimento *</FormLabel>
          <Popover>
            <PopoverTrigger asChild>
              <FormControl>
                <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !field.value && "text-muted-foreground")}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {field.value ? format(new Date(field.value), "dd/MM/yyyy") : "Selecione"}
                </Button>
              </FormControl>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="single" locale={ptBR}
                selected={field.value ? new Date(field.value) : undefined}
                onSelect={(date) => field.onChange(date ? format(date, "yyyy-MM-dd") : "")}
                captionLayout="dropdown-buttons" fromYear={1940} toYear={new Date().getFullYear()} />
            </PopoverContent>
          </Popover>
          <FormMessage />
        </FormItem>
      )} />
      <FormField control={form.control} name="peso" render={({ field }) => (
        <FormItem>
          <FormLabel>Peso (kg)</FormLabel>
          <FormControl><Input type="number" step="0.1" {...field} value={field.value ?? ""} /></FormControl>
        </FormItem>
      )} />
      <FormField control={form.control} name="altura" render={({ field }) => (
        <FormItem>
          <FormLabel>Altura (m)</FormLabel>
          <FormControl><Input type="number" step="0.01" placeholder="1.75" {...field} value={field.value ?? ""} /></FormControl>
        </FormItem>
      )} />
      <FormField control={form.control} name="tamanho_farda" render={({ field }) => (
        <FormItem>
          <FormLabel>Tamanho da Farda</FormLabel>
          <Select onValueChange={field.onChange} value={field.value ?? ""}>
            <FormControl><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger></FormControl>
            <SelectContent>
              {["P", "M", "G", "GG", "XG"].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
        </FormItem>
      )} />
      <FormField control={form.control} name="condicionamento" render={({ field }) => (
        <FormItem className="sm:col-span-2">
          <FormLabel>Condicionamento Físico: {condLabels[field.value ?? 3]}</FormLabel>
          <FormControl>
            <Slider min={1} max={5} step={1} value={[field.value ?? 3]}
              onValueChange={([v]) => field.onChange(v)} />
          </FormControl>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Sedentário</span><span>Moderado</span><span>Atleta</span>
          </div>
        </FormItem>
      )} />
      <FormField control={form.control} name="instagram" render={({ field }) => (
        <FormItem>
          <FormLabel>Instagram</FormLabel>
          <FormControl>
            <div className="flex">
              <span className="inline-flex items-center rounded-l-md border border-r-0 border-input bg-muted px-3 text-sm text-muted-foreground">@</span>
              <Input className="rounded-l-none" {...field} value={field.value ?? ""}
                onChange={(e) => field.onChange(e.target.value.replace(/^@/, ""))} />
            </div>
          </FormControl>
        </FormItem>
      )} />
    </div>
  );

  const TabSaude = () => (
    <div className="grid gap-4">
      <FormField control={form.control} name="doenca" render={({ field }) => (
        <FormItem>
          <FormLabel>Doenças Pré-existentes</FormLabel>
          <FormControl><Textarea placeholder="Descreva doenças pré-existentes ou deixe em branco" {...field} value={field.value ?? ""} /></FormControl>
        </FormItem>
      )} />
      <FormField control={form.control} name="medicamentos" render={({ field }) => (
        <FormItem>
          <FormLabel>Medicamentos</FormLabel>
          <FormControl><Textarea placeholder="Liste medicamentos controlados" {...field} value={field.value ?? ""} /></FormControl>
        </FormItem>
      )} />
      <FormField control={form.control} name="alergia_alimentar" render={({ field }) => (
        <FormItem>
          <FormLabel>Alergias Alimentares</FormLabel>
          <FormControl><Textarea placeholder="Alergias alimentares" {...field} value={field.value ?? ""} /></FormControl>
        </FormItem>
      )} />
      {age !== null && age >= 40 && (
        <>
          <Alert className="border-destructive/50 bg-accent">
            <AlertDescription className="text-accent-foreground font-medium">
              ⚠️ Exame ergométrico obrigatório para maiores de 40 anos.
            </AlertDescription>
          </Alert>
          <FormField control={form.control} name="ergometrico_status" render={({ field }) => (
            <FormItem>
              <FormLabel>Status do Ergométrico</FormLabel>
              <Select onValueChange={field.onChange} value={field.value ?? "pendente"}>
                <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                <SelectContent>
                  {["pendente", "enviado", "aprovado", "dispensado"].map((s) => (
                    <SelectItem key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormItem>
          )} />
          <FormField control={form.control} name="ergometrico_url" render={({ field }) => (
            <FormItem>
              <FormLabel>Arquivo do Ergométrico</FormLabel>
              <FormControl>
                <div className="flex gap-2">
                  <Input {...field} value={field.value ?? ""} placeholder="URL ou faça upload" />
                  <Button type="button" variant="outline" size="icon" disabled={uploading === "ergometrico_url"}
                    onClick={() => {
                      const input = document.createElement("input");
                      input.type = "file";
                      input.accept = ".pdf,.jpg,.jpeg,.png";
                      input.onchange = (e) => {
                        const file = (e.target as HTMLInputElement).files?.[0];
                        if (file) uploadFile(file, "ergometrico_url");
                      };
                      input.click();
                    }}>
                    <Upload className="h-4 w-4" />
                  </Button>
                </div>
              </FormControl>
            </FormItem>
          )} />
        </>
      )}
    </div>
  );

  const TabContatos = () => (
    <div className="grid gap-4 sm:grid-cols-2">
      <FormField control={form.control} name="igreja" render={({ field }) => (
        <FormItem className="sm:col-span-2">
          <FormLabel>Igreja *</FormLabel>
          <FormControl><Input {...field} /></FormControl>
          <FormMessage />
        </FormItem>
      )} />
      <FormField control={form.control} name="profissao" render={({ field }) => (
        <FormItem>
          <FormLabel>Profissão</FormLabel>
          <FormControl><Input {...field} value={field.value ?? ""} /></FormControl>
        </FormItem>
      )} />
      <FormField control={form.control} name="amigo_parente" render={({ field }) => (
        <FormItem>
          <FormLabel>Vai participar com amigo ou parente? Qual o nome?</FormLabel>
          <FormControl><Input {...field} value={field.value ?? ""} /></FormControl>
        </FormItem>
      )} />

      <div className="sm:col-span-2">
        <Separator className="my-4" />
        <h3 className="text-sm font-semibold mb-3">Contato de Emergência (esposa, mãe, etc.)</h3>
      </div>
      <FormField control={form.control} name="contato_nome" render={({ field }) => (
        <FormItem>
          <FormLabel>Nome</FormLabel>
          <FormControl><Input {...field} value={field.value ?? ""} /></FormControl>
        </FormItem>
      )} />
      <FormField control={form.control} name="contato_telefone" render={({ field }) => (
        <FormItem>
          <FormLabel>Telefone</FormLabel>
          <FormControl>
            <Input {...field} value={field.value ?? ""} placeholder="(00) 00000-0000"
              onChange={(e) => field.onChange(maskPhone(e.target.value))} />
          </FormControl>
        </FormItem>
      )} />
      <FormField control={form.control} name="contato_email" render={({ field }) => (
        <FormItem>
          <FormLabel>Email</FormLabel>
          <FormControl><Input type="email" {...field} value={field.value ?? ""} /></FormControl>
          <FormMessage />
        </FormItem>
      )} />

      <div className="sm:col-span-2">
        <Separator className="my-4" />
        <h3 className="text-sm font-semibold mb-3">Inscrição por Terceiros</h3>
      </div>
      <FormField control={form.control} name="inscrito_por" render={({ field }) => (
        <FormItem className="sm:col-span-2">
          <FormLabel>Quem fez a inscrição? (se diferente do participante)</FormLabel>
          <FormControl><Input {...field} value={field.value ?? ""} /></FormControl>
        </FormItem>
      )} />
      {inscritoPor && (
        <FormField control={form.control} name="motivo_inscricao" render={({ field }) => (
          <FormItem className="sm:col-span-2">
            <FormLabel>Por que está sendo inscrito por outra pessoa?</FormLabel>
            <FormControl><Textarea {...field} value={field.value ?? ""} /></FormControl>
          </FormItem>
        )} />
      )}
    </div>
  );

  const TabFinanceiro = () => (
    <div className="grid gap-4 sm:grid-cols-2">
      <FormField control={form.control} name="forma_pagamento" render={({ field }) => (
        <FormItem>
          <FormLabel>Forma de Pagamento</FormLabel>
          <Select onValueChange={field.onChange} value={field.value ?? ""}>
            <FormControl><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger></FormControl>
            <SelectContent>
              <SelectItem value="PIX">PIX</SelectItem>
              <SelectItem value="Cartão">Cartão</SelectItem>
              <SelectItem value="Múltiplos Cartões">Múltiplos Cartões</SelectItem>
            </SelectContent>
          </Select>
        </FormItem>
      )} />
      <FormField control={form.control} name="cupom_desconto" render={({ field }) => (
        <FormItem>
          <FormLabel>Cupom de Desconto</FormLabel>
          <FormControl><Input {...field} value={field.value ?? ""} /></FormControl>
        </FormItem>
      )} />
      <FormField control={form.control} name="valor_pago" render={({ field }) => (
        <FormItem>
          <FormLabel>Valor Pago</FormLabel>
          <FormControl>
            <div className="flex">
              <span className="inline-flex items-center rounded-l-md border border-r-0 border-input bg-muted px-3 text-sm text-muted-foreground">R$</span>
              <Input type="number" step="0.01" className="rounded-l-none" {...field} value={field.value ?? ""} />
            </div>
          </FormControl>
        </FormItem>
      )} />
    </div>
  );

  const TabDocumentos = () => (
    <div className="grid gap-4">
      <FormField control={form.control} name="contrato_assinado" render={({ field }) => (
        <FormItem className="flex items-center gap-3">
          <FormControl>
            <Switch checked={field.value ?? false} onCheckedChange={field.onChange} />
          </FormControl>
          <FormLabel className="!mt-0">Contrato Assinado</FormLabel>
        </FormItem>
      )} />
      <FormField control={form.control} name="contrato_url" render={({ field }) => (
        <FormItem>
          <FormLabel>Contrato (link ou arquivo)</FormLabel>
          <FormControl>
            <div className="flex gap-2">
              <Input {...field} value={field.value ?? ""} placeholder="URL ou faça upload" />
              <Button type="button" variant="outline" size="icon" disabled={uploading === "contrato_url"}
                onClick={() => {
                  const input = document.createElement("input");
                  input.type = "file";
                  input.accept = ".pdf,.jpg,.jpeg,.png";
                  input.onchange = (e) => {
                    const file = (e.target as HTMLInputElement).files?.[0];
                    if (file) uploadFile(file, "contrato_url");
                  };
                  input.click();
                }}>
                <Upload className="h-4 w-4" />
              </Button>
            </div>
          </FormControl>
        </FormItem>
      )} />
    </div>
  );

  const tabs = [
    { value: "pessoais", label: "Dados Pessoais", content: <TabDadosPessoais /> },
    { value: "saude", label: "Saúde", content: <TabSaude /> },
    { value: "contatos", label: "Contatos & Igreja", content: <TabContatos /> },
    { value: "financeiro", label: "Financeiro", content: <TabFinanceiro /> },
    { value: "documentos", label: "Documentos", content: <TabDocumentos /> },
  ];

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto pb-24 md:pb-6">
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate("/participantes")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-xl font-bold">{isEdit ? "Editar Participante" : "Novo Participante"}</h1>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          {isMobile ? (
            <Accordion type="multiple" defaultValue={["pessoais"]} className="space-y-2">
              {tabs.map((tab) => (
                <AccordionItem key={tab.value} value={tab.value} className="border rounded-lg px-4">
                  <AccordionTrigger className="text-sm font-semibold">{tab.label}</AccordionTrigger>
                  <AccordionContent className="pt-2 pb-4">{tab.content}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          ) : (
            <Tabs defaultValue="pessoais">
              <TabsList className="mb-4 w-full justify-start">
                {tabs.map((tab) => (
                  <TabsTrigger key={tab.value} value={tab.value}>{tab.label}</TabsTrigger>
                ))}
              </TabsList>
              {tabs.map((tab) => (
                <TabsContent key={tab.value} value={tab.value}>{tab.content}</TabsContent>
              ))}
            </Tabs>
          )}

          <div className={cn(
            "mt-6 flex justify-end",
            isMobile && "fixed bottom-0 left-0 right-0 p-4 bg-background border-t shadow-lg z-50"
          )}>
            <Button type="submit" disabled={saving} className="w-full md:w-auto">
              <Save className="mr-2 h-4 w-4" />
              {saving ? "Salvando..." : "Salvar Participante"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
