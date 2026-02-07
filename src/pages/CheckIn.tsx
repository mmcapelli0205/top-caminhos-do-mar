import { QrCode } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useParticipantes } from "@/hooks/useParticipantes";
import { QrCodeTab } from "@/components/checkin/QrCodeTab";
import { CheckInTab } from "@/components/checkin/CheckInTab";

const CheckIn = () => {
  const { participantes, familiaMap, isLoading } = useParticipantes();

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <QrCode className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold text-foreground">Check-in</h1>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Carregando...</p>
      ) : (
        <Tabs defaultValue="qrcodes">
          <TabsList>
            <TabsTrigger value="qrcodes">QR Codes</TabsTrigger>
            <TabsTrigger value="checkin">Realizar Check-in</TabsTrigger>
          </TabsList>
          <TabsContent value="qrcodes">
            <QrCodeTab participantes={participantes} familiaMap={familiaMap} />
          </TabsContent>
          <TabsContent value="checkin">
            <CheckInTab participantes={participantes} familiaMap={familiaMap} />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

export default CheckIn;
