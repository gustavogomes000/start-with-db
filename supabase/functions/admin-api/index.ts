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

    // Public action — no auth required (used by the public form)
    if (action === "list_interviewers") {
      const { data, error } = await admin
        .from("admin_users")
        .select("id, username")
        .order("username", { ascending: true });
      if (error) return json({ error: error.message }, 400);
      return json({ interviewers: data ?? [] });
    }

    // Public action — submit a questionnaire entry with CPF validation + uniqueness
    if (action === "submit_entry") {
      const p = payload ?? {};
      const cpfDigits = String(p.cpf ?? "").replace(/\D/g, "");
      if (!isValidCPF(cpfDigits)) return json({ error: "cpf_invalid" }, 400);
      if (!p.full_name || !p.whatsapp || !p.recruiter_id) {
        return json({ error: "missing_fields" }, 400);
      }
      // Check duplicate CPF
      const { data: existing, error: existErr } = await admin
        .from("promotion_entries")
        .select("id")
        .eq("cpf", cpfDigits)
        .maybeSingle();
      if (existErr) return json({ error: existErr.message }, 400);
      if (existing) return json({ error: "cpf_duplicate" }, 409);

      // Resolve recruiter name
      const { data: rec } = await admin
        .from("admin_users")
        .select("username")
        .eq("id", p.recruiter_id)
        .maybeSingle();
      const recruiterName = rec?.username ?? "—";

      const { error: insErr } = await admin.from("promotion_entries").insert({
        full_name: p.full_name,
        whatsapp: p.whatsapp,
        phone: p.whatsapp,
        cpf: cpfDigits,
        instagram: p.instagram ?? null,
        city: p.city ?? "Voz das Mulheres",
        message: `Entrevistador: ${recruiterName} (${p.recruiter_id})\nNascimento: ${p.data_nascimento ?? ""}\n\n${p.answers_text ?? ""}`,
      });
      if (insErr) return json({ error: insErr.message }, 400);

      // Mirror in cadastros_fernanda (best-effort)
      await admin.from("cadastros_fernanda").insert({
        nome: p.full_name,
        telefone: p.whatsapp,
        instagram: p.instagram ?? null,
        cadastrado_por: p.recruiter_id,
        cidade: "Pesquisa Voz das Mulheres",
      });

      return json({ ok: true });
    }

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

    const isMaster = (who.username || "").toLowerCase() === "administrador";

    if (action === "list_entries") {
      if (!isMaster) return json({ error: "forbidden" }, 403);
      const { data, error } = await admin
        .from("promotion_entries")
        .select("id, full_name, whatsapp, cpf, instagram, city, message, created_at")
        .order("created_at", { ascending: false })
        .limit(1000);
      if (error) return json({ error: error.message }, 400);
      return json({ entries: data ?? [] });
    }

    // Entries created by THIS recruiter only (uses message tag we inject)
    if (action === "list_my_entries") {
      const tag = `(${admin_id})`;
      const { data, error } = await admin
        .from("promotion_entries")
        .select("id, full_name, whatsapp, cpf, instagram, city, created_at, message")
        .ilike("message", `%${tag}%`)
        .order("created_at", { ascending: false })
        .limit(1000);
      if (error) return json({ error: error.message }, 400);
      return json({ entries: data ?? [], username: who.username });
    }

    if (action === "list_admins") {
      if (!isMaster) return json({ error: "forbidden" }, 403);
      const { data, error } = await admin
        .from("admin_users")
        .select("id, username, created_at")
        .order("created_at", { ascending: false });
      if (error) return json({ error: error.message }, 400);
      return json({ admins: data ?? [] });
    }

    if (action === "create_admin") {
      if (!isMaster) return json({ error: "forbidden" }, 403);
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
      if (!isMaster) return json({ error: "forbidden" }, 403);
      const { id } = payload ?? {};
      if (!id) return json({ error: "missing id" }, 400);
      const { error } = await admin.from("promotion_entries").delete().eq("id", id);
      if (error) return json({ error: error.message }, 400);
      return json({ ok: true });
    }

    if (action === "update_admin_username") {
      if (!isMaster) return json({ error: "forbidden" }, 403);
      const { id, username } = payload ?? {};
      if (!id || !username || !username.trim())
        return json({ error: "invalid input" }, 400);
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
      if (!isMaster) return json({ error: "forbidden" }, 403);
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
      if (!isMaster) return json({ error: "forbidden" }, 403);
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

function isValidCPF(cpf: string): boolean {
  if (!cpf || cpf.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(cpf)) return false;
  let sum = 0;
  for (let i = 0; i < 9; i++) sum += parseInt(cpf[i]) * (10 - i);
  let d1 = (sum * 10) % 11;
  if (d1 === 10) d1 = 0;
  if (d1 !== parseInt(cpf[9])) return false;
  sum = 0;
  for (let i = 0; i < 10; i++) sum += parseInt(cpf[i]) * (11 - i);
  let d2 = (sum * 10) % 11;
  if (d2 === 10) d2 = 0;
  return d2 === parseInt(cpf[10]);
}
