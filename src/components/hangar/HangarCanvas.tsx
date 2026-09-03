import { Canvas, useThree } from "@react-three/fiber";
import { ContactShadows, OrbitControls, Grid } from "@react-three/drei";
import { Suspense, useEffect, useMemo } from "react";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { SLOTS, BEAM_MELEE } from "@/lib/mech/catalog";
import type { SlotDef } from "@/lib/mech/types";
import {
  RIG_NODE_BY_ID,
  rigChildren,
  nodeForSlot,
  NODE_GROUP,
  type RigNodeId,
} from "@/lib/mech/rig";
import { buildPart, disposePart } from "@/lib/mech/geometry";
import { explodeDir, DEFAULT_VISOR } from "@/lib/mech/palette";
import { poseNodeRotation, poseRoot, type PoseId } from "@/lib/mech/poses";
import { useStudio } from "@/lib/mech/store";

const DEG = Math.PI / 180;

function SlotMesh({
  id,
  variant,
  paint,
  paint2,
  light,
  edges,
  theme,
  beamZ,
}: {
  id: string;
  variant: string;
  paint: string | null;
  paint2: string | null;
  light: string | null;
  edges: boolean;
  theme: "light" | "dark";
  beamZ: number;
}) {
  const group = useMemo(
    () => buildPart(id, variant, paint, edges, theme, light, beamZ, paint2),
    [id, variant, paint, paint2, light, edges, theme, beamZ],
  );
  useEffect(() => () => disposePart(group), [group]);
  return <primitive object={group} />;
}

function MechRig() {
  const slots = useStudio((s) => s.slots);
  const groupXform = useStudio((s) => s.groupXform);
  const explode = useStudio((s) => s.explode);
  const edges = useStudio((s) => s.edges);
  const theme = useStudio((s) => s.theme);
  const poseId = useStudio((s) => s.poseId) as PoseId;
  const light = useStudio((s) => s.light) || slots.visor?.paint || DEFAULT_VISOR;

  const slotsByNode = useMemo(() => {
    const m = new Map<RigNodeId, SlotDef[]>();
    for (const def of SLOTS) {
      const n = nodeForSlot(def.id);
      (m.get(n) ?? m.set(n, []).get(n)!).push(def);
    }
    return m;
  }, []);

  const root = poseRoot(poseId);

  const renderNode = (id: RigNodeId) => {
    const node = RIG_NODE_BY_ID[id];
    const parent = node.parent ? RIG_NODE_BY_ID[node.parent] : null;
    const pr = parent ? parent.rest : ([0, 0, 0] as const);
    const isRoot = id === "root";
    const pose = poseNodeRotation(id, poseId);
    const gx = NODE_GROUP[id] ? groupXform[NODE_GROUP[id]!] : undefined;

    // node transform: rest offset from parent, + pose rotation (+ whole-body
    // attitude at the root), + this region's groupXform. Everything distal —
    // this node's own slots AND its child nodes — inherits it.
    const position: [number, number, number] = [
      node.rest[0] - pr[0] + (gx?.px ?? 0) + (isRoot ? root.pos[0] : 0),
      node.rest[1] - pr[1] + (gx?.py ?? 0) + (isRoot ? root.pos[1] : 0),
      node.rest[2] - pr[2] + (gx?.pz ?? 0) + (isRoot ? root.pos[2] : 0),
    ];
    const rotation: [number, number, number] = [
      (pose[0] + (gx?.rx ?? 0) + (isRoot ? root.rot[0] : 0)) * DEG,
      (pose[1] + (gx?.ry ?? 0) + (isRoot ? root.rot[1] : 0)) * DEG,
      (pose[2] + (gx?.rz ?? 0) + (isRoot ? root.rot[2] : 0)) * DEG,
    ];
    const scale: [number, number, number] = [gx?.sx ?? 1, gx?.sy ?? 1, gx?.sz ?? 1];

    return (
      <group key={id} position={position} rotation={rotation} scale={scale}>
        {(slotsByNode.get(id) ?? []).map((def) => {
          const st = slots[def.id];
          if (!st || !st.visible || st.variant === "none") return null;
          const [dx, dy, dz] = explodeDir(def.socket);
          const k = explode * 0.85;
          // groups with no rig node (back / weapon / extra) keep a per-slot xform
          const wg =
            def.group === "weapon" || def.group === "extra" || def.group === "back"
              ? groupXform[def.group]
              : undefined;
          const beam = BEAM_MELEE.has(st.variant);
          return (
            <group
              key={def.id}
              userData={{ slotId: def.id }}
              position={[
                def.socket[0] - node.rest[0] + st.px + (wg?.px ?? 0) + dx * k,
                def.socket[1] - node.rest[1] + st.py + (wg?.py ?? 0) + dy * k,
                def.socket[2] - node.rest[2] + st.pz + (wg?.pz ?? 0) + dz * k,
              ]}
              rotation={[
                (st.rx + (wg?.rx ?? 0)) * DEG,
                (st.ry + (wg?.ry ?? 0)) * DEG,
                (st.rz + (wg?.rz ?? 0)) * DEG,
              ]}
              scale={[st.sx, st.sy, beam ? 1 : st.sz]}
            >
              <SlotMesh
                id={def.id}
                variant={st.variant}
                paint={st.paint}
                paint2={st.paint2 ?? null}
                light={light}
                edges={edges}
                theme={theme}
                beamZ={beam ? st.sz : 1}
              />
            </group>
          );
        })}
        {rigChildren(id).map((c) => renderNode(c.id))}
      </group>
    );
  };

  return <group>{renderNode("root")}</group>;
}

function slotIdOf(obj: THREE.Object3D | null): string | undefined {
  let o: THREE.Object3D | null = obj;
  while (o) {
    const id = o.userData?.slotId as string | undefined;
    if (id) return id;
    o = o.parent;
  }
  return undefined;
}

const _box = new THREE.Box3();
const _size = new THREE.Vector3();

function slotVolume(obj: THREE.Object3D): number {
  let root: THREE.Object3D = obj;
  const id = slotIdOf(obj);
  while (root.parent && slotIdOf(root.parent) === id) root = root.parent;
  _box.setFromObject(root);
  _box.getSize(_size);
  return Math.max(0.0008, _size.x) * Math.max(0.0008, _size.y) * Math.max(0.0008, _size.z);
}

function pickSlotAt(scene: THREE.Scene, camera: THREE.Camera, ndc: THREE.Vector2): string | null {
  const raycaster = new THREE.Raycaster();
  raycaster.setFromCamera(ndc, camera);
  const hits = raycaster.intersectObject(scene, true);
  type Cand = { id: string; dist: number; vol: number };
  const best = new Map<string, Cand>();
  for (const h of hits) {
    if (!(h.object instanceof THREE.Mesh)) continue;
    const id = slotIdOf(h.object);
    if (!id) continue;
    const prev = best.get(id);
    if (prev && prev.dist <= h.distance) continue;
    best.set(id, { id, dist: h.distance, vol: slotVolume(h.object) });
  }
  if (!best.size) return null;
  const list = [...best.values()];
  const nearest = Math.min(...list.map((c) => c.dist));
  const nearby = list.filter((c) => c.dist <= nearest + 0.16);
  nearby.sort((a, b) => a.vol - b.vol || a.dist - b.dist);
  return nearby[0]?.id ?? null;
}

function ndcFromEvent(el: HTMLElement, ev: PointerEvent | MouseEvent, out: THREE.Vector2) {
  const rect = el.getBoundingClientRect();
  out.set(((ev.clientX - rect.left) / rect.width) * 2 - 1, -((ev.clientY - rect.top) / rect.height) * 2 + 1);
  return out;
}

function PartPicker() {
  const camera = useThree((s) => s.camera);
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  const ndc = useMemo(() => new THREE.Vector2(), []);

  useEffect(() => {
    const el = gl.domElement;
    const onDbl = (ev: MouseEvent) => {
      ndcFromEvent(el, ev, ndc);
      const id = pickSlotAt(scene, camera, ndc);
      if (id) {
        useStudio.getState().closePoseMenu();
        useStudio.getState().pickSlot(id);
        return;
      }
      const rect = el.getBoundingClientRect();
      useStudio.getState().openPoseMenu(ev.clientX - rect.left, ev.clientY - rect.top);
    };
    const onPointerDown = (ev: PointerEvent) => {
      if (ev.detail >= 2) return;
      if (!useStudio.getState().poseMenu) return;
      ndcFromEvent(el, ev, ndc);
      if (pickSlotAt(scene, camera, ndc)) return;
      useStudio.getState().closePoseMenu();
    };
    const onMove = (ev: PointerEvent) => {
      ndcFromEvent(el, ev, ndc);
      const id = pickSlotAt(scene, camera, ndc);
      el.style.cursor = id ? "pointer" : "";
    };
    el.addEventListener("dblclick", onDbl);
    el.addEventListener("pointerdown", onPointerDown);
    el.addEventListener("pointermove", onMove);
    return () => {
      el.removeEventListener("dblclick", onDbl);
      el.removeEventListener("pointerdown", onPointerDown);
      el.removeEventListener("pointermove", onMove);
      el.style.cursor = "";
    };
  }, [camera, gl, scene, ndc]);
  return null;
}

function Lights({ theme }: { theme: "light" | "dark" }) {
  if (theme === "light") {
    return (
      <>
        <hemisphereLight args={["#f4f1ea", "#c8c2b6", 0.85]} />
        <directionalLight
          position={[4.5, 8, 5]}
          intensity={1.35}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          shadow-bias={-0.0002}
          shadow-camera-near={1}
          shadow-camera-far={22}
          shadow-camera-left={-4}
          shadow-camera-right={4}
          shadow-camera-top={4}
          shadow-camera-bottom={-4}
        />
        <directionalLight position={[-5, 3, -2]} intensity={0.35} color="#9aa8b8" />
      </>
    );
  }
  return (
    <>
      <hemisphereLight args={["#cfd4dc", "#1a1c20", 0.55]} />
      <directionalLight
        position={[4.5, 8, 5]}
        intensity={1.5}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-bias={-0.0002}
        shadow-camera-near={1}
        shadow-camera-far={22}
        shadow-camera-left={-4}
        shadow-camera-right={4}
        shadow-camera-top={4}
        shadow-camera-bottom={-4}
      />
      <directionalLight position={[-5, 3, -2]} intensity={0.45} color="#9aa8b8" />
      <directionalLight position={[0, 2, 6]} intensity={0.25} color="#e8e6e1" />
    </>
  );
}

function StudioEnv() {
  const scene = useThree((s) => s.scene);
  const gl = useThree((s) => s.gl);
  useEffect(() => {
    gl.toneMapping = THREE.ACESFilmicToneMapping;
    gl.toneMappingExposure = 1.08;
    gl.outputColorSpace = THREE.SRGBColorSpace;
    gl.shadowMap.enabled = true;
    gl.shadowMap.type = THREE.PCFSoftShadowMap;
    const room = new RoomEnvironment();
    const pmrem = new THREE.PMREMGenerator(gl);
    const tex = pmrem.fromScene(room, 0.04).texture;
    scene.environment = tex;
    scene.environmentIntensity = 0.62;
    room.dispose();
    return () => {
      scene.environment = null;
      tex.dispose();
      pmrem.dispose();
    };
  }, [scene, gl]);
  return null;
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

export function HangarCanvas() {
  const autoRotate = useStudio((s) => s.autoRotate);
  const theme = useStudio((s) => s.theme);
  const camTick = useStudio((s) => s.camTick);
  const bg = theme === "light" ? "#f4f1ea" : "#0b0c0e";

  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      camera={{ position: [2.4, 1.6, 3.4], fov: 38, near: 0.1, far: 50 }}
      gl={{ antialias: true, preserveDrawingBuffer: true, toneMapping: THREE.ACESFilmicToneMapping }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.08;
        gl.shadowMap.type = THREE.PCFSoftShadowMap;
      }}
      className="h-full w-full touch-none bg-bg"
    >
      <color attach="background" args={[bg]} />
      <fog attach="fog" args={[bg, 9, 20]} />
      <Suspense fallback={null}>
        <Lights theme={theme} />
        <StudioEnv />
        <MechRig />
        <PartPicker />
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
          opacity={theme === "light" ? 0.28 : 0.45}
          scale={8}
          blur={2.2}
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
