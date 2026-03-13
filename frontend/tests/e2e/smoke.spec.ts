import { test, expect } from '@playwright/test';

test.describe('MERIDIAN frontend smoke', () => {
  test('landing page loads', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/MERIDIAN/i, { timeout: 15_000 });
  });

  test('dashboard route loads', async ({ page }) => {
    await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });
    await expect(page.getByPlaceholder(/search here/i)).toBeVisible({ timeout: 60_000 });
  });

  test('mcp explorer loads', async ({ page }) => {
    await page.goto('/mcp', { waitUntil: 'domcontentloaded' });
    await expect(page.getByText('Read Tools')).toBeVisible({ timeout: 60_000 });
  });

  test('x402 page loads', async ({ page }) => {
    await page.goto('/x402', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('button', { name: /request/i })).toBeVisible({ timeout: 60_000 });
  });
});
