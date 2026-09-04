import * as THREE from "three";
import { getRecipe } from "./recipes";

export type MatKey =
  | "prim"
  | "sec"
  | "acc"
  | "trim"
  | "dark"
  | "metal"
  | "visor"
  | "glow"
  | "joint";

export type Palette = Record<MatKey, THREE.MeshStandardMaterial>;

const shared = new Map<string, Palette>();
const lineMatDark = new THREE.LineBasicMaterial({ color: 0x1a1a1e, transparent: true, opacity: 0.35 });
const lineMatLight = new THREE.LineBasicMaterial({ color: 0x2a2a30, transparent: true, opacity: 0.28 });

/** Bare mechanical surfaces — frame, mechanism, polished metal. */
function std(color: string, extra: ConstructorParameters<typeof THREE.MeshStandardMaterial>[0] = {}) {
  return new THREE.MeshStandardMaterial({
    color,
    metalness: 0.34,
    roughness: 0.4,
    envMapIntensity: 0.85,
    side: THREE.FrontSide,
    ...extra,
  });
}

/**
 * Painted armour. A clearcoat lobe over a fairly matte base is what separates
 * "lacquered kit panel" from "flat CG plastic" — it gives a tight specular
 * highlight that rides the bevels independently of the diffuse colour.
 */
function lacquer(color: string, extra: ConstructorParameters<typeof THREE.MeshPhysicalMaterial>[0] = {}) {
  return new THREE.MeshPhysicalMaterial({
    color,
    metalness: 0.16,
    roughness: 0.46,
    clearcoat: 0.62,
    clearcoatRoughness: 0.24,
    envMapIntensity: 0.8,
    side: THREE.FrontSide,
    ...extra,
  });
}

export function getLineMat(theme: "light" | "dark" = "dark") {
  return theme === "light" ? lineMatLight : lineMatDark;
}

export const DEFAULT_VISOR = "#79d7ff";

export function hexToHsb(hex: string): { h: number; s: number; b: number } {
  const n = hex.replace("#", "");
  if (n.length < 6) return { h: 196, s: 52, b: 100 };
  const r = parseInt(n.slice(0, 2), 16) / 255;
  const g = parseInt(n.slice(2, 4), 16) / 255;
  const bl = parseInt(n.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, bl);
  const min = Math.min(r, g, bl);
  const d = max - min;
  let h = 0;
  if (d !== 0) {
    if (max === r) h = ((g - bl) / d) % 6;
    else if (max === g) h = (bl - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
    if (h < 0) h += 360;
  }
  const s = max === 0 ? 0 : (d / max) * 100;
  return { h, s, b: max * 100 };
}

export function hsbToHex(h: number, s: number, b: number): string {
  const sat = Math.max(0, Math.min(100, s)) / 100;
  const br = Math.max(0, Math.min(100, b)) / 100;
  const hue = ((h % 360) + 360) % 360;
  const c = br * sat;
  const x = c * (1 - Math.abs(((hue / 60) % 2) - 1));
  const m = br - c;
  let r = 0,
    g = 0,
    bl = 0;
  if (hue < 60) [r, g, bl] = [c, x, 0];
  else if (hue < 120) [r, g, bl] = [x, c, 0];
  else if (hue < 180) [r, g, bl] = [0, c, x];
  else if (hue < 240) [r, g, bl] = [0, x, c];
  else if (hue < 300) [r, g, bl] = [x, 0, c];
  else [r, g, bl] = [c, 0, x];
  const to = (v: number) => Math.round((v + m) * 255).toString(16).padStart(2, "0");
  return `#${to(r)}${to(g)}${to(bl)}`;
}

function shade(hex: string, mul: number) {
  const n = hex.replace("#", "");
  if (n.length < 6) return hex;
  const ch = (i: number) =>
    Math.round(Math.max(0, Math.min(255, parseInt(n.slice(i, i + 2), 16) * mul)))
      .toString(16)
      .padStart(2, "0");
  return `#${ch(0)}${ch(2)}${ch(4)}`;
}

export function getPalette(
  family: string,
  paint: string | null,
  visorPaint = false,
  light: string | null = null,
  paint2: string | null = null,
): Palette {
  const rec = getRecipe(family);
  const lightHex = light ?? DEFAULT_VISOR;
  const key = `${rec.id}:${paint ?? "kit"}:${paint2 ?? "kit2"}:${lightHex}:${visorPaint ? "v" : "b"}`;
  const hit = shared.get(key);
  if (hit) return hit;

  const hex = rec.palette;
  const prim = paint ?? hex.prim;
  const sec = paint2 ?? hex.sec;
  const acc = paint2 ?? hex.acc;
  const trim = paint2 ?? hex.trim;
  const dark = paint2 ? shade(paint2, 0.32) : "#2a2c31";
  const metal = paint2 ?? "#8b919a";
  const joint = paint2 ? shade(paint2, 0.42) : "#3d4048";
  const visorHex = visorPaint && paint ? paint : lightHex;
  // Armour roles get the clearcoat treatment; bare mechanical roles stay
  // standard and deliberately MATTE, so the eye separates shell from frame.
  const pal: Palette = {
    prim: lacquer(prim),
    sec: lacquer(sec, { roughness: 0.5, clearcoat: 0.5 }),
    acc: lacquer(acc, { metalness: 0.2, roughness: 0.36, clearcoat: 0.72, clearcoatRoughness: 0.16 }),
    trim: lacquer(trim, { metalness: 0.55, roughness: 0.3, clearcoat: 0.35 }),
    dark: std(dark, { metalness: 0.42, roughness: 0.66, envMapIntensity: 0.7 }),
    metal: std(metal, { metalness: 0.92, roughness: 0.24, envMapIntensity: 1.35 }),
    visor: std(visorHex, {
      metalness: 0.9,
      roughness: 0.07,
      envMapIntensity: 1.5,
      emissive: visorHex,
      emissiveIntensity: 1.5,
    }),
    glow: std(lightHex, {
      metalness: 0.12,
      roughness: 0.2,
      envMapIntensity: 0.6,
      emissive: lightHex,
      emissiveIntensity: 1.9,
    }),
    joint: std(joint, { metalness: 0.72, roughness: 0.38, envMapIntensity: 1.0 }),
  };
  shared.set(key, pal);
  return pal;
}

export function explodeDir(socket: [number, number, number]): [number, number, number] {
  const [x, y, z] = socket;
  const cy = 1.1;
  const dx = x;
  const dy = y - cy;
  const dz = z;
  const len = Math.hypot(dx, dy, dz) || 1;
  return [dx / len, dy / len, dz / len];
}
