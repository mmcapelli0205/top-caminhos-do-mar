import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface TopResult {
  numero_top?: string;
  nome_track?: string;
  cidade?: string;
  estado?: string;
  data_checkin?: string;
  data_retorno?: string;
  valor_participante?: number;
  link_participante?: string;
  valor_servidor?: number;
  link_servidor?: string;
  instagram_base?: string;
  origem_dados: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const firecrawlKey = Deno.env.get("FIRECRAWL_API_KEY");
    const perplexityKey = Deno.env.get("PERPLEXITY_API_KEY");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const results: TopResult[] = [];
    const errors: string[] = [];

    // Execute 4 searches in parallel
    const [ticketAndGo, perplexitySearch, alternativePlatforms] =
      await Promise.allSettled([
        // 1. Firecrawl - Ticket and Go
        firecrawlKey
          ? searchTicketAndGo(firecrawlKey)
          : Promise.resolve([] as TopResult[]),

        // 2. Perplexity - AI Search
        perplexityKey
          ? searchPerplexity(perplexityKey)
          : Promise.resolve([] as TopResult[]),

        // 3. Firecrawl - Alternative platforms
        firecrawlKey
          ? searchAlternativePlatforms(firecrawlKey)
          : Promise.resolve([] as TopResult[]),
      ]);

    if (ticketAndGo.status === "fulfilled") {
      results.push(...ticketAndGo.value);
    } else {
      errors.push(`TicketAndGo: ${ticketAndGo.reason}`);
    }

    if (perplexitySearch.status === "fulfilled") {
      results.push(...perplexitySearch.value);
    } else {
      errors.push(`Perplexity: ${perplexitySearch.reason}`);
    }

    if (alternativePlatforms.status === "fulfilled") {
      results.push(...alternativePlatforms.value);
    } else {
      errors.push(`Alternativas: ${alternativePlatforms.reason}`);
    }

    // Cross-match and deduplicate
    const merged = crossMatchResults(results);

    // Upsert into database
    for (const top of merged) {
      const { error } = await supabase.from("tops_legendarios").upsert(
        {
          nome_track: top.nome_track || "Desconhecido",
          numero_top: top.numero_top,
          cidade: top.cidade,
          estado: top.estado,
          data_checkin: top.data_checkin || null,
          data_retorno: top.data_retorno || null,
          valor_participante: top.valor_participante,
          link_participante: top.link_participante,
          valor_servidor: top.valor_servidor,
          link_servidor: top.link_servidor,
          instagram_base: top.instagram_base,
          origem_dados: top.origem_dados,
          data_captura: new Date().toISOString(),
          ativo: true,
        },
        { onConflict: "nome_track,data_checkin", ignoreDuplicates: false }
      );
      if (error) {
        console.error("Upsert error:", error);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        total_encontrados: merged.length,
        por_fonte: {
          ticket_and_go:
            ticketAndGo.status === "fulfilled"
              ? ticketAndGo.value.length
              : 0,
          perplexity:
            perplexitySearch.status === "fulfilled"
              ? perplexitySearch.value.length
              : 0,
          alternativas:
            alternativePlatforms.status === "fulfilled"
              ? alternativePlatforms.value.length
              : 0,
        },
        erros: errors,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Radar error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

async function searchTicketAndGo(apiKey: string): Promise<TopResult[]> {
  const results: TopResult[] = [];

  const response = await fetch("https://api.firecrawl.dev/v1/map", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      url: "https://www.ticketandgo.com.br",
      search: "legendarios",
      limit: 100,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Firecrawl map failed: ${response.status} ${text}`);
  }

  const data = await response.json();
  const links: string[] = data.links || [];

  for (const link of links) {
    if (!link.toLowerCase().includes("legendari")) continue;

    const isParticipante = link.includes("/evento/");
    const result: TopResult = {
      origem_dados: "ticketandgo",
    };

    if (isParticipante) {
      result.link_participante = link;
    } else {
      result.link_servidor = link;
    }

    // Try to extract track name from URL
    const parts = link.split("/").filter(Boolean);
    const lastPart = parts[parts.length - 1];
    if (lastPart) {
      result.nome_track = lastPart
        .replace(/-/g, " ")
        .replace(/legendarios?\s*/i, "")
        .trim();
    }

    results.push(result);
  }

  return results;
}

async function searchPerplexity(apiKey: string): Promise<TopResult[]> {
  const results: TopResult[] = [];

  const response = await fetch(
    "https://api.perplexity.ai/chat/completions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "sonar",
        messages: [
          {
            role: "system",
            content:
              "Você é um assistente que busca informações sobre TOPs dos Legendários (eventos cristãos de aventura). Retorne APENAS JSON válido.",
          },
          {
            role: "user",
            content: `Busque TOPs dos Legendários com inscrições abertas em 2025 e 2026. 
Para cada TOP encontrado, retorne um JSON array com objetos contendo:
- numero_top (ex: "TOP 45")
- nome_track (nome da track/base)
- cidade
- estado
- data_checkin (formato YYYY-MM-DD)
- data_retorno (formato YYYY-MM-DD)
- link_participante (link de inscrição para participantes)
- link_servidor (link de inscrição para servidores)
- valor_participante (número)

Retorne APENAS o JSON array, sem texto adicional.`,
          },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "tops_list",
            schema: {
              type: "object",
              properties: {
                tops: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      numero_top: { type: "string" },
                      nome_track: { type: "string" },
                      cidade: { type: "string" },
                      estado: { type: "string" },
                      data_checkin: { type: "string" },
                      data_retorno: { type: "string" },
                      link_participante: { type: "string" },
                      link_servidor: { type: "string" },
                      valor_participante: { type: "number" },
                    },
                  },
                },
              },
            },
          },
        },
      }),
    }
  );

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Perplexity failed: ${response.status} ${text}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;

  if (content) {
    try {
      const parsed = JSON.parse(content);
      const tops = parsed.tops || parsed;
      if (Array.isArray(tops)) {
        for (const top of tops) {
          results.push({
            ...top,
            origem_dados: "perplexity",
          });
        }
      }
    } catch {
      console.error("Failed to parse Perplexity response:", content);
    }
  }

  return results;
}

async function searchAlternativePlatforms(
  apiKey: string
): Promise<TopResult[]> {
  const results: TopResult[] = [];
  const platforms = ["e-inscricao.com", "enttro.com"];

  for (const platform of platforms) {
    try {
      const response = await fetch("https://api.firecrawl.dev/v1/map", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url: `https://www.${platform}`,
          search: "legendarios",
          limit: 50,
        }),
      });

      if (!response.ok) {
        await response.text();
        continue;
      }

      const data = await response.json();
      const links: string[] = data.links || [];

      for (const link of links) {
        if (!link.toLowerCase().includes("legendari")) continue;
        results.push({
          link_participante: link,
          origem_dados: platform,
        });
      }
    } catch (err) {
      console.error(`Error searching ${platform}:`, err);
    }
  }

  return results;
}

function crossMatchResults(results: TopResult[]): TopResult[] {
  const byTrack = new Map<string, TopResult>();

  for (const r of results) {
    const key = (r.nome_track || "unknown").toLowerCase().trim();

    if (byTrack.has(key)) {
      const existing = byTrack.get(key)!;
      // Merge: fill missing fields
      if (r.link_participante && !existing.link_participante)
        existing.link_participante = r.link_participante;
      if (r.link_servidor && !existing.link_servidor)
        existing.link_servidor = r.link_servidor;
      if (r.valor_participante && !existing.valor_participante)
        existing.valor_participante = r.valor_participante;
      if (r.valor_servidor && !existing.valor_servidor)
        existing.valor_servidor = r.valor_servidor;
      if (r.data_checkin && !existing.data_checkin)
        existing.data_checkin = r.data_checkin;
      if (r.data_retorno && !existing.data_retorno)
        existing.data_retorno = r.data_retorno;
      if (r.cidade && !existing.cidade) existing.cidade = r.cidade;
      if (r.estado && !existing.estado) existing.estado = r.estado;
      if (r.numero_top && !existing.numero_top)
        existing.numero_top = r.numero_top;
      existing.origem_dados += `,${r.origem_dados}`;
    } else {
      byTrack.set(key, { ...r });
    }
  }

  return Array.from(byTrack.values());
}
