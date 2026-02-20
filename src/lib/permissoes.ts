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
