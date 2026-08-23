// api/_brazilTime.js
//
// O servidor da Vercel roda em UTC, e o relógio do celular do cliente não
// é confiável pra decidir se uma reserva pode ou não ser feita. Esse
// helper calcula a data/hora atual sempre no fuso de Guarapari-ES
// (America/Sao_Paulo), direto no servidor, pra ser a fonte da verdade do
// corte de reserva de última hora.

export function getBrazilNow() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date());

  const map = {};
  parts.forEach((p) => {
    map[p.type] = p.value;
  });

  return {
    dateStr: `${map.year}-${map.month}-${map.day}`, // "2026-08-23"
    minutesSinceMidnight: Number(map.hour) * 60 + Number(map.minute),
  };
}

// true se, pra esse passeio, já passou da hora limite de reservar PRO DIA
// DE HOJE. Reservas pra outros dias nunca são afetadas por isso.
export function isPastSameDayCutoff(tour, bookingDate) {
  if (!tour || typeof tour.cutoffHour !== "number") return false;

  const { dateStr, minutesSinceMidnight } = getBrazilNow();
  if (bookingDate !== dateStr) return false;

  return minutesSinceMidnight >= tour.cutoffHour * 60;
}
