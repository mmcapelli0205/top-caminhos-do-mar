import {
  Home,
  Users,
  Shield,
  DollarSign,
  Wrench,
  ImageIcon,
  QrCode,
  Calendar,
  Settings,
  UserCheck,
  Radio,
  Map,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

// Backward-compatible TopUser type for components not yet migrated
export interface TopUser {
  id: string;
  nome: string;
  papel: "diretoria" | "coordenacao" | "servidor" | "participante";
  area_servico: string;
}

// Backward-compatible getUser - reads from localStorage for legacy components
export function getUser(): TopUser | null {
  try {
    const raw = localStorage.getItem("top_user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function logout() {
  localStorage.removeItem("top_user");
}

export interface MenuItem {
  id: number;
  title: string;
  url: string;
  icon: LucideIcon;
}

const ALL_MENU_ITEMS: MenuItem[] = [
  { id: 1, title: "Início", url: "/dashboard", icon: Home },
  { id: 2, title: "Participantes", url: "/participantes", icon: Users },
  { id: 4, title: "Servidores", url: "/servidores", icon: Shield },
  // Financeiro removido do menu lateral — agora é aba exclusiva nos portais Diretoria/ADM
  { id: 7, title: "Equipamentos", url: "/equipamentos", icon: Wrench },
  { id: 8, title: "Artes & Docs", url: "/artes-docs", icon: ImageIcon },
  { id: 9, title: "Check-in", url: "/check-in", icon: QrCode },
  { id: 11, title: "TOPs", url: "/tops", icon: Calendar },
  { id: 10, title: "Configurações", url: "/configuracoes", icon: Settings },
  { id: 12, title: "Aprovações", url: "/aprovacoes", icon: UserCheck },
  { id: 13, title: "TOP Real Time", url: "/top-real-time", icon: Radio },
  { id: 14, title: "Mapa da Trilha", url: "/kmz", icon: Map },
];

export function isServidorComum(cargo: string | null): boolean {
  return cargo === "servidor";
}

export function getVisibleMenuItems(cargo: string | null, podeAprovar = false): MenuItem[] {
  if (!cargo) return [];

  let items: MenuItem[];

  switch (cargo) {
    case "diretoria":
      items = ALL_MENU_ITEMS.filter((item) => ![12].includes(item.id));
      break;

    // Radar visible to coordenacao+ roles

    case "coordenacao":
    case "coord02":
    case "coord03":
      items = ALL_MENU_ITEMS.filter((item) =>
        [1, 2, 4, 6, 8, 9, 13, 14].includes(item.id)
      );
      break;

    case "flutuante01":
    case "flutuante02":
    case "flutuante03":
    case "expert":
      items = ALL_MENU_ITEMS.filter((item) =>
        [1, 2, 4, 8, 13, 14].includes(item.id)
      );
      break;

    case "servidor":
      items = ALL_MENU_ITEMS.filter((item) => [1, 8, 14].includes(item.id));
      break;

    default:
      items = ALL_MENU_ITEMS.filter((item) => [1, 14].includes(item.id));
  }

  if (podeAprovar) {
    const aprovItem = ALL_MENU_ITEMS.find((item) => item.id === 12);
    if (aprovItem) items.push(aprovItem);
  }

  return items;
}
