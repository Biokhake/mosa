/**
 * Kit identity.
 *
 * This used to generate a hundred IDs from a four-quadrant grammar and hand
 * one to each generated kit. That grammar is not gone — it is EARLY. An ID is
 * meant to be a measured output that ranks a kit among its band-mates, and
 * ranking sixteen kits into a hundred-slot grid would be inventing the ranks.
 *
 * So until the catalogue reaches a hundred entries a kit is called by the
 * reference archetype it was decomposed from, and `codes.ts` is a thin view
 * over that corpus. `StyleCode`'s shape is unchanged so the picker, the
 * recipes and the saved sessions all keep working.
 */

import { REFERENCES, idsAreAssigned, LINEAGES } from "./engine/references";
import type { Lineage } from "./engine/references";

export type SR = "S" | "R";

export type StyleCode = {
  id: string;
  serial: number;
  major: SR;
  form: SR;
  letter: string;
  complexity: number;
  /** display name — the reference this kit was decomposed from */
  name: string;
  lineage: Lineage;
};

const AZ = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

export function lettersWithout(ch: SR): string {
  return AZ.replace(ch, "");
}

export function buildCodes(): StyleCode[] {
  const perLineage: Record<string, number> = {};
  return REFERENCES.map((r, i) => {
    const n = (perLineage[r.lineage] = (perLineage[r.lineage] ?? 0) + 1);
    return {
      id: r.key,
      serial: i + 1,
      major: r.silhouette.angularity >= 0.5 ? "S" : "R",
      form: r.edge,
      letter: AZ[(n - 1) % 26]!,
      // complexity drives the legacy palette/detail ramp; decoration is what
      // that ramp actually meant, so read it straight off the reference
      complexity: Math.round(r.decoration * 25),
      name: r.name,
      lineage: r.lineage,
    };
  });
}

export const STYLES = buildCodes();
export const STYLE_BY_ID = Object.fromEntries(STYLES.map((s) => [s.id, s]));
export const DEFAULT_STYLE = STYLES[0]!.id;

/** Picker filter groups. Lineages while the catalogue is small; bands once IDs exist. */
export const QUAD_RANGES = LINEAGES.map((l) => ({ id: l.id as string, label: l.label }));

export const IDS_ASSIGNED = idsAreAssigned();
