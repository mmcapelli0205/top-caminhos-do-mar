import type { Participante } from "@/hooks/useParticipantes";

export function calcAge(dob: string | null): number {
  if (!dob) return 0;
  const birth = new Date(dob);
  if (isNaN(birth.getTime())) return 0;
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

interface ParticipantWithAge extends Participante {
  _age: number;
}

export interface FamilyResult {
  families: string[][]; // array of N arrays of participant IDs
  separationPairs: [string, string][]; // pairs that must be separated
}

export function distributeParticipants(
  participants: Participante[],
  numFamilias: number
): FamilyResult {
  const families: string[][] = Array.from({ length: numFamilias }, () => []);
  const assigned = new Set<string>();
  const separationPairs: [string, string][] = [];

  // Enrich with age
  const enriched: ParticipantWithAge[] = participants.map((p) => ({
    ...p,
    _age: calcAge(p.data_nascimento),
  }));

  const byId = new Map<string, ParticipantWithAge>();
  enriched.forEach((p) => byId.set(p.id, p));

  // Helper: find family with fewest members
  const smallestFamilyIndex = (): number => {
    let minIdx = 0;
    for (let i = 1; i < numFamilias; i++) {
      if (families[i].length < families[minIdx].length) minIdx = i;
    }
    return minIdx;
  };

  // Helper: count members in a family matching a predicate
  const countInFamily = (fi: number, pred: (p: ParticipantWithAge) => boolean): number => {
    return families[fi].filter((id) => {
      const p = byId.get(id);
      return p && pred(p);
    }).length;
  };

  // Helper: round-robin distribution with optional max per family predicate
  const roundRobinDistribute = (
    ids: string[],
    maxPerFamily?: (fi: number) => boolean // returns true if family can accept
  ) => {
    let fi = smallestFamilyIndex();
    for (const id of ids) {
      if (assigned.has(id)) continue;
      let placed = false;
      for (let attempt = 0; attempt < numFamilias; attempt++) {
        const candidate = (fi + attempt) % numFamilias;
        if (!maxPerFamily || maxPerFamily(candidate)) {
          families[candidate].push(id);
          assigned.add(id);
          fi = (candidate + 1) % numFamilias;
          placed = true;
          break;
        }
      }
      // If all families are "full" by the predicate, place in smallest anyway
      if (!placed) {
        const idx = smallestFamilyIndex();
        families[idx].push(id);
        assigned.add(id);
      }
    }
  };

  // --- RULE 1: Separation (amigo_parente) ---
  const nameToId = new Map<string, string>();
  enriched.forEach((p) => nameToId.set(normalize(p.nome), p.id));

  for (const p of enriched) {
    if (!p.amigo_parente) continue;
    // Parse comma/semicolon separated names
    const names = p.amigo_parente
      .split(/[,;]/)
      .map((n) => normalize(n))
      .filter(Boolean);

    for (const rawName of names) {
      const matchId = nameToId.get(rawName);
      if (matchId && matchId !== p.id) {
        // Check if pair already recorded
        const exists = separationPairs.some(
          ([a, b]) =>
            (a === p.id && b === matchId) || (a === matchId && b === p.id)
        );
        if (!exists) {
          separationPairs.push([p.id, matchId]);
        }
      }
    }
  }

  // Place separation pairs at maximum distance
  for (const [idA, idB] of separationPairs) {
    if (assigned.has(idA) || assigned.has(idB)) continue;
    const idxA = smallestFamilyIndex();
    families[idxA].push(idA);
    assigned.add(idA);
    // Place B at maximum distance
    const idxB = (idxA + Math.floor(numFamilias / 2)) % numFamilias;
    families[idxB].push(idB);
    assigned.add(idB);
  }
  // Place any remaining from separation pairs that weren't in a mutual pair
  for (const [idA, idB] of separationPairs) {
    for (const id of [idA, idB]) {
      if (!assigned.has(id)) {
        const idx = smallestFamilyIndex();
        families[idx].push(id);
        assigned.add(id);
      }
    }
  }

  // --- RULE 2: Age 60+ ---
  const seniors = enriched
    .filter((p) => !assigned.has(p.id) && p._age >= 60)
    .map((p) => p.id);
  roundRobinDistribute(seniors);

  // --- RULE 3: Health conditions ---
  const health = enriched
    .filter(
      (p) =>
        !assigned.has(p.id) &&
        p.doenca &&
        p.doenca.trim() !== ""
    )
    .map((p) => p.id);
  roundRobinDistribute(health, (fi) => {
    return countInFamily(fi, (pp) => !!pp.doenca && pp.doenca.trim() !== "") < 2;
  });

  // --- RULE 4: Weight > 100kg ---
  const heavy = enriched
    .filter(
      (p) => !assigned.has(p.id) && p.peso != null && p.peso > 100
    )
    .map((p) => p.id);
  roundRobinDistribute(heavy, (fi) => {
    return countInFamily(fi, (pp) => pp.peso != null && pp.peso > 100) < 2;
  });

  // --- RULE 5: Fitness <= 2 ---
  const lowFit = enriched
    .filter(
      (p) =>
        !assigned.has(p.id) &&
        p.condicionamento != null &&
        p.condicionamento <= 2
    )
    .map((p) => p.id);
  roundRobinDistribute(lowFit, (fi) => {
    return (
      countInFamily(
        fi,
        (pp) => pp.condicionamento != null && pp.condicionamento <= 2
      ) < 2
    );
  });

  // --- RULE 6: Remaining ---
  const remaining = enriched
    .filter((p) => !assigned.has(p.id))
    .sort((a, b) => b._age - a._age)
    .map((p) => p.id);
  roundRobinDistribute(remaining);

  return { families, separationPairs };
}

// Validation helpers
export function checkSeparationViolations(
  families: string[][],
  separationPairs: [string, string][]
): Map<number, [string, string][]> {
  const violations = new Map<number, [string, string][]>();
  for (let fi = 0; fi < families.length; fi++) {
    const memberSet = new Set(families[fi]);
    for (const [a, b] of separationPairs) {
      if (memberSet.has(a) && memberSet.has(b)) {
        if (!violations.has(fi)) violations.set(fi, []);
        violations.get(fi)!.push([a, b]);
      }
    }
  }
  return violations;
}
