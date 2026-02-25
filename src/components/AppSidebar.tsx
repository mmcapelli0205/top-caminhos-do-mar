import { useLocation } from "react-router-dom";
import { NavLink } from "@/components/NavLink";
import {
  Home, Users, Shield, DollarSign, Wrench, ImageIcon,
  QrCode, Calendar, Settings, UserCheck, Radio, Map,
} from "lucide-react";
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup,
  SidebarGroupContent, SidebarGroupLabel, SidebarMenu,
  SidebarMenuButton, SidebarMenuItem,
} from "@/components/ui/sidebar";
import { getPermissoesMenu } from "@/lib/permissoes";
import type { PermissoesMenu } from "@/lib/permissoes";

interface MenuItem {
  id: string;
  title: string;
  url: string;
  icon: React.ElementType;
  menuKey: keyof PermissoesMenu;
}

const ALL_ITEMS: MenuItem[] = [
  { id: "inicio",       title: "Início",          url: "/dashboard",    icon: Home,      menuKey: "menu_mapa" },      // sempre visível — tratado especialmente
  { id: "participantes",title: "Participantes",   url: "/participantes",icon: Users,     menuKey: "menu_participantes" },
  { id: "servidores",   title: "Servidores",      url: "/servidores",   icon: Shield,    menuKey: "menu_servidores" },
  // Financeiro removido do menu lateral — agora é aba exclusiva nos portais Diretoria/ADM
  { id: "checkin",      title: "Check-in",        url: "/check-in",     icon: QrCode,    menuKey: "menu_checkin" },
  { id: "equipamentos", title: "Equipamentos",    url: "/equipamentos", icon: Wrench,    menuKey: "menu_equipamentos" },
  { id: "artes",        title: "Artes & Docs",    url: "/artes-docs",   icon: ImageIcon, menuKey: "menu_artes" },
  { id: "tops",         title: "TOPs",            url: "/tops",         icon: Calendar,  menuKey: "menu_tops" },
  { id: "config",       title: "Configurações",   url: "/configuracoes",icon: Settings,  menuKey: "menu_config" },
  { id: "aprovacoes",   title: "Aprovações",      url: "/aprovacoes",   icon: UserCheck, menuKey: "menu_aprovacoes" },
  { id: "realtime",     title: "TOP Real Time",   url: "/top-real-time",icon: Radio,     menuKey: "menu_realtime" },
  { id: "mapa",         title: "Mapa da Trilha",  url: "/kmz",          icon: Map,       menuKey: "menu_mapa" },
];

interface Props {
  cargo: string | null;
  areaServico: string | null;
  podeAprovar?: boolean;
}

export function AppSidebar({ cargo, areaServico, podeAprovar = false }: Props) {
  const location = useLocation();

  // Resolve effective area for permissions
  const effectiveArea = cargo === "diretoria" ? "Diretoria" : (areaServico ?? null);
  const perms = getPermissoesMenu(effectiveArea);

  // Build visible items
  const items = ALL_ITEMS.filter((item) => {
    if (item.id === "inicio") return true; // Always show Início
    if (item.id === "aprovacoes") {
      // Use podeAprovar override OR area permission
      return podeAprovar || perms.menu_aprovacoes;
    }
    return perms[item.menuKey] === true;
  });

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarContent className="pt-4">
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs uppercase tracking-wider text-muted-foreground">
            Menu
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton
                    asChild
                    isActive={location.pathname === item.url}
                    tooltip={item.title}
                  >
                    <NavLink to={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-4">
        <img
          src="https://ilknzgupnswyeynwpovj.supabase.co/storage/v1/object/public/assets/logo.png"
          alt="Legendários"
          className="h-20 w-20 object-contain mx-auto opacity-70 group-data-[collapsible=icon]:h-8 group-data-[collapsible=icon]:w-8 transition-all"
        />
      </SidebarFooter>
    </Sidebar>
  );
}
