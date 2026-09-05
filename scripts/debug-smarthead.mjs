import { chromium } from "playwright";
const browser = await chromium.launch({ headless: true, args: ["--no-sandbox", "--disable-dev-shm-usage"] });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
page.on("pageerror", (e) => console.log("PAGEERROR", e.message));
await page.goto("http://127.0.0.1:3020/", { waitUntil: "domcontentloaded", timeout: 60000 });
await page.waitForFunction(() => !!window.__mosaMapping?.selectSlot, { timeout: 45000 });
await page.waitForTimeout(9000);
await page.evaluate(() => window.__mosaMapping?.setMergeHead12Mode?.("forceSplit"));
await page.waitForTimeout(4000);
const dump = await page.evaluate(() => {
  // Access zustand via selecting each head slot
  const out = {};
  for (const id of ["Head1", "Head2", "Head3"]) {
    window.__mosaMapping.selectSlot(id);
  }
  // Re-read via a hack: store isn't fully exposed; use getSelected after each
  const parts = {};
  for (const id of ["Head1", "Head2", "Head3"]) {
    window.__mosaMapping.selectSlot(id);
    parts[id] = window.__mosaMapping.getSelected();
  }
  return parts;
});
console.log(JSON.stringify(dump, null, 2));
await browser.close();
