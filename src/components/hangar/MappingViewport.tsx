import { Canvas, useThree } from "@react-three/fiber";
import { ContactShadows, OrbitControls, Grid } from "@react-three/drei";
import { Suspense, useEffect, useMemo, useState } from "react";
import * as THREE from "three";
import { useStudio } from "@/lib/mech/store";
import { useMapping } from "@/lib/mapping/store";
import { labelsForOverlay, type Label2d } from "@/lib/mapping/label2d";
import { tintCanvasRegion, tintCanvasPolygon } from "@/lib/mapping/tint";

/**
 * Key near-white background via edge-connected flood fill.
 * Preserves white armor interiors (not edge-connected to the canvas border).
 * Returns the working canvas (caller may composite tints/overlays before texture).
 */
function keyNearWhiteFloodCanvas(image: HTMLImageElement, tol = 16): HTMLCanvasElement {
  const w = image.naturalWidth || image.width;
  const h = image.naturalHeight || image.height;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
  ctx.drawImage(image, 0, 0);
  const img = ctx.getImageData(0, 0, w, h);
  const d = img.data;

  const isBg = (i: number) => {
    const r = d[i]!;
    const g = d[i + 1]!;
    const b = d[i + 2]!;
    const minC = Math.min(r, g, b);
    const chroma = Math.max(r, g, b) - minC;
    return minC >= 255 - tol && chroma <= 14;
  };

  const visited = new Uint8Array(w * h);
  const qx = new Int32Array(w * h);
  const qy = new Int32Array(w * h);
  let qh = 0;
  let qt = 0;

  const push = (x: number, y: number) => {
    const p = y * w + x;
    if (visited[p]) return;
    if (!isBg(p * 4)) return;
    visited[p] = 1;
    qx[qt] = x;
    qy[qt] = y;
    qt++;
  };

  for (let x = 0; x < w; x++) {
    push(x, 0);
    push(x, h - 1);
  }
  for (let y = 0; y < h; y++) {
    push(0, y);
    push(w - 1, y);
  }

  while (qh < qt) {
    const x = qx[qh]!;
    const y = qy[qh]!;
    qh++;
    d[(y * w + x) * 4 + 3] = 0;
    if (x > 0) push(x - 1, y);
    if (x + 1 < w) push(x + 1, y);
    if (y > 0) push(x, y - 1);
    if (y + 1 < h) push(x, y + 1);
  }

  // Soften 1px fringe next to keyed pixels (anti-halo)
  const alphaCopy = new Uint8ClampedArray(w * h);
  for (let p = 0; p < w * h; p++) alphaCopy[p] = d[p * 4 + 3]!;
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const p = y * w + x;
      if (alphaCopy[p]! === 0) continue;
      const neigh =
        (alphaCopy[p - 1]! === 0 ? 1 : 0) +
        (alphaCopy[p + 1]! === 0 ? 1 : 0) +
        (alphaCopy[p - w]! === 0 ? 1 : 0) +
        (alphaCopy[p + w]! === 0 ? 1 : 0);
      if (neigh > 0) {
        const i = p * 4;
        const r = d[i]!;
        const g = d[i + 1]!;
        const b = d[i + 2]!;
        const minC = Math.min(r, g, b);
        if (minC >= 255 - tol - 8) {
          d[i + 3] = Math.round(alphaCopy[p]! * (1 - neigh * 0.28));
        }
      }
    }
  }

  ctx.putImageData(img, 0, 0);
  return canvas;
}

function canvasToTexture(canvas: HTMLCanvasElement): THREE.CanvasTexture {
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.generateMipmaps = true;
  tex.needsUpdate = true;
  return tex;
}

function labelPixelPoints(
  lab: Label2d,
  W: number,
  H: number,
): { x: number; y: number }[] | null {
  if (lab.polygon && lab.polygon.length >= 3) {
    return lab.polygon.map((p) => ({ x: p.x * W, y: p.y * H }));
  }
  if (lab.normRect) {
    const r = lab.normRect;
    return [
      { x: r.x * W, y: r.y * H },
      { x: (r.x + r.w) * W, y: r.y * H },
      { x: (r.x + r.w) * W, y: (r.y + r.h) * H },
      { x: r.x * W, y: (r.y + r.h) * H },
    ];
  }
  return null;
}

/** Apply segment tints + label overlays (polygon lasso preferred) onto keyed canvas. */
function compositeLabelsOntoCanvas(
  canvas: HTMLCanvasElement,
  view: "front" | "back",
  labels: Label2d[],
  selectedSlotId: string | null,
): void {
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return;
  const W = canvas.width;
  const H = canvas.height;
  const forView = labels.filter((l) => l.view === view);

  // 1) Apply tints inside polygon mask (or rect fallback)
  for (const lab of forView) {
    if (!lab.tint) continue;
    const pts = labelPixelPoints(lab, W, H);
    if (!pts) continue;
    if (lab.polygon && lab.polygon.length >= 3) {
      tintCanvasPolygon(ctx, pts, lab.tint);
    } else if (lab.normRect) {
      const rx = lab.normRect.x * W;
      const ry = lab.normRect.y * H;
      const rw = lab.normRect.w * W;
      const rh = lab.normRect.h * H;
      tintCanvasRegion(ctx, rx, ry, rw, rh, lab.tint);
    }
  }

  // 2) Polygonal boundary overlays; selected = stronger stroke
  for (const lab of forView) {
    const pts = labelPixelPoints(lab, W, H);
    if (!pts || pts.length < 2) continue;
    const selected = lab.slotId === selectedSlotId;
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(pts[0]!.x, pts[0]!.y);
    for (let i = 1; i < pts.length; i++) {
      ctx.lineTo(pts[i]!.x, pts[i]!.y);
    }
    ctx.closePath();
    ctx.lineWidth = selected ? Math.max(2.5, W * 0.0045) : Math.max(1, W * 0.002);
    ctx.strokeStyle = selected
      ? lab.tint || "#22d3ee"
      : "rgba(255,255,255,0.22)";
    ctx.setLineDash(selected ? [] : [6, 4]);
    if (selected) {
      ctx.fillStyle = lab.tint ? `${lab.tint}22` : "rgba(34,211,238,0.12)";
      ctx.fill();
    }
    ctx.stroke();
    ctx.restore();
  }
}

function loadKeyedComposite(
  url: string,
  view: "front" | "back",
  labels: Label2d[],
  selectedSlotId: string | null,
): Promise<{ tex: THREE.CanvasTexture; aspect: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const canvas = keyNearWhiteFloodCanvas(img);
        compositeLabelsOntoCanvas(canvas, view, labels, selectedSlotId);
        const tex = canvasToTexture(canvas);
        const aspect = (img.naturalWidth || img.width) / (img.naturalHeight || img.height);
        resolve({ tex, aspect });
      } catch (e) {
        reject(e);
      }
    };
    img.onerror = () => reject(new Error(`Failed to load texture: ${url.slice(0, 48)}`));
    img.src = url;
  });
}

const FIGURE_HEIGHT = 2.15;

function DualViewFigure({
  frontUrl,
  backUrl,
  labels,
  selectedSlotId,
  tintSig,
}: {
  frontUrl: string;
  backUrl: string;
  labels: Label2d[];
  selectedSlotId: string | null;
  /** Changes when any segment tint changes — forces rebuild. */
  tintSig: string;
}) {
  const [front, setFront] = useState<{ tex: THREE.CanvasTexture; aspect: number } | null>(null);
  const [back, setBack] = useState<{ tex: THREE.CanvasTexture; aspect: number } | null>(null);

  useEffect(() => {
    let alive = true;
    let fTex: THREE.CanvasTexture | null = null;
    let bTex: THREE.CanvasTexture | null = null;
    setFront(null);
    setBack(null);
    void Promise.all([
      loadKeyedComposite(frontUrl, "front", labels, selectedSlotId),
      loadKeyedComposite(backUrl, "back", labels, selectedSlotId),
    ]).then(([f, b]) => {
      if (!alive) {
        f.tex.dispose();
        b.tex.dispose();
        return;
      }
      fTex = f.tex;
      bTex = b.tex;
      setFront(f);
      setBack(b);
    });
    return () => {
      alive = false;
      fTex?.dispose();
      bTex?.dispose();
    };
    // tintSig encodes tint+selection so labels identity is covered
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [frontUrl, backUrl, selectedSlotId, tintSig]);

  useEffect(() => {
    return () => {
      front?.tex.dispose();
      back?.tex.dispose();
    };
  }, [front, back]);

  const frontW = front ? FIGURE_HEIGHT * front.aspect : 1;
  const backW = back ? FIGURE_HEIGHT * back.aspect : 1;
  const halfDepth = 0.012;

  if (!front || !back) return null;

  return (
    <group position={[0, FIGURE_HEIGHT / 2, 0]}>
      <mesh position={[0, 0, halfDepth]} castShadow>
        <planeGeometry args={[frontW, FIGURE_HEIGHT]} />
        <meshBasicMaterial
          map={front.tex}
          transparent
          alphaTest={0.12}
          side={THREE.FrontSide}
          depthWrite
          toneMapped={false}
        />
      </mesh>
      <mesh position={[0, 0, -halfDepth]} rotation={[0, Math.PI, 0]} castShadow>
        <planeGeometry args={[backW, FIGURE_HEIGHT]} />
        <meshBasicMaterial
          map={back.tex}
          transparent
          alphaTest={0.12}
          side={THREE.FrontSide}
          depthWrite
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}

function MappingLights({ theme }: { theme: "light" | "dark" }) {
  if (theme === "light") {
    return (
      <>
        <hemisphereLight args={["#f4f1ea", "#c8c2b6", 0.55]} />
        <ambientLight intensity={0.35} />
      </>
    );
  }
  return (
    <>
      <hemisphereLight args={["#cfd4dc", "#1a1c20", 0.4]} />
      <ambientLight intensity={0.25} />
    </>
  );
}

function CaptureBridge() {
  const gl = useThree((s) => s.gl);
  useEffect(() => {
    (window as unknown as { __frameMixCapture?: () => string }).__frameMixCapture = () =>
      gl.domElement.toDataURL("image/png");
    return () => {
      delete (window as unknown as { __frameMixCapture?: () => string }).__frameMixCapture;
    };
  }, [gl]);
  return null;
}

function CameraHome({ tick }: { tick: number }) {
  const camera = useThree((s) => s.camera);
  const controls = useThree((s) => s.controls) as {
    target?: { set: (x: number, y: number, z: number) => void };
    update?: () => void;
  } | null;
  useEffect(() => {
    if (tick === 0) return;
    camera.position.set(2.4, 1.6, 3.4);
    camera.lookAt(0, 1.05, 0);
    controls?.target?.set(0, 1.05, 0);
    controls?.update?.();
  }, [tick, camera, controls]);
  return null;
}

/**
 * Kit viewport: dual-sided front/back keyed silhouettes with 2D label overlays + live tints.
 * Pipeline: 2D label/cut → tint → then 3D (volume later). Not a volume mesh.
 */
export function MappingViewport() {
  const autoRotate = useStudio((s) => s.autoRotate);
  const theme = useStudio((s) => s.theme);
  const camTick = useStudio((s) => s.camTick);
  const front = useMapping((s) => s.views.front);
  const back = useMapping((s) => s.views.back);
  const segments = useMapping((s) => s.segments);
  const selectedSlotId = useMapping((s) => s.selectedSlotId);
  const selectedGroup = useMapping((s) => s.selectedGroup);
  const bg = theme === "light" ? "#f4f1ea" : "#0b0c0e";

  // Head group: only Head*/Face/Eye outlines — hide torso/back heuristic noise
  const labels = useMemo(
    () => labelsForOverlay(segments, selectedGroup),
    [segments, selectedGroup],
  );

  const tintSig = useMemo(
    () =>
      labels
        .map((l) => {
          const poly = l.polygon?.length
            ? `p${l.polygon.length}:${l.polygon[0]?.x?.toFixed(3)}`
            : l.normRect
              ? `r${l.normRect.x.toFixed(3)}`
              : "";
          return `${l.slotId}:${l.tint ?? ""}:${poly}`;
        })
        .sort()
        .join("|") + `|sel:${selectedSlotId ?? ""}`,
    [labels, selectedSlotId],
  );

  const urls = useMemo(() => {
    if (!front || !back) return null;
    return { front, back };
  }, [front, back]);

  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      camera={{ position: [2.4, 1.6, 3.4], fov: 38, near: 0.1, far: 50 }}
      gl={{ antialias: true, preserveDrawingBuffer: true, toneMapping: THREE.NoToneMapping }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.NoToneMapping;
        gl.toneMappingExposure = 1;
        gl.outputColorSpace = THREE.SRGBColorSpace;
        gl.shadowMap.type = THREE.PCFSoftShadowMap;
      }}
      className="h-full w-full touch-none bg-bg"
    >
      <color attach="background" args={[bg]} />
      <fog attach="fog" args={[bg, 9, 20]} />
      <Suspense fallback={null}>
        <MappingLights theme={theme} />
        {urls ? (
          <DualViewFigure
            frontUrl={urls.front}
            backUrl={urls.back}
            labels={labels}
            selectedSlotId={selectedSlotId}
            tintSig={tintSig}
          />
        ) : null}
        <Grid
          args={[12, 12]}
          cellSize={0.25}
          sectionSize={1}
          cellColor={theme === "light" ? "#ddd6c8" : "#1c1e22"}
          sectionColor={theme === "light" ? "#c9c1b2" : "#2a2d33"}
          fadeDistance={10}
          fadeStrength={1.4}
          position={[0, 0, 0]}
        />
        <ContactShadows
          position={[0, 0.001, 0]}
          opacity={theme === "light" ? 0.22 : 0.4}
          scale={8}
          blur={2.4}
          far={2.5}
        />
        <CaptureBridge />
        <CameraHome tick={camTick} />
      </Suspense>
      <OrbitControls
        makeDefault
        enableDamping
        dampingFactor={0.08}
        autoRotate={autoRotate}
        autoRotateSpeed={0.6}
        minDistance={1.4}
        maxDistance={8}
        minPolarAngle={0.2}
        maxPolarAngle={Math.PI / 2 - 0.04}
        target={[0, 1.05, 0]}
      />
    </Canvas>
  );
}
