import { Clock, XCircle, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  status: "pendente" | "recusado";
  motivoRecusa?: string | null;
  onLogout: () => void;
}

const AguardandoAprovacao = ({ status, motivoRecusa, onLogout }: Props) => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 text-center shadow-lg">
        {status === "pendente" ? (
          <>
            <Clock className="mx-auto mb-4 h-16 w-16 text-amber-500" />
            <h2 className="mb-2 text-2xl font-bold text-foreground">
              Seu cadastro está em análise
            </h2>
            <p className="mb-2 text-muted-foreground">
              A coordenação irá aprovar seu acesso em breve.
            </p>
            <p className="mb-6 text-sm text-muted-foreground">
              Você receberá uma notificação quando for aprovado.
            </p>
          </>
        ) : (
          <>
            <XCircle className="mx-auto mb-4 h-16 w-16 text-destructive" />
            <h2 className="mb-2 text-2xl font-bold text-foreground">
              Seu cadastro foi recusado
            </h2>
            {motivoRecusa && (
              <p className="mb-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                Motivo: {motivoRecusa}
              </p>
            )}
            <p className="mb-6 text-muted-foreground">
              Entre em contato com a coordenação para mais informações.
            </p>
          </>
        )}

        <Button variant="outline" onClick={onLogout} className="gap-2">
          <LogOut className="h-4 w-4" />
          Sair
        </Button>
      </div>
    </div>
  );
};

export default AguardandoAprovacao;
