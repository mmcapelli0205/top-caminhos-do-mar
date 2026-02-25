export const CORES_EQUIPES: Record<string, string> = {
  "Mídia": "#9CA3AF",
  "Eventos": "#EAB308",
  "Segurança": "#F97316",
  "Logística": "#D2B48C",
  "Hakuna": "#7C2D12",
  "Voz": "#4D7C0F",
  "Comunicação": "#7C3AED",
  "ADM": "#22C55E",
  "Intercessão": "#F8FAFC",
  "Louvor": "#F8FAFC",
  "Alimentação": "#D2B48C",
  "Diretoria": "#1F2937",
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
