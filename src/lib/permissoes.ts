// ============================================
// Sistema de Permissões Granulares
// ============================================

export type NivelPermissao = "E" | "V" | "EP" | "A" | "X";

export type CargoArea =
  | "coord_01"
  | "coord_02"
  | "coord_03"
  | "sombra_01"
  | "sombra_02"
  | "sombra_03"
  | "servidor"
  | "diretoria";

export type AbaPermissao = {
  mural: NivelPermissao;
  calendario: NivelPermissao;
  participantes: NivelPermissao;
  documentos: NivelPermissao;
  familias: NivelPermissao;
  tirolesa: NivelPermissao;
  cronograma: NivelPermissao;
  predicas: NivelPermissao;
  pedidos: NivelPermissao;
  equipe: NivelPermissao;
  ergometricos: NivelPermissao;
  autorizacoes: NivelPermissao;
  medicamentos: NivelPermissao;
  equipamentos: NivelPermissao;
  homologacao: NivelPermissao;
  financeiro: NivelPermissao;
  radar: NivelPermissao;
  ia_criativa: NivelPermissao;
};

type AbaKey = keyof AbaPermissao;

// ---------- Regras por área/cargo ----------

export const PERMISSOES: Record<string, Partial<Record<CargoArea, Partial<AbaPermissao>>>> = {
  "Eventos": {
    coord_01:  { mural: "E", calendario: "E", participantes: "A", documentos: "E", familias: "E", tirolesa: "V", cronograma: "V", predicas: "V", pedidos: "E" },
    coord_02:  { mural: "E", calendario: "E", participantes: "V", documentos: "E", familias: "V", tirolesa: "V", cronograma: "V", predicas: "V", pedidos: "E" },
    coord_03:  { mural: "E", calendario: "E", participantes: "V", documentos: "E", familias: "V", tirolesa: "V", cronograma: "V", predicas: "V", pedidos: "E" },
    sombra_01: { mural: "V", calendario: "V", participantes: "V", documentos: "V", familias: "V", tirolesa: "V", cronograma: "V", predicas: "V", pedidos: "EP" },
    sombra_02: { mural: "V", calendario: "V", participantes: "V", documentos: "V", familias: "V", tirolesa: "V", cronograma: "V", predicas: "V", pedidos: "EP" },
    sombra_03: { mural: "V", calendario: "V", participantes: "V", documentos: "V", familias: "V", tirolesa: "V", cronograma: "V", predicas: "V", pedidos: "EP" },
    servidor:  { mural: "V", calendario: "V", documentos: "V" },
  },
  "Hakuna": {
    coord_01:  { mural: "E", calendario: "E", participantes: "A", documentos: "E", cronograma: "V", predicas: "V", pedidos: "E", equipe: "E", ergometricos: "E", autorizacoes: "A", medicamentos: "E", equipamentos: "E" },
    coord_02:  { mural: "E", calendario: "E", participantes: "V", documentos: "E", cronograma: "V", predicas: "V", pedidos: "E", equipe: "V", ergometricos: "V", autorizacoes: "A", medicamentos: "E", equipamentos: "E" },
    coord_03:  { mural: "E", calendario: "E", participantes: "V", documentos: "E", cronograma: "V", predicas: "V", pedidos: "E", equipe: "V", ergometricos: "V", autorizacoes: "A", medicamentos: "E", equipamentos: "E" },
    sombra_01: { mural: "V", calendario: "V", participantes: "V", documentos: "V", cronograma: "V", predicas: "V", pedidos: "EP", equipe: "V", ergometricos: "V", autorizacoes: "V", medicamentos: "V", equipamentos: "V" },
    sombra_02: { mural: "V", calendario: "V", participantes: "V", documentos: "V", cronograma: "V", predicas: "V", pedidos: "EP", equipe: "V", ergometricos: "V", autorizacoes: "V", medicamentos: "V", equipamentos: "V" },
    sombra_03: { mural: "V", calendario: "V", participantes: "V", documentos: "V", cronograma: "V", predicas: "V", pedidos: "EP", equipe: "V", ergometricos: "V", autorizacoes: "V", medicamentos: "V", equipamentos: "V" },
    servidor:  { mural: "V", calendario: "V", documentos: "V" },
  },
  "Segurança": {
    coord_01:  { mural: "E", calendario: "E", participantes: "A", documentos: "E", familias: "V", tirolesa: "E", cronograma: "V", predicas: "V", pedidos: "E" },
    coord_02:  { mural: "E", calendario: "E", participantes: "V", documentos: "E", familias: "V", tirolesa: "E", cronograma: "V", predicas: "V", pedidos: "E" },
    coord_03:  { mural: "E", calendario: "E", participantes: "V", documentos: "E", familias: "V", tirolesa: "E", cronograma: "V", predicas: "V", pedidos: "E" },
    sombra_01: { mural: "V", calendario: "V", participantes: "V", documentos: "V", familias: "V", tirolesa: "V", cronograma: "V", predicas: "V", pedidos: "EP" },
    sombra_02: { mural: "V", calendario: "V", participantes: "V", documentos: "V", familias: "V", tirolesa: "V", cronograma: "V", predicas: "V", pedidos: "EP" },
    sombra_03: { mural: "V", calendario: "V", participantes: "V", documentos: "V", familias: "V", tirolesa: "V", cronograma: "V", predicas: "V", pedidos: "EP" },
    servidor:  { mural: "V", calendario: "V", documentos: "V" },
  },
  "Logística": {
    coord_01:  { mural: "E", calendario: "E", participantes: "A", documentos: "E", cronograma: "V", predicas: "V", pedidos: "E" },
    coord_02:  { mural: "E", calendario: "E", participantes: "V", documentos: "E", cronograma: "V", predicas: "V", pedidos: "E" },
    coord_03:  { mural: "E", calendario: "E", participantes: "V", documentos: "E", cronograma: "V", predicas: "V", pedidos: "E" },
    sombra_01: { mural: "V", calendario: "V", participantes: "V", documentos: "V", cronograma: "V", predicas: "V", pedidos: "EP" },
    sombra_02: { mural: "V", calendario: "V", participantes: "V", documentos: "V", cronograma: "V", predicas: "V", pedidos: "EP" },
    sombra_03: { mural: "V", calendario: "V", participantes: "V", documentos: "V", cronograma: "V", predicas: "V", pedidos: "EP" },
    servidor:  { mural: "V", calendario: "V", documentos: "V" },
  },
  "Voz": {
    coord_01:  { mural: "E", calendario: "E", participantes: "A", documentos: "E", cronograma: "V", predicas: "V", pedidos: "E" },
    coord_02:  { mural: "E", calendario: "E", participantes: "V", documentos: "E", cronograma: "V", predicas: "V", pedidos: "E" },
    coord_03:  { mural: "E", calendario: "E", participantes: "V", documentos: "E", cronograma: "V", predicas: "V", pedidos: "E" },
    sombra_01: { mural: "V", calendario: "V", participantes: "V", documentos: "V", cronograma: "V", predicas: "V", pedidos: "EP" },
    sombra_02: { mural: "V", calendario: "V", participantes: "V", documentos: "V", cronograma: "V", predicas: "V", pedidos: "EP" },
    sombra_03: { mural: "V", calendario: "V", participantes: "V", documentos: "V", cronograma: "V", predicas: "V", pedidos: "EP" },
    servidor:  { mural: "V", calendario: "V", documentos: "V" },
  },
  "Comunicação": {
    coord_01:  { mural: "E", calendario: "E", participantes: "A", documentos: "E", cronograma: "V", predicas: "V", pedidos: "E" },
    coord_02:  { mural: "E", calendario: "E", participantes: "V", documentos: "E", cronograma: "V", predicas: "V", pedidos: "E" },
    coord_03:  { mural: "E", calendario: "E", participantes: "V", documentos: "E", cronograma: "V", predicas: "V", pedidos: "E" },
    sombra_01: { mural: "V", calendario: "V", participantes: "V", documentos: "V", cronograma: "V", predicas: "V", pedidos: "EP" },
    sombra_02: { mural: "V", calendario: "V", participantes: "V", documentos: "V", cronograma: "V", predicas: "V", pedidos: "EP" },
    sombra_03: { mural: "V", calendario: "V", participantes: "V", documentos: "V", cronograma: "V", predicas: "V", pedidos: "EP" },
    servidor:  { mural: "V", calendario: "V", documentos: "V" },
  },
  "Mídia": {
    coord_01:  { mural: "E", calendario: "E", participantes: "A", documentos: "E", cronograma: "V", predicas: "V", pedidos: "E", radar: "E", ia_criativa: "E" },
    coord_02:  { mural: "E", calendario: "E", participantes: "V", documentos: "E", cronograma: "V", predicas: "V", pedidos: "E", radar: "E", ia_criativa: "E" },
    coord_03:  { mural: "E", calendario: "E", participantes: "V", documentos: "E", cronograma: "V", predicas: "V", pedidos: "E", radar: "E", ia_criativa: "E" },
    sombra_01: { mural: "V", calendario: "V", participantes: "V", documentos: "V", cronograma: "V", predicas: "V", pedidos: "EP", radar: "E", ia_criativa: "E" },
    sombra_02: { mural: "V", calendario: "V", participantes: "V", documentos: "V", cronograma: "V", predicas: "V", pedidos: "EP", radar: "E", ia_criativa: "E" },
    sombra_03: { mural: "V", calendario: "V", participantes: "V", documentos: "V", cronograma: "V", predicas: "V", pedidos: "EP", radar: "E", ia_criativa: "E" },
    servidor:  { mural: "V", calendario: "V", documentos: "V" },
  },
  "Intercessão": {
    coord_01:  { mural: "E", calendario: "E", participantes: "A", documentos: "E", cronograma: "V", predicas: "E", pedidos: "E" },
    coord_02:  { mural: "E", calendario: "E", participantes: "V", documentos: "E", cronograma: "V", predicas: "E", pedidos: "E" },
    coord_03:  { mural: "E", calendario: "E", participantes: "V", documentos: "E", cronograma: "V", predicas: "E", pedidos: "E" },
    sombra_01: { mural: "V", calendario: "V", participantes: "V", documentos: "V", cronograma: "V", predicas: "V", pedidos: "EP" },
    sombra_02: { mural: "V", calendario: "V", participantes: "V", documentos: "V", cronograma: "V", predicas: "V", pedidos: "EP" },
    sombra_03: { mural: "V", calendario: "V", participantes: "V", documentos: "V", cronograma: "V", predicas: "V", pedidos: "EP" },
    servidor:  { mural: "V", calendario: "V", documentos: "V" },
  },
  "DOC": {
    coord_01:  { mural: "E", calendario: "E", participantes: "A", documentos: "E", cronograma: "V", predicas: "E", pedidos: "E" },
    coord_02:  { mural: "E", calendario: "E", participantes: "V", documentos: "E", cronograma: "V", predicas: "E", pedidos: "E" },
    coord_03:  { mural: "E", calendario: "E", participantes: "V", documentos: "E", cronograma: "V", predicas: "E", pedidos: "E" },
    sombra_01: { mural: "V", calendario: "V", participantes: "V", documentos: "V", cronograma: "V", predicas: "V", pedidos: "EP" },
    sombra_02: { mural: "V", calendario: "V", participantes: "V", documentos: "V", cronograma: "V", predicas: "V", pedidos: "EP" },
    sombra_03: { mural: "V", calendario: "V", participantes: "V", documentos: "V", cronograma: "V", predicas: "V", pedidos: "EP" },
    servidor:  { mural: "V", calendario: "V", documentos: "V" },
  },
  "Louvor": {
    coord_01:  { mural: "E", calendario: "E", participantes: "A", documentos: "E", cronograma: "V", predicas: "V", pedidos: "E" },
    coord_02:  { mural: "E", calendario: "E", participantes: "V", documentos: "E", cronograma: "V", predicas: "V", pedidos: "E" },
    coord_03:  { mural: "E", calendario: "E", participantes: "V", documentos: "E", cronograma: "V", predicas: "V", pedidos: "E" },
    sombra_01: { mural: "V", calendario: "V", participantes: "V", documentos: "V", cronograma: "V", predicas: "V", pedidos: "EP" },
    sombra_02: { mural: "V", calendario: "V", participantes: "V", documentos: "V", cronograma: "V", predicas: "V", pedidos: "EP" },
    sombra_03: { mural: "V", calendario: "V", participantes: "V", documentos: "V", cronograma: "V", predicas: "V", pedidos: "EP" },
    servidor:  { mural: "V", calendario: "V", documentos: "V" },
  },
  "ADM": {
    coord_01:  { mural: "E", calendario: "E", participantes: "A", documentos: "E", familias: "V", tirolesa: "V", cronograma: "E", predicas: "E", pedidos: "E", equipe: "V", ergometricos: "V", autorizacoes: "V", medicamentos: "V", equipamentos: "V", homologacao: "E", financeiro: "E" },
    coord_02:  { mural: "E", calendario: "E", participantes: "A", documentos: "E", familias: "V", tirolesa: "V", cronograma: "E", predicas: "E", pedidos: "E", equipe: "V", ergometricos: "V", autorizacoes: "V", medicamentos: "V", equipamentos: "V", homologacao: "E", financeiro: "E" },
    coord_03:  { mural: "E", calendario: "E", participantes: "A", documentos: "E", familias: "V", tirolesa: "V", cronograma: "E", predicas: "E", pedidos: "E", equipe: "V", ergometricos: "V", autorizacoes: "V", medicamentos: "V", equipamentos: "V", homologacao: "E", financeiro: "E" },
    sombra_01: { mural: "E", calendario: "E", participantes: "A", documentos: "E", familias: "V", tirolesa: "V", cronograma: "E", predicas: "V", pedidos: "E", equipe: "V", ergometricos: "V", autorizacoes: "V", medicamentos: "V", equipamentos: "V", homologacao: "E", financeiro: "V" },
    sombra_02: { mural: "E", calendario: "E", participantes: "A", documentos: "E", familias: "V", tirolesa: "V", cronograma: "E", predicas: "V", pedidos: "E", equipe: "V", ergometricos: "V", autorizacoes: "V", medicamentos: "V", equipamentos: "V", homologacao: "E", financeiro: "V" },
    sombra_03: { mural: "E", calendario: "E", participantes: "A", documentos: "E", familias: "V", tirolesa: "V", cronograma: "E", predicas: "V", pedidos: "E", equipe: "V", ergometricos: "V", autorizacoes: "V", medicamentos: "V", equipamentos: "V", homologacao: "E", financeiro: "V" },
    servidor:  { mural: "V", calendario: "V", documentos: "V" },
  },
  "Diretoria": {
    diretoria: { mural: "E", calendario: "E", participantes: "E", documentos: "E", familias: "E", tirolesa: "E", cronograma: "E", predicas: "E", pedidos: "E", equipe: "V", ergometricos: "V", autorizacoes: "V", medicamentos: "V", equipamentos: "V", homologacao: "E", financeiro: "E", radar: "V", ia_criativa: "V" },
  },
};

// Diretor Espiritual — permissões específicas
export const PERMISSOES_DIRETOR_ESPIRITUAL: Partial<AbaPermissao> = {
  mural: "V",
  calendario: "E",
  participantes: "V",
  documentos: "E",
  familias: "V",
  tirolesa: "V",
  cronograma: "V",
  predicas: "E",
  pedidos: "E",
  equipe: "V",
  ergometricos: "V",
  autorizacoes: "V",
  medicamentos: "V",
  equipamentos: "V",
  homologacao: "V",
  financeiro: "V",
};

// ---------- Funções utilitárias ----------

export function getPermissaoAba(
  area: string,
  cargo: CargoArea,
  aba: string,
): NivelPermissao {
  // Diretoria (Diretor / Sub-Diretor) em qualquer área → acesso total
  if (cargo === "diretoria") {
    const dir = PERMISSOES["Diretoria"]?.diretoria;
    return (dir?.[aba as AbaKey] as NivelPermissao) ?? "E";
  }

  const areaPerms = PERMISSOES[area];
  if (!areaPerms) return "X";

  const cargoPerms = areaPerms[cargo];
  if (!cargoPerms) return "X";

  return (cargoPerms[aba as AbaKey] as NivelPermissao) ?? "X";
}

export function isAbaVisivel(permissao: NivelPermissao): boolean {
  return permissao !== "X";
}

export function canEdit(permissao: NivelPermissao): boolean {
  return permissao === "E" || permissao === "A";
}

export function canCreate(permissao: NivelPermissao): boolean {
  return permissao === "E" || permissao === "EP" || permissao === "A";
}

export function canDelete(permissao: NivelPermissao): boolean {
  return permissao === "E";
}

export function canApprove(permissao: NivelPermissao): boolean {
  return permissao === "A" || permissao === "E";
}
