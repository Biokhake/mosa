import { chromium } from "playwright";

const url = process.argv[2] || "http://127.0.0.1:3020/";
const out = process.argv[3] || "/workspace/mosa-mapping-2d-tint.png";

const browser = await chromium.launch({
  headless: true,
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});

try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const logs = [];
  page.on("console", (m) => logs.push(`[${m.type()}] ${m.text()}`));
  page.on("pageerror", (e) => logs.push(`[pageerror] ${e.message}`));

  const resp = await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });
  console.log(JSON.stringify({ status: resp?.status() ?? 0 }));

  await page.waitForSelector("canvas", { timeout: 30000 });
  // Wait for seed kit + mapping ready + bridge
  await page.waitForFunction(
    () => Boolean(window.__mosaMapping) && document.querySelectorAll("canvas").length > 0,
    { timeout: 45000 },
  );
  // Give crops / textures time to settle
  await page.waitForTimeout(5000);

  const before = await page.evaluate(() => {
    const m = window.__mosaMapping;
    m.selectSlot("Head1");
    return m.getSelected();
  });
  console.log("selected before tint:", JSON.stringify(before));

  await page.waitForTimeout(800);

  await page.evaluate(() => {
    window.__mosaMapping.setSegmentTint("Head1", "#FF1493"); // hot pink
  });

  // Wait until tint is stored and canvas composite can rebuild
  await page.waitForFunction(
    () => window.__mosaMapping.getSelected().tint === "#FF1493",
    { timeout: 10000 },
  );
  await page.waitForTimeout(2500);

  const after = await page.evaluate(() => window.__mosaMapping.getSelected());
  console.log("selected after tint:", JSON.stringify(after));

  // Prefer WebGL capture of the hangar if available
  const captured = await page.evaluate(() => {
    try {
      return window.__frameMixCapture?.() || null;
    } catch {
      return null;
    }
  });

  if (captured && captured.startsWith("data:image")) {
    const fs = await import("node:fs");
    const b64 = captured.replace(/^data:image\/\w+;base64,/, "");
    fs.writeFileSync(out, Buffer.from(b64, "base64"));
    console.log(JSON.stringify({ ok: true, via: "frameMixCapture", screenshot: out }));
  } else {
    await page.screenshot({ path: out, fullPage: false });
    console.log(JSON.stringify({ ok: true, via: "page", screenshot: out }));
  }

  console.log("logs:", logs.slice(0, 30).join("\n"));
} catch (err) {
  console.error(String(err?.message || err));
  process.exitCode = 1;
} finally {
  await browser.close();
}
