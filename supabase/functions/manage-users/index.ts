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

  // Extract JWT from Authorization header
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
    return json({ error: "Apenas diretoria pode gerenciar usuários" }, 403);
  }

  const body = await req.json();
  const action = body.action as string;

  try {
    // LIST - fetch from user_profiles + user_roles
    if (action === "list") {
      const { data: profiles, error } = await supabase
        .from("user_profiles")
        .select("id, nome, email, telefone, cargo, area_preferencia, numero_legendario, status, created_at")
        .order("nome");

      if (error) return json({ error: error.message }, 500);

      // Fetch roles for all users
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

    // CREATE - use Supabase Auth Admin API + insert into user_profiles + user_roles
    if (action === "create") {
      const { email, nome, senha, role, telefone, cargo, area_preferencia } = body;
      if (!email || !nome || !senha || !role) {
        return json({ error: "Campos obrigatórios: email, nome, senha, role" }, 400);
      }

      // Create auth user
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email: email.trim(),
        password: senha,
        email_confirm: true,
      });

      if (createError) return json({ error: createError.message }, 500);

      const userId = newUser.user.id;

      // Insert into user_profiles
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
        // Cleanup: delete auth user if profile insert fails
        await supabase.auth.admin.deleteUser(userId);
        return json({ error: profileError.message }, 500);
      }

      // Insert into user_roles
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

    // UPDATE - update user_profiles + user_roles + optionally auth
    if (action === "update") {
      const { user_id, email, nome, senha, role, telefone, cargo, area_preferencia, status } = body;
      if (!user_id) return json({ error: "user_id obrigatório" }, 400);

      // Update user_profiles
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

      // Update role if provided
      if (role !== undefined) {
        // Delete existing roles and insert new one
        await supabase.from("user_roles").delete().eq("user_id", user_id);
        const { error } = await supabase
          .from("user_roles")
          .insert({ user_id, role });
        if (error) return json({ error: error.message }, 500);
      }

      // Update auth email/password if provided
      const authUpdates: Record<string, unknown> = {};
      if (email !== undefined) authUpdates.email = email.trim();
      if (senha !== undefined && senha !== "") authUpdates.password = senha;

      if (Object.keys(authUpdates).length > 0) {
        const { error } = await supabase.auth.admin.updateUserById(user_id, authUpdates);
        if (error) return json({ error: error.message }, 500);
      }

      return json({ success: true });
    }

    return json({ error: "Ação inválida" }, 400);
  } catch (err) {
    console.error("manage-users error:", err);
    return json({ error: "Erro interno" }, 500);
  }
});
