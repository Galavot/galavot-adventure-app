// api/_blockedDates.js
//
// Helper compartilhado (prefixo "_" = não conta no limite de 12 funções
// serverless da Vercel) pra consultar a tabela "blocked_dates" — dias em
// que o Sid decidiu não vender um passeio específico (evento, manutenção
// geral, feriado etc), configurável na aba CONFIGURAÇÕES do /admin.
//
// Usado por: check-availability-batch.js (mostra a data como indisponível
// no calendário, tanto no app quanto na tela de reserva do parceiro) e
// create-booking.js (recusa a reserva no servidor mesmo que alguém tente
// forçar via API direto).

// Devolve um Set com as datas (string "YYYY-MM-DD") bloqueadas pra um
// tourId específico, dentro da lista de datas fornecida.
export async function getBlockedDatesSet(supabase, tourId, dateList) {
  if (!supabase || !tourId || !dateList?.length) return new Set();

  const { data, error } = await supabase
    .from("blocked_dates")
    .select("date")
    .eq("tour_id", tourId)
    .in("date", dateList);

  if (error || !data) return new Set();
  return new Set(data.map((row) => row.date));
}

// Confere se UMA data específica está bloqueada pro passeio — usado no
// momento de salvar a reserva (create-booking.js).
export async function isDateBlocked(supabase, tourId, date) {
  if (!supabase || !tourId || !date) return false;

  const { data, error } = await supabase
    .from("blocked_dates")
    .select("id")
    .eq("tour_id", tourId)
    .eq("date", date)
    .maybeSingle();

  if (error) return false;
  return Boolean(data);
}
