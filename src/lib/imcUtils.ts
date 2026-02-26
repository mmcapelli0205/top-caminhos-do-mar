export function imcBadgeColor(classificacao: string | null): string {
  switch (classificacao) {
    case "Abaixo do peso":
      return "bg-purple-600/20 text-purple-400 border-purple-600/30";
    case "Normal":
      return "bg-green-600/20 text-green-400 border-green-600/30";
    case "Sobrepeso":
      return "bg-yellow-600/20 text-yellow-400 border-yellow-600/30";
    case "Obesidade I":
      return "bg-orange-600/20 text-orange-400 border-orange-600/30";
    case "Obesidade II":
      return "bg-red-600/20 text-red-400 border-red-600/30";
    case "Obesidade III":
      return "bg-red-900/30 text-red-300 border-red-900/40";
    default:
      return "bg-muted text-muted-foreground border-border";
  }
}
