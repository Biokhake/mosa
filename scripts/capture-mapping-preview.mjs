import { chromium } from "playwright";

const url = process.argv[2] || "http://127.0.0.1:3020/";
const out = process.argv[3] || "/workspace/mosa-mapping-preview.png";

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
  await page.waitForTimeout(8000);
  try {
    await page.waitForSelector("header", { timeout: 20000 });
    console.log("header found");
  } catch {
    console.log("no header");
  }
  try {
    await page.waitForSelector("canvas", { timeout: 10000 });
    console.log("canvas found");
  } catch {
    console.log("no canvas");
  }
  await page.waitForTimeout(2000);
  const text = await page.locator("body").innerText().catch(() => "");
  console.log("bodyTextSample:", JSON.stringify(text.slice(0, 500)));
  console.log("logs:", logs.slice(0, 40).join("\n"));
  await page.screenshot({ path: out, fullPage: false });
  console.log(JSON.stringify({ ok: true, screenshot: out }));
} catch (err) {
  console.error(String(err?.message || err));
  process.exitCode = 1;
} finally {
  await browser.close();
}
