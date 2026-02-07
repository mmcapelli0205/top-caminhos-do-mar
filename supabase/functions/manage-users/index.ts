import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // Verify caller is diretoria
  const body = await req.json();
  const callerId = body.caller_id as string | undefined;

  if (!callerId) return json({ error: "Não autorizado" }, 401);

  const { data: caller } = await supabase
    .from("usuarios")
    .select("papel")
    .eq("id", callerId)
    .maybeSingle();

  if (!caller || caller.papel !== "diretoria") {
    return json({ error: "Apenas diretoria pode gerenciar usuários" }, 403);
  }

  const action = body.action as string;

  try {
    // LIST
    if (action === "list") {
      const { data, error } = await supabase
        .from("usuarios")
        .select("id, username, nome, papel, area_servico, ativo, created_at")
        .order("nome");

      if (error) return json({ error: error.message }, 500);
      return json({ users: data });
    }

    // UPDATE
    if (action === "update") {
      const { user_id, username, nome, senha, papel, area_servico, ativo } = body;
      if (!user_id) return json({ error: "user_id obrigatório" }, 400);

      const updates: Record<string, unknown> = {};
      if (username !== undefined) updates.username = username.trim();
      if (nome !== undefined) updates.nome = nome.trim();
      if (senha !== undefined && senha !== "") updates.senha_hash = senha;
      if (papel !== undefined) updates.papel = papel;
      if (area_servico !== undefined) updates.area_servico = area_servico;
      if (ativo !== undefined) updates.ativo = ativo;

      const { data, error } = await supabase
        .from("usuarios")
        .update(updates)
        .eq("id", user_id)
        .select("id, username, nome, papel, area_servico, ativo")
        .single();

      if (error) return json({ error: error.message }, 500);
      return json({ user: data });
    }

    // CREATE
    if (action === "create") {
      const { username, nome, senha, papel, area_servico } = body;
      if (!username || !nome || !senha || !papel) {
        return json({ error: "Campos obrigatórios: username, nome, senha, papel" }, 400);
      }

      const { data, error } = await supabase
        .from("usuarios")
        .insert({
          username: username.trim(),
          nome: nome.trim(),
          senha_hash: senha,
          papel,
          area_servico: area_servico || null,
        })
        .select("id, username, nome, papel, area_servico, ativo")
        .single();

      if (error) return json({ error: error.message }, 500);
      return json({ user: data });
    }

    return json({ error: "Ação inválida" }, 400);
  } catch {
    return json({ error: "Erro interno" }, 500);
  }
});
