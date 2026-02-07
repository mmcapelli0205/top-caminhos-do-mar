import { Calendar } from "lucide-react";

const Tops = () => (
  <div className="space-y-4">
    <div className="flex items-center gap-3">
      <Calendar className="h-6 w-6 text-primary" />
      <h1 className="text-2xl font-bold text-foreground">Histórico de TOPs</h1>
    </div>
    <p className="text-muted-foreground">Em construção</p>
  </div>
);

export default Tops;
