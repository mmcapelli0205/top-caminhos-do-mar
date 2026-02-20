import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { QrCode } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { useParticipantes } from "@/hooks/useParticipantes";
import { supabase } from "@/integrations/supabase/client";
import { PulseirasTab } from "@/components/checkin/PulseirasTab";
import { RealizarCheckinTab } from "@/components/checkin/RealizarCheckinTab";
import { ConsultaPulseiraTab } from "@/components/checkin/ConsultaPulseiraTab";
import { GestaoCheckinTab } from "@/components/checkin/GestaoCheckinTab";
import { CheckinServidoresDashboard } from "@/components/checkin/CheckinServidoresDashboard";

const CheckIn = () => {
  const { profile, session, loading } = useAuth();
  const { participantes, familiaMap, isLoading } = useParticipantes();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [servidorArea, setServidorArea] = useState<string | null>(null);
  const [areaLoading, setAreaLoading] = useState(true);
  const [topId, setTopId] = useState<string | null>(null);

  const cargo = profile?.cargo ?? null;
  const userId = session?.user?.id ?? "";
  const userEmail = session?.user?.email ?? "";

  // Fetch servidor area_servico and top_id
  useEffect(() => {
    if (!userEmail) { setAreaLoading(false); return; }
    supabase
      .from("servidores")
      .select("area_servico")
      .eq("email", userEmail)
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        setServidorArea(data?.area_servico ?? null);
        setAreaLoading(false);
      });
    supabase
      .from("tops")
      .select("id")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => setTopId(data?.id ?? null));
  }, [userEmail]);

  if (loading || areaLoading) {
    return <p className="text-muted-foreground p-4">Carregando...</p>;
  }

  const isAdmin = cargo === "diretoria" || servidorArea === "ADM";
  const isHakuna = servidorArea === "Hakuna";

  // If not admin and not hakuna, redirect
  if (!isAdmin && !isHakuna) {
    navigate("/dashboard", { replace: true });
    return null;
  }

  const tabParam = searchParams.get("tab");
  const defaultTab = isHakuna && !isAdmin ? "consultar" : (tabParam === "consultar" ? "consultar" : "pulseiras");

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <QrCode className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold text-foreground">Check-in</h1>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Carregando...</p>
      ) : (
        <Tabs defaultValue={defaultTab}>
          <TabsList className="w-full overflow-x-auto justify-start">
            {isAdmin && <TabsTrigger value="pulseiras">Pulseiras</TabsTrigger>}
            {isAdmin && <TabsTrigger value="checkin">Realizar Check-in</TabsTrigger>}
            <TabsTrigger value="consultar">Consultar Pulseira</TabsTrigger>
            {isAdmin && <TabsTrigger value="gestao">Gestão</TabsTrigger>}
            {isAdmin && <TabsTrigger value="servidores">Check-in Servidores</TabsTrigger>}
          </TabsList>

          {isAdmin && (
            <TabsContent value="pulseiras">
              <PulseirasTab />
            </TabsContent>
          )}

          {isAdmin && (
            <TabsContent value="checkin">
              <RealizarCheckinTab userId={userId} />
            </TabsContent>
          )}

          <TabsContent value="consultar">
            <ConsultaPulseiraTab userId={userId} userEmail={userEmail} />
          </TabsContent>

          {isAdmin && (
            <TabsContent value="gestao">
              <GestaoCheckinTab participantes={participantes} familiaMap={familiaMap} userId={userId} />
            </TabsContent>
          )}

          {isAdmin && (
            <TabsContent value="servidores">
              <CheckinServidoresDashboard
                topId={topId}
                userId={userId}
                userEmail={userEmail}
                isAdmin={isAdmin}
              />
            </TabsContent>
          )}
        </Tabs>
      )}
    </div>
  );
};

export default CheckIn;
