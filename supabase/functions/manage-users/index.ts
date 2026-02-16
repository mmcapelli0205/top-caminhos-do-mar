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

function gerarEmailTemp(nome: string): string {
  return nome
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ".")
    .replace(/[^a-z0-9.]/g, "")
    + "@top1575.temp";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const body = await req.json();
  const action = body.action as string;

  // update_credentials does NOT require diretoria role — the user updates their own credentials
  if (action === "update_credentials") {
    const { user_id, new_email, new_password } = body;
    if (!user_id || !new_email || !new_password) {
      return json({ error: "user_id, new_email e new_password obrigatórios" }, 400);
    }

    try {
      const { error: authError } = await supabase.auth.admin.updateUserById(user_id, {
        email: new_email.trim(),
        password: new_password,
        email_confirm: true,
      });
      if (authError) return json({ error: authError.message }, 500);

      const { error: profileError } = await supabase
        .from("user_profiles")
        .update({ email: new_email.trim(), login_temporario: false })
        .eq("id", user_id);
      if (profileError) return json({ error: profileError.message }, 500);

      return json({ success: true });
    } catch (err) {
      console.error("update_credentials error:", err);
      return json({ error: "Erro interno" }, 500);
    }
  }

  // All other actions require authorization
  const authHeader = req.headers.get("authorization");
  if (!authHeader) return json({ error: "Não autorizado" }, 401);

  const token = authHeader.replace("Bearer ", "");
  const { data: { user: caller }, error: authError } = await supabase.auth.getUser(token);

  if (authError || !caller) return json({ error: "Não autorizado" }, 401);

  // Check if caller has 'diretoria' role in user_roles
  const { data: roleData } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", caller.id)
    .eq("role", "diretoria")
    .maybeSingle();

  if (!roleData) {
    // Also allow users with pode_aprovar for approve/confirm actions
    const { data: approverProfile } = await supabase
      .from("user_profiles")
      .select("pode_aprovar")
      .eq("id", caller.id)
      .single();

    if (!approverProfile?.pode_aprovar || !["approve", "confirm_email"].includes(action)) {
      return json({ error: "Apenas diretoria pode gerenciar usuários" }, 403);
    }
  }

  try {
    // CREATE_TEMP_USER - quick leadership registration
    if (action === "create_temp_user") {
      const { nome, equipe, cargo_area } = body;
      if (!nome || !equipe || !cargo_area) {
        return json({ error: "nome, equipe e cargo_area obrigatórios" }, 400);
      }

      // Generate temp email
      let baseEmail = gerarEmailTemp(nome);
      let emailToUse = baseEmail;
      let suffix = 1;

      // Check for duplicates
      while (true) {
        const { data: existing } = await supabase.auth.admin.listUsers({ perPage: 1 });
        // Use getUserByEmail approach
        const { data: existingUser } = await supabase.auth.admin.getUserById("00000000-0000-0000-0000-000000000000").catch(() => ({ data: null }));
        
        // Simpler: try to list users filtered by email
        const { data: listData } = await supabase.auth.admin.listUsers();
        const emailExists = (listData?.users || []).some((u: { email?: string }) => u.email === emailToUse);
        
        if (!emailExists) break;
        suffix++;
        const [localPart] = baseEmail.split("@");
        emailToUse = `${localPart}${suffix}@top1575.temp`;
        if (suffix > 20) return json({ error: "Muitos usuários com nome similar" }, 400);
      }

      const senha = "TOP2026!";
      const diretoriaCargos = ["Diretor", "Sub-Diretor", "Diretor Espiritual"];
      const role = diretoriaCargos.includes(cargo_area) ? "diretoria" : "coordenacao";

      // Create auth user
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email: emailToUse,
        password: senha,
        email_confirm: true,
      });

      if (createError) return json({ error: createError.message }, 500);
      const userId = newUser.user.id;

      // The trigger handle_new_user will create a basic profile, so we use upsert
      const { error: profileError } = await supabase
        .from("user_profiles")
        .upsert({
          id: userId,
          nome: nome.trim(),
          email: emailToUse,
          status: "aprovado",
          cargo: role,
          area_preferencia: equipe,
          login_temporario: true,
          primeiro_acesso: true,
        }, { onConflict: "id" });

      if (profileError) {
        console.error("Profile upsert error:", profileError);
        await supabase.auth.admin.deleteUser(userId);
        return json({ error: profileError.message }, 500);
      }

      // Insert role
      const { error: roleError } = await supabase
        .from("user_roles")
        .upsert({ user_id: userId, role }, { onConflict: "user_id,role" });

      if (roleError) {
        console.error("Role insert error:", roleError);
      }

      // Insert servidor
      const { error: servidorError } = await supabase
        .from("servidores")
        .insert({
          nome: nome.trim(),
          area_servico: equipe,
          cargo_area,
          status: "ativo",
          origem: "convite",
          dados_completos: false,
        });

      if (servidorError) {
        console.error("Servidor insert error:", servidorError);
      }

      return json({ user_id: userId, email: emailToUse, senha });
    }

    // LIST - fetch from user_profiles + user_roles
    if (action === "list") {
      const { data: profiles, error } = await supabase
        .from("user_profiles")
        .select("id, nome, email, telefone, cargo, area_preferencia, numero_legendario, status, created_at")
        .order("nome");

      if (error) return json({ error: error.message }, 500);

      const userIds = (profiles || []).map((p: { id: string }) => p.id);
      const { data: roles } = await supabase
        .from("user_roles")
        .select("user_id, role")
        .in("user_id", userIds);

      const rolesMap: Record<string, string> = {};
      for (const r of roles || []) {
        rolesMap[r.user_id] = r.role;
      }

      const users = (profiles || []).map((p: Record<string, unknown>) => ({
        ...p,
        role: rolesMap[p.id as string] || "servidor",
      }));

      return json({ users });
    }

    // CREATE
    if (action === "create") {
      const { email, nome, senha, role, telefone, cargo, area_preferencia } = body;
      if (!email || !nome || !senha || !role) {
        return json({ error: "Campos obrigatórios: email, nome, senha, role" }, 400);
      }

      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email: email.trim(),
        password: senha,
        email_confirm: true,
      });

      if (createError) return json({ error: createError.message }, 500);

      const userId = newUser.user.id;

      const { error: profileError } = await supabase
        .from("user_profiles")
        .insert({
          id: userId,
          email: email.trim(),
          nome: nome.trim(),
          telefone: telefone || null,
          cargo: cargo || null,
          area_preferencia: area_preferencia || null,
          status: "aprovado",
        });

      if (profileError) {
        await supabase.auth.admin.deleteUser(userId);
        return json({ error: profileError.message }, 500);
      }

      const { error: roleError } = await supabase
        .from("user_roles")
        .insert({ user_id: userId, role });

      if (roleError) {
        return json({ error: roleError.message }, 500);
      }

      return json({
        user: { id: userId, email: email.trim(), nome: nome.trim(), role, telefone, cargo, area_preferencia, status: "aprovado" },
      });
    }

    // UPDATE
    if (action === "update") {
      const { user_id, email, nome, senha, role, telefone, cargo, area_preferencia, status } = body;
      if (!user_id) return json({ error: "user_id obrigatório" }, 400);

      const profileUpdates: Record<string, unknown> = {};
      if (nome !== undefined) profileUpdates.nome = nome.trim();
      if (email !== undefined) profileUpdates.email = email.trim();
      if (telefone !== undefined) profileUpdates.telefone = telefone || null;
      if (cargo !== undefined) profileUpdates.cargo = cargo || null;
      if (area_preferencia !== undefined) profileUpdates.area_preferencia = area_preferencia || null;
      if (status !== undefined) profileUpdates.status = status;

      if (Object.keys(profileUpdates).length > 0) {
        const { error } = await supabase
          .from("user_profiles")
          .update(profileUpdates)
          .eq("id", user_id);
        if (error) return json({ error: error.message }, 500);
      }

      if (role !== undefined) {
        await supabase.from("user_roles").delete().eq("user_id", user_id);
        const { error } = await supabase
          .from("user_roles")
          .insert({ user_id, role });
        if (error) return json({ error: error.message }, 500);
      }

      const authUpdates: Record<string, unknown> = {};
      if (email !== undefined) authUpdates.email = email.trim();
      if (senha !== undefined && senha !== "") authUpdates.password = senha;

      if (Object.keys(authUpdates).length > 0) {
        const { error } = await supabase.auth.admin.updateUserById(user_id, authUpdates);
        if (error) return json({ error: error.message }, 500);
      }

      return json({ success: true });
    }

    // CONFIRM EMAIL
    if (action === "confirm_email") {
      const { user_id } = body;
      if (!user_id) return json({ error: "user_id obrigatório" }, 400);

      const { error } = await supabase.auth.admin.updateUserById(user_id, {
        email_confirm: true,
      });

      if (error) return json({ error: error.message }, 500);
      return json({ success: true });
    }

    // APPROVE
    if (action === "approve") {
      const { user_id, cargo, aprovado_por } = body;
      if (!user_id || !cargo) return json({ error: "user_id e cargo obrigatórios" }, 400);

      const { error: profileError } = await supabase
        .from("user_profiles")
        .update({
          status: "aprovado",
          cargo,
          aprovado_por: aprovado_por || null,
          data_aprovacao: new Date().toISOString(),
        })
        .eq("id", user_id);
      if (profileError) return json({ error: profileError.message }, 500);

      await supabase.from("user_roles").delete().eq("user_id", user_id);
      const { error: roleError } = await supabase
        .from("user_roles")
        .insert({ user_id, role: cargo });
      if (roleError) return json({ error: roleError.message }, 500);

      const { error: confirmError } = await supabase.auth.admin.updateUserById(user_id, {
        email_confirm: true,
      });
      if (confirmError) return json({ error: confirmError.message }, 500);

      return json({ success: true });
    }

    return json({ error: "Ação inválida" }, 400);
  } catch (err) {
    console.error("manage-users error:", err);
    return json({ error: "Erro interno" }, 500);
  }
});
