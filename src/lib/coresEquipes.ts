export const CORES_EQUIPES: Record<string, string> = {
  "Mídia": "#9CA3AF",
  "Eventos": "#EAB308",
  "Segurança": "#F97316",
  "Logística": "#92702A",
  "Hakuna": "#DC2626",
  "Voz": "#4B5320",
  "Comunicação": "#8B5CF6",
  "ADM": "#4ADE80",
  "Intercessão": "#FFFFFF",
  "Louvor": "#FFFFFF",
  "Alimentação": "#92702A",
  "Diretoria": "#000000",
};

/** Returns white or dark text color based on background luminance */
export function getTextColor(bg: string): string {
  const hex = bg.replace("#", "");
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6 ? "#1F2937" : "#FFFFFF";
}
