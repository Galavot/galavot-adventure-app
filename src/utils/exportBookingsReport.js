// src/utils/exportBookingsReport.js
//
// Gera um relatório em .xlsx com as reservas, direto no navegador (sem
// precisar de nenhuma função serverless nova — a Vercel Hobby já está no
// limite de 12/12). Usa os dados que a tela do ADM já carregou.

import ExcelJS from "exceljs";

const METHOD_LABELS = {
  pix: "Pix",
  credito: "Cartão de Crédito",
  debito: "Cartão de Débito",
  transferencia: "Transferência Bancária",
};

const STATUS_LABELS = {
  pendente_pagamento: "Aguardando pagamento",
  confirmado: "Confirmado",
  concluido: "Concluído",
  cancelado: "Cancelado",
  pagamento_recusado: "Pagamento recusado",
  conflito_vaga: "Conflito de vaga",
};

// Formata "2026-08-28" -> "28/08/2026". Se vier algo fora do formato
// esperado, devolve como veio, sem quebrar o relatório inteiro por causa
// de uma linha com dado estranho.
function formatDateBR(iso) {
  if (!iso) return "";
  const [year, month, day] = iso.split("-");
  if (!year || !month || !day) return iso;
  return `${day}/${month}/${year}`;
}

function formatDateTimeBR(isoDateTime) {
  if (!isoDateTime) return "";
  try {
    return new Date(isoDateTime).toLocaleString("pt-BR");
  } catch {
    return isoDateTime;
  }
}

const COLUMNS = [
  { header: "Código", key: "booking_code", width: 12 },
  { header: "Status", key: "status_label", width: 20 },
  { header: "Passeio", key: "tour_name", width: 20 },
  { header: "Data", key: "date_label", width: 12 },
  { header: "Horário", key: "booking_time", width: 10 },
  { header: "Cliente", key: "customer_name", width: 26 },
  { header: "WhatsApp", key: "customer_phone", width: 16 },
  { header: "E-mail", key: "customer_email", width: 26 },
  { header: "Pessoas", key: "participants", width: 9 },
  { header: "Valor total (R$)", key: "total", width: 15 },
  { header: "Forma de pagamento", key: "payment_method_label", width: 20 },
  { header: "Plano", key: "payment_plan_label", width: 12 },
  { header: "Valor pago (R$)", key: "valor_pago_inicial", width: 14 },
  { header: "Restante (R$)", key: "restante", width: 13 },
  { header: "Parceiro", key: "partner_name", width: 20 },
  { header: "Comissão (R$)", key: "comissao_valor", width: 13 },
  { header: "Comissão paga?", key: "comissao_paga_label", width: 14 },
  { header: "Reservado em", key: "created_at_label", width: 18 },
];

/**
 * Gera e baixa um .xlsx com as reservas informadas.
 *
 * @param {Array} bookings - lista de reservas (já carregada na tela do ADM)
 * @param {Object} options
 * @param {Map<string,string>} [options.partnerNamesById] - id do parceiro -> nome, pra mostrar o nome em vez do id cru
 * @param {string} [options.monthLabel] - texto pro nome do arquivo, ex: "2026-09" ou "todos-os-periodos"
 */
export async function exportBookingsReport(bookings, { partnerNamesById = new Map(), monthLabel = "relatorio" } = {}) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Galavot Adventure";
  workbook.created = new Date();

  const sheet = workbook.addWorksheet("Reservas", {
    views: [{ state: "frozen", ySplit: 1 }], // trava a linha de cabeçalho ao rolar
  });
  sheet.columns = COLUMNS;

  for (const b of bookings) {
    const restante =
      b.payment_plan === "sinal" ? Number(b.total || 0) - Number(b.valor_pago_inicial || 0) : 0;

    sheet.addRow({
      booking_code: b.booking_code || "",
      status_label: STATUS_LABELS[b.status] || b.status || "",
      tour_name: b.tour_name || "",
      date_label: formatDateBR(b.booking_date),
      booking_time: b.booking_time || "",
      customer_name: b.customer_name || "",
      customer_phone: b.customer_phone || "",
      customer_email: b.customer_email || "",
      participants: b.participants ?? "",
      total: Number(b.total || 0),
      payment_method_label: METHOD_LABELS[b.payment_method] || b.payment_method || "",
      payment_plan_label: b.payment_plan === "vista" ? "À vista" : b.payment_plan === "sinal" ? "Sinal 50%" : "",
      valor_pago_inicial: b.valor_pago_inicial != null ? Number(b.valor_pago_inicial) : "",
      restante: b.payment_plan === "sinal" ? restante : "",
      partner_name: b.partner_id ? partnerNamesById.get(b.partner_id) || "Parceiro" : "",
      comissao_valor: b.partner_id ? Number(b.comissao_valor || 0) : "",
      comissao_paga_label: b.partner_id ? (b.comissao_paga ? "Sim" : "Não") : "",
      created_at_label: formatDateTimeBR(b.created_at),
    });
  }

  // Cabeçalho em negrito + fundo laranja da marca, e AutoFilter em todas
  // as colunas — é isso que deixa pronto pra filtrar por status, mês,
  // parceiro etc. direto no Excel, sem precisar mexer em nada.
  const headerRow = sheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
  headerRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF2600C" } };
  sheet.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: COLUMNS.length } };

  // Colunas de dinheiro formatadas como moeda, pra já vir prontinho.
  ["total", "valor_pago_inicial", "restante", "comissao_valor"].forEach((key) => {
    const col = sheet.getColumn(COLUMNS.findIndex((c) => c.key === key) + 1);
    col.numFmt = '"R$" #,##0.00';
  });

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `galavot-reservas-${monthLabel}.xlsx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
