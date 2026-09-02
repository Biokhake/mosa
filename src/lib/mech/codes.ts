export type SR = "S" | "R";

export type StyleCode = {
  id: string;
  serial: number;
  major: SR;
  form: SR;
  letter: string;
  complexity: number;
};

const AZ = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

export function lettersWithout(ch: SR): string {
  return AZ.replace(ch, "");
}

export function buildCodes(): StyleCode[] {
  const quads: Array<[SR, SR]> = [
    ["S", "S"],
    ["S", "R"],
    ["R", "S"],
    ["R", "R"],
  ];
  const out: StyleCode[] = [];
  let serial = 1;
  for (const [major, form] of quads) {
    const letters = lettersWithout(form);
    for (let i = 0; i < letters.length; i++) {
      const letter = letters[i]!;
      out.push({
        id: `${major}${form}${letter}-${String(serial).padStart(3, "0")}`,
        serial,
        major,
        form,
        letter,
        complexity: i,
      });
      serial += 1;
    }
  }
  return out;
}

export const STYLES = buildCodes();
export const STYLE_BY_ID = Object.fromEntries(STYLES.map((s) => [s.id, s]));
export const DEFAULT_STYLE = STYLES[0]!.id;

export const QUAD_RANGES = [
  { id: "SS", label: "SS 001–025", from: 1, to: 25 },
  { id: "SR", label: "SR 026–050", from: 26, to: 50 },
  { id: "RS", label: "RS 051–075", from: 51, to: 75 },
  { id: "RR", label: "RR 076–100", from: 76, to: 100 },
] as const;
