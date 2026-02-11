import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Props {
  estado: string;
  setEstado: (v: string) => void;
  statusServidor: string;
  setStatusServidor: (v: string) => void;
}

const ESTADOS = [
  "Todos", "SP", "MG", "PR", "MS", "CE", "PA", "ES", "RS", "GO", "DF", "Internacional",
];

export function RadarFilters({ estado, setEstado, statusServidor, setStatusServidor }: Props) {
  return (
    <div className="flex flex-wrap gap-3">
      <Select value={estado} onValueChange={setEstado}>
        <SelectTrigger className="w-[160px] bg-[#2d2d2d] border-[#c9a84c]/30 text-white">
          <SelectValue placeholder="Estado" />
        </SelectTrigger>
        <SelectContent>
          {ESTADOS.map((e) => (
            <SelectItem key={e} value={e}>{e}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={statusServidor} onValueChange={setStatusServidor}>
        <SelectTrigger className="w-[200px] bg-[#2d2d2d] border-[#c9a84c]/30 text-white">
          <SelectValue placeholder="Link servidor" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="todos">Todos</SelectItem>
          <SelectItem value="com_link">Com link de servidor</SelectItem>
          <SelectItem value="sem_link">Sem link de servidor</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
