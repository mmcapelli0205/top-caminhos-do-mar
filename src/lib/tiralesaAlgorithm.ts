import type { Participante, Familia } from "@/hooks/useParticipantes";

export interface ZiplinePair {
  familiaId: number;
  participante1: Participante;
  participante2: Participante | null; // null = solo
  peso1: number;
  peso2: number | null;
  pesoTotal: number;
  ordem: number;
}

export interface IneligibleEntry {
  familiaId: number;
  participante: Participante;
  motivo: string;
}

export interface ZiplineResult {
  pairs: ZiplinePair[];
  ineligible: IneligibleEntry[];
}

export function generateZiplinePairs(
  familias: Familia[],
  participantes: Participante[]
): ZiplineResult {
  const allPairs: ZiplinePair[] = [];
  const allIneligible: IneligibleEntry[] = [];

  for (const familia of familias) {
    const membros = participantes.filter((p) => p.familia_id === familia.id);

    const aptos: Participante[] = [];

    for (const m of membros) {
      if (m.peso == null || m.peso <= 0) {
        // sem peso registrado — ignorar silenciosamente
        continue;
      }
      if (m.peso > 120) {
        allIneligible.push({
          familiaId: familia.id,
          participante: m,
          motivo: "Acima do limite individual (120kg)",
        });
      } else {
        aptos.push(m);
      }
    }

    // Ordenar por peso decrescente
    aptos.sort((a, b) => (b.peso ?? 0) - (a.peso ?? 0));

    let pairs = formPairs(aptos, familia.id);

    // Validar e tentar reorganizar se alguma dupla > 160kg
    pairs = validateAndReorganize(pairs, aptos, familia.id);

    allPairs.push(...pairs);
  }

  return { pairs: allPairs, ineligible: allIneligible };
}

function formPairs(aptos: Participante[], familiaId: number): ZiplinePair[] {
  const pairs: ZiplinePair[] = [];
  const used = new Set<string>();
  let ordem = 1;

  let left = 0;
  let right = aptos.length - 1;

  while (left < right) {
    const p1 = aptos[left];
    const p2 = aptos[right];
    const peso1 = p1.peso ?? 0;
    const peso2 = p2.peso ?? 0;

    pairs.push({
      familiaId,
      participante1: p1,
      participante2: p2,
      peso1,
      peso2,
      pesoTotal: peso1 + peso2,
      ordem: ordem++,
    });

    used.add(p1.id);
    used.add(p2.id);
    left++;
    right--;
  }

  // Solo (ímpar)
  if (left === right) {
    const solo = aptos[left];
    pairs.push({
      familiaId,
      participante1: solo,
      participante2: null,
      peso1: solo.peso ?? 0,
      peso2: null,
      pesoTotal: solo.peso ?? 0,
      ordem: ordem++,
    });
  }

  return pairs;
}

function validateAndReorganize(
  pairs: ZiplinePair[],
  aptos: Participante[],
  familiaId: number
): ZiplinePair[] {
  const overweight = pairs.some((p) => p.participante2 && p.pesoTotal > 170);

  if (!overweight) return pairs;

  // Tentar reorganizar: ordenar por peso e tentar combinações diferentes
  // Estratégia: tentar adjacentes em vez de extremos
  const duplaAptos = aptos.filter((a) => a.peso != null && a.peso <= 120);
  duplaAptos.sort((a, b) => (a.peso ?? 0) - (b.peso ?? 0));

  const newPairs: ZiplinePair[] = [];
  const usedIds = new Set<string>();
  let ordem = 1;

  // Greedy: para cada pessoa, encontrar o parceiro mais pesado que ainda caiba
  for (let i = 0; i < duplaAptos.length; i++) {
    if (usedIds.has(duplaAptos[i].id)) continue;

    let bestJ = -1;
    let bestTotal = 0;

    for (let j = duplaAptos.length - 1; j > i; j--) {
      if (usedIds.has(duplaAptos[j].id)) continue;
      const total = (duplaAptos[i].peso ?? 0) + (duplaAptos[j].peso ?? 0);
      if (total <= 170) {
        bestJ = j;
        bestTotal = total;
        break;
      }
    }

    if (bestJ !== -1) {
      usedIds.add(duplaAptos[i].id);
      usedIds.add(duplaAptos[bestJ].id);
      newPairs.push({
        familiaId,
        participante1: duplaAptos[bestJ],
        participante2: duplaAptos[i],
        peso1: duplaAptos[bestJ].peso ?? 0,
        peso2: duplaAptos[i].peso ?? 0,
        pesoTotal: bestTotal,
        ordem: ordem++,
      });
    }
  }

  // Solos — quem não foi pareado
  for (const p of duplaAptos) {
    if (!usedIds.has(p.id)) {
      newPairs.push({
        familiaId,
        participante1: p,
        participante2: null,
        peso1: p.peso ?? 0,
        peso2: null,
        pesoTotal: p.peso ?? 0,
        ordem: ordem++,
      });
    }
  }

  return newPairs;
}
