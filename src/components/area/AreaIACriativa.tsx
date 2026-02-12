import { useState, useEffect, useRef } from "react";
import { ImageIcon, Video, Download, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export default function AreaIACriativa() {
  return (
    <div className="space-y-6">
      <GerarImagemSection />
      <GerarVideoSection />
    </div>
  );
}

function GerarImagemSection() {
  const [prompt, setPrompt] = useState("");
  const [size, setSize] = useState("1024x1024");
  const [quality, setQuality] = useState("standard");
  const [loading, setLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [revisedPrompt, setRevisedPrompt] = useState<string | null>(null);
  const { toast } = useToast();

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    setImageUrl(null);
    try {
      const { data, error } = await supabase.functions.invoke("generate-image", {
        body: { prompt, size, quality },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setImageUrl(data.url);
      setRevisedPrompt(data.revised_prompt);
      toast({ title: "Imagem gerada com sucesso!" });
    } catch (e: any) {
      toast({ title: "Erro ao gerar imagem", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="bg-[#2d2d2d] border-[#c9a84c]/20">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2 text-white">
          <ImageIcon className="h-5 w-5 text-[#c9a84c]" />
          Gerar Imagem (DALL-E 3)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label className="text-gray-300 text-sm">Prompt</Label>
          <Textarea
            placeholder="Descreva a imagem que deseja gerar..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="bg-[#1a1a1a] border-[#444] text-white mt-1"
            rows={3}
          />
        </div>

        <div className="flex gap-3">
          <div className="flex-1">
            <Label className="text-gray-300 text-sm">Tamanho</Label>
            <Select value={size} onValueChange={setSize}>
              <SelectTrigger className="bg-[#1a1a1a] border-[#444] text-white mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1024x1024">1024×1024</SelectItem>
                <SelectItem value="1792x1024">1792×1024 (paisagem)</SelectItem>
                <SelectItem value="1024x1792">1024×1792 (retrato)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1">
            <Label className="text-gray-300 text-sm">Qualidade</Label>
            <Select value={quality} onValueChange={setQuality}>
              <SelectTrigger className="bg-[#1a1a1a] border-[#444] text-white mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="standard">Standard</SelectItem>
                <SelectItem value="hd">HD</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button
          onClick={handleGenerate}
          disabled={loading || !prompt.trim()}
          className="w-full bg-[#c9a84c] hover:bg-[#b8973b] text-black font-semibold"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
          {loading ? "Gerando..." : "Gerar Imagem"}
        </Button>

        {imageUrl && (
          <div className="space-y-2">
            <img src={imageUrl} alt="Imagem gerada" className="w-full rounded-lg" />
            {revisedPrompt && (
              <p className="text-xs text-gray-400 italic">Prompt revisado: {revisedPrompt}</p>
            )}
            <a href={imageUrl} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="sm" className="border-[#c9a84c]/30 text-[#c9a84c]">
                <Download className="h-4 w-4 mr-1" /> Abrir em nova aba
              </Button>
            </a>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function GerarVideoSection() {
  const [prompt, setPrompt] = useState("");
  const [duration, setDuration] = useState("5");
  const [loading, setLoading] = useState(false);
  const [taskId, setTaskId] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { toast } = useToast();

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    setVideoUrl(null);
    setStatus(null);
    setTaskId(null);
    try {
      const { data, error } = await supabase.functions.invoke("generate-video", {
        body: { prompt, duration },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setTaskId(data.task_id);
      setStatus(data.status || "Processing");
      toast({ title: "Vídeo em geração!", description: "Aguarde enquanto o Kling AI processa." });
    } catch (e: any) {
      toast({ title: "Erro ao gerar vídeo", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  // Poll for status
  useEffect(() => {
    if (!taskId || status === "succeed" || status === "failed") {
      if (pollingRef.current) clearInterval(pollingRef.current);
      return;
    }

    pollingRef.current = setInterval(async () => {
      try {
        const { data, error } = await supabase.functions.invoke("check-video-status", {
          body: { task_id: taskId },
        });
        if (error) return;
        setStatus(data.status);
        if (data.status === "succeed" && data.video_url) {
          setVideoUrl(data.video_url);
          toast({ title: "Vídeo pronto!" });
          if (pollingRef.current) clearInterval(pollingRef.current);
        }
        if (data.status === "failed") {
          toast({ title: "Falha na geração do vídeo", variant: "destructive" });
          if (pollingRef.current) clearInterval(pollingRef.current);
        }
      } catch {
        // ignore polling errors
      }
    }, 10000);

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [taskId, status, toast]);

  const progressValue =
    status === "succeed" ? 100 :
    status === "processing" ? 60 :
    status === "submitted" ? 20 : 0;

  return (
    <Card className="bg-[#2d2d2d] border-[#c9a84c]/20">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2 text-white">
          <Video className="h-5 w-5 text-[#c9a84c]" />
          Gerar Vídeo (Kling AI)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label className="text-gray-300 text-sm">Prompt</Label>
          <Textarea
            placeholder="Descreva o vídeo que deseja gerar..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="bg-[#1a1a1a] border-[#444] text-white mt-1"
            rows={3}
          />
        </div>

        <div>
          <Label className="text-gray-300 text-sm">Duração</Label>
          <Select value={duration} onValueChange={setDuration}>
            <SelectTrigger className="bg-[#1a1a1a] border-[#444] text-white mt-1 w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5">5 segundos</SelectItem>
              <SelectItem value="10">10 segundos</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button
          onClick={handleGenerate}
          disabled={loading || !prompt.trim() || (!!taskId && status !== "succeed" && status !== "failed")}
          className="w-full bg-[#c9a84c] hover:bg-[#b8973b] text-black font-semibold"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Video className="h-4 w-4 mr-2" />}
          {loading ? "Enviando..." : "Gerar Vídeo"}
        </Button>

        {taskId && status && status !== "succeed" && status !== "failed" && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-[#c9a84c]" />
              <span className="text-sm text-gray-300">Status: {status}</span>
            </div>
            <Progress value={progressValue} className="h-2" />
            <p className="text-xs text-gray-500">Verificando a cada 10s...</p>
          </div>
        )}

        {status === "failed" && (
          <p className="text-sm text-red-400">A geração falhou. Tente novamente com outro prompt.</p>
        )}

        {videoUrl && (
          <div className="space-y-2">
            <video src={videoUrl} controls className="w-full rounded-lg" />
            <a href={videoUrl} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="sm" className="border-[#c9a84c]/30 text-[#c9a84c]">
                <Download className="h-4 w-4 mr-1" /> Baixar vídeo
              </Button>
            </a>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
