/**
 * Comparação de telefones para localizar o contato certo (WhatsApp Central / Conecta).
 *
 * Antes, qualquer contato cujo telefone terminasse com os mesmos 8 dígitos era considerado
 * "o mesmo", e o primeiro da lista vencia. Isso juntava pessoas diferentes (mesmo final,
 * DDD diferente; ou um cadastro com vários números no mesmo campo).
 * Agora cada número recebe uma nota e só vence quem tiver a melhor nota.
 */

const digits = (v: unknown) => String(v ?? "").replace(/\D/g, "");

/** Separa um campo que pode ter vários números ("11 99999-0000 / 11 3333-4444"). */
export function splitPhones(field: string | null | undefined): string[] {
  if (!field) return [];
  const parts = String(field)
    .split(/[\/,;|]|\s+e\s+|\s+ou\s+|\n/i)
    .map(digits)
    .filter((d) => d.length >= 8);
  const whole = digits(field);
  // Campo com um número só (com espaços/traços): usa o número inteiro
  if (parts.length <= 1 && whole.length >= 8 && whole.length <= 13) return [whole];
  return parts;
}

/** Normaliza para DDD + número, sem o 55 e com o 9º dígito de celular. */
function canonical(d: string): { ddd: string; local: string } | null {
  let n = d;
  if (n.length >= 12 && n.startsWith("55")) n = n.slice(2);
  if (n.length === 11 || n.length === 10) {
    const ddd = n.slice(0, 2);
    let local = n.slice(2);
    if (local.length === 8 && /^[6-9]/.test(local)) local = "9" + local; // celular antigo sem o 9
    return { ddd, local };
  }
  if (n.length === 9 || n.length === 8) {
    let local = n;
    if (local.length === 8 && /^[6-9]/.test(local)) local = "9" + local;
    return { ddd: "", local };
  }
  return null;
}

/**
 * 3 = mesmo número (DDD + número)
 * 1 = um dos lados não tem DDD e o número bate
 * 0 = diferente
 */
export function phoneScore(a: string, b: string): number {
  const ca = canonical(digits(a));
  const cb = canonical(digits(b));
  if (!ca || !cb) return 0;
  if (ca.local !== cb.local) return 0;
  if (ca.ddd && cb.ddd) return ca.ddd === cb.ddd ? 3 : 0;
  return 1;
}

/** Melhor nota entre o telefone procurado e todos os números de um campo. */
export function bestPhoneScore(input: string, field: string | null | undefined): number {
  let best = 0;
  for (const p of splitPhones(field)) best = Math.max(best, phoneScore(input, p));
  return best;
}

/** Escolhe o registro com o telefone mais parecido (nota > 0); em empate fica o primeiro da lista. */
export function pickByPhone<T extends { id: number }>(input: string, items: T[], getPhones: (item: T) => (string | null | undefined)[]): T | undefined {
  if (!digits(input)) return undefined;
  let best: T | undefined;
  let bestScore = 0;
  for (const item of items) {
    const score = Math.max(0, ...getPhones(item).map((f) => bestPhoneScore(input, f)));
    if (score > bestScore) {
      best = item;
      bestScore = score;
    }
  }
  return bestScore > 0 ? best : undefined;
}
