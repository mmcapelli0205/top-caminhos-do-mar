import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { CheckCircle, XCircle } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type Servidor = Tables<"servidores">;

interface Props {
  servidor: Servidor | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm text-foreground">{value || "—"}</p>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-primary">{title}</h3>
      <div className="grid grid-cols-2 gap-3">{children}</div>
      <Separator />
    </div>
  );
}

const statusColors: Record<string, string> = {
  pendente: "bg-orange-600/20 text-orange-400 border-orange-600/30",
  aprovado: "bg-green-600/20 text-green-400 border-green-600/30",
  recusado: "bg-red-600/20 text-red-400 border-red-600/30",
  sem_area: "bg-red-900/30 text-red-300 border-red-800/40",
};

function parseJsonArray(val: string | null): string[] {
  if (!val) return [];
  try { return JSON.parse(val); } catch { return []; }
}

export default function ServidorSheet({ servidor, open, onOpenChange }: Props) {
  const s = servidor;
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg p-0">
        <SheetHeader className="p-6 pb-2">
          <SheetTitle>{s?.nome ?? "Servidor"}</SheetTitle>
          <SheetDescription>Detalhes completos do servidor</SheetDescription>
        </SheetHeader>
        {s && (
          <ScrollArea className="h-[calc(100vh-100px)] px-6 pb-6">
            <div className="space-y-5">
              <Section title="Dados Pessoais">
                <Field label="Nome" value={s.nome} />
                <Field label="CPF" value={s.cpf} />
                <Field label="Email" value={s.email} />
                <Field label="Telefone" value={s.telefone} />
                <Field label="Data de Nascimento" value={s.data_nascimento} />
                <Field label="Nº Legendário" value={s.numero_legendario} />
                <Field label="Experiência" value={s.experiencia} />
                <Field label="Tamanho Farda" value={s.tamanho_farda} />
                <Field label="Estrangeiro" value={s.estrangeiro ? "Sim" : "Não"} />
              </Section>
              <Section title="Endereço & Igreja">
                <Field label="País" value={s.pais} />
                <Field label="CEP" value={s.cep} />
                <Field label="Endereço" value={s.endereco} />
                <Field label="Cidade" value={s.cidade} />
                <Field label="Estado" value={s.estado} />
                <Field label="Igreja" value={s.igreja} />
                <Field label="Sede" value={s.sede} />
              </Section>
              <Section title="Habilidades & Área">
                <Field label="Habilidades" value={parseJsonArray(s.habilidades).join(", ") || "—"} />
                <Field label="Áreas Servidas" value={parseJsonArray(s.areas_servidas).join(", ") || "—"} />
                <Field label="1ª Preferência" value={s.area_preferencia_1} />
                <Field label="2ª Preferência" value={s.area_preferencia_2} />
                <Field label="Área Atual" value={s.area_servico} />
                <Field label="Status" value={<Badge className={statusColors[s.status ?? ""] ?? ""}>{s.status ?? "—"}</Badge>} />
              </Section>
              <Section title="Contato de Emergência">
                <Field label="Nome" value={s.contato_nome} />
                <Field label="Email" value={s.contato_email} />
                <Field label="Telefone" value={s.contato_telefone} />
              </Section>
              <Section title="Recursos & Financeiro">
                <Field label="Tem Veículo" value={s.tem_veiculo ? "Sim" : "Não"} />
                <Field label="Tem Recurso" value={s.tem_recurso ? "Sim" : "Não"} />
                <Field label="Descrição Recurso" value={s.recurso_descricao} />
                <Field label="Valor Pago" value={s.valor_pago != null ? `R$ ${s.valor_pago}` : "—"} />
                <Field label="Forma Pgto" value={s.forma_pagamento} />
                <Field label="Cupom" value={s.cupom_desconto} />
                <Field label="QR Code" value={s.qr_code} />
                <Field label="Check-in" value={s.checkin ? <span className="flex items-center gap-1 text-green-400"><CheckCircle className="h-4 w-4" /> Realizado</span> : "Não realizado"} />
              </Section>
            </div>
          </ScrollArea>
        )}
      </SheetContent>
    </Sheet>
  );
}
