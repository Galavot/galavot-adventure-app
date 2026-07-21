// api/_rateLimit.js
//
// Proteção simples contra força bruta nos logins (admin e parceiro).
// Guarda tentativas de login na tabela "login_attempts" do Supabase e
// bloqueia temporariamente um IP que errar demais em pouco tempo.
//
// Requer a tabela abaixo no Supabase (ver README):
//
// create table login_attempts (
//   id uuid primary key default gen_random_uuid(),
//   ip text not null,
//   scope text not null,
//   created_at timestamptz default now()
// );
// create index login_attempts_ip_scope_idx on login_attempts (ip, scope, created_at);

const WINDOW_MINUTES = 15;
const MAX_ATTEMPTS = 8;

export function getClientIp(req) {
  const fwd = req.headers["x-forwarded-for"];
  if (fwd) return fwd.split(",")[0].trim();
  return req.socket?.remoteAddress || "unknown";
}

// Retorna { blocked: true, retryAfterMinutes } se o IP já errou demais,
// ou { blocked: false } se pode tentar.
export async function checkRateLimit(supabase, ip, scope) {
  const since = new Date(Date.now() - WINDOW_MINUTES * 60 * 1000).toISOString();
  const { count, error } = await supabase
    .from("login_attempts")
    .select("*", { count: "exact", head: true })
    .eq("ip", ip)
    .eq("scope", scope)
    .gte("created_at", since);

  // Se a tabela ainda não existe ou algo falhou na checagem, não bloqueia
  // o login por causa disso — só não protege dessa vez.
  if (error) return { blocked: false };

  if ((count || 0) >= MAX_ATTEMPTS) {
    return { blocked: true, retryAfterMinutes: WINDOW_MINUTES };
  }
  return { blocked: false };
}

export async function registerFailedAttempt(supabase, ip, scope) {
  try {
    await supabase.from("login_attempts").insert({ ip, scope });
  } catch (err) {
    // Não bloqueia o fluxo de login se o registro falhar.
  }
}
