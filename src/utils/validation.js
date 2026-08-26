// src/utils/validation.js
//
// Validação de "isso parece um nome/telefone de verdade" — usada tanto no
// formulário (BookingCustomer.jsx) quanto no servidor (create-booking.js).
// Precisa existir nos dois lugares porque a validação do navegador sozinha
// não impede ninguém de mandar um POST direto pra API digitando qualquer
// coisa.
//
// Não dá pra confirmar 100% que um nome é real, mas dá pra barrar os casos
// óbvios de zoeira: nome de uma palavra só, tudo repetido ("aaaa"),
// telefone com dígito repetido de mais, DDD inválido, etc.

export function isValidCustomerName(name) {
  const trimmed = String(name || "")
    .trim()
    .replace(/\s+/g, " ");

  if (trimmed.length < 3) return false;

  // Exige nome + sobrenome (pelo menos 2 palavras) — bloqueia "Cghuu",
  // "Teste", "Asdf" digitados sozinhos.
  const parts = trimmed.split(" ").filter(Boolean);
  if (parts.length < 2) return false;

  // Cada parte só com letras (com acento), apóstrofo ou hífen (cobre
  // sobrenomes como "D'Ávila" ou "Silva-Souza"), mínimo 2 letras.
  const namePartRegex = /^[A-Za-zÀ-ÖØ-öø-ÿ][A-Za-zÀ-ÖØ-öø-ÿ'-]*$/;
  if (!parts.every((p) => p.length >= 2 && namePartRegex.test(p))) return false;

  // Bloqueia palavra com a mesma letra repetida ("aaaa", "kkkk").
  if (parts.some((p) => /^(.)\1+$/i.test(p))) return false;

  return true;
}

export function isValidPhoneNumber(phone) {
  const digits = String(phone || "").replace(/\D/g, "");

  // Telefone brasileiro: DDD (2 dígitos) + 8 ou 9 dígitos do número.
  if (digits.length < 10 || digits.length > 11) return false;

  const ddd = Number(digits.slice(0, 2));
  if (ddd < 11 || ddd > 99) return false;

  // Bloqueia número com poucos dígitos distintos, tipo "11111111111"
  // ou "11111111121" (quase tudo repetido).
  const uniqueDigits = new Set(digits.split(""));
  if (uniqueDigits.size <= 2) return false;

  // Bloqueia sequência óbvia tipo "12345678900".
  const isSequential = digits
    .split("")
    .every((d, i, arr) => i === 0 || Number(d) === (Number(arr[i - 1]) + 1) % 10);
  if (isSequential) return false;

  return true;
}
