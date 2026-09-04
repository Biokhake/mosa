/**
 * Measured references, one record per kit.
 *
 * These are read off a front-view thumbnail: landmark heights and widths as
 * fractions of the figure's height. Depths are the shared priors from
 * `types.ts`, adjusted only where a front view actually hints at them.
 *
 * Study measurements. Ratios and landmark positions, not artwork.
 */

import type { RefMeasure } from "./types";
import { DEFAULT_DEPTHS } from "./types";

/**
 * Read off front-view lineart. Seven-and-a-fifth heads; legs are half the
 * total height; shoulder span is about three and a half head widths, which is
 * the ratio the earlier hand-built version got worst (it was running at five).
 */
const RX78: RefMeasure = {
  key: "RX-78",
  source: "front-view lineart; landmark ratios, depths from the shared priors",
  height: 1.88,
  groundY: 0.02,
  y: {
    sole: 0,
    ankle: 0.075,
    kneeLow: 0.245,
    knee: 0.28,
    crotch: 0.46,
    hip: 0.5,
    waist: 0.575,
    chestLow: 0.62,
    chestHigh: 0.78,
    shoulder: 0.755,
    neck: 0.8,
    chin: 0.861,
    crown: 1,
    crest: 1.06,
    elbow: 0.6,
    wrist: 0.44,
  },
  w: {
    head: 0.104,
    shoulderSpan: 0.364,
    shoulderPivot: 0.22,
    chest: 0.24,
    waist: 0.13,
    hip: 0.28,
    hipPivot: 0.115,
    thigh: 0.075,
    shin: 0.08,
    foot: 0.085,
    upperArm: 0.06,
    forearm: 0.065,
  },
  d: { ...DEFAULT_DEPTHS, foot: 0.125, chest: 0.115 },
};

export const REF_MEASURES: Record<string, RefMeasure> = {
  [RX78.key]: RX78,
};

export function refMeasureFor(key: string): RefMeasure | null {
  return REF_MEASURES[(key || "").trim().toUpperCase()] ?? null;
}
