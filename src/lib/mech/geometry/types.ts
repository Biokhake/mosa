import type { MatKey } from "../palette";

export type SpecType =
  | "box"
  | "cyl"
  | "sph"
  | "cone"
  | "torus"
  | "tetra"
  | "octa"
  | "dodeca"
  | "icosa"
  | "capsule"
  | "knot"
  | "hemi"
  | "ring"
  | "wedge"
  | "trap"
  | "cowl"
  | "claw"
  | "heel"
  | "hover"
  | "wing"
  | "layer";

export interface Spec {
  t: SpecType;
  m: MatKey;
  s: [number, number, number];
  p: [number, number, number];
  r?: [number, number, number];
  n?: number;
  geo?: import("three").BufferGeometry;
}

export type Vec3 = [number, number, number];
