/**
 * Reference diff runner.
 *
 *   node --experimental-strip-types --import ./scripts/tsreg.mjs scripts/refdiff.mts [KEY]
 *
 * Measures the built kit the same way its reference thumbnail was measured and
 * prints the difference field by field. A pass costs milliseconds, which is the
 * entire point: authoring a part used to mean a two-minute round trip through a
 * dev server and a screenshot, at a fidelity where a 20% proportion error was
 * invisible.
 */
import { specsFor } from "../src/lib/mech/geometry.ts";
import { SLOTS, isLeftSlot } from "../src/lib/mech/catalog.ts";
import { socketFor } from "../src/lib/mech/reference/frame.ts";
import { refMeasureFor } from "../src/lib/mech/reference/data.ts";
import { measureBuild, diffMeasure } from "../src/lib/mech/reference/diff.ts";
import type { SlotGeometry } from "../src/lib/mech/reference/diff.ts";

const key = process.argv[2] ?? "RX-78";
const ref = refMeasureFor(key);
if (!ref) {
  console.log("no reference measurements for", key);
  process.exit(1);
}

const slots: SlotGeometry[] = [];
for (const s of SLOTS as Array<{ id: string }>) {
  let specs: ReturnType<typeof specsFor> = [];
  try {
    specs = specsFor(s.id, key);
  } catch {
    specs = [];
  }
  slots.push({ id: s.id, specs, socket: socketFor(s.id, key), mirror: isLeftSlot(s.id) });
}
const built = measureBuild(slots, key);
const d = diffMeasure(built, ref);
console.log(`=== ${key} : silhouette match ${(d.score * 100).toFixed(1)}% ===`);
console.log(
  `height ${built.height.toFixed(3)} (ground ${built.groundY.toFixed(3)}), head count ${(1 / (1 - built.y.chin)).toFixed(2)} vs ref ${(1 / (1 - ref.y.chin)).toFixed(2)}`,
);
console.log("\nworst:");
for (const f of d.worst) {
  const flag = Math.abs(f.err) > 0.25 ? "!!" : Math.abs(f.err) > 0.1 ? "! " : "  ";
  console.log(
    `${flag} ${f.field.padEnd(20)} built ${f.built.toFixed(4).padStart(8)}   ref ${f.ref.toFixed(4).padStart(8)}   ${(f.err >= 0 ? "+" : "") + (f.err * 100).toFixed(0)}%`,
  );
}
const empty = slots.filter((s) => s.specs.length === 0).length;
console.log(`\nslots with geometry: ${slots.length - empty}/${slots.length}`);
