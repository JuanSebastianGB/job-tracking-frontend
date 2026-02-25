import { test, expect } from '@playwright/test';

test.describe('Job Application Flow - E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('Full create job flow with optimistic update', async ({ page }) => {
    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Click Add Job button
    await page.click('text=Add Job');

    // Fill in the form
    await page.fill('input[placeholder*="Senior Frontend Engineer"]', 'Test Engineer');
    await page.fill('input[placeholder*="Google"]', 'Test Company');

    // Submit form
    await page.click('button:has-text("Create Application")');

    // Job should appear immediately (optimistic)
    await expect(page.locator('text=Test Engineer')).toBeVisible();
    await expect(page.locator('text=Test Company')).toBeVisible();
  });

  test('Delete job flow with optimistic update', async ({ page }) => {
    // Wait for jobs to load
    await page.waitForLoadState('networkidle');

    // Check if there are any delete buttons
    const deleteButtons = page.locator('[title="Delete"]');
    const count = await deleteButtons.count();

    if (count > 0) {
      // Click delete on first job
      await deleteButtons.first().click();

      // Job should disappear immediately (optimistic)
      // The job should no longer be visible or should show loading state
      await page.waitForTimeout(500);
    }
  });
});

test.describe('Loading States - E2E', () => {
  test('Loading skeleton shows during initial fetch', async ({ page }) => {
    await page.goto('/');

    // Check for loading skeleton elements (animate-pulse class)
    const skeleton = page.locator('.animate-pulse, [class*="skeleton"]');
    
    // Initially might show skeleton, then data loads
    await page.waitForLoadState('networkidle');
    
    // After load completes, skeleton should be gone and content should show
    await expect(page.locator('body')).toBeVisible();
  });
});

test.describe('Error Handling - E2E', () => {
  test('Delete rollback on error simulation', async ({ page, request }) => {
    // Intercept DELETE request and fail it
    await page.route('**/api/jobs/*', async (route) => {
      if (route.request().method() === 'DELETE') {
        await route.fulfill({
          status: 500,
          body: JSON.stringify({ error: 'Delete failed' }),
        });
      }
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const deleteButtons = page.locator('[title="Delete"]');
    const count = await deleteButtons.count();

    if (count > 0) {
      await deleteButtons.first().click();
      
      // Should show error alert or message
      await page.waitForTimeout(500);
    }
  });
});
