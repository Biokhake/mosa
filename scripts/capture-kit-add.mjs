import { chromium } from "playwright";

const url = "http://127.0.0.1:3020/";
const out = "/workspace/mosa-mapping-kit-add.png";

const browser = await chromium.launch({
  headless: true,
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});

try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const logs = [];
  page.on("console", (m) => logs.push(`[${m.type()}] ${m.text()}`));
  page.on("pageerror", (e) => logs.push(`[pageerror] ${e.message}`));
  const resp = await page.goto(url, { waitUntil: "networkidle", timeout: 60000 });
  console.log("status", resp?.status());
  await page.waitForSelector("header", { timeout: 30000 });
  // Prefer header Add Kit, else Kits panel +
  const headerBtn = page.getByRole("button", { name: "Add Kit" }).first();
  await headerBtn.waitFor({ timeout: 15000 });
  await headerBtn.click();
  await page.waitForSelector("#add-kit-title", { timeout: 10000 });
  await page.waitForTimeout(800);
  await page.screenshot({ path: out, fullPage: false });
  const title = await page.locator("#add-kit-title").innerText();
  console.log(JSON.stringify({ ok: true, screenshot: out, title, logs: logs.slice(0, 30) }, null, 2));
} catch (err) {
  console.error(String(err?.message || err));
  process.exitCode = 1;
} finally {
  await browser.close();
}
