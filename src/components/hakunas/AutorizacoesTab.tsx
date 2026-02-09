import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableHeader, TableRow, TableHead, TableCell, TableBody } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "@/hooks/use-toast";
import { CheckCircle, XCircle, Info } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import type { Tables } from "@/integrations/supabase/types";

type Participante = Tables<"participantes">;
type Autorizacao = Tables<"autorizacoes_medicas">;

function calcAge(dob: string | null): number | null {
  if (!dob) return null;
  return Math.floor((Date.now() - new Date(dob).getTime()) / (365.25 * 86400000));
}

export default function AutorizacoesTab() {
  const qc = useQueryClient();
  const isMobile = useIsMobile();
  const [dialogPart, setDialogPart] = useState<{ id: string; action: "aprovar" | "reprovar" } | null>(null);
  const [obs, setObs] = useState("");

  const { data: participantes = [], isLoading } = useQuery({
    queryKey: ["aut-participantes"],
    queryFn: async () => {
      const { data } = await supabase.from("participantes").select("*").order("nome");
      return (data ?? []) as Participante[];
    },
  });

  const { data: autorizacoes = [] } = useQuery({
    queryKey: ["aut-autorizacoes"],
    queryFn: async () => {
      const { data } = await supabase.from("autorizacoes_medicas").select("*");
      return (data ?? []) as Autorizacao[];
    },
  });

  const autMap = useMemo(() => {
    const m = new Map<string, Autorizacao>();
    autorizacoes.forEach((a) => { if (a.participante_id) m.set(a.participante_id, a); });
    return m;
  }, [autorizacoes]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!dialogPart) return;
      if (!obs.trim()) throw new Error("Observações obrigatórias");
      const status = dialogPart.action === "aprovar" ? "aprovado" : "reprovado";
      const existing = autMap.get(dialogPart.id);
      if (existing) {
        await supabase.from("autorizacoes_medicas").update({ status, observacoes: obs, data_autorizacao: new Date().toISOString() }).eq("id", existing.id);
      } else {
        await supabase.from("autorizacoes_medicas").insert({ participante_id: dialogPart.id, status, observacoes: obs, data_autorizacao: new Date().toISOString() });
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["aut-autorizacoes"] });
      setDialogPart(null); setObs("");
      toast({ title: "Autorização salva" });
    },
    onError: (e: any) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  return (
    <div className="space-y-4">
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>Autorização médica para subir a montanha</AlertDescription>
      </Alert>

      {isMobile ? (
        <div className="space-y-3">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-28 w-full" />)
          ) : participantes.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Nenhum participante</p>
          ) : participantes.map((p) => {
            const aut = autMap.get(p.id);
            const status = aut?.status ?? "pendente";
            const hasDoenca = !!p.doenca?.trim();
            return (
              <Card key={p.id} className={hasDoenca ? "border-accent" : ""}>
                <CardContent className="p-3 space-y-2">
                  <div className="flex justify-between items-start">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{p.nome}</p>
                      <p className="text-sm text-muted-foreground">Idade: {calcAge(p.data_nascimento) ?? "—"}</p>
                    </div>
                    <Badge variant={status === "aprovado" ? "default" : status === "reprovado" ? "destructive" : "secondary"}>{status}</Badge>
                  </div>
                  {p.doenca && <p className="text-xs text-muted-foreground truncate">Doença: {p.doenca}</p>}
                  <div className="flex items-center justify-between">
                    <Badge variant={p.ergometrico_status === "aprovado" ? "default" : p.ergometrico_status === "reprovado" ? "destructive" : "secondary"} className="text-xs">
                      Ergo: {p.ergometrico_status ?? "pendente"}
                    </Badge>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-green-600" onClick={() => { setDialogPart({ id: p.id, action: "aprovar" }); setObs(aut?.observacoes ?? ""); }}>
                        <CheckCircle className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => { setDialogPart({ id: p.id, action: "reprovar" }); setObs(aut?.observacoes ?? ""); }}>
                        <XCircle className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="rounded-md border border-border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="sticky left-0 bg-card z-10">Nome</TableHead>
                <TableHead>Idade</TableHead>
                <TableHead>Doença/Condição</TableHead>
                <TableHead className="hidden md:table-cell">Ergométrico</TableHead>
                <TableHead>Autorização</TableHead>
                <TableHead className="hidden lg:table-cell">Observações</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <TableRow key={i}>{Array.from({ length: 7 }).map((_, j) => <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>)}</TableRow>
                ))
              ) : participantes.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">Nenhum participante</TableCell></TableRow>
              ) : participantes.map((p) => {
                const aut = autMap.get(p.id);
                const status = aut?.status ?? "pendente";
                const hasDoenca = !!p.doenca?.trim();
                return (
                  <TableRow key={p.id} className={hasDoenca ? "bg-accent/30" : ""}>
                    <TableCell className="sticky left-0 bg-card z-10 font-medium">{p.nome}</TableCell>
                    <TableCell>{calcAge(p.data_nascimento) ?? "—"}</TableCell>
                    <TableCell className="max-w-[200px] truncate">{p.doenca ?? "—"}</TableCell>
                    <TableCell className="hidden md:table-cell">
                      <Badge variant={p.ergometrico_status === "aprovado" ? "default" : p.ergometrico_status === "reprovado" ? "destructive" : "secondary"}>
                        {p.ergometrico_status ?? "pendente"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={status === "aprovado" ? "default" : status === "reprovado" ? "destructive" : "secondary"}>{status}</Badge>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell max-w-[200px] truncate">{aut?.observacoes ?? "—"}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-green-600" onClick={() => { setDialogPart({ id: p.id, action: "aprovar" }); setObs(aut?.observacoes ?? ""); }}>
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => { setDialogPart({ id: p.id, action: "reprovar" }); setObs(aut?.observacoes ?? ""); }}>
                          <XCircle className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={!!dialogPart} onOpenChange={(o) => { if (!o) setDialogPart(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{dialogPart?.action === "aprovar" ? "Aprovar" : "Reprovar"} Autorização</DialogTitle>
          </DialogHeader>
          <Textarea placeholder="Observações médicas (obrigatório)..." value={obs} onChange={(e) => setObs(e.target.value)} rows={4} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogPart(null)}>Cancelar</Button>
            <Button variant={dialogPart?.action === "aprovar" ? "default" : "destructive"} onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
              {dialogPart?.action === "aprovar" ? "Aprovar" : "Reprovar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
