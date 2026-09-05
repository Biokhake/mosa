import { chromium } from "playwright";

const url = process.argv[2] || "http://127.0.0.1:3020/";
const out = process.argv[3] || "/workspace/mosa-mapping-details-render.png";

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
  await page.waitForSelector("canvas", { timeout: 20000 });

  // Wait for RX-78 seed kit + crop pass
  await page.waitForTimeout(10000);

  // Ensure Details panel title is present
  const detailsTitle = page.locator("text=Details").first();
  await detailsTitle.waitFor({ timeout: 15000 }).catch(() => {});

  // Click a Head part (Head1) in Parts list if present
  const head1 = page.getByRole("button", { name: /Head1/i }).first();
  if (await head1.count()) {
    await head1.click();
    await page.waitForTimeout(1500);
  } else {
    // Fallback: click first part row button in Parts panel
    const partBtn = page.locator("aside button, [class*='Float'] button").filter({ hasText: /Chest|Head|Upper|Thigh/ }).first();
    if (await partBtn.count()) await partBtn.click();
    await page.waitForTimeout(1000);
  }

  // Probe store state via page evaluate
  const probe = await page.evaluate(() => {
    const titles = [...document.querySelectorAll("*")]
      .filter((el) => el.childNodes.length === 1 && el.textContent?.trim() === "Details")
      .map((el) => el.tagName);
    const cropImgs = [...document.querySelectorAll("img")].filter((img) =>
      /crop|data:image/.test(img.alt + img.src.slice(0, 30)),
    ).length;
    return {
      hasDetailsTitle: titles.length > 0 || document.body.innerText.includes("Details"),
      bodyHasCropPreview: document.body.innerText.includes("Crop preview"),
      bodyHasKits: document.body.innerText.includes("Kits"),
      bodyHasRx: document.body.innerText.includes("RX-78"),
      sample: document.body.innerText.slice(0, 800),
      cropImgs,
    };
  });
  console.log("probe:", JSON.stringify(probe, null, 2));
  console.log("logs:", logs.slice(0, 40).join("\n"));

  await page.screenshot({ path: out, fullPage: false });
  console.log(JSON.stringify({ ok: true, screenshot: out }));
} catch (err) {
  console.error(String(err?.message || err));
  process.exitCode = 1;
} finally {
  await browser.close();
}
