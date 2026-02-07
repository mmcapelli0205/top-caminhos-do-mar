import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import type { Participante } from "@/hooks/useParticipantes";
import { CheckCircle, XCircle } from "lucide-react";

interface Props {
  participante: Participante | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  familiaNumero: number | null;
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

function statusBadge(status: string | null) {
  const s = status ?? "inscrito";
  const colors: Record<string, string> = {
    inscrito: "bg-yellow-600/20 text-yellow-400 border-yellow-600/30",
    confirmado: "bg-green-600/20 text-green-400 border-green-600/30",
    cancelado: "bg-red-600/20 text-red-400 border-red-600/30",
  };
  return <Badge className={colors[s] ?? ""}>{s}</Badge>;
}

function ergometricoBadge(status: string | null) {
  const s = status ?? "pendente";
  const colors: Record<string, string> = {
    pendente: "bg-orange-600/20 text-orange-400 border-orange-600/30",
    enviado: "bg-blue-600/20 text-blue-400 border-blue-600/30",
    aprovado: "bg-green-600/20 text-green-400 border-green-600/30",
    dispensado: "bg-muted text-muted-foreground border-border",
  };
  return <Badge className={colors[s] ?? ""}>{s}</Badge>;
}

export default function ParticipanteSheet({ participante, open, onOpenChange, familiaNumero }: Props) {
  const p = participante;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg p-0">
        <SheetHeader className="p-6 pb-2">
          <SheetTitle>{p?.nome ?? "Participante"}</SheetTitle>
          <SheetDescription>Detalhes completos do participante</SheetDescription>
        </SheetHeader>
        {p && (
          <ScrollArea className="h-[calc(100vh-100px)] px-6 pb-6">
            <div className="space-y-5">
              <Section title="Dados Pessoais">
                <Field label="Nome" value={p.nome} />
                <Field label="CPF" value={p.cpf} />
                <Field label="Email" value={p.email} />
                <Field label="Telefone" value={p.telefone} />
                <Field label="Data de Nascimento" value={p.data_nascimento} />
                <Field label="Profissão" value={p.profissao} />
                <Field label="Instagram" value={p.instagram} />
                <Field label="Igreja" value={p.igreja} />
              </Section>

              <Section title="Dados Físicos">
                <Field label="Peso (kg)" value={p.peso?.toString()} />
                <Field label="Altura (m)" value={p.altura?.toString()} />
                <Field label="Condicionamento" value={p.condicionamento?.toString()} />
                <Field label="Tamanho Farda" value={p.tamanho_farda} />
              </Section>

              <Section title="Saúde">
                <Field label="Doença" value={p.doenca} />
                <Field label="Medicamentos" value={p.medicamentos} />
                <Field label="Alergia Alimentar" value={p.alergia_alimentar} />
                <Field label="Ergométrico" value={ergometricoBadge(p.ergometrico_status)} />
                <Field label="Ergométrico URL" value={p.ergometrico_url ? <a href={p.ergometrico_url} target="_blank" rel="noopener noreferrer" className="text-primary underline">Ver arquivo</a> : "—"} />
              </Section>

              <Section title="Contato de Emergência">
                <Field label="Nome" value={p.contato_nome} />
                <Field label="Telefone" value={p.contato_telefone} />
                <Field label="Email" value={p.contato_email} />
              </Section>

              <Section title="Inscrição">
                <Field label="Status" value={statusBadge(p.status)} />
                <Field label="Forma de Pagamento" value={p.forma_pagamento} />
                <Field label="Valor Pago" value={p.valor_pago != null ? `R$ ${p.valor_pago}` : "—"} />
                <Field label="Cupom de Desconto" value={p.cupom_desconto} />
                <Field label="Inscrito Por" value={p.inscrito_por} />
                <Field label="Motivo Inscrição" value={p.motivo_inscricao} />
                <Field label="Amigo/Parente" value={p.amigo_parente} />
                <Field label="Família" value={familiaNumero != null ? `Família ${familiaNumero}` : "—"} />
              </Section>

              <Section title="Documentos">
                <Field label="Contrato" value={p.contrato_assinado ? <span className="flex items-center gap-1 text-green-400"><CheckCircle className="h-4 w-4" /> Assinado</span> : <span className="flex items-center gap-1 text-red-400"><XCircle className="h-4 w-4" /> Não assinado</span>} />
                <Field label="Contrato URL" value={p.contrato_url ? <a href={p.contrato_url} target="_blank" rel="noopener noreferrer" className="text-primary underline">Ver contrato</a> : "—"} />
                <Field label="QR Code" value={p.qr_code} />
                <Field label="Check-in" value={p.checkin_realizado ? <span className="flex items-center gap-1 text-green-400"><CheckCircle className="h-4 w-4" /> Realizado</span> : "Não realizado"} />
              </Section>
            </div>
          </ScrollArea>
        )}
      </SheetContent>
    </Sheet>
  );
}
