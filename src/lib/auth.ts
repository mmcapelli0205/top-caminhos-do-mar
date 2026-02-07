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
  Settings,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface TopUser {
  id: string;
  nome: string;
  papel: "diretoria" | "coordenacao" | "servidor" | "participante";
  area_servico: string;
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
  { id: 10, title: "Configurações", url: "/configuracoes", icon: Settings },
];

const COORDENACAO_MAP: Record<string, number[]> = {
  Eventos: [1, 2, 3, 4, 8],
  Segurança: [1, 2, 3, 4, 8],
  Hakunas: [1, 2, 3, 4, 7, 8],
  Logística: [1, 2, 4, 7, 8],
  Comunicação: [1, 3, 4, 7, 8, 9],
  Mídia: [1, 2, 3, 4, 7, 8],
  Administração: [1, 2, 3, 4, 5, 6, 7, 8, 9],
  Intercessão: [1, 2, 3, 4, 8],
};

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

export function getVisibleMenuItems(user: TopUser | null): MenuItem[] {
  if (!user) return [];

  switch (user.papel) {
    case "diretoria":
      return ALL_MENU_ITEMS;

    case "coordenacao": {
      const allowed = COORDENACAO_MAP[user.area_servico] ?? [1, 8];
      return ALL_MENU_ITEMS.filter((item) => allowed.includes(item.id));
    }

    case "servidor":
      return ALL_MENU_ITEMS.filter((item) => [1, 8].includes(item.id));

    case "participante":
      return ALL_MENU_ITEMS.filter((item) => [1].includes(item.id));

    default:
      return [];
  }
}
