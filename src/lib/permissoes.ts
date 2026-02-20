// ============================================
// Sistema de Permissões Granulares (Portal de Área)
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

// ---------- Funções utilitárias (Portal) ----------

export function getPermissaoAba(
  area: string,
  cargo: CargoArea,
  aba: string,
): NivelPermissao {
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

// ============================================
// Permissões do Menu Principal por Área
// ============================================

export type NivelAcesso = "V" | "E" | "B" | null;

export interface PermissoesMenu {
  // Participantes
  participantes_listar: NivelAcesso;
  participantes_buscar: NivelAcesso;
  participantes_filtros: NivelAcesso;
  participantes_importar: NivelAcesso;
  participantes_exportar: NivelAcesso;
  participantes_novo: NivelAcesso;
  participantes_visualizar: NivelAcesso;
  participantes_editar: NivelAcesso;
  // Servidores
  servidores_cards: NivelAcesso;
  servidores_listar: NivelAcesso;
  servidores_filtros: NivelAcesso;
  servidores_exportar: NivelAcesso;
  servidores_importar: NivelAcesso;
  servidores_novo: NivelAcesso;
  servidores_visualizar: NivelAcesso;
  servidores_editar: NivelAcesso;
  servidores_excluir: NivelAcesso;
  // Financeiro
  financeiro_resumo: NivelAcesso;
  financeiro_completo: NivelAcesso;
  // Check-in
  checkin_pulseiras: NivelAcesso;
  checkin_realizar: NivelAcesso;
  checkin_consultar: NivelAcesso;
  checkin_gestao: NivelAcesso;
  // Equipamentos
  equipamentos_listar: NivelAcesso;
  equipamentos_novo: NivelAcesso;
  equipamentos_filtros: NivelAcesso;
  // Artes & Docs
  artes_visualizar: NivelAcesso;
  artes_upload: NivelAcesso;
  artes_download: NivelAcesso;
  artes_editar: NivelAcesso;
  artes_excluir: NivelAcesso;
  // TOPs
  tops_edicoes: NivelAcesso;
  tops_whatsapp: NivelAcesso;
  tops_templates: NivelAcesso;
  // Configurações
  config_listar: NivelAcesso;
  config_novo: NivelAcesso;
  config_editar: NivelAcesso;
  // TOP Real Time
  realtime_visualizar: NivelAcesso;
  realtime_iniciar: NivelAcesso;
  realtime_pular: NivelAcesso;
  // Mapa
  mapa_visualizar: NivelAcesso;
  mapa_compartilhar_gps: NivelAcesso;
  // Aprovações
  aprovacoes: NivelAcesso;
  // Menu visibility
  menu_participantes: boolean;
  menu_servidores: boolean;
  menu_financeiro: boolean;
  menu_checkin: boolean;
  menu_equipamentos: boolean;
  menu_artes: boolean;
  menu_tops: boolean;
  menu_config: boolean;
  menu_realtime: boolean;
  menu_mapa: boolean;
  menu_aprovacoes: boolean;
}

// Fallback mínimo (área desconhecida)
const PERMISSOES_FALLBACK: PermissoesMenu = {
  participantes_listar: null, participantes_buscar: null, participantes_filtros: null,
  participantes_importar: null, participantes_exportar: null, participantes_novo: null,
  participantes_visualizar: null, participantes_editar: null,
  servidores_cards: null, servidores_listar: null, servidores_filtros: null,
  servidores_exportar: null, servidores_importar: null, servidores_novo: null,
  servidores_visualizar: null, servidores_editar: null, servidores_excluir: null,
  financeiro_resumo: null, financeiro_completo: null,
  checkin_pulseiras: null, checkin_realizar: null, checkin_consultar: null, checkin_gestao: null,
  equipamentos_listar: null, equipamentos_novo: null, equipamentos_filtros: null,
  artes_visualizar: "V", artes_upload: null, artes_download: "V", artes_editar: null, artes_excluir: null,
  tops_edicoes: null, tops_whatsapp: null, tops_templates: null,
  config_listar: null, config_novo: null, config_editar: null,
  realtime_visualizar: null, realtime_iniciar: null, realtime_pular: null,
  mapa_visualizar: "V", mapa_compartilhar_gps: null,
  aprovacoes: null,
  menu_participantes: false, menu_servidores: false, menu_financeiro: false,
  menu_checkin: false, menu_equipamentos: false, menu_artes: true,
  menu_tops: false, menu_config: false, menu_realtime: false,
  menu_mapa: true, menu_aprovacoes: false,
};

export const PERMISSOES_MENU: Record<string, PermissoesMenu> = {
  "Hakuna": {
    participantes_listar: "V", participantes_buscar: "V", participantes_filtros: "V",
    participantes_importar: "B", participantes_exportar: "B", participantes_novo: "B",
    participantes_visualizar: "V", participantes_editar: "B",
    servidores_cards: "E", servidores_listar: "E", servidores_filtros: "E",
    servidores_exportar: "E", servidores_importar: "E", servidores_novo: "E",
    servidores_visualizar: "E", servidores_editar: "E", servidores_excluir: "E",
    financeiro_resumo: "E", financeiro_completo: "B",
    checkin_pulseiras: "B", checkin_realizar: "B", checkin_consultar: "E", checkin_gestao: "E",
    equipamentos_listar: "E", equipamentos_novo: "E", equipamentos_filtros: "E",
    artes_visualizar: "V", artes_upload: "V", artes_download: "V", artes_editar: "V", artes_excluir: "V",
    tops_edicoes: "B", tops_whatsapp: "B", tops_templates: "B",
    config_listar: "B", config_novo: "B", config_editar: "B",
    realtime_visualizar: "V", realtime_iniciar: "B", realtime_pular: "B",
    mapa_visualizar: "V", mapa_compartilhar_gps: null,
    aprovacoes: "B",
    menu_participantes: true, menu_servidores: true, menu_financeiro: true,
    menu_checkin: true, menu_equipamentos: true, menu_artes: true,
    menu_tops: false, menu_config: false, menu_realtime: true,
    menu_mapa: true, menu_aprovacoes: false,
  },
  "Segurança": {
    participantes_listar: "V", participantes_buscar: "V", participantes_filtros: "V",
    participantes_importar: "B", participantes_exportar: null, participantes_novo: null,
    participantes_visualizar: "V", participantes_editar: null,
    servidores_cards: "B", servidores_listar: "B", servidores_filtros: "B",
    servidores_exportar: "B", servidores_importar: "B", servidores_novo: "E",
    servidores_visualizar: "B", servidores_editar: "B", servidores_excluir: "B",
    financeiro_resumo: "B", financeiro_completo: "B",
    checkin_pulseiras: "E", checkin_realizar: "E", checkin_consultar: "V", checkin_gestao: "E",
    equipamentos_listar: "V", equipamentos_novo: "V", equipamentos_filtros: "V",
    artes_visualizar: "V", artes_upload: "V", artes_download: "V", artes_editar: "V", artes_excluir: "V",
    tops_edicoes: "B", tops_whatsapp: "B", tops_templates: "B",
    config_listar: "B", config_novo: "B", config_editar: "B",
    realtime_visualizar: "V", realtime_iniciar: "B", realtime_pular: "B",
    mapa_visualizar: "V", mapa_compartilhar_gps: null,
    aprovacoes: "B",
    menu_participantes: true, menu_servidores: true, menu_financeiro: false,
    menu_checkin: true, menu_equipamentos: true, menu_artes: true,
    menu_tops: false, menu_config: false, menu_realtime: true,
    menu_mapa: true, menu_aprovacoes: false,
  },
  "Eventos": {
    participantes_listar: "V", participantes_buscar: null, participantes_filtros: "V",
    participantes_importar: "B", participantes_exportar: null, participantes_novo: null,
    participantes_visualizar: "V", participantes_editar: null,
    servidores_cards: "B", servidores_listar: "B", servidores_filtros: "B",
    servidores_exportar: "B", servidores_importar: "B", servidores_novo: "E",
    servidores_visualizar: "B", servidores_editar: "B", servidores_excluir: "B",
    financeiro_resumo: "B", financeiro_completo: "B",
    checkin_pulseiras: "E", checkin_realizar: "E", checkin_consultar: "V", checkin_gestao: "E",
    equipamentos_listar: "V", equipamentos_novo: "V", equipamentos_filtros: "V",
    artes_visualizar: "V", artes_upload: "V", artes_download: "V", artes_editar: "V", artes_excluir: "V",
    tops_edicoes: "B", tops_whatsapp: "B", tops_templates: "B",
    config_listar: "B", config_novo: "B", config_editar: "B",
    realtime_visualizar: "V", realtime_iniciar: "B", realtime_pular: "B",
    mapa_visualizar: "V", mapa_compartilhar_gps: null,
    aprovacoes: "B",
    menu_participantes: true, menu_servidores: true, menu_financeiro: false,
    menu_checkin: true, menu_equipamentos: true, menu_artes: true,
    menu_tops: false, menu_config: false, menu_realtime: true,
    menu_mapa: true, menu_aprovacoes: false,
  },
  "Mídia": {
    participantes_listar: "V", participantes_buscar: null, participantes_filtros: "V",
    participantes_importar: "B", participantes_exportar: null, participantes_novo: null,
    participantes_visualizar: "V", participantes_editar: null,
    servidores_cards: "B", servidores_listar: "B", servidores_filtros: "B",
    servidores_exportar: "B", servidores_importar: "B", servidores_novo: "E",
    servidores_visualizar: "B", servidores_editar: "B", servidores_excluir: "B",
    financeiro_resumo: "B", financeiro_completo: "B",
    checkin_pulseiras: "B", checkin_realizar: "B", checkin_consultar: "B", checkin_gestao: "B",
    equipamentos_listar: "B", equipamentos_novo: "B", equipamentos_filtros: "B",
    artes_visualizar: "V", artes_upload: "V", artes_download: "V", artes_editar: "V", artes_excluir: "V",
    tops_edicoes: "B", tops_whatsapp: "B", tops_templates: "B",
    config_listar: "B", config_novo: "B", config_editar: "B",
    realtime_visualizar: "V", realtime_iniciar: "B", realtime_pular: "B",
    mapa_visualizar: "V", mapa_compartilhar_gps: null,
    aprovacoes: "B",
    menu_participantes: true, menu_servidores: true, menu_financeiro: false,
    menu_checkin: false, menu_equipamentos: false, menu_artes: true,
    menu_tops: false, menu_config: false, menu_realtime: true,
    menu_mapa: true, menu_aprovacoes: false,
  },
  "Comunicação": {
    participantes_listar: "V", participantes_buscar: null, participantes_filtros: "V",
    participantes_importar: "B", participantes_exportar: null, participantes_novo: null,
    participantes_visualizar: "V", participantes_editar: null,
    servidores_cards: "B", servidores_listar: "B", servidores_filtros: "B",
    servidores_exportar: "B", servidores_importar: "B", servidores_novo: "E",
    servidores_visualizar: "B", servidores_editar: "B", servidores_excluir: "B",
    financeiro_resumo: "B", financeiro_completo: "B",
    checkin_pulseiras: "B", checkin_realizar: "B", checkin_consultar: "B", checkin_gestao: "B",
    equipamentos_listar: "V", equipamentos_novo: null, equipamentos_filtros: null,
    artes_visualizar: "E", artes_upload: "E", artes_download: "V", artes_editar: "E", artes_excluir: "E",
    tops_edicoes: "B", tops_whatsapp: "B", tops_templates: "B",
    config_listar: "B", config_novo: "B", config_editar: "B",
    realtime_visualizar: "V", realtime_iniciar: "B", realtime_pular: "B",
    mapa_visualizar: "V", mapa_compartilhar_gps: null,
    aprovacoes: "B",
    menu_participantes: true, menu_servidores: true, menu_financeiro: false,
    menu_checkin: false, menu_equipamentos: true, menu_artes: true,
    menu_tops: false, menu_config: false, menu_realtime: true,
    menu_mapa: true, menu_aprovacoes: false,
  },
  "Logística": {
    participantes_listar: "V", participantes_buscar: null, participantes_filtros: "V",
    participantes_importar: "B", participantes_exportar: null, participantes_novo: null,
    participantes_visualizar: "V", participantes_editar: null,
    servidores_cards: "B", servidores_listar: "B", servidores_filtros: "B",
    servidores_exportar: "B", servidores_importar: "B", servidores_novo: "E",
    servidores_visualizar: "B", servidores_editar: "B", servidores_excluir: "B",
    financeiro_resumo: "B", financeiro_completo: "B",
    checkin_pulseiras: null, checkin_realizar: null, checkin_consultar: null, checkin_gestao: null,
    equipamentos_listar: null, equipamentos_novo: null, equipamentos_filtros: null,
    artes_visualizar: "V", artes_upload: "V", artes_download: "V", artes_editar: "V", artes_excluir: "V",
    tops_edicoes: "B", tops_whatsapp: "B", tops_templates: "B",
    config_listar: "B", config_novo: "B", config_editar: "B",
    realtime_visualizar: "V", realtime_iniciar: "B", realtime_pular: "B",
    mapa_visualizar: "V", mapa_compartilhar_gps: null,
    aprovacoes: "B",
    menu_participantes: true, menu_servidores: true, menu_financeiro: false,
    menu_checkin: false, menu_equipamentos: false, menu_artes: true,
    menu_tops: false, menu_config: false, menu_realtime: true,
    menu_mapa: true, menu_aprovacoes: false,
  },
  "Voz": {
    participantes_listar: "V", participantes_buscar: null, participantes_filtros: "V",
    participantes_importar: "B", participantes_exportar: null, participantes_novo: null,
    participantes_visualizar: "V", participantes_editar: null,
    servidores_cards: "B", servidores_listar: "B", servidores_filtros: "B",
    servidores_exportar: "B", servidores_importar: "B", servidores_novo: "E",
    servidores_visualizar: "B", servidores_editar: "B", servidores_excluir: "B",
    financeiro_resumo: "B", financeiro_completo: "B",
    checkin_pulseiras: null, checkin_realizar: null, checkin_consultar: null, checkin_gestao: null,
    equipamentos_listar: null, equipamentos_novo: null, equipamentos_filtros: null,
    artes_visualizar: "V", artes_upload: "V", artes_download: "V", artes_editar: "V", artes_excluir: "V",
    tops_edicoes: "B", tops_whatsapp: "B", tops_templates: "B",
    config_listar: "B", config_novo: "B", config_editar: "B",
    realtime_visualizar: "V", realtime_iniciar: "B", realtime_pular: "B",
    mapa_visualizar: "V", mapa_compartilhar_gps: "E",
    aprovacoes: "B",
    menu_participantes: true, menu_servidores: true, menu_financeiro: false,
    menu_checkin: false, menu_equipamentos: false, menu_artes: true,
    menu_tops: false, menu_config: false, menu_realtime: true,
    menu_mapa: true, menu_aprovacoes: false,
  },
  "ADM": {
    participantes_listar: "V", participantes_buscar: "E", participantes_filtros: "E",
    participantes_importar: "E", participantes_exportar: "E", participantes_novo: "E",
    participantes_visualizar: "V", participantes_editar: "E",
    servidores_cards: "E", servidores_listar: "E", servidores_filtros: "E",
    servidores_exportar: "E", servidores_importar: "E", servidores_novo: "E",
    servidores_visualizar: "E", servidores_editar: "E", servidores_excluir: "E",
    financeiro_resumo: "E", financeiro_completo: "E",
    checkin_pulseiras: "E", checkin_realizar: "E", checkin_consultar: "E", checkin_gestao: "E",
    equipamentos_listar: "E", equipamentos_novo: "E", equipamentos_filtros: "E",
    artes_visualizar: "V", artes_upload: "V", artes_download: "V", artes_editar: "V", artes_excluir: "V",
    tops_edicoes: "E", tops_whatsapp: "E", tops_templates: "E",
    config_listar: "E", config_novo: "E", config_editar: "E",
    // ADM Coord 01 controla; outros visualizam — lógica aplicada no componente
    realtime_visualizar: "V", realtime_iniciar: "B", realtime_pular: "B",
    mapa_visualizar: "V", mapa_compartilhar_gps: null,
    aprovacoes: "B",
    menu_participantes: true, menu_servidores: true, menu_financeiro: true,
    menu_checkin: true, menu_equipamentos: true, menu_artes: true,
    menu_tops: true, menu_config: true, menu_realtime: true,
    menu_mapa: true, menu_aprovacoes: false,
  },
  "Intercessão": {
    participantes_listar: "V", participantes_buscar: null, participantes_filtros: "V",
    participantes_importar: "B", participantes_exportar: null, participantes_novo: null,
    participantes_visualizar: "V", participantes_editar: null,
    servidores_cards: "B", servidores_listar: "B", servidores_filtros: "B",
    servidores_exportar: "B", servidores_importar: "B", servidores_novo: "E",
    servidores_visualizar: "B", servidores_editar: "B", servidores_excluir: "B",
    financeiro_resumo: "B", financeiro_completo: "B",
    checkin_pulseiras: null, checkin_realizar: null, checkin_consultar: null, checkin_gestao: null,
    equipamentos_listar: null, equipamentos_novo: null, equipamentos_filtros: null,
    artes_visualizar: "V", artes_upload: "V", artes_download: "V", artes_editar: "V", artes_excluir: "V",
    tops_edicoes: "B", tops_whatsapp: "B", tops_templates: "B",
    config_listar: "B", config_novo: "B", config_editar: "B",
    realtime_visualizar: "V", realtime_iniciar: "B", realtime_pular: "B",
    mapa_visualizar: "V", mapa_compartilhar_gps: "E",
    aprovacoes: "B",
    menu_participantes: true, menu_servidores: true, menu_financeiro: false,
    menu_checkin: false, menu_equipamentos: false, menu_artes: true,
    menu_tops: false, menu_config: false, menu_realtime: true,
    menu_mapa: true, menu_aprovacoes: false,
  },
  "DOC": {
    participantes_listar: "V", participantes_buscar: null, participantes_filtros: "V",
    participantes_importar: "B", participantes_exportar: null, participantes_novo: null,
    participantes_visualizar: "V", participantes_editar: null,
    servidores_cards: "B", servidores_listar: "B", servidores_filtros: "B",
    servidores_exportar: "B", servidores_importar: "B", servidores_novo: "E",
    servidores_visualizar: "B", servidores_editar: "B", servidores_excluir: "B",
    financeiro_resumo: "B", financeiro_completo: "B",
    checkin_pulseiras: null, checkin_realizar: null, checkin_consultar: null, checkin_gestao: null,
    equipamentos_listar: null, equipamentos_novo: null, equipamentos_filtros: null,
    artes_visualizar: "E", artes_upload: "E", artes_download: "V", artes_editar: "V", artes_excluir: "V",
    tops_edicoes: "B", tops_whatsapp: "B", tops_templates: "V",
    config_listar: "E", config_novo: "E", config_editar: "B",
    realtime_visualizar: "V", realtime_iniciar: "B", realtime_pular: "B",
    mapa_visualizar: "V", mapa_compartilhar_gps: null,
    aprovacoes: "B",
    menu_participantes: true, menu_servidores: true, menu_financeiro: false,
    menu_checkin: false, menu_equipamentos: false, menu_artes: true,
    menu_tops: true, menu_config: true, menu_realtime: true,
    menu_mapa: true, menu_aprovacoes: false,
  },
  "Diretoria": {
    participantes_listar: "V", participantes_buscar: "V", participantes_filtros: "V",
    participantes_importar: "B", participantes_exportar: "E", participantes_novo: "E",
    participantes_visualizar: "V", participantes_editar: "E",
    servidores_cards: "V", servidores_listar: "V", servidores_filtros: "V",
    servidores_exportar: "V", servidores_importar: "V", servidores_novo: "E",
    servidores_visualizar: "V", servidores_editar: "V", servidores_excluir: "E",
    financeiro_resumo: "E", financeiro_completo: "E",
    checkin_pulseiras: null, checkin_realizar: null, checkin_consultar: null, checkin_gestao: "E",
    equipamentos_listar: null, equipamentos_novo: null, equipamentos_filtros: null,
    artes_visualizar: "V", artes_upload: "V", artes_download: "V", artes_editar: "V", artes_excluir: "V",
    tops_edicoes: "B", tops_whatsapp: "B", tops_templates: "E",
    config_listar: "E", config_novo: "E", config_editar: "E",
    realtime_visualizar: "V", realtime_iniciar: "B", realtime_pular: "B",
    mapa_visualizar: "V", mapa_compartilhar_gps: null,
    aprovacoes: "E",
    menu_participantes: true, menu_servidores: true, menu_financeiro: true,
    menu_checkin: true, menu_equipamentos: false, menu_artes: true,
    menu_tops: true, menu_config: true, menu_realtime: true,
    menu_mapa: true, menu_aprovacoes: true,
  },
};

// ---------- Funções utilitárias do Menu ----------

export function getPermissoesMenu(area: string | null): PermissoesMenu {
  if (!area) return PERMISSOES_FALLBACK;
  return PERMISSOES_MENU[area] ?? PERMISSOES_FALLBACK;
}

export function canAccessMenu(
  area: string | null,
  funcionalidade: keyof PermissoesMenu,
): boolean {
  const p = getPermissoesMenu(area);
  const val = p[funcionalidade];
  if (typeof val === "boolean") return val;
  return val === "V" || val === "E";
}

export function canEditMenu(
  area: string | null,
  funcionalidade: keyof PermissoesMenu,
): boolean {
  const p = getPermissoesMenu(area);
  const val = p[funcionalidade];
  return val === "E";
}

export function isBlockedMenu(
  area: string | null,
  funcionalidade: keyof PermissoesMenu,
): boolean {
  const p = getPermissoesMenu(area);
  const val = p[funcionalidade];
  return val === "B" || val === null;
}

// ============================================
// Permissões dos Portais por Cargo (Parte 2)
// ============================================

export interface PermissoesPortal {
  painel_cards: NivelAcesso;
  painel_definir_coords: NivelAcesso;
  painel_editar_area: NivelAcesso;
  mural_visualizar: NivelAcesso;
  mural_novo_aviso: NivelAcesso;
  calendario_visualizar: NivelAcesso;
  calendario_novo_evento: NivelAcesso;
  participantes_area: NivelAcesso;
  documentos_visualizar: NivelAcesso;
  documentos_upload: NivelAcesso;
  cronograma: NivelAcesso;
  predicas_visualizar: NivelAcesso;
  predicas_nova: NivelAcesso;
  pedidos_ver: NivelAcesso;
  pedidos_novo: NivelAcesso;
  // Hakuna-exclusivos
  consultar_pulseira?: NivelAcesso;
  equipe_ver?: NivelAcesso;
  equipe_match?: NivelAcesso;
  ergo_configurar?: NivelAcesso;
  ergo_lista?: NivelAcesso;
  autorizacoes_ver?: NivelAcesso;
  autorizacoes_aprovar?: NivelAcesso;
  medicamentos_ver?: NivelAcesso;
  medicamentos_novo?: NivelAcesso;
  medicamentos_baixa?: NivelAcesso;
  medicamentos_estoque?: NivelAcesso;
  medicamentos_historico?: NivelAcesso;
  equip_area_ver?: NivelAcesso;
  equip_area_novo?: NivelAcesso;
  equip_area_editar?: NivelAcesso;
  necessaire_ver?: NivelAcesso;
  necessaire_salvar?: NivelAcesso;
  // Segurança + Eventos
  familias_visualizar?: NivelAcesso;
  familias_gerar?: NivelAcesso;
  familias_salvar?: NivelAcesso;
  familias_etiquetas?: NivelAcesso;
  tirolesa_cards?: NivelAcesso;
  tirolesa_simular?: NivelAcesso;
  tirolesa_gerar_oficial?: NivelAcesso;
  tirolesa_briefing?: NivelAcesso;
  tirolesa_config?: NivelAcesso;
  tirolesa_imprimir?: NivelAcesso;
  tirolesa_exportar?: NivelAcesso;
  // Mídia
  radar_visualizar?: NivelAcesso;
  radar_rastrear?: NivelAcesso;
  radar_bases?: NivelAcesso;
  ia_criativa?: NivelAcesso;
  // Logística
  crono_logistica_ver?: NivelAcesso;
  crono_logistica_nova?: NivelAcesso;
  crono_logistica_relatorio?: NivelAcesso;
  // ADM
  homologacao_ver?: NivelAcesso;
  homologacao_marcar?: NivelAcesso;
  homologacao_editar?: NivelAcesso;
  painel_pedidos_cards?: NivelAcesso;
  painel_pedidos_listar?: NivelAcesso;
  painel_pedidos_alterar_status?: NivelAcesso;
}

// Base bloqueado para DOC
const DOC_BASE: PermissoesPortal = {
  painel_cards: null, painel_definir_coords: null, painel_editar_area: null,
  mural_visualizar: null, mural_novo_aviso: null,
  calendario_visualizar: null, calendario_novo_evento: null,
  participantes_area: null,
  documentos_visualizar: null, documentos_upload: null,
  cronograma: null,
  predicas_visualizar: null, predicas_nova: null,
  pedidos_ver: null, pedidos_novo: null,
};

export const PERMISSOES_PORTAL: Record<string, PermissoesPortal> = {
  // ─── HAKUNA ───
  "Hakuna_Coord 01": {
    painel_cards: "E", painel_definir_coords: "E", painel_editar_area: "E",
    mural_visualizar: "E", mural_novo_aviso: "E",
    calendario_visualizar: "E", calendario_novo_evento: "E",
    participantes_area: "E",
    documentos_visualizar: "E", documentos_upload: "E",
    cronograma: "E",
    predicas_visualizar: "V", predicas_nova: "V",
    pedidos_ver: "E", pedidos_novo: "E",
    consultar_pulseira: "E",
    equipe_ver: "E", equipe_match: "E",
    ergo_configurar: "E", ergo_lista: "E",
    autorizacoes_ver: "E", autorizacoes_aprovar: "E",
    medicamentos_ver: "E", medicamentos_novo: "E", medicamentos_baixa: "E", medicamentos_estoque: "E", medicamentos_historico: "E",
    equip_area_ver: "E", equip_area_novo: "E", equip_area_editar: "E",
    necessaire_ver: "E", necessaire_salvar: "E",
  },
  "Hakuna_Coord 02": {
    painel_cards: "E", painel_definir_coords: "E", painel_editar_area: null,
    mural_visualizar: "E", mural_novo_aviso: "E",
    calendario_visualizar: "E", calendario_novo_evento: "E",
    participantes_area: "E",
    documentos_visualizar: "E", documentos_upload: "E",
    cronograma: "V",
    predicas_visualizar: "V", predicas_nova: "V",
    pedidos_ver: "E", pedidos_novo: "E",
    consultar_pulseira: "E",
    equipe_ver: "E", equipe_match: "E",
    ergo_configurar: null, ergo_lista: "E",
    autorizacoes_ver: "E", autorizacoes_aprovar: "E",
    medicamentos_ver: "E", medicamentos_novo: "E", medicamentos_baixa: "E", medicamentos_estoque: "E", medicamentos_historico: "E",
    equip_area_ver: "V", equip_area_novo: "E", equip_area_editar: "E",
    necessaire_ver: "E", necessaire_salvar: "E",
  },
  "Hakuna_Coord 03": {
    painel_cards: "E", painel_definir_coords: null, painel_editar_area: null,
    mural_visualizar: "V", mural_novo_aviso: null,
    calendario_visualizar: "V", calendario_novo_evento: "V",
    participantes_area: "V",
    documentos_visualizar: "E", documentos_upload: "E",
    cronograma: "V",
    predicas_visualizar: "V", predicas_nova: null,
    pedidos_ver: "V", pedidos_novo: null,
    consultar_pulseira: null,
    equipe_ver: "V", equipe_match: "V",
    ergo_configurar: null, ergo_lista: "E",
    autorizacoes_ver: "V", autorizacoes_aprovar: null,
    medicamentos_ver: "V", medicamentos_novo: null, medicamentos_baixa: "E", medicamentos_estoque: "E", medicamentos_historico: "E",
    equip_area_ver: "V", equip_area_novo: "E", equip_area_editar: "V",
    necessaire_ver: "E", necessaire_salvar: "E",
  },
  "Hakuna_Sombra 01": {
    painel_cards: null, painel_definir_coords: null, painel_editar_area: null,
    mural_visualizar: "V", mural_novo_aviso: null,
    calendario_visualizar: "V", calendario_novo_evento: "V",
    participantes_area: "V",
    documentos_visualizar: "E", documentos_upload: null,
    cronograma: "V",
    predicas_visualizar: "V", predicas_nova: null,
    pedidos_ver: "V", pedidos_novo: null,
    consultar_pulseira: null,
    equipe_ver: "V", equipe_match: "V",
    ergo_configurar: null, ergo_lista: "E",
    autorizacoes_ver: "E", autorizacoes_aprovar: null,
    medicamentos_ver: "V", medicamentos_novo: null, medicamentos_baixa: "E", medicamentos_estoque: "E", medicamentos_historico: "E",
    equip_area_ver: "V", equip_area_novo: null, equip_area_editar: "V",
    necessaire_ver: "E", necessaire_salvar: null,
  },
  "Hakuna_Sombra 02": {
    painel_cards: null, painel_definir_coords: null, painel_editar_area: null,
    mural_visualizar: "V", mural_novo_aviso: null,
    calendario_visualizar: "V", calendario_novo_evento: "V",
    participantes_area: "V",
    documentos_visualizar: "E", documentos_upload: null,
    cronograma: "V",
    predicas_visualizar: "V", predicas_nova: null,
    pedidos_ver: "V", pedidos_novo: null,
    consultar_pulseira: null,
    equipe_ver: "V", equipe_match: "V",
    ergo_configurar: null, ergo_lista: "E",
    autorizacoes_ver: "E", autorizacoes_aprovar: null,
    medicamentos_ver: "V", medicamentos_novo: null, medicamentos_baixa: null, medicamentos_estoque: null, medicamentos_historico: null,
    equip_area_ver: "V", equip_area_novo: null, equip_area_editar: "V",
    necessaire_ver: "E", necessaire_salvar: null,
  },
  "Hakuna_Sombra 03": {
    painel_cards: null, painel_definir_coords: null, painel_editar_area: null,
    mural_visualizar: "V", mural_novo_aviso: null,
    calendario_visualizar: "V", calendario_novo_evento: "V",
    participantes_area: "V",
    documentos_visualizar: "E", documentos_upload: null,
    cronograma: "V",
    predicas_visualizar: "V", predicas_nova: null,
    pedidos_ver: "V", pedidos_novo: null,
    consultar_pulseira: null,
    equipe_ver: "V", equipe_match: null,
    ergo_configurar: null, ergo_lista: "E",
    autorizacoes_ver: "E", autorizacoes_aprovar: null,
    medicamentos_ver: "V", medicamentos_novo: null, medicamentos_baixa: null, medicamentos_estoque: null, medicamentos_historico: null,
    equip_area_ver: "V", equip_area_novo: null, equip_area_editar: "V",
    necessaire_ver: "E", necessaire_salvar: null,
  },
  "Hakuna_Servidor": {
    painel_cards: null, painel_definir_coords: null, painel_editar_area: null,
    mural_visualizar: "V", mural_novo_aviso: null,
    calendario_visualizar: "V", calendario_novo_evento: "V",
    participantes_area: null,
    documentos_visualizar: null, documentos_upload: null,
    cronograma: "V",
    predicas_visualizar: "V", predicas_nova: null,
    pedidos_ver: "V", pedidos_novo: null,
    consultar_pulseira: null,
    equipe_ver: "V", equipe_match: null,
    ergo_configurar: null, ergo_lista: null,
    autorizacoes_ver: null, autorizacoes_aprovar: null,
    medicamentos_ver: null, medicamentos_novo: null, medicamentos_baixa: null, medicamentos_estoque: null, medicamentos_historico: null,
    equip_area_ver: "V", equip_area_novo: null, equip_area_editar: "V",
    necessaire_ver: null, necessaire_salvar: null,
  },

  // ─── SEGURANÇA ───
  "Segurança_Coord 01": {
    painel_cards: "E", painel_definir_coords: "E", painel_editar_area: "E",
    mural_visualizar: "E", mural_novo_aviso: "E",
    calendario_visualizar: "E", calendario_novo_evento: "E",
    participantes_area: "E",
    documentos_visualizar: "E", documentos_upload: "E",
    cronograma: "V",
    predicas_visualizar: "V", predicas_nova: "V",
    pedidos_ver: "E", pedidos_novo: "E",
    familias_visualizar: "V", familias_gerar: "E", familias_salvar: "E", familias_etiquetas: "V",
    tirolesa_cards: "E", tirolesa_simular: "E", tirolesa_gerar_oficial: "E", tirolesa_briefing: "E", tirolesa_config: "E", tirolesa_imprimir: "E", tirolesa_exportar: "E",
  },
  "Segurança_Coord 02": {
    painel_cards: "E", painel_definir_coords: "E", painel_editar_area: "V",
    mural_visualizar: "E", mural_novo_aviso: "E",
    calendario_visualizar: "E", calendario_novo_evento: "E",
    participantes_area: "E",
    documentos_visualizar: "E", documentos_upload: "E",
    cronograma: "V",
    predicas_visualizar: "V", predicas_nova: "V",
    pedidos_ver: "V", pedidos_novo: "E",
    familias_visualizar: "V", familias_gerar: "V", familias_salvar: "V", familias_etiquetas: "V",
    tirolesa_cards: "E", tirolesa_simular: "E", tirolesa_gerar_oficial: "E", tirolesa_briefing: "E", tirolesa_config: "E", tirolesa_imprimir: "E", tirolesa_exportar: "E",
  },
  "Segurança_Coord 03": {
    painel_cards: "V", painel_definir_coords: "V", painel_editar_area: null,
    mural_visualizar: "V", mural_novo_aviso: "V",
    calendario_visualizar: "V", calendario_novo_evento: "V",
    participantes_area: "V",
    documentos_visualizar: "V", documentos_upload: "V",
    cronograma: "V",
    predicas_visualizar: "V", predicas_nova: null,
    pedidos_ver: "V", pedidos_novo: "E",
    familias_visualizar: "V", familias_gerar: "V", familias_salvar: "V", familias_etiquetas: "E",
    tirolesa_cards: "E", tirolesa_simular: "E", tirolesa_gerar_oficial: "E", tirolesa_briefing: "E", tirolesa_config: "E", tirolesa_imprimir: "E", tirolesa_exportar: "E",
  },
  "Segurança_Sombra 01": {
    painel_cards: "V", painel_definir_coords: "V", painel_editar_area: null,
    mural_visualizar: "V", mural_novo_aviso: "V",
    calendario_visualizar: "V", calendario_novo_evento: "V",
    participantes_area: "V",
    documentos_visualizar: "V", documentos_upload: null,
    cronograma: "V",
    predicas_visualizar: "V", predicas_nova: null,
    pedidos_ver: "V", pedidos_novo: null,
    familias_visualizar: "V", familias_gerar: "V", familias_salvar: "V", familias_etiquetas: "E",
    tirolesa_cards: "E", tirolesa_simular: "E", tirolesa_gerar_oficial: "E", tirolesa_briefing: "E", tirolesa_config: "E", tirolesa_imprimir: "E", tirolesa_exportar: "V",
  },
  "Segurança_Sombra 02": {
    painel_cards: "V", painel_definir_coords: "V", painel_editar_area: null,
    mural_visualizar: "V", mural_novo_aviso: "V",
    calendario_visualizar: "V", calendario_novo_evento: "V",
    participantes_area: "V",
    documentos_visualizar: "V", documentos_upload: null,
    cronograma: "V",
    predicas_visualizar: "V", predicas_nova: null,
    pedidos_ver: "V", pedidos_novo: null,
    familias_visualizar: "V", familias_gerar: "V", familias_salvar: "V", familias_etiquetas: "V",
    tirolesa_cards: "V", tirolesa_simular: "V", tirolesa_gerar_oficial: "V", tirolesa_briefing: "V", tirolesa_config: "V", tirolesa_imprimir: "V", tirolesa_exportar: "V",
  },
  "Segurança_Sombra 03": {
    painel_cards: "V", painel_definir_coords: "V", painel_editar_area: null,
    mural_visualizar: "V", mural_novo_aviso: "V",
    calendario_visualizar: "V", calendario_novo_evento: "V",
    participantes_area: "V",
    documentos_visualizar: "V", documentos_upload: null,
    cronograma: "V",
    predicas_visualizar: "V", predicas_nova: null,
    pedidos_ver: "V", pedidos_novo: null,
    familias_visualizar: "V", familias_gerar: "V", familias_salvar: "V", familias_etiquetas: "V",
    tirolesa_cards: "V", tirolesa_simular: "V", tirolesa_gerar_oficial: "V", tirolesa_briefing: "V", tirolesa_config: "V", tirolesa_imprimir: "V", tirolesa_exportar: "V",
  },
  "Segurança_Servidor": {
    painel_cards: null, painel_definir_coords: null, painel_editar_area: null,
    mural_visualizar: "V", mural_novo_aviso: null,
    calendario_visualizar: "V", calendario_novo_evento: null,
    participantes_area: null,
    documentos_visualizar: "V", documentos_upload: null,
    cronograma: "V",
    predicas_visualizar: "V", predicas_nova: null,
    pedidos_ver: "V", pedidos_novo: null,
    familias_visualizar: "V", familias_gerar: null, familias_salvar: null, familias_etiquetas: null,
    tirolesa_cards: null, tirolesa_simular: null, tirolesa_gerar_oficial: null, tirolesa_briefing: null, tirolesa_config: null, tirolesa_imprimir: null, tirolesa_exportar: "V",
  },

  // ─── EVENTOS ───
  "Eventos_Coord 01": {
    painel_cards: "E", painel_definir_coords: "E", painel_editar_area: "E",
    mural_visualizar: "E", mural_novo_aviso: "E",
    calendario_visualizar: "E", calendario_novo_evento: "E",
    participantes_area: "E",
    documentos_visualizar: "E", documentos_upload: "E",
    cronograma: "V",
    predicas_visualizar: "V", predicas_nova: "V",
    pedidos_ver: "E", pedidos_novo: "E",
    familias_visualizar: "E", familias_gerar: "E",
    tirolesa_cards: "V", tirolesa_simular: "V", tirolesa_briefing: "V", tirolesa_config: "V", tirolesa_exportar: "V",
  },
  "Eventos_Coord 02": {
    painel_cards: "E", painel_definir_coords: "E", painel_editar_area: "E",
    mural_visualizar: "E", mural_novo_aviso: "E",
    calendario_visualizar: "E", calendario_novo_evento: "E",
    participantes_area: "E",
    documentos_visualizar: "E", documentos_upload: "E",
    cronograma: "E",
    predicas_visualizar: "V", predicas_nova: "E",
    pedidos_ver: "E", pedidos_novo: "E",
    familias_visualizar: "E", familias_gerar: "E",
    tirolesa_cards: "V", tirolesa_simular: "E", tirolesa_briefing: "E", tirolesa_config: "E", tirolesa_exportar: "V",
  },
  "Eventos_Coord 03": {
    painel_cards: "V", painel_definir_coords: "V", painel_editar_area: "V",
    mural_visualizar: "E", mural_novo_aviso: null,
    calendario_visualizar: "E", calendario_novo_evento: "E",
    participantes_area: "V",
    documentos_visualizar: "E", documentos_upload: null,
    cronograma: "E",
    predicas_visualizar: "E", predicas_nova: null,
    pedidos_ver: "E", pedidos_novo: "E",
    familias_visualizar: "E", familias_gerar: null,
    tirolesa_cards: "E", tirolesa_simular: null, tirolesa_briefing: null, tirolesa_config: null, tirolesa_exportar: "V",
  },
  "Eventos_Sombra 01": {
    painel_cards: "V", painel_definir_coords: "V", painel_editar_area: "V",
    mural_visualizar: "V", mural_novo_aviso: null,
    calendario_visualizar: "E", calendario_novo_evento: "E",
    participantes_area: "V",
    documentos_visualizar: "V", documentos_upload: null,
    cronograma: null,
    predicas_visualizar: null, predicas_nova: null,
    pedidos_ver: "V", pedidos_novo: null,
    familias_visualizar: "V", familias_gerar: null,
    tirolesa_cards: "V", tirolesa_simular: null, tirolesa_briefing: null, tirolesa_config: null, tirolesa_exportar: "V",
  },
  "Eventos_Sombra 02": {
    painel_cards: "V", painel_definir_coords: "V", painel_editar_area: "V",
    mural_visualizar: "V", mural_novo_aviso: null,
    calendario_visualizar: "E", calendario_novo_evento: "E",
    participantes_area: "V",
    documentos_visualizar: "V", documentos_upload: null,
    cronograma: null,
    predicas_visualizar: null, predicas_nova: null,
    pedidos_ver: "V", pedidos_novo: null,
    familias_visualizar: "V", familias_gerar: null,
    tirolesa_cards: "V", tirolesa_simular: null, tirolesa_briefing: null, tirolesa_config: null, tirolesa_exportar: "V",
  },
  "Eventos_Sombra 03": {
    painel_cards: "V", painel_definir_coords: "V", painel_editar_area: "V",
    mural_visualizar: "V", mural_novo_aviso: null,
    calendario_visualizar: "E", calendario_novo_evento: "E",
    participantes_area: "V",
    documentos_visualizar: "V", documentos_upload: null,
    cronograma: null,
    predicas_visualizar: null, predicas_nova: null,
    pedidos_ver: "V", pedidos_novo: null,
    familias_visualizar: "V", familias_gerar: null,
    tirolesa_cards: "V", tirolesa_simular: null, tirolesa_briefing: null, tirolesa_config: null, tirolesa_exportar: "V",
  },
  "Eventos_Servidor": {
    painel_cards: "V", painel_definir_coords: null, painel_editar_area: null,
    mural_visualizar: "V", mural_novo_aviso: null,
    calendario_visualizar: "V", calendario_novo_evento: null,
    participantes_area: "V",
    documentos_visualizar: "V", documentos_upload: null,
    cronograma: null,
    predicas_visualizar: "V", predicas_nova: null,
    pedidos_ver: "V", pedidos_novo: null,
    familias_visualizar: "V", familias_gerar: null,
    tirolesa_cards: "V", tirolesa_simular: null, tirolesa_briefing: null, tirolesa_config: null, tirolesa_exportar: "V",
  },

  // ─── MÍDIA ───
  "Mídia_Coord 01": {
    painel_cards: "E", painel_definir_coords: "E", painel_editar_area: "E",
    mural_visualizar: "E", mural_novo_aviso: "E",
    calendario_visualizar: "E", calendario_novo_evento: "E",
    participantes_area: "E",
    documentos_visualizar: "E", documentos_upload: "E",
    cronograma: "V",
    predicas_visualizar: "V", predicas_nova: "V",
    pedidos_ver: "E", pedidos_novo: "E",
    radar_visualizar: "E", radar_rastrear: "E", radar_bases: "E",
    ia_criativa: "E",
  },
  "Mídia_Coord 02": {
    painel_cards: "E", painel_definir_coords: "E", painel_editar_area: "E",
    mural_visualizar: "E", mural_novo_aviso: "E",
    calendario_visualizar: "E", calendario_novo_evento: "E",
    participantes_area: "E",
    documentos_visualizar: "E", documentos_upload: "E",
    cronograma: "V",
    predicas_visualizar: "V", predicas_nova: "V",
    pedidos_ver: "E", pedidos_novo: "E",
    radar_visualizar: "E", radar_rastrear: "E", radar_bases: "E",
    ia_criativa: "E",
  },
  "Mídia_Coord 03": {
    painel_cards: "E", painel_definir_coords: "E", painel_editar_area: "E",
    mural_visualizar: "E", mural_novo_aviso: "E",
    calendario_visualizar: "E", calendario_novo_evento: "E",
    participantes_area: "E",
    documentos_visualizar: "E", documentos_upload: "E",
    cronograma: "V",
    predicas_visualizar: "V", predicas_nova: null,
    pedidos_ver: "E", pedidos_novo: "E",
    radar_visualizar: "E", radar_rastrear: "E", radar_bases: "E",
    ia_criativa: "E",
  },
  "Mídia_Sombra 01": {
    painel_cards: "V", painel_definir_coords: "V", painel_editar_area: null,
    mural_visualizar: "E", mural_novo_aviso: null,
    calendario_visualizar: "E", calendario_novo_evento: "E",
    participantes_area: "V",
    documentos_visualizar: "E", documentos_upload: null,
    cronograma: "V",
    predicas_visualizar: "V", predicas_nova: null,
    pedidos_ver: "V", pedidos_novo: "V",
    radar_visualizar: "V", radar_rastrear: "V", radar_bases: "V",
    ia_criativa: "V",
  },
  "Mídia_Sombra 02": {
    painel_cards: "V", painel_definir_coords: "V", painel_editar_area: null,
    mural_visualizar: "E", mural_novo_aviso: null,
    calendario_visualizar: "E", calendario_novo_evento: "E",
    participantes_area: "V",
    documentos_visualizar: "V", documentos_upload: null,
    cronograma: "V",
    predicas_visualizar: "V", predicas_nova: null,
    pedidos_ver: "V", pedidos_novo: "V",
    radar_visualizar: "V", radar_rastrear: "V", radar_bases: "V",
    ia_criativa: "V",
  },
  "Mídia_Sombra 03": {
    painel_cards: "V", painel_definir_coords: "V", painel_editar_area: null,
    mural_visualizar: "E", mural_novo_aviso: null,
    calendario_visualizar: "E", calendario_novo_evento: "E",
    participantes_area: "V",
    documentos_visualizar: "V", documentos_upload: null,
    cronograma: "V",
    predicas_visualizar: "V", predicas_nova: null,
    pedidos_ver: "V", pedidos_novo: "V",
    radar_visualizar: "V", radar_rastrear: "V", radar_bases: "V",
    ia_criativa: "V",
  },
  "Mídia_Servidor": {
    painel_cards: null, painel_definir_coords: null, painel_editar_area: null,
    mural_visualizar: null, mural_novo_aviso: null,
    calendario_visualizar: null, calendario_novo_evento: null,
    participantes_area: null,
    documentos_visualizar: "V", documentos_upload: null,
    cronograma: "V",
    predicas_visualizar: "V", predicas_nova: null,
    pedidos_ver: "V", pedidos_novo: null,
    radar_visualizar: "V", radar_rastrear: "V", radar_bases: "V",
    ia_criativa: "V",
  },

  // ─── COMUNICAÇÃO ───
  "Comunicação_Coord 01": {
    painel_cards: "E", painel_definir_coords: "E", painel_editar_area: "E",
    mural_visualizar: "E", mural_novo_aviso: "E",
    calendario_visualizar: "E", calendario_novo_evento: "E",
    participantes_area: "E",
    documentos_visualizar: "E", documentos_upload: "E",
    cronograma: "V",
    predicas_visualizar: "V", predicas_nova: "V",
    pedidos_ver: "E", pedidos_novo: "E",
  },
  "Comunicação_Coord 02": {
    painel_cards: "E", painel_definir_coords: "E", painel_editar_area: "E",
    mural_visualizar: "E", mural_novo_aviso: "E",
    calendario_visualizar: "E", calendario_novo_evento: "E",
    participantes_area: "E",
    documentos_visualizar: "E", documentos_upload: "E",
    cronograma: "V",
    predicas_visualizar: "V", predicas_nova: "V",
    pedidos_ver: "E", pedidos_novo: null,
  },
  "Comunicação_Coord 03": {
    painel_cards: "E", painel_definir_coords: "E", painel_editar_area: "E",
    mural_visualizar: "E", mural_novo_aviso: "E",
    calendario_visualizar: "E", calendario_novo_evento: "E",
    participantes_area: "E",
    documentos_visualizar: "E", documentos_upload: "E",
    cronograma: "V",
    predicas_visualizar: "V", predicas_nova: null,
    pedidos_ver: "E", pedidos_novo: null,
  },
  "Comunicação_Sombra 01": {
    painel_cards: "V", painel_definir_coords: "V", painel_editar_area: "V",
    mural_visualizar: "V", mural_novo_aviso: "V",
    calendario_visualizar: "E", calendario_novo_evento: "E",
    participantes_area: "V",
    documentos_visualizar: "V", documentos_upload: null,
    cronograma: "V",
    predicas_visualizar: "V", predicas_nova: null,
    pedidos_ver: "E", pedidos_novo: null,
  },
  "Comunicação_Sombra 02": {
    painel_cards: "V", painel_definir_coords: "V", painel_editar_area: "V",
    mural_visualizar: "V", mural_novo_aviso: "V",
    calendario_visualizar: "E", calendario_novo_evento: "E",
    participantes_area: "V",
    documentos_visualizar: "V", documentos_upload: null,
    cronograma: "V",
    predicas_visualizar: "V", predicas_nova: null,
    pedidos_ver: "E", pedidos_novo: null,
  },
  "Comunicação_Sombra 03": {
    painel_cards: "V", painel_definir_coords: "V", painel_editar_area: "V",
    mural_visualizar: "V", mural_novo_aviso: "V",
    calendario_visualizar: "E", calendario_novo_evento: "E",
    participantes_area: "V",
    documentos_visualizar: "V", documentos_upload: null,
    cronograma: "V",
    predicas_visualizar: "V", predicas_nova: null,
    pedidos_ver: "E", pedidos_novo: null,
  },
  "Comunicação_Servidor": {
    painel_cards: "V", painel_definir_coords: "V", painel_editar_area: null,
    mural_visualizar: "V", mural_novo_aviso: null,
    calendario_visualizar: "V", calendario_novo_evento: null,
    participantes_area: "V",
    documentos_visualizar: "V", documentos_upload: null,
    cronograma: "V",
    predicas_visualizar: "V", predicas_nova: null,
    pedidos_ver: "V", pedidos_novo: null,
  },

  // ─── LOGÍSTICA ───
  "Logística_Coord 01": {
    painel_cards: "E", painel_definir_coords: "E", painel_editar_area: "E",
    mural_visualizar: "E", mural_novo_aviso: "E",
    calendario_visualizar: "E", calendario_novo_evento: "E",
    participantes_area: "E",
    documentos_visualizar: "E", documentos_upload: "E",
    cronograma: "V",
    predicas_visualizar: "V", predicas_nova: "V",
    pedidos_ver: "E", pedidos_novo: "E",
    crono_logistica_ver: "E", crono_logistica_nova: "E", crono_logistica_relatorio: "E",
  },
  "Logística_Coord 02": {
    painel_cards: "E", painel_definir_coords: "E", painel_editar_area: "E",
    mural_visualizar: "E", mural_novo_aviso: "E",
    calendario_visualizar: "E", calendario_novo_evento: "E",
    participantes_area: "E",
    documentos_visualizar: "E", documentos_upload: "E",
    cronograma: "V",
    predicas_visualizar: "V", predicas_nova: "V",
    pedidos_ver: "E", pedidos_novo: "E",
    crono_logistica_ver: "E", crono_logistica_nova: "E", crono_logistica_relatorio: "E",
  },
  "Logística_Coord 03": {
    painel_cards: "V", painel_definir_coords: "E", painel_editar_area: "E",
    mural_visualizar: "E", mural_novo_aviso: "E",
    calendario_visualizar: "E", calendario_novo_evento: "E",
    participantes_area: "E",
    documentos_visualizar: "E", documentos_upload: "E",
    cronograma: "V",
    predicas_visualizar: "V", predicas_nova: "V",
    pedidos_ver: "E", pedidos_novo: "E",
    crono_logistica_ver: "E", crono_logistica_nova: "E", crono_logistica_relatorio: null,
  },
  "Logística_Sombra 01": {
    painel_cards: "V", painel_definir_coords: "V", painel_editar_area: "V",
    mural_visualizar: "V", mural_novo_aviso: "V",
    calendario_visualizar: "V", calendario_novo_evento: "V",
    participantes_area: "V",
    documentos_visualizar: "V", documentos_upload: null,
    cronograma: "V",
    predicas_visualizar: "V", predicas_nova: "E",
    pedidos_ver: "E", pedidos_novo: null,
    crono_logistica_ver: "E", crono_logistica_nova: "E", crono_logistica_relatorio: "E",
  },
  "Logística_Sombra 02": {
    painel_cards: "V", painel_definir_coords: "V", painel_editar_area: "V",
    mural_visualizar: "V", mural_novo_aviso: "V",
    calendario_visualizar: "V", calendario_novo_evento: "V",
    participantes_area: "V",
    documentos_visualizar: "V", documentos_upload: null,
    cronograma: "V",
    predicas_visualizar: "V", predicas_nova: "E",
    pedidos_ver: "E", pedidos_novo: null,
    crono_logistica_ver: "E", crono_logistica_nova: "E", crono_logistica_relatorio: "E",
  },
  "Logística_Sombra 03": {
    painel_cards: "V", painel_definir_coords: "V", painel_editar_area: "V",
    mural_visualizar: "V", mural_novo_aviso: "V",
    calendario_visualizar: "V", calendario_novo_evento: "V",
    participantes_area: "V",
    documentos_visualizar: "V", documentos_upload: null,
    cronograma: "V",
    predicas_visualizar: "V", predicas_nova: null,
    pedidos_ver: "E", pedidos_novo: null,
    crono_logistica_ver: "E", crono_logistica_nova: "E", crono_logistica_relatorio: "E",
  },
  "Logística_Servidor": {
    painel_cards: null, painel_definir_coords: null, painel_editar_area: null,
    mural_visualizar: "V", mural_novo_aviso: null,
    calendario_visualizar: "V", calendario_novo_evento: null,
    participantes_area: null,
    documentos_visualizar: "V", documentos_upload: null,
    cronograma: "V",
    predicas_visualizar: "V", predicas_nova: null,
    pedidos_ver: "V", pedidos_novo: null,
    crono_logistica_ver: "V", crono_logistica_nova: null, crono_logistica_relatorio: null,
  },

  // ─── VOZ ───
  "Voz_Coord 01": {
    painel_cards: "E", painel_definir_coords: "E", painel_editar_area: "E",
    mural_visualizar: "E", mural_novo_aviso: "E",
    calendario_visualizar: "E", calendario_novo_evento: "E",
    participantes_area: "E",
    documentos_visualizar: "E", documentos_upload: "E",
    cronograma: "V",
    predicas_visualizar: "V", predicas_nova: "V",
    pedidos_ver: "E", pedidos_novo: "E",
  },
  "Voz_Coord 02": {
    painel_cards: "E", painel_definir_coords: "E", painel_editar_area: "E",
    mural_visualizar: "E", mural_novo_aviso: "E",
    calendario_visualizar: "E", calendario_novo_evento: "E",
    participantes_area: "E",
    documentos_visualizar: "E", documentos_upload: "E",
    cronograma: "V",
    predicas_visualizar: "V", predicas_nova: null,
    pedidos_ver: "E", pedidos_novo: "E",
  },
  "Voz_Coord 03": {
    painel_cards: "E", painel_definir_coords: "E", painel_editar_area: "E",
    mural_visualizar: "E", mural_novo_aviso: "E",
    calendario_visualizar: "E", calendario_novo_evento: "E",
    participantes_area: "E",
    documentos_visualizar: "E", documentos_upload: "E",
    cronograma: "V",
    predicas_visualizar: "V", predicas_nova: null,
    pedidos_ver: "E", pedidos_novo: null,
  },
  "Voz_Sombra 01": {
    painel_cards: "V", painel_definir_coords: "V", painel_editar_area: null,
    mural_visualizar: "V", mural_novo_aviso: "V",
    calendario_visualizar: "E", calendario_novo_evento: "E",
    participantes_area: "V",
    documentos_visualizar: "E", documentos_upload: null,
    cronograma: "V",
    predicas_visualizar: "V", predicas_nova: null,
    pedidos_ver: "E", pedidos_novo: null,
  },
  "Voz_Sombra 02": {
    painel_cards: "V", painel_definir_coords: "V", painel_editar_area: null,
    mural_visualizar: "V", mural_novo_aviso: "V",
    calendario_visualizar: "E", calendario_novo_evento: "E",
    participantes_area: "V",
    documentos_visualizar: "V", documentos_upload: null,
    cronograma: "V",
    predicas_visualizar: "V", predicas_nova: null,
    pedidos_ver: "E", pedidos_novo: null,
  },
  "Voz_Sombra 03": {
    painel_cards: "V", painel_definir_coords: "V", painel_editar_area: null,
    mural_visualizar: "V", mural_novo_aviso: "V",
    calendario_visualizar: "E", calendario_novo_evento: "E",
    participantes_area: "V",
    documentos_visualizar: "V", documentos_upload: null,
    cronograma: "V",
    predicas_visualizar: "V", predicas_nova: null,
    pedidos_ver: "V", pedidos_novo: null,
  },
  "Voz_Servidor": {
    painel_cards: null, painel_definir_coords: null, painel_editar_area: null,
    mural_visualizar: "V", mural_novo_aviso: null,
    calendario_visualizar: null, calendario_novo_evento: null,
    participantes_area: null,
    documentos_visualizar: "V", documentos_upload: null,
    cronograma: "V",
    predicas_visualizar: "V", predicas_nova: null,
    pedidos_ver: "V", pedidos_novo: null,
  },

  // ─── ADM ───
  "ADM_Coord 01": {
    painel_cards: "E", painel_definir_coords: "E", painel_editar_area: "E",
    mural_visualizar: "E", mural_novo_aviso: "E",
    calendario_visualizar: "E", calendario_novo_evento: "E",
    participantes_area: "E",
    documentos_visualizar: "E", documentos_upload: "E",
    cronograma: "E",
    predicas_visualizar: "E", predicas_nova: "E",
    pedidos_ver: "E", pedidos_novo: "E",
    homologacao_ver: "E", homologacao_marcar: "E", homologacao_editar: "E",
    painel_pedidos_cards: "E", painel_pedidos_listar: "E", painel_pedidos_alterar_status: "E",
  },
  "ADM_Coord 02": {
    painel_cards: "E", painel_definir_coords: "E", painel_editar_area: "E",
    mural_visualizar: "E", mural_novo_aviso: "E",
    calendario_visualizar: "E", calendario_novo_evento: "E",
    participantes_area: "E",
    documentos_visualizar: "E", documentos_upload: "E",
    cronograma: "E",
    predicas_visualizar: "E", predicas_nova: "E",
    pedidos_ver: "E", pedidos_novo: "E",
    homologacao_ver: "E", homologacao_marcar: "E", homologacao_editar: "E",
    painel_pedidos_cards: "E", painel_pedidos_listar: "E", painel_pedidos_alterar_status: "E",
  },
  "ADM_Coord 03": {
    painel_cards: "E", painel_definir_coords: "E", painel_editar_area: "E",
    mural_visualizar: "E", mural_novo_aviso: "E",
    calendario_visualizar: "E", calendario_novo_evento: "E",
    participantes_area: "E",
    documentos_visualizar: "E", documentos_upload: "E",
    cronograma: "E",
    predicas_visualizar: "E", predicas_nova: null,
    pedidos_ver: "E", pedidos_novo: "E",
    homologacao_ver: "E", homologacao_marcar: "E", homologacao_editar: "E",
    painel_pedidos_cards: "E", painel_pedidos_listar: "E", painel_pedidos_alterar_status: "E",
  },
  "ADM_Sombra 01": {
    painel_cards: "E", painel_definir_coords: "E", painel_editar_area: "E",
    mural_visualizar: "E", mural_novo_aviso: "E",
    calendario_visualizar: "E", calendario_novo_evento: "E",
    participantes_area: "E",
    documentos_visualizar: "E", documentos_upload: "E",
    cronograma: "E",
    predicas_visualizar: "E", predicas_nova: null,
    pedidos_ver: "E", pedidos_novo: "E",
    homologacao_ver: "E", homologacao_marcar: "E", homologacao_editar: "E",
    painel_pedidos_cards: "E", painel_pedidos_listar: "E", painel_pedidos_alterar_status: "V",
  },
  "ADM_Sombra 02": {
    painel_cards: "E", painel_definir_coords: "E", painel_editar_area: "E",
    mural_visualizar: "E", mural_novo_aviso: "E",
    calendario_visualizar: "E", calendario_novo_evento: "E",
    participantes_area: "E",
    documentos_visualizar: "E", documentos_upload: "E",
    cronograma: "E",
    predicas_visualizar: "E", predicas_nova: null,
    pedidos_ver: "E", pedidos_novo: "E",
    homologacao_ver: "E", homologacao_marcar: "E", homologacao_editar: "E",
    painel_pedidos_cards: "E", painel_pedidos_listar: "E", painel_pedidos_alterar_status: "V",
  },
  "ADM_Sombra 03": {
    painel_cards: "E", painel_definir_coords: "E", painel_editar_area: "E",
    mural_visualizar: "E", mural_novo_aviso: "E",
    calendario_visualizar: "E", calendario_novo_evento: "E",
    participantes_area: "E",
    documentos_visualizar: "E", documentos_upload: "E",
    cronograma: "E",
    predicas_visualizar: "E", predicas_nova: null,
    pedidos_ver: "E", pedidos_novo: "E",
    homologacao_ver: "E", homologacao_marcar: "E", homologacao_editar: "E",
    painel_pedidos_cards: "E", painel_pedidos_listar: "E", painel_pedidos_alterar_status: "V",
  },
  "ADM_Servidor": {
    painel_cards: "E", painel_definir_coords: null, painel_editar_area: null,
    mural_visualizar: "E", mural_novo_aviso: null,
    calendario_visualizar: "E", calendario_novo_evento: null,
    participantes_area: null,
    documentos_visualizar: "E", documentos_upload: null,
    cronograma: "E",
    predicas_visualizar: "E", predicas_nova: null,
    pedidos_ver: "E", pedidos_novo: "E",
    homologacao_ver: null, homologacao_marcar: null, homologacao_editar: null,
    painel_pedidos_cards: null, painel_pedidos_listar: null, painel_pedidos_alterar_status: "V",
  },

  // ─── INTERCESSÃO ───
  "Intercessão_Coord 01": {
    painel_cards: "E", painel_definir_coords: "E", painel_editar_area: "E",
    mural_visualizar: "E", mural_novo_aviso: "E",
    calendario_visualizar: "E", calendario_novo_evento: "E",
    participantes_area: "E",
    documentos_visualizar: "E", documentos_upload: "E",
    cronograma: "V",
    predicas_visualizar: "E", predicas_nova: "E",
    pedidos_ver: "E", pedidos_novo: "E",
  },
  "Intercessão_Coord 02": {
    painel_cards: "E", painel_definir_coords: "E", painel_editar_area: "E",
    mural_visualizar: "E", mural_novo_aviso: "E",
    calendario_visualizar: "E", calendario_novo_evento: "E",
    participantes_area: "E",
    documentos_visualizar: "E", documentos_upload: "E",
    cronograma: "V",
    predicas_visualizar: "E", predicas_nova: "E",
    pedidos_ver: "E", pedidos_novo: "E",
  },
  "Intercessão_Coord 03": {
    painel_cards: "E", painel_definir_coords: "V", painel_editar_area: null,
    mural_visualizar: "E", mural_novo_aviso: "E",
    calendario_visualizar: "E", calendario_novo_evento: "E",
    participantes_area: "E",
    documentos_visualizar: "E", documentos_upload: "E",
    cronograma: "V",
    predicas_visualizar: "E", predicas_nova: "E",
    pedidos_ver: "E", pedidos_novo: "E",
  },
  "Intercessão_Sombra 01": {
    painel_cards: "E", painel_definir_coords: "E", painel_editar_area: null,
    mural_visualizar: "E", mural_novo_aviso: "E",
    calendario_visualizar: "E", calendario_novo_evento: "E",
    participantes_area: "E",
    documentos_visualizar: "E", documentos_upload: "E",
    cronograma: "V",
    predicas_visualizar: "E", predicas_nova: "E",
    pedidos_ver: "E", pedidos_novo: "E",
  },
  "Intercessão_Sombra 02": {
    painel_cards: "E", painel_definir_coords: "E", painel_editar_area: null,
    mural_visualizar: "E", mural_novo_aviso: "E",
    calendario_visualizar: "E", calendario_novo_evento: "E",
    participantes_area: "E",
    documentos_visualizar: "E", documentos_upload: "E",
    cronograma: "V",
    predicas_visualizar: "V", predicas_nova: null,
    pedidos_ver: "E", pedidos_novo: "E",
  },
  "Intercessão_Sombra 03": {
    painel_cards: "E", painel_definir_coords: "E", painel_editar_area: null,
    mural_visualizar: "E", mural_novo_aviso: "E",
    calendario_visualizar: "E", calendario_novo_evento: "E",
    participantes_area: "E",
    documentos_visualizar: "E", documentos_upload: "E",
    cronograma: "V",
    predicas_visualizar: "V", predicas_nova: null,
    pedidos_ver: "E", pedidos_novo: "E",
  },
  "Intercessão_Servidor": {
    painel_cards: "E", painel_definir_coords: null, painel_editar_area: null,
    mural_visualizar: "E", mural_novo_aviso: null,
    calendario_visualizar: "E", calendario_novo_evento: null,
    participantes_area: null,
    documentos_visualizar: "E", documentos_upload: null,
    cronograma: "V",
    predicas_visualizar: "V", predicas_nova: null,
    pedidos_ver: "E", pedidos_novo: null,
  },

  // ─── DOC ─── (tudo bloqueado, exceto prédicas para coordenadores)
  "DOC_Coord 01": { ...DOC_BASE, predicas_visualizar: "E", predicas_nova: "E" },
  "DOC_Coord 02": { ...DOC_BASE, predicas_visualizar: "E", predicas_nova: "E" },
  "DOC_Coord 03": { ...DOC_BASE, predicas_visualizar: "E", predicas_nova: null },
  "DOC_Sombra 01": { ...DOC_BASE },
  "DOC_Sombra 02": { ...DOC_BASE },
  "DOC_Sombra 03": { ...DOC_BASE },
  "DOC_Servidor": { ...DOC_BASE },

  // ─── DIRETORIA ───
  "Diretoria_Coord 01": {
    painel_cards: "E", painel_definir_coords: "E", painel_editar_area: "E",
    mural_visualizar: "E", mural_novo_aviso: "E",
    calendario_visualizar: "E", calendario_novo_evento: "E",
    participantes_area: "E",
    documentos_visualizar: "E", documentos_upload: "E",
    cronograma: "E",
    predicas_visualizar: "E", predicas_nova: "E",
    pedidos_ver: "E", pedidos_novo: "E",
  },
  "Diretoria_Coord 02": {
    painel_cards: "E", painel_definir_coords: "E", painel_editar_area: "E",
    mural_visualizar: "E", mural_novo_aviso: "E",
    calendario_visualizar: "E", calendario_novo_evento: "E",
    participantes_area: "E",
    documentos_visualizar: "E", documentos_upload: "E",
    cronograma: "E",
    predicas_visualizar: "E", predicas_nova: "E",
    pedidos_ver: "E", pedidos_novo: "E",
  },
  "Diretoria_Coord 03": {
    painel_cards: "E", painel_definir_coords: "E", painel_editar_area: "E",
    mural_visualizar: "E", mural_novo_aviso: "E",
    calendario_visualizar: "E", calendario_novo_evento: "E",
    participantes_area: "E",
    documentos_visualizar: "E", documentos_upload: "E",
    cronograma: "V",
    predicas_visualizar: "E", predicas_nova: null,
    pedidos_ver: "E", pedidos_novo: "E",
  },
  "Diretoria_Sombra 01": {
    painel_cards: "E", painel_definir_coords: "E", painel_editar_area: "E",
    mural_visualizar: "E", mural_novo_aviso: "E",
    calendario_visualizar: "E", calendario_novo_evento: "E",
    participantes_area: "E",
    documentos_visualizar: "E", documentos_upload: "E",
    cronograma: "V",
    predicas_visualizar: "E", predicas_nova: null,
    pedidos_ver: "E", pedidos_novo: "E",
  },
  "Diretoria_Sombra 02": {
    painel_cards: "E", painel_definir_coords: "E", painel_editar_area: "E",
    mural_visualizar: "E", mural_novo_aviso: "E",
    calendario_visualizar: "E", calendario_novo_evento: "E",
    participantes_area: "E",
    documentos_visualizar: "E", documentos_upload: "E",
    cronograma: "V",
    predicas_visualizar: "E", predicas_nova: null,
    pedidos_ver: "E", pedidos_novo: "E",
  },
  "Diretoria_Sombra 03": {
    painel_cards: "E", painel_definir_coords: "E", painel_editar_area: "E",
    mural_visualizar: "E", mural_novo_aviso: "E",
    calendario_visualizar: "E", calendario_novo_evento: "E",
    participantes_area: "E",
    documentos_visualizar: "E", documentos_upload: "E",
    cronograma: "V",
    predicas_visualizar: "E", predicas_nova: null,
    pedidos_ver: "E", pedidos_novo: "E",
  },
  "Diretoria_Servidor": {
    painel_cards: "E", painel_definir_coords: null, painel_editar_area: null,
    mural_visualizar: "E", mural_novo_aviso: null,
    calendario_visualizar: "E", calendario_novo_evento: null,
    participantes_area: null,
    documentos_visualizar: "E", documentos_upload: null,
    cronograma: "V",
    predicas_visualizar: "E", predicas_nova: null,
    pedidos_ver: "E", pedidos_novo: null,
  },
};

// Normaliza valores reais de cargo_area do banco para as chaves do PERMISSOES_PORTAL
export function normalizarCargoPortal(cargo: string | null): string | null {
  if (!cargo) return null;
  const map: Record<string, string> = {
    "Coordenador 01": "Coord 01",
    "Coordenador 02": "Coord 02",
    "Coordenador 03": "Coord 03",
    "Sombra 01":      "Sombra 01",
    "Sombra 02":      "Sombra 02",
    "Sombra 03":      "Sombra 03",
    "Servidor":       "Servidor",
    "Diretor Espiritual": "Servidor",
    "Diretor":        "Servidor",
    "Sub-Diretor":    "Servidor",
  };
  return map[cargo] ?? cargo;
}

export function getPermissoesPortal(area: string | null, cargo: string | null): PermissoesPortal | null {
  if (!area || !cargo) return null;
  const normalizedCargo = normalizarCargoPortal(cargo);
  const key = `${area}_${normalizedCargo}`;
  return PERMISSOES_PORTAL[key] ?? null;
}

export function canAccessPortal(perms: PermissoesPortal | null, func: keyof PermissoesPortal): boolean {
  if (!perms) return false;
  const val = perms[func];
  return val === "V" || val === "E";
}

export function canEditPortal(perms: PermissoesPortal | null, func: keyof PermissoesPortal): boolean {
  if (!perms) return false;
  return perms[func] === "E";
}
