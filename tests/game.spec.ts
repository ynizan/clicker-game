import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Clicker Game Widget', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/widget');
  });

  test('should load game widget', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Clicker Game');
    await expect(page.locator('#score')).toBeVisible();
    await expect(page.locator('#clickBtn')).toBeVisible();
  });

  test('should display initial score of 0', async ({ page }) => {
    await expect(page.locator('#score')).toHaveText('0');
  });

  test('should display upgrade buttons', async ({ page }) => {
    await expect(page.locator('#multiplierBtn')).toBeVisible();
    await expect(page.locator('#autoClickerBtn')).toBeVisible();
  });

  test('should display stats section', async ({ page }) => {
    await expect(page.locator('.stats')).toBeVisible();
    await expect(page.locator('#multiplier')).toHaveText('1');
    await expect(page.locator('#autoClickers')).toHaveText('0');
  });

  test('visual regression - game container', async ({ page }) => {
    await expect(page.locator('.game-container')).toHaveScreenshot('game-container.png');
  });
});

test.describe('Static Pages', () => {
  test('should load homepage', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/.*|/);
    const content = await page.textContent('body');
    expect(content).toContain('Clicker Game MCP Server');
  });

  test('should load privacy policy', async ({ page }) => {
    await page.goto('/privacy-policy');
    await expect(page.locator('h1')).toContainText('Privacy Policy');
  });

  test('should load terms of service', async ({ page }) => {
    await page.goto('/terms');
    await expect(page.locator('h1')).toContainText('Terms of Service');
  });
});

test.describe('Accessibility', () => {
  test('game widget should have no accessibility violations', async ({ page }) => {
    await page.goto('/widget');
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('privacy policy should have no accessibility violations', async ({ page }) => {
    await page.goto('/privacy-policy');
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('terms page should have no accessibility violations', async ({ page }) => {
    await page.goto('/terms');
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
    expect(accessibilityScanResults.violations).toEqual([]);
  });
});

test.describe('Responsive Design', () => {
  test('game container should be responsive on mobile', async ({ page }) => {
    await page.goto('/widget');
    const container = page.locator('.game-container');
    await expect(container).toBeVisible();
    const box = await container.boundingBox();
    expect(box?.width).toBeLessThanOrEqual(400);
  });

  test('click button should be visible and interactive on all viewports', async ({ page }) => {
    await page.goto('/widget');
    const clickBtn = page.locator('#clickBtn');
    await expect(clickBtn).toBeVisible();
    await expect(clickBtn).toBeEnabled();
  });

  test('upgrade buttons should stack vertically', async ({ page }) => {
    await page.goto('/widget');
    const upgrades = page.locator('.upgrades');
    await expect(upgrades).toHaveCSS('flex-direction', 'column');
  });
});
