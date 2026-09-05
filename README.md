# MOSA Mapping (`mosa-mapping`)

**매핑 / 캡처 엔진** — Front + Back 이미지를 파트 슬롯에 매핑해 렌더하는 독립 앱입니다.

## 이게 뭔가요?

- **UI 셸:** MOSA 에디터 크롬(헤더, FloatPanel, Hangar 뷰포트)을 빌려 씁니다.
- **엔진:** **완전 신규** 매핑 엔진입니다. Claude kit geometry 생성기가 **아닙니다**.
- Front / Back 이미지 → 파트 슬롯에 맵 → 렌더. **빈(empty) 세그먼트는 hide**.
- 슬롯은 omit / group 가능. Body는 `Body1`/`Body2`(Body12 아님), Leg는 `LegL`+`LegR`.

## 포트

```bash
bun install
bun run dev
```

- Dev 서버: **http://0.0.0.0:3020** (3000 / 3010 아님)
- 배지: `mapping :3020`

## 엔진 위치

```
src/lib/mapping/
  types.ts      — MappingState, SegmentVisibility
  slots.ts      — 슬롯 정의 + group/omit 헬퍼
  engine.ts     — mapViewsToSegments(front, back) 스텁 (비전/LLM 매핑은 다음 단계)
  store.ts      — UI 상태
  slots.json    — 제품 슬롯 스키마
```

`mapViewsToSegments`는 플레이스홀더입니다. 실제 vision/LLM 매핑은 이후 붙입니다. empty → `visibility: "hidden"` 로직은 이미 코드에 있습니다.


## 2D labeling pipeline (before volume / 3D mesh)

We establish **cut in 2D → then 3D render**, not jump-to-3D via perspective/shadows. Heuristic crop rects in `crops.ts` are the **2D label boxes** for most slots (`label2d.ts`: segment → `{ view, normRect?, polygon?, tint }`). **Head1/2/3** use `smartHead.ts` geometry (skull / top structures / side→back wrap) with **polygonal** masks — not square partitions. MappingViewport strokes polygon lassos; selected part = stronger stroke. Zaku-like heads with weak top protrusion auto-**merge Head1+Head2** (`mergeHead12Mode`: auto/merge/split in Parts). Details Part Color tints inside the polygon mask. Volume mesh / 3D part subdivision is **later**.

## 슬롯 스키마

| Group | Slots |
|-------|--------|
| Head | Head1, Head2, Head3, Face, Eye, Acc1, Acc2, Acc3 |
| Torso | Chest1, Chest2, Chest3, Body1, Body2 |
| Waist | Front, Side, Back |
| ArmL / ArmR | Shoulder1, Shoulder2, Upper, Forearm, Vambrace, Hand |
| LegL / LegR | Thigh, Shin1, Shin2, Foot |
| Back | PackCore, Thruster, BinderR, BinderL, Stabilizer |
| Weapons | WeaponR, WeaponL |

## 주의

- `/workspace/mosa-aistudio-extract/mosa-main` (Claude extract) — **수정하지 않음**
- `/workspace/mosa-hybrid` Kits 실험 — **제품으로 쓰지 않음 / 수정하지 않음**
- 이 폴더(`/workspace/mosa-mapping`)만 매핑 제품입니다.

## UI (product)

- **Parts** (left): mapping slots by group
- **Hangar** (center)
- **Details** (right): classic **part** editing (variant / paint / AxisSliders) — not the kit editor
- **Kits**: Details → StylePicker zone (`Kits` label, TTL/SS/SR/RS/RR chrome). Seed kit `RX-78`. `+` Add Kit modal; right-click Edit/Copy/Delete/Rename
- **Right-click a kit** → Edit / Rename / Copy / Delete. **Edit** opens Front/Back kit editor; Close returns to part Details

