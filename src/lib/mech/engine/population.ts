/**
 * =========================================================================
 * Population generation — the INVERTED pipeline
 * =========================================================================
 *
 * The ID is an OUTPUT. We do NOT decode "SSA-001" into a design; we generate
 * a hundred independent designs, MEASURE each, and only then hand out IDs:
 *
 *   1. for each band, build a candidate pool (briefs aimed at that band),
 *      run each through the full engine, and measure its silhouette
 *   2. keep the candidates that actually MEASURE into the band
 *   3. farthest-point-sample 25 of them for maximal spread in the
 *      silhouette / edge / decoration / layer axes (+ a philosophy-spread
 *      nudge) — this is the diversity pressure
 *   4. rank those 25 by measured decoration weight, ascending
 *   5. assign letters + serials in that order: least-decorated SS kit is
 *      "SSA-001", the next "SSB-002", and so on
 *
 * The result is memoised: `getPopulation()` builds it once.
 */

import { makeBrief } from "./brief";
import { classifyBand, assignId } from "./classify";
import type { Band, Brief, MetricVector } from "./types";

const BANDS: Band[] = ["SS", "SR", "RS", "RR"];
const PER_BAND = 25;
const POOL_PER_BAND = 44;

export interface PopulationEntry {
  id: string;
  seed: string;
  brief: Brief;
  metrics: MetricVector;
  band: Band;
  /** 0 = least decorated in the band = letter A = serial = band base */
  rankInBand: number;
}

export interface Population {
  entries: PopulationEntry[];
  byId: Record<string, PopulationEntry>;
  bySeed: Record<string, PopulationEntry>;
  /** how many candidates were built and measured to fill the 100 slots */
  poolSize: number;
}

/** What `designKit` must return for the population to measure it. */
export type MeasuredKit = { brief: Brief; metrics: MetricVector; band?: Band };
export type DesignKitFn = (brief: Brief) => MeasuredKit;

interface Cand {
  seed: string;
  brief: Brief;
  metrics: MetricVector;
}

/** Distance in the axes that decide "is this a meaningfully different design". */
function metricDist(a: MetricVector, b: MetricVector): number {
  const sq = (k: keyof MetricVector, w: number) => ((a[k] - b[k]) * w) ** 2;
  return Math.sqrt(
    sq("silhouetteStraightness", 1.1) +
      sq("edgeSharpness", 1.1) +
      sq("decorationWeight", 1.3) +
      sq("layerDepth", 0.12) +
      sq("compactness", 0.5) +
      sq("symmetryError", 0.3),
  );
}

function candDist(a: Cand, b: Cand): number {
  const philBonus = a.brief.philosophy === b.brief.philosophy ? 0 : 0.14;
  const roleBonus = a.brief.role === b.brief.role ? 0 : 0.05;
  return metricDist(a.metrics, b.metrics) + philBonus + roleBonus;
}

/** Greedy farthest-point sampling: maximal spread over the candidate pool. */
function farthestPointSample(pool: Cand[], n: number): Cand[] {
  if (pool.length <= n) return [...pool];

  // start from the two most distant candidates
  let seedA = 0;
  let seedB = 1;
  let bestD = -1;
  for (let i = 0; i < pool.length; i++) {
    for (let j = i + 1; j < pool.length; j++) {
      const d = candDist(pool[i]!, pool[j]!);
      if (d > bestD) {
        bestD = d;
        seedA = i;
        seedB = j;
      }
    }
  }
  const picked = [seedA, seedB];
  const inSet = new Set(picked);
  const minD = pool.map((p, i) =>
    inSet.has(i) ? 0 : Math.min(candDist(p, pool[seedA]!), candDist(p, pool[seedB]!)),
  );

  while (picked.length < n) {
    let far = -1;
    let farD = -1;
    for (let i = 0; i < pool.length; i++) {
      if (inSet.has(i)) continue;
      if (minD[i]! > farD) {
        farD = minD[i]!;
        far = i;
      }
    }
    if (far < 0) break;
    picked.push(far);
    inSet.add(far);
    for (let i = 0; i < pool.length; i++) {
      if (!inSet.has(i)) minD[i] = Math.min(minD[i]!, candDist(pool[i]!, pool[far]!));
    }
  }
  return picked.map((i) => pool[i]!);
}

export function generatePopulation(designKit: DesignKitFn): Population {
  const entries: PopulationEntry[] = [];
  let poolSize = 0;

  for (const band of BANDS) {
    const all: Cand[] = [];
    const inBand: Cand[] = [];
    for (let i = 0; i < POOL_PER_BAND; i++) {
      const seed = `pop/${band}/${i}`;
      const brief = makeBrief(seed, band);
      const kit = designKit(brief);
      const c: Cand = { seed, brief, metrics: kit.metrics };
      all.push(c);
      if ((kit.band ?? classifyBand(kit.metrics)) === band) inBand.push(c);
    }
    poolSize += all.length;

    // prefer candidates that measured into the band; fall back to the full
    // pool if the grammar drifted too many out of it
    const usable = inBand.length >= PER_BAND ? inBand : all;
    const picked = farthestPointSample(usable, PER_BAND);

    // INVERTED ID assignment: rank by measured decoration, ascending
    picked.sort((a, b) => a.metrics.decorationWeight - b.metrics.decorationWeight);
    picked.forEach((c, rank) => {
      entries.push({
        id: assignId(band, rank),
        seed: c.seed,
        brief: c.brief,
        metrics: c.metrics,
        band,
        rankInBand: rank,
      });
    });
  }

  const serial = (id: string) => parseInt(id.slice(id.indexOf("-") + 1), 10) || 0;
  entries.sort((a, b) => serial(a.id) - serial(b.id));
  const byId: Record<string, PopulationEntry> = {};
  const bySeed: Record<string, PopulationEntry> = {};
  for (const e of entries) {
    byId[e.id] = e;
    bySeed[e.seed] = e;
  }
  return { entries, byId, bySeed, poolSize };
}
