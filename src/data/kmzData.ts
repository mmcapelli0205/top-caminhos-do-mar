export type DiaTipo = "todos" | "logistica" | "d1" | "d2" | "d3" | "d4";
export type PontoTipo = "base" | "predica" | "acampamento" | "extracao" | "ponto";

export interface KMZPonto {
  id: string;
  nome: string;
  lat: number;
  lng: number;
  dia: DiaTipo;
  tipo: PontoTipo;
}

export interface KMZRota {
  id: string;
  nome: string;
  dia: DiaTipo;
  distancia: string;
  cor: string;
  coordenadas: [number, number][];
}

export const ICONE_TIPO: Record<PontoTipo, string> = {
  predica: "📖",
  acampamento: "⛺",
  base: "🏠",
  extracao: "🚌",
  ponto: "📍",
};

export const COR_DIA: Record<string, string> = {
  logistica: "#D2B48C",
  d1: "#3B82F6",
  d2: "#A855F7",
  d3: "#F97316",
  d4: "#EF4444",
};
