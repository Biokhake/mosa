import { chromium } from "playwright";

const url = process.argv[2] || "http://127.0.0.1:3020/";
const out = process.argv[3] || "/workspace/mosa-mapping-head-poly.png";
const slot = process.argv[4] || "Head2";

const browser = await chromium.launch({
  headless: true,
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});

try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const logs = [];
  page.on("console", (m) => logs.push(`[${m.type()}] ${m.text()}`));
  page.on("pageerror", (e) => logs.push(`[pageerror] ${e.message}`));
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForSelector("canvas", { timeout: 45000 });
  await page.waitForFunction(() => !!window.__mosaMapping?.selectSlot, { timeout: 45000 });
  await page.waitForTimeout(8000);

  await page.evaluate(() => window.__mosaMapping?.setMergeHead12Mode?.("forceSplit"));
  await page.waitForTimeout(4000);

  await page.evaluate((slotId) => window.__mosaMapping?.selectSlot?.(slotId), slot);
  await page.waitForTimeout(2500);

  const info = await page.evaluate(() => window.__mosaMapping?.getSelected?.() ?? null);
  console.log("selected", JSON.stringify({
    slotId: info?.slotId,
    mergeHead12: info?.mergeHead12,
    polyN: info?.polygon?.length,
    poly: info?.polygon?.slice(0, 4),
  }));

  const canvas = page.locator("canvas").first();
  const box = await canvas.boundingBox();
  if (box) {
    const cx = box.x + box.width * 0.55;
    const cy = box.y + box.height * 0.35;
    // zoom in toward head
    await page.mouse.move(cx, cy);
    for (let i = 0; i < 12; i++) {
      await page.mouse.wheel(0, -120);
      await page.waitForTimeout(50);
    }
    // pan slightly up
    await page.mouse.move(cx, cy);
    await page.mouse.down();
    await page.mouse.move(cx, cy + 90, { steps: 8 });
    await page.mouse.up();
    await page.waitForTimeout(800);
  }

  await page.screenshot({ path: out, fullPage: false });
  console.log(JSON.stringify({ ok: true, screenshot: out, logs: logs.slice(-8) }));
} catch (err) {
  console.error(String(err?.message || err));
  process.exitCode = 1;
} finally {
  await browser.close();
}
