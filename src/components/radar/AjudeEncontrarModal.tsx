import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useEnviarLinkServidor, TopLegendario } from "@/hooks/useRadarLegendarios";
import { useToast } from "@/hooks/use-toast";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  top: TopLegendario | null;
}

export function AjudeEncontrarModal({ open, onOpenChange, top }: Props) {
  const [link, setLink] = useState("");
  const [nome, setNome] = useState("");
  const { mutate, isPending } = useEnviarLinkServidor();
  const { toast } = useToast();

  const handleSubmit = () => {
    if (!top || !link) return;
    mutate(
      { topId: top.id, link, enviadoPor: nome || "Anônimo" },
      {
        onSuccess: () => {
          toast({ title: "Obrigado!", description: "Link enviado com sucesso." });
          setLink("");
          setNome("");
          onOpenChange(false);
        },
        onError: (err) => {
          toast({ title: "Erro", description: err.message, variant: "destructive" });
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#2d2d2d] border-[#c9a84c]/30 text-white">
        <DialogHeader>
          <DialogTitle className="text-[#c9a84c]">
            Ajude a encontrar o link de servidor
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            {top?.nome_track || "TOP"} — envie o link de inscrição para servidores
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <div>
            <Label className="text-gray-300">Link de inscrição (servidor)</Label>
            <Input
              value={link}
              onChange={(e) => setLink(e.target.value)}
              placeholder="https://..."
              className="bg-[#1a1a1a] border-gray-600 text-white"
            />
          </div>
          <div>
            <Label className="text-gray-300">Seu nome (opcional)</Label>
            <Input
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Seu nome"
              className="bg-[#1a1a1a] border-gray-600 text-white"
            />
          </div>
          <Button
            onClick={handleSubmit}
            disabled={!link || isPending}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            {isPending ? "Enviando..." : "Enviar Link"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
