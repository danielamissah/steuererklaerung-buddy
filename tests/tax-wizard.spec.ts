import { test, expect } from '@playwright/test';

test.describe('Steuererklärung Buddy Wizard', () => {
  test('should complete the first step of the tax wizard', async ({ page }) => {
    // Navigate to the app
    await page.goto('/');

    // Wait for the page to load by checking for the hero title
    const heroHeading = page.locator('h1');
    await expect(heroHeading).toBeVisible({ timeout: 10000 });
    
    // Check if we are on the landing page
    await expect(page).toHaveTitle(/Steuererklärung Buddy/);

    // Click the "Get Started" button (Hero Start)
    // Using a more specific selector to avoid language toggle in nav
    const startButton = page.getByRole('button', { name: /Start my tax return|Steuererklärung starten/i });
    await startButton.click();

    // Verify we are on Step 1 (Your situation)
    await expect(page.getByRole('heading', { name: /Your situation|Deine Situation/i })).toBeVisible();

    // Fill in some fields
    await page.selectOption('select', { index: 0 }); // Employment type
    
    // Check for children toggle
    const noButton = page.getByRole('button', { name: /^No$|^Nein$/i }).first();
    await expect(noButton).toBeVisible();
    await noButton.click();

    // Go to next step
    const nextButton = page.getByRole('button', { name: /Continue|Weiter/i });
    await nextButton.click();

    // Verify we are on Step 2 (Income)
    await expect(page.getByRole('heading', { name: /Your income|Dein Einkommen/i })).toBeVisible();
    
    // Check if refund meter is visible
    const refundMeter = page.locator('div').filter({ hasText: /€/ }).first();
    await expect(refundMeter).toBeVisible();
  });

  test('should toggle language', async ({ page }) => {
    await page.goto('/');
    
    const langToggle = page.getByLabel('Toggle language');
    await expect(langToggle).toBeVisible();

    // Get current text to see if it changes
    const initialTitle = await page.textContent('h1');
    expect(initialTitle).toBeTruthy();
    
    await langToggle.click();
    
    // Wait for the title to change
    await expect(page.locator('h1')).not.toHaveText(initialTitle || '');
    
    const newTitle = await page.textContent('h1');
    expect(initialTitle).not.toBe(newTitle);
  });
});
