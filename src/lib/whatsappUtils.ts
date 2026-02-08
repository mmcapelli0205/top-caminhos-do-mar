export function substituirVariaveis(template: string, dados: Record<string, string | number | null | undefined>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    const val = dados[key];
    return val != null ? String(val) : `{{${key}}}`;
  });
}

export const VARIAVEIS_DISPONIVEIS = [
  "nome", "telefone", "idade", "familia_numero", "top_numero",
  "top_nome", "top_data", "local", "horario", "link_grupo",
  "hakuna_nome", "dias"
];

export const STATUS_COLORS: Record<string, string> = {
  "Planejamento": "bg-muted text-muted-foreground",
  "Inscrições Abertas": "bg-blue-100 text-blue-800",
  "Em Andamento": "bg-yellow-100 text-yellow-800",
  "Finalizado": "bg-green-100 text-green-800",
};

export const GATILHO_COLORS: Record<string, string> = {
  "inscricao": "bg-green-100 text-green-800",
  "ergometrico": "bg-orange-100 text-orange-800",
  "confirmacao": "bg-blue-100 text-blue-800",
  "lembrete": "bg-purple-100 text-purple-800",
  "checkin": "bg-cyan-100 text-cyan-800",
  "geral": "bg-muted text-muted-foreground",
};
