// @ts-nocheck
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import * as bcrypt from "https://deno.land/x/bcrypt@v0.4.1/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const body = await req.json();
    const { action, admin_id, payload } = body ?? {};
    if (!action) return json({ error: "missing action" }, 400);

    // Validate admin session via anon client (uses public.admin_users via SECURITY DEFINER funcs)
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

    if (action === "login") {
      const { username, password } = payload ?? {};
      if (!username || !password) return json({ error: "missing credentials" }, 400);
      const { data, error } = await admin.rpc("admin_check_password", {
        p_username: username,
        p_password: password,
      });
      if (error) return json({ error: error.message }, 400);
      const row = Array.isArray(data) ? data[0] : null;
      if (!row?.id) return json({ error: "invalid_credentials" }, 401);
      return json({ id: row.id, username: row.username });
    }

    // For all other actions, verify admin_id exists
    if (!admin_id) return json({ error: "unauthorized" }, 401);
    const { data: who, error: whoErr } = await admin
      .from("admin_users")
      .select("id, username")
      .eq("id", admin_id)
      .maybeSingle();
    if (whoErr || !who) return json({ error: "unauthorized" }, 401);

    if (action === "list_entries") {
      const { data, error } = await admin
        .from("promotion_entries")
        .select("id, full_name, whatsapp, cpf, instagram, city, message, created_at")
        .order("created_at", { ascending: false })
        .limit(1000);
      if (error) return json({ error: error.message }, 400);
      return json({ entries: data ?? [] });
    }

    if (action === "list_admins") {
      const { data, error } = await admin
        .from("admin_users")
        .select("id, username, created_at")
        .order("created_at", { ascending: false });
      if (error) return json({ error: error.message }, 400);
      return json({ admins: data ?? [] });
    }

    if (action === "create_admin") {
      const { username, password } = payload ?? {};
      if (!username || !password || password.length < 6)
        return json({ error: "invalid input" }, 400);
      const { error } = await admin.rpc("admin_create_user", {
        p_username: username,
        p_password: password,
      });
      if (error) return json({ error: error.message }, 400);
      return json({ ok: true });
    }

    if (action === "delete_entry") {
      const { id } = payload ?? {};
      if (!id) return json({ error: "missing id" }, 400);
      const { error } = await admin.from("promotion_entries").delete().eq("id", id);
      if (error) return json({ error: error.message }, 400);
      return json({ ok: true });
    }

    if (action === "update_admin_username") {
      const { id, username } = payload ?? {};
      if (!id || !username || !username.trim())
        return json({ error: "invalid input" }, 400);
      // Check duplicate
      const { data: existing } = await admin
        .from("admin_users")
        .select("id")
        .eq("username", username.trim())
        .maybeSingle();
      if (existing && existing.id !== id)
        return json({ error: "Nome de usuário já em uso." }, 400);
      const { error } = await admin
        .from("admin_users")
        .update({ username: username.trim() })
        .eq("id", id);
      if (error) return json({ error: error.message }, 400);
      return json({ ok: true });
    }

    if (action === "update_admin_password") {
      const { id, password } = payload ?? {};
      if (!id || !password || password.length < 6)
        return json({ error: "Senha deve ter ao menos 6 caracteres." }, 400);
      const salt = bcrypt.genSaltSync(10);
      const hash = bcrypt.hashSync(password, salt);
      const { error } = await admin
        .from("admin_users")
        .update({ password_hash: hash })
        .eq("id", id);
      if (error) return json({ error: error.message }, 400);
      return json({ ok: true });
    }

    if (action === "delete_admin") {
      const { id } = payload ?? {};
      if (!id) return json({ error: "missing id" }, 400);
      if (id === admin_id) return json({ error: "Não é possível excluir você mesmo." }, 400);
      const { error } = await admin.from("admin_users").delete().eq("id", id);
      if (error) return json({ error: error.message }, 400);
      return json({ ok: true });
    }

    return json({ error: "unknown action" }, 400);
  } catch (e: any) {
    return json({ error: e?.message || "server error" }, 500);
  }
});

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
