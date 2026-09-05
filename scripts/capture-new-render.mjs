import { chromium } from "playwright";

const url = process.argv[2] || "http://127.0.0.1:3020/";
const out = process.argv[3] || "/workspace/mosa-mapping-new-render.png";

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

  await page.waitForSelector("header", { timeout: 30000 });
  await page.waitForSelector("canvas", { timeout: 30000 });

  // Wait for RX-78 seed + keyed texture processing
  await page.waitForTimeout(12000);

  // Probe: ensure RX-78 kit active and MappingViewport path
  const probe = await page.evaluate(() => {
    const text = document.body.innerText;
    const canvas = document.querySelector("canvas");
    return {
      hasRx: text.includes("RX-78"),
      hasMappingBadge: text.includes("mapping"),
      canvasW: canvas?.width ?? 0,
      canvasH: canvas?.height ?? 0,
      sample: text.slice(0, 400),
    };
  });
  console.log("probe:", JSON.stringify(probe, null, 2));
  console.log("logs:", logs.slice(0, 50).join("\n"));

  // Prefer WebGL capture if available (cleaner figure crop), else page screenshot
  const dataUrl = await page.evaluate(() => {
    const cap = window.__frameMixCapture;
    return typeof cap === "function" ? cap() : null;
  });

  if (dataUrl && dataUrl.startsWith("data:image")) {
    const fs = await import("node:fs");
    const b64 = dataUrl.split(",")[1];
    fs.writeFileSync(out, Buffer.from(b64, "base64"));
    console.log(JSON.stringify({ ok: true, screenshot: out, via: "webgl-capture" }));
  } else {
    await page.screenshot({ path: out, fullPage: false });
    console.log(JSON.stringify({ ok: true, screenshot: out, via: "page-screenshot" }));
  }

  // Also save full page UI for context
  await page.screenshot({ path: "/workspace/mosa-mapping-new-render-ui.png", fullPage: false });
} catch (err) {
  console.error(String(err?.message || err));
  process.exitCode = 1;
} finally {
  await browser.close();
}
