import { test, expect } from "@playwright/test";

test.describe("Phaser 4 Game Arena (/lessons/[slug]/game)", () => {
  const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000";

  test("should render the Phaser 2D Canvas Arena and characters smoothly in main game route", async ({ page }) => {
    // Navigate to standard Game route
    await page.goto(`${BASE_URL}/lessons/bai-tap-1/game`);

    // Wait for the container to mount
    const arenaContainer = page.locator(".aspect-\\[16\\/9\\]");
    await expect(arenaContainer).toBeVisible({ timeout: 15000 });

    // Wait for canvas created by Phaser
    const canvas = arenaContainer.locator("canvas");
    await expect(canvas).toBeVisible({ timeout: 15000 });

    // Verify canvas dimensions
    const box = await canvas.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.width).toBeGreaterThan(300);
    expect(box!.height).toBeGreaterThan(150);

    // Verify Mute button toggle exists and can be clicked
    const muteButton = page.locator("button:has-text('ÂM:')");
    await expect(muteButton).toBeVisible();
    await muteButton.click();

    // Capture screenshot for visual inspection
    await canvas.screenshot({ path: "apps/web/tests/e2e/screenshots/phaser-arena.png" });
  });
});
