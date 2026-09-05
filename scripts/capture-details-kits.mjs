import { chromium } from "playwright";

const url = "http://127.0.0.1:3020/";
const out = "/workspace/mosa-mapping-details-kits.png";

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
  await page.waitForSelector('header img[alt="MOSA"]', { timeout: 30000 });
  const nameInput = page.getByLabel("Unit name and identification");
  await nameInput.waitFor({ timeout: 10000 });
  const kitBtn = page.getByRole("button", { name: "RX-78", exact: true }).first();
  await kitBtn.waitFor({ timeout: 45000 });
  const head1 = page.getByRole("button", { name: /Head1/i }).first();
  if (await head1.count()) await head1.click();
  await page.waitForTimeout(800);
  const topHeader = page.locator("header").filter({ has: page.locator('img[alt="MOSA"]') });
  const headerText = await topHeader.innerText();
  const detailsPanel = page.locator("text=Details").first();
  const kitsLabelInDetails = await page.locator("p", { hasText: /^Kits$/ }).count();
  const hasTTL = await page.getByRole("button", { name: "TTL", exact: true }).count();
  const hasSSA = await page.getByRole("button", { name: "SSA-001" }).count();
  const headerAddKit = await topHeader.getByLabel("Add Kit").count();
  await page.screenshot({ path: out, fullPage: false });
  await kitBtn.click({ button: "right" });
  await page.waitForTimeout(400);
  const menu = await page.locator('[role="menu"]').count();
  console.log(
    JSON.stringify(
      {
        ok: true,
        screenshot: out,
        headerText: headerText.replace(/\s+/g, " ").slice(0, 220),
        headerHasKitsChipRow: /\bKits\b/.test(headerText) && headerAddKit > 0,
        headerAddKit,
        kitsLabelInDetails,
        ttlChips: hasTTL,
        ssaCatalogGone: hasSSA === 0,
        contextMenu: menu > 0,
        nameValue: await nameInput.inputValue(),
        errors: logs.filter((l) => l.includes("pageerror") || l.includes("error")).slice(0, 15),
      },
      null,
      2,
    ),
  );
} finally {
  await browser.close();
}
