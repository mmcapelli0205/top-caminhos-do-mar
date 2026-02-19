import { useState, useEffect } from "react";
import JSZip from "jszip";
import type { KMZPonto, KMZRota, DiaTipo, PontoTipo } from "@/data/kmzData";
import { COR_DIA } from "@/data/kmzData";

function inferirDia(nomePasta: string): DiaTipo {
  const n = nomePasta.toLowerCase();
  if (n.includes("logistic")) return "logistica";
  if (n.includes("d1")) return "d1";
  if (n.includes("d2")) return "d2";
  if (n.includes("d3")) return "d3";
  if (n.includes("d4")) return "d4";
  return "todos";
}

function inferirTipo(nome: string): PontoTipo {
  const n = nome.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  if (n.includes("predica") || n.includes("pregacao")) return "predica";
  if (n.includes("acampamento")) return "acampamento";
  if (n.includes("base")) return "base";
  if (n.includes("extracao") || n.includes("extr") || n.includes("van")) return "extracao";
  return "ponto";
}

function parseCoordinates(coordStr: string): [number, number][] {
  return coordStr
    .trim()
    .split(/\s+/)
    .map((triple) => {
      const parts = triple.split(",");
      if (parts.length < 2) return null;
      const lng = parseFloat(parts[0]);
      const lat = parseFloat(parts[1]);
      if (isNaN(lat) || isNaN(lng)) return null;
      return [lat, lng] as [number, number];
    })
    .filter(Boolean) as [number, number][];
}

function extrairPlacemarks(
  folder: Element,
  dia: DiaTipo,
  pontos: KMZPonto[],
  rotas: KMZRota[],
  contadores: { p: number; r: number }
) {
  const placemarks = Array.from(folder.children).filter(
    (el) => el.tagName === "Placemark"
  );

  for (const pm of placemarks) {
    const nome =
      pm.querySelector("name")?.textContent?.trim() ?? "Sem nome";

    const lineString = pm.querySelector("LineString");
    const point = pm.querySelector("Point");

    if (lineString) {
      const coordEl = lineString.querySelector("coordinates");
      if (!coordEl?.textContent) continue;
      const coordenadas = parseCoordinates(coordEl.textContent);
      if (coordenadas.length < 2) continue;
      const cor = COR_DIA[dia] ?? "#6366F1";
      rotas.push({
        id: `rota_${contadores.r++}`,
        nome,
        dia,
        distancia: "",
        cor,
        coordenadas,
      });
    } else if (point) {
      const coordEl = point.querySelector("coordinates");
      if (!coordEl?.textContent) continue;
      const parts = coordEl.textContent.trim().split(",");
      if (parts.length < 2) continue;
      const lng = parseFloat(parts[0]);
      const lat = parseFloat(parts[1]);
      if (isNaN(lat) || isNaN(lng)) continue;
      pontos.push({
        id: `ponto_${contadores.p++}`,
        nome,
        lat,
        lng,
        dia,
        tipo: inferirTipo(nome),
      });
    }
  }

  // Recursively process sub-folders
  const subFolders = Array.from(folder.children).filter(
    (el) => el.tagName === "Folder"
  );
  for (const sub of subFolders) {
    const subNome = sub.querySelector("name")?.textContent?.trim() ?? "";
    const subDia = inferirDia(subNome) !== "todos" ? inferirDia(subNome) : dia;
    extrairPlacemarks(sub, subDia, pontos, rotas, contadores);
  }
}

export function useKmzParser(kmzUrl: string) {
  const [pontos, setPontos] = useState<KMZPonto[]>([]);
  const [rotas, setRotas] = useState<KMZRota[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function parseKmz() {
      try {
        const res = await fetch(kmzUrl);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const blob = await res.blob();
        const zip = await JSZip.loadAsync(blob);

        const kmlFile = Object.values(zip.files).find((f) =>
          f.name.endsWith(".kml")
        );
        if (!kmlFile) throw new Error("doc.kml não encontrado no KMZ");

        const kmlText = await kmlFile.async("text");
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(kmlText, "text/xml");

        const pontosExtraidos: KMZPonto[] = [];
        const rotasExtraidas: KMZRota[] = [];
        const contadores = { p: 0, r: 0 };

        // Process top-level folders
        const topFolders = Array.from(
          xmlDoc.querySelectorAll("kml > Document > Folder")
        );

        if (topFolders.length === 0) {
          // Try without Document wrapper
          const allFolders = Array.from(xmlDoc.querySelectorAll("Folder"));
          for (const folder of allFolders) {
            const nome = folder.querySelector("name")?.textContent?.trim() ?? "";
            const dia = inferirDia(nome);
            extrairPlacemarks(folder, dia, pontosExtraidos, rotasExtraidas, contadores);
          }
        } else {
          for (const folder of topFolders) {
            const nome = folder.querySelector("name")?.textContent?.trim() ?? "";
            const dia = inferirDia(nome);
            extrairPlacemarks(folder, dia, pontosExtraidos, rotasExtraidas, contadores);
          }
        }

        if (!cancelled) {
          setPontos(pontosExtraidos);
          setRotas(rotasExtraidas);
        }
      } catch (e) {
        if (!cancelled) {
          console.error("Erro ao parsear KMZ:", e);
          setError("Erro ao carregar mapa");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    parseKmz();
    return () => { cancelled = true; };
  }, [kmzUrl]);

  return { pontos, rotas, loading, error };
}
