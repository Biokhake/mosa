import { chromium } from "playwright";

const url = "http://127.0.0.1:3020/";
const out = "/workspace/mosa-mapping-kit-menu.png";

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
  // Wait for seeded kit name chip
  const kitChip = page.getByRole("button", { name: "RX-78" }).first();
  await kitChip.waitFor({ timeout: 45000 });
  // Ensure Details shows part editing (classic)
  await page.waitForTimeout(1200);
  // Right-click kit name for context menu
  await kitChip.click({ button: "right" });
  await page.waitForSelector('[role="menu"][aria-label*="kit menu"]', { timeout: 10000 });
  await page.waitForTimeout(400);
  await page.screenshot({ path: out, fullPage: false });
  const menuText = await page.locator('[role="menu"][aria-label*="kit menu"]').innerText();
  const hasDetails = await page.getByText("Part 1 Color").count();
  const hasKitsThumbs = await page.locator('img[alt=""]').count(); // soft
  console.log(
    JSON.stringify(
      {
        ok: true,
        screenshot: out,
        menuText,
        hasPart1Color: hasDetails > 0,
        logs: logs.filter((l) => l.includes("pageerror") || l.includes("error")).slice(0, 20),
      },
      null,
      2,
    ),
  );
} catch (err) {
  console.error(String(err?.message || err));
  process.exitCode = 1;
} finally {
  await browser.close();
}
