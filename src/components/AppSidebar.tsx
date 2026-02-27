import { useLocation } from "react-router-dom";
import { NavLink } from "@/components/NavLink";
import {
  Home, Users, Shield, Wrench, ImageIcon,
  QrCode, Calendar, Settings, UserCheck, Radio, Map,
} from "lucide-react";
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup,
  SidebarGroupContent, SidebarMenu,
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
  section?: "main" | "manage" | "system";
}

const ALL_ITEMS: MenuItem[] = [
  { id: "inicio",       title: "Início",          url: "/dashboard",    icon: Home,      menuKey: "menu_mapa",          section: "main" },
  { id: "realtime",     title: "TOP Real Time",   url: "/top-real-time",icon: Radio,     menuKey: "menu_realtime",      section: "main" },
  { id: "mapa",         title: "Mapa da Trilha",  url: "/kmz",          icon: Map,       menuKey: "menu_mapa",          section: "main" },
  { id: "participantes",title: "Participantes",   url: "/participantes",icon: Users,     menuKey: "menu_participantes", section: "manage" },
  { id: "servidores",   title: "Servidores",      url: "/servidores",   icon: Shield,    menuKey: "menu_servidores",    section: "manage" },
  { id: "checkin",      title: "Check-in",        url: "/check-in",     icon: QrCode,    menuKey: "menu_checkin",       section: "manage" },
  { id: "equipamentos", title: "Equipamentos",    url: "/equipamentos", icon: Wrench,    menuKey: "menu_equipamentos",  section: "manage" },
  { id: "artes",        title: "Artes & Docs",    url: "/artes-docs",   icon: ImageIcon, menuKey: "menu_artes",         section: "manage" },
  { id: "tops",         title: "TOPs",            url: "/tops",         icon: Calendar,  menuKey: "menu_tops",          section: "manage" },
  { id: "aprovacoes",   title: "Aprovações",      url: "/aprovacoes",   icon: UserCheck, menuKey: "menu_aprovacoes",    section: "system" },
  { id: "config",       title: "Configurações",   url: "/configuracoes",icon: Settings,  menuKey: "menu_config",        section: "system" },
];

interface Props {
  cargo: string | null;
  areaServico: string | null;
  podeAprovar?: boolean;
}

export function AppSidebar({ cargo, areaServico, podeAprovar = false }: Props) {
  const location = useLocation();

  const effectiveArea = cargo === "diretoria" ? "Diretoria" : (areaServico ?? null);
  const perms = getPermissoesMenu(effectiveArea);

  const items = ALL_ITEMS.filter((item) => {
    if (item.id === "inicio") return true;
    if (item.id === "aprovacoes") return podeAprovar || perms.menu_aprovacoes;
    return perms[item.menuKey] === true;
  });

  const mainItems = items.filter((i) => i.section === "main");
  const manageItems = items.filter((i) => i.section === "manage");
  const systemItems = items.filter((i) => i.section === "system");

  const renderSection = (sectionItems: MenuItem[], label: string) => {
    if (sectionItems.length === 0) return null;
    return (
      <div className="mb-1">
        <p className="px-4 pt-5 pb-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/20 group-data-[collapsible=icon]:hidden select-none">
          {label}
        </p>
        {sectionItems.map((item) => {
          const isActive = location.pathname === item.url;
          return (
            <SidebarMenuItem key={item.id}>
              <SidebarMenuButton
                asChild
                isActive={isActive}
                tooltip={item.title}
                className={`
                  relative h-9 rounded-lg mx-2 px-2.5 gap-3 transition-all duration-150
                  text-white/50 hover:text-white/80 hover:bg-white/[0.05]
                  ${isActive
                    ? "!bg-gradient-to-r !from-orange-500/15 !to-orange-500/5 !text-orange-400 font-medium"
                    : ""
                  }
                `}
              >
                <NavLink to={item.url}>
                  <div className="relative flex items-center justify-center w-5 h-5 shrink-0">
                    <item.icon
                      className={`h-[17px] w-[17px] ${isActive ? "text-orange-400" : ""}`}
                      strokeWidth={isActive ? 2.2 : 1.6}
                    />
                    {isActive && (
                      <div className="absolute -left-[13px] top-1/2 -translate-y-1/2 w-[3px] h-3.5 rounded-full bg-orange-500" />
                    )}
                  </div>
                  <span className="text-[13px] truncate leading-none">{item.title}</span>
                </NavLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          );
        })}
      </div>
    );
  };

  return (
    <Sidebar collapsible="icon" className="border-r border-white/[0.04]">
      <SidebarContent className="pt-1.5 pb-4 bg-[hsl(240,35%,9%)]">
        {/* Brand Header */}
        <div className="flex items-center gap-2.5 px-4 py-3.5 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
          <div className="relative shrink-0">
            <img
              src="https://ilknzgupnswyeynwpovj.supabase.co/storage/v1/object/public/assets/logo.png"
              alt="TOP"
              className="h-9 w-9 object-contain"
            />
            <div className="absolute inset-0 rounded-lg bg-orange-500/10 blur-md -z-10" />
          </div>
          <div className="group-data-[collapsible=icon]:hidden overflow-hidden">
            <p className="text-[14px] font-bold text-white/90 leading-tight tracking-tight">TOP Manager</p>
            <p className="text-[10px] text-orange-400/70 font-medium leading-tight">Caminhos do Mar</p>
          </div>
        </div>

        <div className="mx-4 h-px bg-white/[0.05] group-data-[collapsible=icon]:mx-2" />

        <SidebarGroup className="flex-1">
          <SidebarGroupContent>
            <SidebarMenu>
              {renderSection(mainItems, "Principal")}
              {renderSection(manageItems, "Gestão")}
              {renderSection(systemItems, "Sistema")}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="px-4 py-3 border-t border-white/[0.04] bg-[hsl(240,35%,9%)]">
        <div className="flex items-center gap-2.5 group-data-[collapsible=icon]:justify-center">
          <div className="h-7 w-7 rounded-md bg-gradient-to-br from-orange-500/25 to-orange-600/10 flex items-center justify-center shrink-0 ring-1 ring-orange-500/20">
            <span className="text-[10px] font-bold text-orange-400">T</span>
          </div>
          <div className="group-data-[collapsible=icon]:hidden overflow-hidden">
            <p className="text-[11px] text-white/30 truncate">TOP #1575 • Abr 2026</p>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
