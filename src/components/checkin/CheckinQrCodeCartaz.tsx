import { useEffect, useRef, useState } from "react";
import { QrCode, Printer } from "lucide-react";
import QRCode from "qrcode";
import { Button } from "@/components/ui/button";

const CHECKIN_URL = "https://top-caminhos-do-mar.lovable.app/checkin-servidor";

export function CheckinQrCodeCartaz() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!show || !canvasRef.current) return;
    QRCode.toCanvas(canvasRef.current, CHECKIN_URL, {
      width: 280,
      margin: 2,
      color: { dark: "#000000", light: "#ffffff" },
    });
  }, [show]);

  function imprimir() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL("image/png");
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`
      <html>
        <head>
          <title>Check-in Servidores — QR Code</title>
          <style>
            body {
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              margin: 0;
              font-family: sans-serif;
              background: #fff;
            }
            img { width: 320px; height: 320px; }
            h1 { font-size: 28px; margin-top: 24px; color: #111; }
            p { font-size: 16px; color: #555; margin-top: 8px; }
            .url { font-size: 12px; color: #999; margin-top: 16px; }
          </style>
        </head>
        <body>
          <img src="${dataUrl}" />
          <h1>Escaneie para fazer Check-in</h1>
          <p>TOP Caminhos do Mar — Servidores</p>
          <p class="url">${CHECKIN_URL}</p>
          <script>window.onload = () => { window.print(); }</script>
        </body>
      </html>
    `);
    win.document.close();
  }

  return (
    <div className="bg-card border border-border rounded-xl p-4 space-y-4">
      <div className="flex items-center gap-2">
        <QrCode className="h-4 w-4 text-primary" />
        <h3 className="font-semibold text-foreground">QR Code para Cartaz</h3>
      </div>

      {!show ? (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Gere o QR Code para imprimir e afixar na entrada. Os servidores escaneiam e fazem check-in sem precisar de login.
          </p>
          <Button size="sm" variant="outline" onClick={() => setShow(true)}>
            <QrCode className="h-3 w-3 mr-2" />
            Gerar QR Code
          </Button>
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="bg-white p-3 rounded-xl">
            <canvas ref={canvasRef} />
          </div>
          <div className="space-y-3">
            <div>
              <p className="text-sm font-medium text-foreground">URL do Check-in:</p>
              <p className="text-xs text-primary break-all">{CHECKIN_URL}</p>
            </div>
            <Button size="sm" onClick={imprimir}>
              <Printer className="h-3 w-3 mr-2" />
              Imprimir Cartaz
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
