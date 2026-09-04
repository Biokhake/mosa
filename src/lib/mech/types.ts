import { STYLES } from "./codes";

export const FAMILIES = STYLES.map((s) => ({
  id: s.id,
  name: s.id,
  blurb: `${s.major}${s.form}${s.letter}`,
}));

export type FamilyId = string;

export const GROUPS = [
  { id: "head", label: "Head" },
  { id: "torso", label: "Torso" },
  { id: "waist", label: "Waist" },
  { id: "armR", label: "Arm R" },
  { id: "armL", label: "Arm L" },
  { id: "legR", label: "Leg R" },
  { id: "legL", label: "Leg L" },
  { id: "back", label: "Back" },
  { id: "weapon", label: "Weapons" },
  { id: "extra", label: "Extra" },
] as const;

export type GroupId = (typeof GROUPS)[number]["id"];

export type Vec3 = [number, number, number];

export interface SlotDef {
  id: string;
  group: GroupId;
  label: string;
  socket: Vec3;
  kind: "armor" | "weapon" | "extra";
  mirror?: string;
  optional?: boolean;
  defaultVariant: string;
  variants: { id: string; name: string; cls?: string }[];
}

export interface PartTransform {
  px: number;
  py: number;
  pz: number;
  rx: number;
  ry: number;
  rz: number;
  sx: number;
  sy: number;
  sz: number;
}

export interface SlotState extends PartTransform {
  variant: string;
  paint: string | null;
  paint2: string | null;
  visible: boolean;
}

export const IDENTITY: PartTransform = {
  px: 0,
  py: 0,
  pz: 0,
  rx: 0,
  ry: 0,
  rz: 0,
  sx: 1,
  sy: 1,
  sz: 1,
};

export const PAINTS: { id: string | null; name: string; hex: string }[] = [
  { id: null, name: "Kit", hex: "kit" },
  { id: "#e8e6e1", name: "White", hex: "#e8e6e1" },
  { id: "#b42222", name: "Red", hex: "#b42222" },
  { id: "#1f3d73", name: "Blue", hex: "#1f3d73" },
  { id: "#2a2c31", name: "Black", hex: "#2a2c31" },
  { id: "#c5c7cc", name: "Gray", hex: "#c5c7cc" },
  { id: "#3d5c3a", name: "Khaki", hex: "#3d5c3a" },
  { id: "#7a8b9a", name: "Slate", hex: "#7a8b9a" },
  { id: "#b8bcc4", name: "Steel", hex: "#b8bcc4" },
  { id: "#5c1f1f", name: "Crimson", hex: "#5c1f1f" },
];

export const SAVE_VERSION = 10;

export type ThemeMode = "light" | "dark";

export type PanelRect = {
  x: number;
  y: number;
  w: number;
  h: number;
  pinned: boolean;
  folded: boolean;
};
