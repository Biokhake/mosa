import { useStudio } from "@/lib/mech/store";
import type { MappedSegment } from "./types";

/** RX-78-2 tricolor hexes sampled from kit front/back thumbs. */
export const RX78_COLORS = {
  white: "#F5F5F5",
  blue: "#3F51B5",
  red: "#E53935",
  yellow: "#FFC107",
  dark: "#37474F",
  pack: "#4A3F55",
  metal: "#8B919A",
  eye: "#76FF03",
  hand: "#37474F",
  rifle: "#3A3545",
} as const;

export type SlotPaint = { paint: string; paint2?: string | null };

/**
 * Mech slot id → primary/secondary paint for RX-78 look.
 * paint = prim armor; paint2 = accent / trim where geometry uses it.
 */
export const RX78_SLOT_PALETTE: Record<string, SlotPaint> = {
  // Head — white helm, yellow V-fin, green eyes, red chin accents
  helm: { paint: RX78_COLORS.white, paint2: RX78_COLORS.yellow },
  brow: { paint: RX78_COLORS.white, paint2: RX78_COLORS.yellow },
  vfin: { paint: RX78_COLORS.yellow, paint2: RX78_COLORS.red },
  jaw: { paint: RX78_COLORS.white, paint2: RX78_COLORS.red },
  chin: { paint: RX78_COLORS.red, paint2: RX78_COLORS.white },
  cheekL: { paint: RX78_COLORS.white, paint2: RX78_COLORS.dark },
  cheekR: { paint: RX78_COLORS.white, paint2: RX78_COLORS.dark },
  nose: { paint: RX78_COLORS.white, paint2: RX78_COLORS.dark },
  mouth: { paint: RX78_COLORS.white, paint2: RX78_COLORS.red },
  visor: { paint: RX78_COLORS.eye, paint2: RX78_COLORS.yellow },
  eyeL: { paint: RX78_COLORS.eye, paint2: RX78_COLORS.yellow },
  eyeR: { paint: RX78_COLORS.eye, paint2: RX78_COLORS.yellow },
  antennaL: { paint: RX78_COLORS.yellow, paint2: RX78_COLORS.white },
  antennaR: { paint: RX78_COLORS.yellow, paint2: RX78_COLORS.white },
  earL: { paint: RX78_COLORS.white, paint2: RX78_COLORS.dark },
  earR: { paint: RX78_COLORS.white, paint2: RX78_COLORS.dark },

  // Torso — blue chest, red mid, yellow vents
  chestCore: { paint: RX78_COLORS.blue, paint2: RX78_COLORS.yellow },
  cockpit: { paint: RX78_COLORS.blue, paint2: RX78_COLORS.yellow },
  pecL: { paint: RX78_COLORS.blue, paint2: RX78_COLORS.white },
  pecR: { paint: RX78_COLORS.blue, paint2: RX78_COLORS.white },
  collar: { paint: RX78_COLORS.yellow, paint2: RX78_COLORS.blue },
  abdomen: { paint: RX78_COLORS.red, paint2: RX78_COLORS.white },

  // Waist — white skirt, yellow pouches
  pelvis: { paint: RX78_COLORS.white, paint2: RX78_COLORS.red },
  skirtF: { paint: RX78_COLORS.white, paint2: RX78_COLORS.yellow },
  skirtB: { paint: RX78_COLORS.white, paint2: RX78_COLORS.yellow },
  skirtL: { paint: RX78_COLORS.white, paint2: RX78_COLORS.yellow },
  skirtR: { paint: RX78_COLORS.white, paint2: RX78_COLORS.yellow },

  // Arms — white armor, dark hands
  shoulderL: { paint: RX78_COLORS.white, paint2: RX78_COLORS.blue },
  shoulderR: { paint: RX78_COLORS.white, paint2: RX78_COLORS.blue },
  upperL: { paint: RX78_COLORS.white, paint2: RX78_COLORS.metal },
  upperR: { paint: RX78_COLORS.white, paint2: RX78_COLORS.metal },
  elbowL: { paint: RX78_COLORS.metal, paint2: RX78_COLORS.dark },
  elbowR: { paint: RX78_COLORS.metal, paint2: RX78_COLORS.dark },
  forearmL: { paint: RX78_COLORS.white, paint2: RX78_COLORS.metal },
  forearmR: { paint: RX78_COLORS.white, paint2: RX78_COLORS.metal },
  vambraceL: { paint: RX78_COLORS.white, paint2: RX78_COLORS.dark },
  vambraceR: { paint: RX78_COLORS.white, paint2: RX78_COLORS.dark },
  handL: { paint: RX78_COLORS.hand, paint2: RX78_COLORS.dark },
  handR: { paint: RX78_COLORS.hand, paint2: RX78_COLORS.dark },

  // Legs — white, red foot tops
  hipL: { paint: RX78_COLORS.white, paint2: RX78_COLORS.metal },
  hipR: { paint: RX78_COLORS.white, paint2: RX78_COLORS.metal },
  thighL: { paint: RX78_COLORS.white, paint2: RX78_COLORS.metal },
  thighR: { paint: RX78_COLORS.white, paint2: RX78_COLORS.metal },
  kneeL: { paint: RX78_COLORS.metal, paint2: RX78_COLORS.white },
  kneeR: { paint: RX78_COLORS.metal, paint2: RX78_COLORS.white },
  shinL: { paint: RX78_COLORS.white, paint2: RX78_COLORS.metal },
  shinR: { paint: RX78_COLORS.white, paint2: RX78_COLORS.metal },
  ankleL: { paint: RX78_COLORS.metal, paint2: RX78_COLORS.white },
  ankleR: { paint: RX78_COLORS.metal, paint2: RX78_COLORS.white },
  footL: { paint: RX78_COLORS.red, paint2: RX78_COLORS.white },
  footR: { paint: RX78_COLORS.red, paint2: RX78_COLORS.white },

  // Back pack — dark purple/gray, metallic thrusters
  pack: { paint: RX78_COLORS.pack, paint2: RX78_COLORS.metal },
  thrusterL: { paint: RX78_COLORS.metal, paint2: RX78_COLORS.pack },
  thrusterR: { paint: RX78_COLORS.metal, paint2: RX78_COLORS.pack },
  binderL: { paint: RX78_COLORS.white, paint2: RX78_COLORS.pack },
  binderR: { paint: RX78_COLORS.white, paint2: RX78_COLORS.pack },
  stabilizer: { paint: RX78_COLORS.pack, paint2: RX78_COLORS.metal },

  // Weapons — L shield red+white, R rifle dark
  weaponL: { paint: RX78_COLORS.red, paint2: RX78_COLORS.white },
  weaponR: { paint: RX78_COLORS.rifle, paint2: RX78_COLORS.dark },
  shield: { paint: RX78_COLORS.red, paint2: RX78_COLORS.white },
};

/** Weapon / equipment variants when RX-78 kit is active with back view. */
export const RX78_WEAPON_VARIANTS: Record<string, string> = {
  weaponR: "rifle",
  shield: "tower",
  weaponL: "none",
};

export function isRx78KitName(name: string | null | undefined): boolean {
  if (!name) return false;
  return /RX-?78/i.test(name);
}

export type PaletteApplyOpts = {
  kitName?: string | null;
  hasFront?: boolean;
  hasBack?: boolean;
  /** When true (default for RX-78 + back), enable shield + rifle variants. */
  equipWeapons?: boolean;
};

/**
 * Apply kit-accurate palette to hangar slots via useStudio paint fields.
 * Hardcoded RX-78 map when kit name matches / views present.
 * Not mesh-from-image reconstruction — paint hex + equipment only.
 */
export function applyPaletteFromViews(opts: PaletteApplyOpts = {}): void {
  const { kitName, hasFront = false, hasBack = false, equipWeapons } = opts;
  const rx78 = isRx78KitName(kitName) || hasFront || hasBack;
  if (!rx78) return;

  const wantWeapons = equipWeapons ?? hasBack;

  useStudio.setState((st) => {
    const slots = { ...st.slots };
    for (const [id, colors] of Object.entries(RX78_SLOT_PALETTE)) {
      const cur = slots[id];
      if (!cur) continue;
      slots[id] = {
        ...cur,
        paint: colors.paint,
        paint2: colors.paint2 ?? null,
      };
    }

    if (wantWeapons) {
      for (const [id, variant] of Object.entries(RX78_WEAPON_VARIANTS)) {
        const cur = slots[id];
        if (!cur) continue;
        const on = variant !== "none";
        slots[id] = {
          ...cur,
          variant,
          visible: on,
          paint: RX78_SLOT_PALETTE[id]?.paint ?? cur.paint,
          paint2: RX78_SLOT_PALETTE[id]?.paint2 ?? cur.paint2,
        };
      }
    }

    return {
      slots,
      light: RX78_COLORS.eye,
    };
  });
}

/**
 * After segments hit hangar: paint RX-78 palette when kit name or both views match.
 */
export function applyPaletteAfterMapping(args: {
  kitName?: string | null;
  front: string | null;
  back: string | null;
  segments?: MappedSegment[];
}): void {
  const hasFront = Boolean(args.front);
  const hasBack = Boolean(args.back);
  if (!(hasFront || hasBack)) return;

  const name = args.kitName;
  // Apply when kit name includes RX-78, or both views with no named non-RX kit.
  const rx =
    isRx78KitName(name) ||
    (hasFront && hasBack && (!name || isRx78KitName(name)));
  if (!rx) return;

  applyPaletteFromViews({
    kitName: name ?? "RX-78",
    hasFront,
    hasBack,
    equipWeapons: hasBack,
  });
}
