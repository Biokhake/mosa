import * as THREE from "three";
import { Evaluator, Brush, ADDITION, SUBTRACTION } from "three-bvh-csg";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";

/**
 * Procedural Topological Evolution & Armor Shell Factory (Master 6.0)
 *
 * Core Architecture & Mandates:
 * 1. Symmetry: Right side is built as canonical master; Left side is generated via
 *    exact scale(-1, 1, 1) + triangle winding reversal + normal recomputation.
 * 2. Shell Structure (Anti-Solid): Shin, Shoulder, Vambrace, and Skirt are carved
 *    into hollow armor shells (C/U-cross section) via CSG Subtraction, allowing inner
 *    chassis frames and actuators to be exposed inside.
 * 3. All-around Beveling: Rounded base brushes and 45-degree chamfer cutters eliminate
 *    any sharp 90-degree edges across all parts.
 * 4. Multi-Zone Progressive Evolution (A..Z -> 0..25 detail tiers):
 *    Applied simultaneously across Head, Shoulder, Torso/Cockpit, Skirt, Forearm/Vambrace,
 *    Shin, Foot, and Backpack.
 * 5. Joint & Socket Offset Integrity: Dimensions and pivot centers are strictly conserved.
 */

const evaluator = new Evaluator();
evaluator.useGroups = false;

const geometryCache = new Map<string, THREE.BufferGeometry>();

/**
 * Creates a 100% mathematically exact mirror symmetric Left geometry from Right master.
 * Reverses triangle winding order to ensure correct normal orientation without backface issues.
 */
export function createSymmetricLeftGeometry(rightGeo: THREE.BufferGeometry): THREE.BufferGeometry {
  const leftGeo = rightGeo.clone();
  leftGeo.scale(-1, 1, 1);

  if (leftGeo.index) {
    const array = leftGeo.index.array;
    for (let i = 0; i < array.length; i += 3) {
      const tmp = array[i + 1];
      array[i + 1] = array[i + 2];
      array[i + 2] = tmp;
    }
    leftGeo.index.needsUpdate = true;
  } else {
    const pos = leftGeo.attributes.position;
    for (let i = 0; i < pos.count; i += 3) {
      const x1 = pos.getX(i + 1);
      const y1 = pos.getY(i + 1);
      const z1 = pos.getZ(i + 1);
      const x2 = pos.getX(i + 2);
      const y2 = pos.getY(i + 2);
      const z2 = pos.getZ(i + 2);
      pos.setXYZ(i + 1, x2, y2, z2);
      pos.setXYZ(i + 2, x1, y1, z1);
    }
    pos.needsUpdate = true;
  }

  leftGeo.computeVertexNormals();
  return leftGeo;
}

/**
 * CSG Union (ADDITION) helper with graceful fallback
 */
function csgUnion(
  baseGeo: THREE.BufferGeometry,
  addGeo: THREE.BufferGeometry,
  pos: [number, number, number],
  rot?: [number, number, number],
): THREE.BufferGeometry {
  try {
    baseGeo.computeVertexNormals();
    addGeo.computeVertexNormals();

    const brushA = new Brush(baseGeo);
    brushA.updateMatrixWorld();

    const brushB = new Brush(addGeo);
    brushB.position.set(pos[0], pos[1], pos[2]);
    if (rot) brushB.rotation.set(rot[0], rot[1], rot[2]);
    brushB.updateMatrixWorld();

    const result = evaluator.evaluate(brushA, brushB, ADDITION);
    result.geometry.computeVertexNormals();
    return result.geometry;
  } catch {
    return baseGeo;
  }
}

/**
 * CSG Subtraction (DIFFERENCE) helper with graceful fallback
 */
function csgSubtract(
  baseGeo: THREE.BufferGeometry,
  cutGeo: THREE.BufferGeometry,
  pos: [number, number, number],
  rot?: [number, number, number],
): THREE.BufferGeometry {
  try {
    baseGeo.computeVertexNormals();
    cutGeo.computeVertexNormals();

    const brushA = new Brush(baseGeo);
    brushA.updateMatrixWorld();

    const brushB = new Brush(cutGeo);
    brushB.position.set(pos[0], pos[1], pos[2]);
    if (rot) brushB.rotation.set(rot[0], rot[1], rot[2]);
    brushB.updateMatrixWorld();

    const result = evaluator.evaluate(brushA, brushB, SUBTRACTION);
    result.geometry.computeVertexNormals();
    return result.geometry;
  } catch {
    return baseGeo;
  }
}

/**
 * Helper to build a beveled rounded box brush (preventing 90-degree sharp corners)
 */
function createBeveledBox(w: number, h: number, d: number, bevel = 0.008): THREE.BufferGeometry {
  const minSide = Math.min(w, h, d);
  const safeRadius = Math.min(minSide * 0.15, bevel);
  return new RoundedBoxGeometry(w, h, d, 2, Math.max(0.002, safeRadius));
}

/**
 * =========================================================================
 * 1. SHOULDER EVOLUTION & HOLLOW SHELL (어깨 장갑판 쉘)
 *
 * Mandates:
 *  - Right-side canonical master -> Left-side mirror
 *  - Hollowed under-carriage / inner cavity via CSG Subtraction (Armor Pauldron Shell)
 *  - All edges beveled
 *  - Levels A..Z: Progressive crest lift, lateral booster union, cooling vents & chamfers
 * =========================================================================
 */
export function evolveShoulderGeometry(
  id: string,
  isLeft: boolean,
  w: number,
  h: number,
  d: number,
): THREE.BufferGeometry {
  const masterKey = `shoulder_${id}_R_${w.toFixed(3)}_${h.toFixed(3)}_${d.toFixed(3)}`;
  let rightGeo = geometryCache.get(masterKey);

  if (!rightGeo) {
    const detailLevel = Math.max(0, Math.min(25, (id.charCodeAt(2) || 65) - 65));

    // 1) Base beveled pauldron block (no sharp 90-deg edges)
    let geo: THREE.BufferGeometry = createBeveledBox(w, h, d, 0.012);

    // 2) Level D (3+): Top-outer trapezoid expansion (+X is outer for Right)
    if (detailLevel >= 3) {
      const pos = geo.attributes.position;
      const progressD = Math.min(1.0, (detailLevel - 2) / 4);
      const flare = w * 0.45 * progressD;

      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i);
        const y = pos.getY(i);
        if (y > h * 0.1 && x > 0) {
          const heightFactor = Math.max(0, (y - h * 0.1) / (h * 0.4));
          pos.setX(i, x + flare * heightFactor);
        }
      }
      pos.needsUpdate = true;
      geo.computeVertexNormals();
    }

    // 3) Level H (7+): Outer crest upward vertical lift (+Y)
    if (detailLevel >= 7) {
      const pos = geo.attributes.position;
      const progressH = Math.min(1.0, (detailLevel - 6) / 5);
      const lift = h * 0.52 * progressH;

      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i);
        const y = pos.getY(i);
        if (y > h * 0.15 && x > w * 0.25) {
          const distFactor = Math.max(0, (x - w * 0.25) / (w * 0.4));
          pos.setY(i, y + lift * distFactor);
        }
      }
      pos.needsUpdate = true;
      geo.computeVertexNormals();
    }

    // 4) Level M (12+): Outer pauldron angled thruster bell / cone CSG Union
    if (detailLevel >= 12) {
      const coneR = w * 0.24;
      const coneH = h * 0.65;
      const coneGeo = new THREE.ConeGeometry(coneR, coneH, 16);
      const csgPos: [number, number, number] = [w * 0.50, h * 0.35, 0];
      const csgRot: [number, number, number] = [0, 0, -(Math.PI / 4.2)];
      geo = csgUnion(geo, coneGeo, csgPos, csgRot);
    }

    // 5) Level R (17+): Fore/Aft angled sub-cones CSG Union
    if (detailLevel >= 17) {
      const subR = w * 0.15;
      const subH = h * 0.42;

      const coneFront = new THREE.ConeGeometry(subR, subH, 12);
      geo = csgUnion(geo, coneFront, [w * 0.35, h * 0.18, d * 0.42], [Math.PI / 3.2, 0, -(Math.PI / 5)]);

      const coneBack = new THREE.ConeGeometry(subR, subH, 12);
      geo = csgUnion(geo, coneBack, [w * 0.35, h * 0.18, -d * 0.42], [-Math.PI / 3.2, 0, -(Math.PI / 5)]);
    }

    // 6) CRITICAL ARMOR SHELL HOLLOWING (통짜 방지: 하부 및 안통 CSG Subtraction)
    // Carves the inner cavity under the shoulder so inner gimbal actuators fit inside
    const cavityW = w * 0.75;
    const cavityH = h * 0.65;
    const cavityD = d * 0.78;
    const cavityCutter = createBeveledBox(cavityW, cavityH, cavityD, 0.008);
    // Offset cavity slightly inward and downward
    geo = csgSubtract(geo, cavityCutter, [-w * 0.15, -h * 0.28, 0]);

    // 7) Level Z (21+): Mechanical Chamfers & Bevels + cooling exhaust cutouts
    if (detailLevel >= 21) {
      // Outer lower edge 45-degree chamfer
      const bevelCutter = new THREE.BoxGeometry(w * 0.45, h * 0.45, d * 1.5);
      geo = csgSubtract(geo, bevelCutter, [w * 0.52, -h * 0.42, 0], [0, 0, Math.PI / 4]);

      // Top heat vent slit
      const ventCutter = new THREE.BoxGeometry(w * 0.45, h * 0.07, d * 0.14);
      geo = csgSubtract(geo, ventCutter, [w * 0.05, h * 0.45, 0]);
    }

    rightGeo = geo;
    geometryCache.set(masterKey, rightGeo);
  }

  if (isLeft) {
    const leftKey = `shoulder_${id}_L_${w.toFixed(3)}_${h.toFixed(3)}_${d.toFixed(3)}`;
    let leftGeo = geometryCache.get(leftKey);
    if (!leftGeo) {
      leftGeo = createSymmetricLeftGeometry(rightGeo);
      geometryCache.set(leftKey, leftGeo);
    }
    return leftGeo.clone();
  }

  return rightGeo.clone();
}

/**
 * =========================================================================
 * 2. SHIN EVOLUTION & HOLLOW SHELL (정강이 장갑판 쉘 - 통짜 방지)
 *
 * Mandates:
 *  - Right-side canonical master -> Left-side mirror
 *  - C-Shape Hollow Shell: Backside and core are hollowed out so inner leg frame
 *    actuators and rods are visibly housed inside
 *  - Beveled front crest & knee striker wedge
 *  - Levels A..Z: Progressive knee wedge, calf flare, thruster bell, vents
 * =========================================================================
 */
export function evolveShinGeometry(
  id: string,
  isLeft: boolean,
  w: number,
  h: number,
  d: number,
): THREE.BufferGeometry {
  const masterKey = `shin_${id}_R_${w.toFixed(3)}_${h.toFixed(3)}_${d.toFixed(3)}`;
  let rightGeo = geometryCache.get(masterKey);

  if (!rightGeo) {
    const detailLevel = Math.max(0, Math.min(25, (id.charCodeAt(2) || 65) - 65));

    // 1) Base beveled armor shin block
    let geo: THREE.BufferGeometry = createBeveledBox(w, h, d, 0.01);

    // 2) Level D (3+): Knee striker protrusion forward (+Z) & upward (+Y)
    if (detailLevel >= 3) {
      const pos = geo.attributes.position;
      const progressD = Math.min(1.0, (detailLevel - 2) / 4);

      for (let i = 0; i < pos.count; i++) {
        const y = pos.getY(i);
        const z = pos.getZ(i);

        if (y > h * 0.15 && z > 0) {
          const factor = (y - h * 0.15) / (h * 0.35);
          pos.setZ(i, z + d * 0.40 * progressD * factor);
          pos.setY(i, y + h * 0.12 * progressD * factor);
        }
      }
      pos.needsUpdate = true;
      geo.computeVertexNormals();
    }

    // 3) Level H (7+): Calf flare outward (+X) & rearward (-Z)
    if (detailLevel >= 7) {
      const pos = geo.attributes.position;
      const progressH = Math.min(1.0, (detailLevel - 6) / 5);

      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i);
        const y = pos.getY(i);
        const z = pos.getZ(i);

        if (y < 0 && y > -h * 0.4) {
          const calfFactor = 1 - Math.abs(y - (-h * 0.2)) / (h * 0.25);
          if (calfFactor > 0) {
            if (x > 0) {
              pos.setX(i, x + w * 0.32 * progressH * calfFactor);
            }
            if (z < 0) {
              pos.setZ(i, z - d * 0.40 * progressH * calfFactor);
            }
          }
        }
      }
      pos.needsUpdate = true;
      geo.computeVertexNormals();
    }

    // 4) Level M (12+): Calf thruster module CSG Union on outer flank
    if (detailLevel >= 12) {
      const thrusterGeo = new THREE.ConeGeometry(w * 0.17, h * 0.32, 12);
      const tPos: [number, number, number] = [w * 0.38, -h * 0.14, -d * 0.44];
      const tRot: [number, number, number] = [-Math.PI / 3.5, 0, -(Math.PI / 8)];
      geo = csgUnion(geo, thrusterGeo, tPos, tRot);
    }

    // 5) Level R (17+): Knee striker reinforced faceted wedge CSG Union
    if (detailLevel >= 17) {
      const strikerGeo = new THREE.ConeGeometry(w * 0.18, h * 0.30, 4);
      const sPos: [number, number, number] = [0, h * 0.42, d * 0.50];
      const sRot: [number, number, number] = [Math.PI / 3, 0, 0];
      geo = csgUnion(geo, strikerGeo, sPos, sRot);
    }

    // 6) CRITICAL ARMOR SHELL HOLLOWING (통짜 방지: 후면 및 중심축 대형 캐비티 파내기)
    // Transforms the solid block into an authentic C-shaped Armor Shell covering the inner leg frame
    const hollowW = w * 0.72;
    const hollowH = h * 0.88;
    const hollowD = d * 0.65;
    const hollowCutter = createBeveledBox(hollowW, hollowH, hollowD, 0.008);
    // Position cutter toward rear (-Z) to create an open rear channel for chassis frame
    geo = csgSubtract(geo, hollowCutter, [0, -h * 0.02, -d * 0.28]);

    // 7) Level Z (21+): Ankle recess notch & side cooling slits
    if (detailLevel >= 21) {
      const notchCutter = new THREE.BoxGeometry(w * 0.45, h * 0.14, d * 0.5);
      geo = csgSubtract(geo, notchCutter, [w * 0.40, -h * 0.44, 0]);

      // Side cooling exhaust vent slits
      const ventCutter = new THREE.BoxGeometry(w * 0.12, h * 0.04, d * 0.25);
      geo = csgSubtract(geo, ventCutter, [w * 0.42, 0, 0]);
      geo = csgSubtract(geo, ventCutter, [w * 0.42, -h * 0.10, 0]);
    }

    rightGeo = geo;
    geometryCache.set(masterKey, rightGeo);
  }

  if (isLeft) {
    const leftKey = `shin_${id}_L_${w.toFixed(3)}_${h.toFixed(3)}_${d.toFixed(3)}`;
    let leftGeo = geometryCache.get(leftKey);
    if (!leftGeo) {
      leftGeo = createSymmetricLeftGeometry(rightGeo);
      geometryCache.set(leftKey, leftGeo);
    }
    return leftGeo.clone();
  }

  return rightGeo.clone();
}

/**
 * =========================================================================
 * 3. SKIRT EVOLUTION & HOLLOWED ARMOR PLATE (스커트 아머 쉘)
 * =========================================================================
 */
export function evolveSkirtGeometry(
  id: string,
  isLeft: boolean,
  w: number,
  h: number,
  d: number,
): THREE.BufferGeometry {
  const masterKey = `skirt_${id}_R_${w.toFixed(3)}_${h.toFixed(3)}_${d.toFixed(3)}`;
  let rightGeo = geometryCache.get(masterKey);

  if (!rightGeo) {
    const detailLevel = Math.max(0, Math.min(25, (id.charCodeAt(2) || 65) - 65));

    // 1) Base beveled skirt plate
    let geo: THREE.BufferGeometry = createBeveledBox(w, h, d, 0.008);

    // 2) Level D (3+): Bottom-outer flare
    if (detailLevel >= 3) {
      const pos = geo.attributes.position;
      const progressD = Math.min(1.0, (detailLevel - 2) / 4);

      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i);
        const y = pos.getY(i);

        if (y < 0) {
          const factor = -y / (h * 0.5);
          if (x > 0) {
            pos.setX(i, x + w * 0.38 * progressD * factor);
          }
        }
      }
      pos.needsUpdate = true;
      geo.computeVertexNormals();
    }

    // 3) Level H (7+): Swallowtail backward wing sweep (-Z)
    if (detailLevel >= 7) {
      const pos = geo.attributes.position;
      const progressH = Math.min(1.0, (detailLevel - 6) / 5);

      for (let i = 0; i < pos.count; i++) {
        const y = pos.getY(i);
        const z = pos.getZ(i);

        if (y < 0 && z < 0) {
          const factor = (-y / (h * 0.5)) * (-z / (d * 0.5));
          pos.setZ(i, z - d * 0.45 * progressH * factor);
          pos.setY(i, y - h * 0.18 * progressH * factor);
        }
      }
      pos.needsUpdate = true;
      geo.computeVertexNormals();
    }

    // 4) Level M (12+): Side vernier booster pod CSG Union
    if (detailLevel >= 12) {
      const vernierGeo = new THREE.CylinderGeometry(w * 0.20, w * 0.16, h * 0.42, 12);
      geo = csgUnion(geo, vernierGeo, [w * 0.36, -h * 0.1, 0]);
    }

    // 5) Level R (17+): Layered composite armor plate CSG Union
    if (detailLevel >= 17) {
      const plateGeo = createBeveledBox(w * 0.55, h * 0.45, d * 0.22, 0.006);
      geo = csgUnion(geo, plateGeo, [w * 0.42, h * 0.1, 0]);
    }

    // 6) CRITICAL ARMOR SHELL HOLLOWING: Carve inner pelvis side to create realistic armor plate
    const innerPocketCutter = createBeveledBox(w * 0.65, h * 0.75, d * 0.55, 0.006);
    geo = csgSubtract(geo, innerPocketCutter, [-w * 0.22, -h * 0.05, 0]);

    // 7) Level Z (21+): Vernier nozzle recess cutout
    if (detailLevel >= 21) {
      const nozzleCutter = new THREE.ConeGeometry(w * 0.15, h * 0.22, 12);
      geo = csgSubtract(geo, nozzleCutter, [w * 0.36, -h * 0.32, 0], [Math.PI, 0, 0]);
    }

    rightGeo = geo;
    geometryCache.set(masterKey, rightGeo);
  }

  if (isLeft) {
    const leftKey = `skirt_${id}_L_${w.toFixed(3)}_${h.toFixed(3)}_${d.toFixed(3)}`;
    let leftGeo = geometryCache.get(leftKey);
    if (!leftGeo) {
      leftGeo = createSymmetricLeftGeometry(rightGeo);
      geometryCache.set(leftKey, leftGeo);
    }
    return leftGeo.clone();
  }

  return rightGeo.clone();
}

/**
 * =========================================================================
 * 4. FOOT EVOLUTION (발 점진적 진화 및 접지 쉘)
 * =========================================================================
 */
export function evolveFootGeometry(
  id: string,
  isLeft: boolean,
  w: number,
  h: number,
  d: number,
): THREE.BufferGeometry {
  const masterKey = `foot_${id}_R_${w.toFixed(3)}_${h.toFixed(3)}_${d.toFixed(3)}`;
  let rightGeo = geometryCache.get(masterKey);

  if (!rightGeo) {
    const detailLevel = Math.max(0, Math.min(25, (id.charCodeAt(2) || 65) - 65));

    let geo: THREE.BufferGeometry = createBeveledBox(w, h, d, 0.008);

    // Level D (3+): Toe taper forward (+Z) and flatten
    if (detailLevel >= 3) {
      const pos = geo.attributes.position;
      const progressD = Math.min(1.0, (detailLevel - 2) / 4);

      for (let i = 0; i < pos.count; i++) {
        const y = pos.getY(i);
        const z = pos.getZ(i);

        if (z > 0) {
          const factor = z / (d * 0.5);
          pos.setZ(i, z + d * 0.28 * progressD * factor);
          if (y > 0) {
            pos.setY(i, y * (1 - 0.38 * progressD * factor));
          }
        }
      }
      pos.needsUpdate = true;
      geo.computeVertexNormals();
    }

    // Level H (7+): Heel elevation & arch
    if (detailLevel >= 7) {
      const pos = geo.attributes.position;
      const progressH = Math.min(1.0, (detailLevel - 6) / 5);

      for (let i = 0; i < pos.count; i++) {
        const y = pos.getY(i);
        const z = pos.getZ(i);

        if (z < -d * 0.1) {
          const factor = (-z - d * 0.1) / (d * 0.4);
          pos.setY(i, y + h * 0.22 * progressH * factor);
        }
      }
      pos.needsUpdate = true;
      geo.computeVertexNormals();
    }

    // Level M (12+): Toe claw blades / articulated sole plates
    if (detailLevel >= 12) {
      const clawGeo = new THREE.ConeGeometry(w * 0.15, d * 0.32, 4);
      const cRot: [number, number, number] = [Math.PI / 2.2, 0, 0];
      geo = csgUnion(geo, clawGeo, [-w * 0.25, -h * 0.2, d * 0.62], cRot);
      geo = csgUnion(geo, clawGeo, [w * 0.25, -h * 0.2, d * 0.62], cRot);
    }

    // Level R (17+): Ankle armor guards CSG Union
    if (detailLevel >= 17) {
      const guardGeo = createBeveledBox(w * 0.20, h * 0.60, d * 0.38, 0.006);
      geo = csgUnion(geo, guardGeo, [w * 0.46, h * 0.22, -d * 0.1]);
    }

    // Ankle joint socket top recess (Cavity for ankle gimbal)
    const ankleCutter = new THREE.CylinderGeometry(w * 0.32, w * 0.32, h * 0.45, 16);
    geo = csgSubtract(geo, ankleCutter, [0, h * 0.35, -d * 0.1]);

    // Level Z (21+): Sole grip traction tread grooves CSG Subtraction
    if (detailLevel >= 21) {
      const treadCutter = new THREE.BoxGeometry(w * 1.1, h * 0.12, d * 0.08);
      geo = csgSubtract(geo, treadCutter, [0, -h * 0.48, d * 0.2]);
      geo = csgSubtract(geo, treadCutter, [0, -h * 0.48, -d * 0.2]);
    }

    rightGeo = geo;
    geometryCache.set(masterKey, rightGeo);
  }

  if (isLeft) {
    const leftKey = `foot_${id}_L_${w.toFixed(3)}_${h.toFixed(3)}_${d.toFixed(3)}`;
    let leftGeo = geometryCache.get(leftKey);
    if (!leftGeo) {
      leftGeo = createSymmetricLeftGeometry(rightGeo);
      geometryCache.set(leftKey, leftGeo);
    }
    return leftGeo.clone();
  }

  return rightGeo.clone();
}

/**
 * =========================================================================
 * 5. HEAD / HELM EVOLUTION (두개골/헤드 점진적 진화)
 * =========================================================================
 */
export function evolveHeadGeometry(
  id: string,
  w: number,
  h: number,
  d: number,
): THREE.BufferGeometry {
  const cacheKey = `head_${id}_${w.toFixed(3)}_${h.toFixed(3)}_${d.toFixed(3)}`;
  if (geometryCache.has(cacheKey)) {
    return geometryCache.get(cacheKey)!.clone();
  }

  const detailLevel = Math.max(0, Math.min(25, (id.charCodeAt(2) || 65) - 65));

  // 1) Base beveled skull block
  let geo: THREE.BufferGeometry = createBeveledBox(w, h, d, 0.012);

  // 2) Level D (3+): Jaw & chin V-taper forward (+Z) and down (-Y)
  if (detailLevel >= 3) {
    const pos = geo.attributes.position;
    const progressD = Math.min(1.0, (detailLevel - 2) / 4);
    const jawProtrusion = d * 0.45 * progressD;

    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const z = pos.getZ(i);

      if (y < 0 && z > 0) {
        const chinFactor = Math.max(0, (-y / (h * 0.5)) * (z / (d * 0.5)));
        pos.setZ(i, z + jawProtrusion * chinFactor);
        pos.setY(i, y - h * 0.14 * progressD * chinFactor);
        pos.setX(i, x * (1 - 0.26 * progressD * chinFactor));
      }
    }
    pos.needsUpdate = true;
    geo.computeVertexNormals();
  }

  // 3) Level H (7+): Occipital cranium aerodynamic elongation (-Z)
  if (detailLevel >= 7) {
    const pos = geo.attributes.position;
    const progressH = Math.min(1.0, (detailLevel - 6) / 5);
    const cranialStretch = d * 0.60 * progressH;

    for (let i = 0; i < pos.count; i++) {
      const y = pos.getY(i);
      const z = pos.getZ(i);

      if (z < 0 && y > -h * 0.25) {
        const rearFactor = Math.max(0, (-z / (d * 0.5)) * ((y + h * 0.25) / (h * 0.75)));
        pos.setZ(i, z - cranialStretch * rearFactor);
        pos.setY(i, y + h * 0.10 * progressH * rearFactor);
      }
    }
    pos.needsUpdate = true;
    geo.computeVertexNormals();
  }

  // 4) Level M (12+): Visor recess & lateral antenna sockets CSG Subtraction
  if (detailLevel >= 12) {
    // Sockets
    const socketR = h * 0.20;
    const socketH = w * 0.35;
    const socketGeo = new THREE.CylinderGeometry(socketR, socketR, socketH, 16);
    geo = csgSubtract(geo, socketGeo, [-w * 0.46, h * 0.08, -d * 0.05], [0, 0, Math.PI / 2]);
    geo = csgSubtract(geo, socketGeo, [w * 0.46, h * 0.08, -d * 0.05], [0, 0, Math.PI / 2]);

    // Visor recess slot
    const visorCutter = createBeveledBox(w * 0.82, h * 0.14, d * 0.35, 0.005);
    geo = csgSubtract(geo, visorCutter, [0, h * 0.14, d * 0.46], [-Math.PI / 16, 0, 0]);
  }

  // 5) Level R (17+): Dorsal aerodynamic crest spine CSG Union
  if (detailLevel >= 17) {
    const pinR = h * 0.08;
    const pinH = w * 0.38;
    const pinGeo = new THREE.CylinderGeometry(pinR, pinR, pinH, 12);
    geo = csgUnion(geo, pinGeo, [-w * 0.48, h * 0.08, -d * 0.05], [0, 0, Math.PI / 2]);
    geo = csgUnion(geo, pinGeo, [w * 0.48, h * 0.08, -d * 0.05], [0, 0, Math.PI / 2]);

    const crestGeo = createBeveledBox(w * 0.13, h * 0.32, d * 1.05, 0.006);
    geo = csgUnion(geo, crestGeo, [0, h * 0.50, -d * 0.15]);
  }

  // 6) Level Z (21+): Cheek bevel chamfers CSG Subtraction
  if (detailLevel >= 21) {
    const cheekCutter = new THREE.BoxGeometry(w * 0.42, h * 0.42, d * 0.85);
    geo = csgSubtract(geo, cheekCutter, [-w * 0.44, -h * 0.34, d * 0.24], [0, -Math.PI / 6, Math.PI / 4]);
    geo = csgSubtract(geo, cheekCutter, [w * 0.44, -h * 0.34, d * 0.24], [0, Math.PI / 6, -Math.PI / 4]);
  }

  geometryCache.set(cacheKey, geo);
  return geo.clone();
}

/**
 * =========================================================================
 * 6. BACKPACK EVOLUTION (백팩 리액터 점진적 진화)
 * =========================================================================
 */
export function evolveBackpackGeometry(
  id: string,
  w: number,
  h: number,
  d: number,
): THREE.BufferGeometry {
  const cacheKey = `pack_${id}_${w.toFixed(3)}_${h.toFixed(3)}_${d.toFixed(3)}`;
  if (geometryCache.has(cacheKey)) {
    return geometryCache.get(cacheKey)!.clone();
  }

  const detailLevel = Math.max(0, Math.min(25, (id.charCodeAt(2) || 65) - 65));

  let geo: THREE.BufferGeometry = createBeveledBox(w, h, d, 0.012);

  // Level D (3+): Top taper & bottom aerodynamic flare
  if (detailLevel >= 3) {
    const pos = geo.attributes.position;
    const progressD = Math.min(1.0, (detailLevel - 2) / 4);

    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const z = pos.getZ(i);

      if (y > 0) {
        pos.setZ(i, z - d * 0.22 * progressD * (y / (h * 0.5)));
      } else {
        pos.setX(i, x * (1 + 0.22 * progressD * (-y / (h * 0.5))));
      }
    }
    pos.needsUpdate = true;
    geo.computeVertexNormals();
  }

  // Level H (7+): Center spine keel ridge
  if (detailLevel >= 7) {
    const pos = geo.attributes.position;
    const progressH = Math.min(1.0, (detailLevel - 6) / 5);

    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);

      if (Math.abs(x) < w * 0.24 && z < 0) {
        pos.setZ(i, z - d * 0.40 * progressH * (1 - Math.abs(x) / (w * 0.24)));
      }
    }
    pos.needsUpdate = true;
    geo.computeVertexNormals();
  }

  // Level M (12+): Twin booster flank pods CSG Union
  if (detailLevel >= 12) {
    const podR = w * 0.18;
    const podH = h * 0.85;
    const podGeo = new THREE.CylinderGeometry(podR * 0.85, podR, podH, 16);
    geo = csgUnion(geo, podGeo, [-w * 0.46, 0, -d * 0.18]);
    geo = csgUnion(geo, podGeo, [w * 0.46, 0, -d * 0.18]);
  }

  // Level R (17+): Vectoring thruster bells CSG Union
  if (detailLevel >= 17) {
    const bellR = w * 0.16;
    const bellH = h * 0.42;
    const bellGeo = new THREE.ConeGeometry(bellR, bellH, 14);
    geo = csgUnion(geo, bellGeo, [-w * 0.30, -h * 0.50, -d * 0.28], [Math.PI / 4, 0, Math.PI / 8]);
    geo = csgUnion(geo, bellGeo, [w * 0.30, -h * 0.50, -d * 0.28], [Math.PI / 4, 0, -Math.PI / 8]);
  }

  // Level Z (21+): Heat exhaust grill slits CSG Subtraction
  if (detailLevel >= 21) {
    const grillCutter = new THREE.BoxGeometry(w * 0.55, h * 0.05, d * 0.3);
    geo = csgSubtract(geo, grillCutter, [0, h * 0.34, -d * 0.36]);
    geo = csgSubtract(geo, grillCutter, [0, h * 0.20, -d * 0.36]);
  }

  geometryCache.set(cacheKey, geo);
  return geo.clone();
}

/**
 * =========================================================================
 * 7. COCKPIT / CHEST HATCH EVOLUTION (흉부 콕핏 해치 점진적 진화)
 *
 * Mandates:
 *  - Level A (0..2): Sleek low-profile hatch
 *  - Level D (3..6): Angular wedge protrusion (+Z)
 *  - Level H (7..11): Top visor slit & pilot egress seam
 *  - Level M (12..16): Layered applique blast armor plate
 *  - Level R (17..20): Multi-faceted crest striker ridge
 *  - Level Z (21..25): Emergency release latches & 45-deg edge chamfers
 * =========================================================================
 */
export function evolveCockpitGeometry(
  id: string,
  w: number,
  h: number,
  d: number,
): THREE.BufferGeometry {
  const cacheKey = `cockpit_${id}_${w.toFixed(3)}_${h.toFixed(3)}_${d.toFixed(3)}`;
  if (geometryCache.has(cacheKey)) {
    return geometryCache.get(cacheKey)!.clone();
  }

  const detailLevel = Math.max(0, Math.min(25, (id.charCodeAt(2) || 65) - 65));

  // Base beveled hatch
  let geo: THREE.BufferGeometry = createBeveledBox(w, h, d, 0.01);

  // Level D (3+): Wedge shape slope forward (+Z)
  if (detailLevel >= 3) {
    const pos = geo.attributes.position;
    const progressD = Math.min(1.0, (detailLevel - 2) / 4);

    for (let i = 0; i < pos.count; i++) {
      const y = pos.getY(i);
      const z = pos.getZ(i);

      if (y > 0 && z > 0) {
        pos.setZ(i, z + d * 0.35 * progressD * (y / (h * 0.5)));
      }
    }
    pos.needsUpdate = true;
    geo.computeVertexNormals();
  }

  // Level H (7+): Center striker keel ridge along Z
  if (detailLevel >= 7) {
    const pos = geo.attributes.position;
    const progressH = Math.min(1.0, (detailLevel - 6) / 5);

    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);

      if (Math.abs(x) < w * 0.3 && z > 0) {
        pos.setZ(i, z + d * 0.25 * progressH * (1 - Math.abs(x) / (w * 0.3)));
      }
    }
    pos.needsUpdate = true;
    geo.computeVertexNormals();
  }

  // Level M (12+): Telemetry optical camera visor slot CSG Subtraction
  if (detailLevel >= 12) {
    const visorCutter = createBeveledBox(w * 0.65, h * 0.12, d * 0.4, 0.004);
    geo = csgSubtract(geo, visorCutter, [0, h * 0.25, d * 0.45]);
  }

  // Level R (17+): Composite armor applique plate CSG Union
  if (detailLevel >= 17) {
    const applique = createBeveledBox(w * 0.75, h * 0.55, d * 0.25, 0.006);
    geo = csgUnion(geo, applique, [0, -h * 0.08, d * 0.28]);
  }

  // Level Z (21+): 45-degree chamfers on lower edges
  if (detailLevel >= 21) {
    const cutter = new THREE.BoxGeometry(w * 0.4, h * 0.35, d * 1.2);
    geo = csgSubtract(geo, cutter, [-w * 0.45, -h * 0.4, 0], [0, 0, Math.PI / 4]);
    geo = csgSubtract(geo, cutter, [w * 0.45, -h * 0.4, 0], [0, 0, -Math.PI / 4]);
  }

  geometryCache.set(cacheKey, geo);
  return geo.clone();
}

/**
 * =========================================================================
 * 8. FOREARM / VAMBRACE EVOLUTION & GAUNTLET SHELL (하완 아머 쉘)
 *
 * Mandates:
 *  - Right-side canonical master -> Left-side mirror
 *  - Open C-channel gauntlet shell housing inner radius/ulna chassis rails
 *  - NATO Picatinny rail slots & weapon mount latches
 * =========================================================================
 */
export function evolveVambraceGeometry(
  id: string,
  isLeft: boolean,
  w: number,
  h: number,
  d: number,
): THREE.BufferGeometry {
  const masterKey = `vambrace_${id}_R_${w.toFixed(3)}_${h.toFixed(3)}_${d.toFixed(3)}`;
  let rightGeo = geometryCache.get(masterKey);

  if (!rightGeo) {
    const detailLevel = Math.max(0, Math.min(25, (id.charCodeAt(2) || 65) - 65));

    // Base beveled gauntlet
    let geo: THREE.BufferGeometry = createBeveledBox(w, h, d, 0.008);

    // Level D (3+): Strike edge ridge on outer lateral flank (+X)
    if (detailLevel >= 3) {
      const pos = geo.attributes.position;
      const progressD = Math.min(1.0, (detailLevel - 2) / 4);

      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i);
        if (x > 0) {
          pos.setX(i, x + w * 0.30 * progressD * (x / (w * 0.5)));
        }
      }
      pos.needsUpdate = true;
      geo.computeVertexNormals();
    }

    // Level H (7+): Weapon hardpoint mounting rail plate CSG Union
    if (detailLevel >= 7) {
      const railGeo = createBeveledBox(w * 0.22, h * 0.70, d * 0.28, 0.004);
      geo = csgUnion(geo, railGeo, [w * 0.45, 0, 0]);
    }

    // Level M (12+): Picatinny rail slots CSG Subtraction
    if (detailLevel >= 12) {
      const slotCutter = new THREE.BoxGeometry(w * 0.26, h * 0.06, d * 0.35);
      geo = csgSubtract(geo, slotCutter, [w * 0.48, h * 0.20, 0]);
      geo = csgSubtract(geo, slotCutter, [w * 0.48, 0, 0]);
      geo = csgSubtract(geo, slotCutter, [w * 0.48, -h * 0.20, 0]);
    }

    // CRITICAL ARMOR SHELL HOLLOWING: Open inner C-channel so arm chassis rails are exposed inside
    const innerArmCutter = createBeveledBox(w * 0.70, h * 0.92, d * 0.72, 0.006);
    geo = csgSubtract(geo, innerArmCutter, [-w * 0.20, 0, 0]);

    // Level R (17+): Sub-shield attachment bracket socket
    if (detailLevel >= 17) {
      const bracketGeo = createBeveledBox(w * 0.16, h * 0.25, d * 0.45, 0.004);
      geo = csgUnion(geo, bracketGeo, [w * 0.38, 0, d * 0.25]);
    }

    // Level Z (21+): 45-degree chamfers on upper and lower rims
    if (detailLevel >= 21) {
      const rimCutter = new THREE.BoxGeometry(w * 1.2, h * 0.12, d * 1.2);
      geo = csgSubtract(geo, rimCutter, [0, h * 0.48, 0], [0, 0, Math.PI / 4]);
      geo = csgSubtract(geo, rimCutter, [0, -h * 0.48, 0], [0, 0, -Math.PI / 4]);
    }

    rightGeo = geo;
    geometryCache.set(masterKey, rightGeo);
  }

  if (isLeft) {
    const leftKey = `vambrace_${id}_L_${w.toFixed(3)}_${h.toFixed(3)}_${d.toFixed(3)}`;
    let leftGeo = geometryCache.get(leftKey);
    if (!leftGeo) {
      leftGeo = createSymmetricLeftGeometry(rightGeo);
      geometryCache.set(leftKey, leftGeo);
    }
    return leftGeo.clone();
  }

  return rightGeo.clone();
}
