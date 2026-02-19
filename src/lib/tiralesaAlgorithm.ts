import type { Participante, Familia } from "@/hooks/useParticipantes";

export interface ZiplinePair {
  grupoIdx: number; // índice do grupo (0-based)
  familiaId: number; // família do participante1 (para display)
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
  grupos: number[][]; // grupos efetivos usados
}

/**
 * Gera duplas de tirolesa.
 *
 * @param familias       Lista de famílias
 * @param participantes  Lista de participantes
 * @param grupos         Array de arrays de familia_id. Ex: [[1,4,7],[2,3]].
 *                       Se vazio, cada família forma seu próprio grupo.
 * @param modo           "simulacao" = todos aptos por peso;
 *                       "oficial"   = apenas aptos por peso E com termo aceito
 * @param termosAceitos  Set de participante_id com status='aceito' (só relevante no modo oficial)
 */
export function generateZiplinePairs(
  familias: Familia[],
  participantes: Participante[],
  grupos: number[][] = [],
  modo: "simulacao" | "oficial" = "simulacao",
  termosAceitos: Set<string> = new Set()
): ZiplineResult {
  const allPairs: ZiplinePair[] = [];
  const allIneligible: IneligibleEntry[] = [];

  // ----- Normalizar grupos -----
  // Se vazio → cada família é seu próprio grupo
  let gruposEfetivos: number[][];
  if (grupos.length === 0) {
    gruposEfetivos = familias.map((f) => [f.id]);
  } else {
    // Remover duplicatas: uma família só pode aparecer no primeiro grupo que a contém
    const familiasUsadas = new Set<number>();
    gruposEfetivos = grupos
      .map((g) => {
        const unicas = g.filter((fid) => !familiasUsadas.has(fid));
        unicas.forEach((fid) => familiasUsadas.add(fid));
        return unicas;
      })
      .filter((g) => g.length > 0);

    // Famílias não incluídas em nenhum grupo → grupo individual
    familias.forEach((f) => {
      if (!familiasUsadas.has(f.id)) {
        gruposEfetivos.push([f.id]);
      }
    });
  }

  // Set global para garantir que nenhum participante aparece em mais de uma dupla
  const globalUsed = new Set<string>();

  gruposEfetivos.forEach((grupoFamilyIds, grupoIdx) => {
    // Pegar todos os participantes das famílias deste grupo
    const membros = participantes.filter((p) =>
      p.familia_id != null && grupoFamilyIds.includes(p.familia_id)
    );

    const aptos: Participante[] = [];

    for (const m of membros) {
      if (globalUsed.has(m.id)) continue; // segurança extra

      if (m.peso == null || m.peso <= 0) {
        // sem peso registrado — ignorar silenciosamente
        continue;
      }

      // Filtro por peso individual
      if (m.peso > 120) {
        // Encontrar a família do participante para o ineligible
        const famId = m.familia_id ?? grupoFamilyIds[0];
        allIneligible.push({
          familiaId: famId,
          participante: m,
          motivo: "Acima do limite individual (120kg)",
        });
        continue;
      }

      // Filtro de modo oficial: exige termo aceito
      if (modo === "oficial" && !termosAceitos.has(m.id)) {
        continue;
      }

      aptos.push(m);
    }

    // Ordenar por peso decrescente para o algoritmo
    aptos.sort((a, b) => (b.peso ?? 0) - (a.peso ?? 0));

    // Formar duplas respeitando o globalUsed
    let pairs = formPairs(aptos, grupoIdx, globalUsed);

    // Validar e reorganizar se houver dupla > 170kg
    pairs = validateAndReorganize(pairs, aptos, grupoIdx, globalUsed);

    // Marcar todos os participantes das duplas como usados
    pairs.forEach((p) => {
      globalUsed.add(p.participante1.id);
      if (p.participante2) globalUsed.add(p.participante2.id);
    });

    allPairs.push(...pairs);
  });

  return { pairs: allPairs, ineligible: allIneligible, grupos: gruposEfetivos };
}

function formPairs(
  aptos: Participante[],
  grupoIdx: number,
  globalUsed: Set<string>
): ZiplinePair[] {
  const pairs: ZiplinePair[] = [];
  // Filtrar apenas os não usados (no momento da chamada)
  const disponiveis = aptos.filter((p) => !globalUsed.has(p.id));

  let left = 0;
  let right = disponiveis.length - 1;
  let ordem = 1;

  while (left < right) {
    const p1 = disponiveis[left];
    const p2 = disponiveis[right];
    const peso1 = p1.peso ?? 0;
    const peso2 = p2.peso ?? 0;

    pairs.push({
      grupoIdx,
      familiaId: p1.familia_id ?? 0,
      participante1: p1,
      participante2: p2,
      peso1,
      peso2,
      pesoTotal: peso1 + peso2,
      ordem: ordem++,
    });

    left++;
    right--;
  }

  // Solo (ímpar)
  if (left === right) {
    const solo = disponiveis[left];
    pairs.push({
      grupoIdx,
      familiaId: solo.familia_id ?? 0,
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
  grupoIdx: number,
  globalUsed: Set<string>
): ZiplinePair[] {
  const overweight = pairs.some((p) => p.participante2 && p.pesoTotal > 170);

  if (!overweight) return pairs;

  // Estratégia greedy: ordenar crescente e parear mais leve com mais pesado que caiba
  const disponiveis = aptos.filter((p) => !globalUsed.has(p.id));
  const sorted = [...disponiveis].sort((a, b) => (a.peso ?? 0) - (b.peso ?? 0));

  const newPairs: ZiplinePair[] = [];
  const localUsed = new Set<string>();
  let ordem = 1;

  for (let i = 0; i < sorted.length; i++) {
    if (localUsed.has(sorted[i].id)) continue;

    let bestJ = -1;
    let bestTotal = 0;

    for (let j = sorted.length - 1; j > i; j--) {
      if (localUsed.has(sorted[j].id)) continue;
      const total = (sorted[i].peso ?? 0) + (sorted[j].peso ?? 0);
      if (total <= 170) {
        bestJ = j;
        bestTotal = total;
        break;
      }
    }

    if (bestJ !== -1) {
      localUsed.add(sorted[i].id);
      localUsed.add(sorted[bestJ].id);
      newPairs.push({
        grupoIdx,
        familiaId: sorted[bestJ].familia_id ?? 0,
        participante1: sorted[bestJ],
        participante2: sorted[i],
        peso1: sorted[bestJ].peso ?? 0,
        peso2: sorted[i].peso ?? 0,
        pesoTotal: bestTotal,
        ordem: ordem++,
      });
    }
  }

  // Solos — quem não foi pareado
  for (const p of sorted) {
    if (!localUsed.has(p.id)) {
      newPairs.push({
        grupoIdx,
        familiaId: p.familia_id ?? 0,
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
