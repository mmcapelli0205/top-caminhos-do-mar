import {
  LayoutDashboard,
  Users,
  UsersRound,
  Shield,
  HeartPulse,
  DollarSign,
  Wrench,
  ImageIcon,
  QrCode,
  Calendar,
  Settings,
  UserCheck,
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
  { id: 1, title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { id: 2, title: "Participantes", url: "/participantes", icon: Users },
  { id: 3, title: "Famílias", url: "/familias", icon: UsersRound },
  { id: 4, title: "Servidores", url: "/servidores", icon: Shield },
  { id: 5, title: "Hakunas", url: "/hakunas", icon: HeartPulse },
  { id: 6, title: "Financeiro", url: "/financeiro", icon: DollarSign },
  { id: 7, title: "Equipamentos", url: "/equipamentos", icon: Wrench },
  { id: 8, title: "Artes & Docs", url: "/artes-docs", icon: ImageIcon },
  { id: 9, title: "Check-in", url: "/check-in", icon: QrCode },
  { id: 11, title: "TOPs", url: "/tops", icon: Calendar },
  { id: 10, title: "Configurações", url: "/configuracoes", icon: Settings },
  { id: 12, title: "Aprovações", url: "/aprovacoes", icon: UserCheck },
];

export function getVisibleMenuItems(cargo: string | null): MenuItem[] {
  if (!cargo) return [];

  switch (cargo) {
    case "diretoria":
      return ALL_MENU_ITEMS;

    case "coordenacao":
    case "coord02":
    case "coord03":
      return ALL_MENU_ITEMS.filter((item) =>
        [1, 2, 3, 4, 6, 8].includes(item.id)
      );

    case "sombra":
      return ALL_MENU_ITEMS.filter((item) => [1, 8].includes(item.id));

    case "servidor":
      return ALL_MENU_ITEMS.filter((item) => [1, 8].includes(item.id));

    default:
      return ALL_MENU_ITEMS.filter((item) => [1].includes(item.id));
  }
}
