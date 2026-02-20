import { useState, useEffect } from "react";
import JSZip from "jszip";
import type { KMZPonto, KMZRota, DiaTipo, PontoTipo } from "@/data/kmzData";
import { COR_DIA } from "@/data/kmzData";

// Color mapping by route name (matched by keywords)
function getRotaCor(nome: string): string {
  const n = nome.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  if (n.includes("check-in") || n.includes("checkin") || n.includes("arena")) return "#1E1E1E";
  if (n.includes("logist") || n.includes("9,36") || n.includes("9.36")) return "#8B4513";
  if (n.includes("translado")) return "#EA580C";
  if (n.includes("d1") || n.includes("lorena") || n.includes("6,13") || n.includes("6.13")) return "#DC2626";
  if (n.includes("d2") || n.includes("8,90") || n.includes("8.90") || n.includes("8,9")) return "#EAB308";
  if (n.includes("d3") || n.includes("5,45") || n.includes("5.45")) return "#1E3A8A";
  if (n.includes("d4") || n.includes("5,0") || n.includes("5.0")) return "#16A34A";
  return "#6366F1";
}

function inferirDia(nomePasta: string): DiaTipo {
  const n = nomePasta.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  if (n.includes("logistic")) return "logistica";
  if (n.includes("d4") || n.includes("3,35") || n.includes("3.35")) return "d4";
  if (n.includes("d1") || n.includes("6,13") || n.includes("6.13")) return "d1";
  if (n.includes("d2") || n.includes("8,90") || n.includes("8.90")) return "d2";
  if (n.includes("d3") || n.includes("5,45") || n.includes("5.45")) return "d3";
  return "todos";
}

function inferirDiaPorRota(nome: string): DiaTipo {
  const n = nome.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  if (n.includes("logist") || n.includes("9,36") || n.includes("9.36")) return "logistica";
  if (n.includes("check-in") || n.includes("checkin") || n.includes("arena")) return "d1";
  if (n.includes("3,35") || n.includes("3.35")) return "d4";
  if (n.includes("translado") && (n.includes("6,1") || n.includes("6.1"))) return "d1";
  if (n.includes("translado")) return "d1"; // default translado
  if (n.includes("d1") || n.includes("lorena") || n.includes("6,13") || n.includes("6.13")) return "d1";
  if (n.includes("d2") || n.includes("8,90") || n.includes("8.90")) return "d2";
  if (n.includes("d3") || n.includes("5,45") || n.includes("5.45")) return "d3";
  if (n.includes("d4") || n.includes("5,0") || n.includes("5.0")) return "d4";
  return "todos";
}

function inferirTipo(nome: string): PontoTipo {
  const n = nome.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  // ACAMPAMENTO
  if (n.includes("acampamento") || n.includes("camp")) return "acampamento";

  // BASE
  if (n.includes("base")) return "base";

  // HIDRATAÇÃO
  if (n.includes("hidratacao") || n.includes("hidratação")) return "hidratacao";

  // EXTRAÇÃO/VAN
  if (n.includes("extracao") || n.includes("extração") || n.includes("embarque") || n.includes("desembarque")) return "extracao";

  // PONTO GERAL (apenas estes 3 casos específicos)
  const nOriginal = nome.toLowerCase();
  if (
    nOriginal.includes("blocao") || nOriginal.includes("blocão") ||
    nOriginal.includes("entrega madeiro") ||
    nOriginal.includes("opcao de segunda revista") || nOriginal.includes("opção de segunda revista")
  ) return "ponto";

  // Todo o resto é PRÉDICA (inclui: Peleja, Pão Nosso, Ceia Do Rei, Lázaro, etc.)
  return "predica";
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
      const cor = getRotaCor(nome) || COR_DIA[dia] || "#6366F1";
      // Override dia by route name for routes that may be in wrong folder
      const diaFinal = inferirDiaPorRota(nome) !== "todos" ? inferirDiaPorRota(nome) : dia;
      console.log(`[KMZ] Rota: "${nome}" | dia pasta: ${dia} | dia final: ${diaFinal} | pontos: ${coordenadas.length} | cor: ${cor}`);
      rotas.push({
        id: `rota_${contadores.r++}`,
        nome,
        dia: diaFinal,
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
