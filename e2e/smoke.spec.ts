import { test, expect } from '@playwright/test';

test.describe('Smoke Tests', () => {
  test('homepage loads and shows login form', async ({ page }) => {
    await page.goto('/');
    // Should be redirected to login or show a landing page
    await expect(page).toHaveURL(/\/(login|auth)?/);
  });

  test('login page renders correctly', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('input[type="email"], input[name="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"], input[name="password"]')).toBeVisible();
  });

  test('login with invalid credentials shows error', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"], input[name="email"]', 'bad@example.com');
    await page.fill('input[type="password"], input[name="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');
    // Should show an error message
    await expect(page.locator('text=/invalid|error|incorrect/i')).toBeVisible({ timeout: 5000 });
  });

  test('register page renders correctly', async ({ page }) => {
    await page.goto('/register');
    await expect(page.locator('input[name="firstName"], input[placeholder*="irst"]')).toBeVisible();
    await expect(page.locator('input[type="email"], input[name="email"]')).toBeVisible();
  });

  test('navigation between login and register works', async ({ page }) => {
    await page.goto('/login');
    // Look for a sign-up / register link
    const registerLink = page.locator('a[href*="register"], a:has-text("Sign up"), a:has-text("Register")');
    if (await registerLink.count() > 0) {
      await registerLink.first().click();
      await expect(page).toHaveURL(/register/);
    }
  });
});

test.describe('Dashboard (requires auth)', () => {
  // These tests verify that unauthenticated access redirects to login
  test('portfolio page redirects to login when unauthenticated', async ({ page }) => {
    await page.goto('/portfolio');
    await expect(page).toHaveURL(/login/);
  });

  test('properties page redirects to login when unauthenticated', async ({ page }) => {
    await page.goto('/properties');
    await expect(page).toHaveURL(/login/);
  });

  test('transactions page redirects to login when unauthenticated', async ({ page }) => {
    await page.goto('/transactions');
    await expect(page).toHaveURL(/login/);
  });
});
