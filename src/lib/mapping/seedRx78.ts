import { useMapping } from "./store";

const KIT_NAME = "RX-78";
const LEGACY_NAMES = ["RX-78-2"];
const FRONT_URL = "/seed/rx78-front.jpg";
const BACK_URL = "/seed/rx78-back.jpg";

async function fetchAsDataUrl(url: string): Promise<string> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch ${url}: ${res.status}`);
  }
  const blob = await res.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error ?? new Error(`read failed: ${url}`));
    reader.readAsDataURL(blob);
  });
}

/** Idempotent: loads RX-78 seed kit once if no kit with that name exists. */
export async function seedRx78Kit(): Promise<boolean> {
  const state = useMapping.getState();
  const legacy = state.kits.find((k) => LEGACY_NAMES.includes(k.name));
  if (legacy) {
    state.renameKit(legacy.id, KIT_NAME);
  }
  if (useMapping.getState().kits.some((k) => k.name === KIT_NAME)) {
    return false;
  }
  const [front, back] = await Promise.all([
    fetchAsDataUrl(FRONT_URL),
    fetchAsDataUrl(BACK_URL),
  ]);
  // Re-check after await in case of concurrent mounts
  if (useMapping.getState().kits.some((k) => k.name === KIT_NAME)) {
    return false;
  }
  useMapping.getState().addKit({ name: KIT_NAME, front, back });
  return true;
}
