import { STYLES, type StyleCode } from "./codes";

export type Quad = "SS" | "SR" | "RS" | "RR";

export type HelmArch =
  | "blunt"
  | "hex"
  | "wedge"
  | "bucket"
  | "shelf"
  | "diamond"
  | "split"
  | "trap"
  | "snout"
  | "hood"
  | "step"
  | "gem"
  | "anvil"
  | "arrow"
  | "beak"
  | "clam"
  | "plow"
  | "tower"
  | "mask"
  | "cap"
  | "ram"
  | "ridge"
  | "facet"
  | "hawk"
  | "cage";

export type VisorArch =
  | "slit"
  | "bar"
  | "thin"
  | "recess"
  | "dual"
  | "tee"
  | "mono"
  | "notch"
  | "plus"
  | "window"
  | "penta"
  | "strip"
  | "dome"
  | "visorV"
  | "visorX"
  | "diamond"
  | "visorHex"
  | "visorBar2"
  | "visorCrest"
  | "visorSplit"
  | "visorRing"
  | "visorGem"
  | "visorMask"
  | "visorArrow"
  | "visorWide";

export type CrestArch =
  | "none"
  | "fin"
  | "twin"
  | "mast"
  | "crown"
  | "halo"
  | "wing"
  | "teeth"
  | "cloak"
  | "blade"
  | "spike"
  | "horn"
  | "plow"
  | "ram";

export type ChestArch =
  | "plow"
  | "wedge"
  | "hex"
  | "rib"
  | "slim"
  | "bulk"
  | "shield"
  | "cage"
  | "core"
  | "barrel"
  | "slab"
  | "peak"
  | "fortress"
  | "reactor"
  | "grate"
  | "crystal"
  | "hump"
  | "delta"
  | "lattice"
  | "boiler"
  | "armature"
  | "altar"
  | "carapace"
  | "turbine"
  | "wingbox";

export type PackArch =
  | "box"
  | "spine"
  | "mast"
  | "twin"
  | "wing"
  | "tank"
  | "shell"
  | "halo"
  | "brick"
  | "fin"
  | "rack"
  | "plate"
  | "booster"
  | "scythe"
  | "ring"
  | "pod"
  | "sail"
  | "turret"
  | "canopy"
  | "claw"
  | "fold"
  | "disc"
  | "arch"
  | "stack"
  | "crystal";

export type LimbArch =
  | "block"
  | "plate"
  | "frame"
  | "pipe"
  | "slab"
  | "beam"
  | "hinge"
  | "boxer"
  | "post"
  | "rail"
  | "brick"
  | "channel"
  | "blade"
  | "capsule"
  | "claw"
  | "piston"
  | "armor"
  | "spike"
  | "ribbon"
  | "tanked"
  | "lattice"
  | "cannon"
  | "pauldron"
  | "ornate"
  | "talon";

export type BodyCanon = "soldier" | "brute" | "stalker" | "heavy" | "runner" | "totem" | "drone" | "knight";

export type Recipe = {
  id: string;
  code: StyleCode;
  quad: Quad;
  rank: number;
  density: number;
  ornate: boolean;
  helm: HelmArch;
  visor: VisorArch;
  crest: CrestArch;
  chest: ChestArch;
  pack: PackArch;
  limb: LimbArch;
  canon: BodyCanon;
  curve: number;
  segs: number;
  greeble: number;
  height: number;
  shoulder: number;
  hip: number;
  head: number;
  thick: number;
  torso: number;
  palette: { prim: string; sec: string; acc: string; trim: string };
};

const CANONS: BodyCanon[] = ["soldier", "brute", "stalker", "heavy", "runner", "totem", "drone", "knight"];

const HELMS_SPARSE: HelmArch[] = [
  "blunt",
  "hex",
  "wedge",
  "bucket",
  "shelf",
  "diamond",
  "split",
  "trap",
  "snout",
  "hood",
  "step",
  "gem",
];
const HELMS_ORNATE: HelmArch[] = [
  "anvil",
  "arrow",
  "beak",
  "clam",
  "plow",
  "tower",
  "mask",
  "cap",
  "ram",
  "ridge",
  "facet",
  "hawk",
  "cage",
];

const VISORS_SPARSE: VisorArch[] = [
  "slit",
  "bar",
  "thin",
  "recess",
  "dual",
  "tee",
  "mono",
  "notch",
  "plus",
  "window",
  "penta",
  "strip",
];
const VISORS_ORNATE: VisorArch[] = [
  "dome",
  "visorV",
  "visorX",
  "diamond",
  "visorHex",
  "visorBar2",
  "visorCrest",
  "visorSplit",
  "visorRing",
  "visorGem",
  "visorMask",
  "visorArrow",
  "visorWide",
];

const CRESTS: CrestArch[] = [
  "fin",
  "twin",
  "mast",
  "crown",
  "halo",
  "wing",
  "teeth",
  "cloak",
  "blade",
  "spike",
  "horn",
  "plow",
  "ram",
];

const CHESTS_SPARSE: ChestArch[] = [
  "plow",
  "wedge",
  "hex",
  "rib",
  "slim",
  "bulk",
  "shield",
  "cage",
  "core",
  "barrel",
  "slab",
  "peak",
];
const CHESTS_ORNATE: ChestArch[] = [
  "fortress",
  "reactor",
  "grate",
  "crystal",
  "hump",
  "delta",
  "lattice",
  "boiler",
  "armature",
  "altar",
  "carapace",
  "turbine",
  "wingbox",
];

const PACKS_SPARSE: PackArch[] = [
  "box",
  "spine",
  "mast",
  "twin",
  "wing",
  "tank",
  "shell",
  "halo",
  "brick",
  "fin",
  "rack",
  "plate",
];
const PACKS_ORNATE: PackArch[] = [
  "booster",
  "scythe",
  "ring",
  "pod",
  "sail",
  "turret",
  "canopy",
  "claw",
  "fold",
  "disc",
  "arch",
  "stack",
  "crystal",
];

const LIMBS_SPARSE: LimbArch[] = [
  "block",
  "plate",
  "frame",
  "pipe",
  "slab",
  "beam",
  "hinge",
  "boxer",
  "post",
  "rail",
  "brick",
  "channel",
];
const LIMBS_ORNATE: LimbArch[] = [
  "blade",
  "capsule",
  "claw",
  "piston",
  "armor",
  "spike",
  "ribbon",
  "tanked",
  "lattice",
  "cannon",
  "pauldron",
  "ornate",
  "talon",
];

function hsl(h: number, s: number, l: number): string {
  const a = s / 100;
  const k = (n: number) => (n + h / 30) % 12;
  const f = (n: number) =>
    l / 100 - a * Math.min(l / 100, 1 - l / 100) * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  const to = (x: number) => Math.round(255 * x).toString(16).padStart(2, "0");
  return `#${to(f(0))}${to(f(8))}${to(f(4))}`;
}

function paletteFor(code: StyleCode, quad: Quad) {
  const shift = (code.serial * 9.7) % 360;
  if (quad === "SS") {
    return {
      prim: hsl((38 + shift * 0.08) % 360, 8, 84 - code.complexity * 0.5),
      sec: hsl((220 + shift * 0.15) % 360, 12, 20),
      acc: hsl((6 + shift * 0.4) % 360, 62, 42),
      trim: hsl((42 + shift * 0.2) % 360, 48, 56),
    };
  }
  if (quad === "SR") {
    return {
      prim: hsl((48 + shift * 0.1) % 360, 10, 80),
      sec: hsl((210 + shift * 0.18) % 360, 28, 28),
      acc: hsl((8 + shift * 0.3) % 360, 55, 40),
      trim: hsl((40 + shift * 0.2) % 360, 38, 58),
    };
  }
  if (quad === "RS") {
    return {
      prim: hsl((300 + shift * 0.08) % 360, 8, 82),
      sec: hsl((320 + shift * 0.15) % 360, 16, 22),
      acc: hsl((16 + shift * 0.4) % 360, 58, 46),
      trim: hsl((200 + shift * 0.2) % 360, 18, 60),
    };
  }
  return {
    prim: hsl((28 + shift * 0.1) % 360, 14, 78),
    sec: hsl((210 + shift * 0.12) % 360, 14, 28),
    acc: hsl((200 + shift * 0.35) % 360, 40, 42),
    trim: hsl((36 + shift * 0.2) % 360, 22, 64),
  };
}

function segsFor(quad: Quad, density: number): number {
  if (quad === "SS") return 4 + Math.floor(density / 3);
  if (quad === "SR") return 8 + density;
  if (quad === "RS") return 10 + density;
  return 16 + density;
}

function curveFor(quad: Quad): number {
  if (quad === "SS") return 0;
  if (quad === "SR") return 0.42;
  if (quad === "RS") return 0.06;
  return 0.86;
}

function canonFor(quad: Quad, rank: number): BodyCanon {
  const off = quad === "SS" ? 0 : quad === "SR" ? 2 : quad === "RS" ? 4 : 6;
  return CANONS[(rank + off) % CANONS.length]!;
}

function buildRecipe(code: StyleCode): Recipe {
  const quad = `${code.major}${code.form}` as Quad;
  const rank = code.complexity;
  const ornate = rank >= 12;
  const density = ornate ? Math.min(12, rank - 11) : rank + 1;
  const oi = rank - 12;
  const canon = canonFor(quad, rank);
  return {
    id: code.id,
    code,
    quad,
    rank,
    density,
    ornate,
    helm: ornate ? HELMS_ORNATE[oi]! : HELMS_SPARSE[rank]!,
    visor: ornate ? VISORS_ORNATE[oi]! : VISORS_SPARSE[rank]!,
    crest: ornate ? CRESTS[oi]! : "none",
    chest: ornate ? CHESTS_ORNATE[oi]! : CHESTS_SPARSE[rank]!,
    pack: ornate ? PACKS_ORNATE[oi]! : PACKS_SPARSE[rank]!,
    limb: ornate ? LIMBS_ORNATE[oi]! : LIMBS_SPARSE[rank]!,
    canon,
    curve: curveFor(quad),
    segs: segsFor(quad, density),
    greeble: density,
    height: canon === "stalker" || canon === "runner" ? 1.04 : canon === "brute" || canon === "heavy" ? 0.92 : 0.98,
    shoulder: canon === "heavy" || canon === "brute" ? 1.06 : canon === "stalker" ? 0.88 : 0.96,
    hip: canon === "heavy" ? 1.04 : canon === "runner" ? 0.9 : 0.96,
    head: 0.96,
    thick: canon === "heavy" || canon === "brute" ? 1.05 : canon === "drone" ? 0.88 : 0.96,
    torso: canon === "heavy" ? 1.06 : canon === "stalker" ? 0.9 : 0.98,
    palette: paletteFor(code, quad),
  };
}

export const RECIPES: Recipe[] = STYLES.map(buildRecipe);
export const RECIPE_BY_ID: Record<string, Recipe> = Object.fromEntries(RECIPES.map((r) => [r.id, r]));

export function getRecipe(id: string): Recipe {
  return RECIPE_BY_ID[id] ?? RECIPES[0]!;
}
